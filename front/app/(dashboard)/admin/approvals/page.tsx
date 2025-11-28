"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Clock, AlertCircle, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StartupRequest {
  id: string
  project_id: string
  project_name: string
  requester_id: string
  requester_name: string
  approver_id?: string
  approver_name?: string
  request_reason: string
  reject_reason?: string
  status: string
  approved_at?: string
  started_at?: string
  expires_at?: string
  is_running: boolean
  process_id?: number
  created_at: string
  updated_at: string
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")
  const [requests, setRequests] = useState<StartupRequest[]>([])
  const [historyRequests, setHistoryRequests] = useState<StartupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<"all" | "approved" | "rejected">("all")
  const [selectedRequest, setSelectedRequest] = useState<StartupRequest | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  // 获取待审批列表
  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("http://localhost:8000/api/projects/startup-requests/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("获取待审批列表失败")
      }

      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error("获取待审批列表失败:", error)
      toast({
        title: "错误",
        description: "获取待审批列表失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 审批通过
  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch(
        `http://localhost:8000/api/projects/startup-requests/${selectedRequest.id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("审批失败")
      }

      const result = await response.json()
      toast({
        title: "审批成功",
        description: result.message || "项目启动请求已通过",
      })

      setShowApproveDialog(false)
      setSelectedRequest(null)
      fetchPendingRequests()
    } catch (error) {
      console.error("审批失败:", error)
      toast({
        title: "错误",
        description: "审批失败，请重试",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // 审批拒绝
  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast({
        title: "错误",
        description: "请填写拒绝原因",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessing(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch(
        `http://localhost:8000/api/projects/startup-requests/${selectedRequest.id}/reject?reject_reason=${encodeURIComponent(rejectReason)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("拒绝失败")
      }

      const result = await response.json()
      toast({
        title: "已拒绝",
        description: result.message || "项目启动请求已拒绝",
      })

      setShowRejectDialog(false)
      setSelectedRequest(null)
      setRejectReason("")
      fetchPendingRequests()
    } catch (error) {
      console.error("拒绝失败:", error)
      toast({
        title: "错误",
        description: "拒绝失败，请重试",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // 获取历史记录
  const fetchHistoryRequests = async () => {
    try {
      setHistoryLoading(true)
      const token = localStorage.getItem("auth_token")
      const statusParam = historyFilter === "all" ? "" : `?status=${historyFilter}`
      const response = await fetch(`http://localhost:8000/api/projects/startup-requests/history${statusParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("获取历史记录失败")
      }

      const data = await response.json()
      setHistoryRequests(data)
    } catch (error) {
      console.error("获取历史记录失败:", error)
      toast({
        title: "错误",
        description: "获取历史记录失败",
        variant: "destructive",
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistoryRequests()
    }
  }, [activeTab, historyFilter])

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 获取状态卡片颜色
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            已通过
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            已拒绝
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            待审批
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">项目启动审批</h1>
        <p className="text-muted-foreground mt-2">
          管理和审批用户提交的项目启动请求
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审批</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground">需要处理的请求</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">历史记录</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyRequests.length}</div>
            <p className="text-xs text-muted-foreground">已处理的请求</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "history")}>
        <TabsList>
          <TabsTrigger value="pending">待审批</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
        </TabsList>

        {/* 待审批列表 */}
        <TabsContent value="pending">
          <Card>
        <CardHeader>
          <CardTitle>待审批列表</CardTitle>
          <CardDescription>
            以下是所有待审批的项目启动请求
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">加载中...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无待审批的请求</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{request.project_name}</h3>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            待审批
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">申请人：</span>
                            <span className="font-medium">{request.requester_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">申请时间：</span>
                            <span className="font-medium">{formatDate(request.created_at)}</span>
                          </div>
                        </div>
                        {request.request_reason && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-sm text-muted-foreground mb-1">申请理由：</p>
                            <p className="text-sm">{request.request_reason}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowApproveDialog(true)
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowRejectDialog(true)
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* 历史记录列表 */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>历史审批记录</CardTitle>
                  <CardDescription>
                    查看已处理的项目启动请求
                  </CardDescription>
                </div>
                <Select value={historyFilter} onValueChange={(v) => setHistoryFilter(v as "all" | "approved" | "rejected")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="筛选状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="approved">已通过</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">加载中...</p>
                </div>
              ) : historyRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无历史记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyRequests.map((request) => (
                    <Card key={request.id} className={`border-l-4 ${
                      request.status === "approved" ? "border-l-green-500" : "border-l-red-500"
                    }`}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{request.project_name}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">申请人：</span>
                              <span className="font-medium">{request.requester_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">审批人：</span>
                              <span className="font-medium">{request.approver_name || "-"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">申请时间：</span>
                              <span className="font-medium">{formatDate(request.created_at)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">审批时间：</span>
                              <span className="font-medium">
                                {request.approved_at ? formatDate(request.approved_at) : "-"}
                              </span>
                            </div>
                          </div>

                          {request.request_reason && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-sm text-muted-foreground mb-1">申请理由：</p>
                              <p className="text-sm">{request.request_reason}</p>
                            </div>
                          )}

                          {request.reject_reason && (
                            <div className="p-3 bg-red-50 rounded-md border border-red-200">
                              <p className="text-sm text-red-600 mb-1">拒绝理由：</p>
                              <p className="text-sm text-red-700">{request.reject_reason}</p>
                            </div>
                          )}

                          {request.status === "approved" && (
                            <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                              <div>
                                <span className="text-muted-foreground">启动时间：</span>
                                <span className="font-medium">
                                  {request.started_at ? formatDate(request.started_at) : "-"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">过期时间：</span>
                                <span className="font-medium">
                                  {request.expires_at ? formatDate(request.expires_at) : "-"}
                                </span>
                              </div>
                              {request.process_id && (
                                <div>
                                  <span className="text-muted-foreground">进程ID：</span>
                                  <span className="font-medium">{request.process_id}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">运行状态：</span>
                                <span className={`font-medium ${
                                  request.is_running ? "text-green-600" : "text-gray-600"
                                }`}>
                                  {request.is_running ? "运行中" : "已停止"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 审批通过对话框 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认审批通过</DialogTitle>
            <DialogDescription>
              确认通过 <strong>{selectedRequest?.project_name}</strong> 的启动请求？
              <br />
              项目将立即启动，默认运行时长为 1 小时。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false)
                setSelectedRequest(null)
              }}
              disabled={processing}
            >
              取消
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? "处理中..." : "确认通过"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批拒绝对话框 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝启动请求</DialogTitle>
            <DialogDescription>
              拒绝 <strong>{selectedRequest?.project_name}</strong> 的启动请求
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">拒绝原因 *</Label>
              <Textarea
                id="reject-reason"
                placeholder="请输入拒绝原因..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setSelectedRequest(null)
                setRejectReason("")
              }}
              disabled={processing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? "处理中..." : "确认拒绝"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
