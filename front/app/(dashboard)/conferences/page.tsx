"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  MapPin,
  Users,
  FileText,
  Plus,
  Filter,
  Search,
  Clock,
  Plane,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Trash2,
  Pencil,
  TrendingUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApi, usePaginatedApi } from "@/hooks/useApi"
import { conferencesApi, ConferenceListItem } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"

const getStatusColor = (status: string) => {
  switch (status) {
    case "即将参加": return "bg-blue-100 text-blue-800"
    case "已参加": return "bg-green-100 text-green-800"
    case "待申请": return "bg-yellow-100 text-yellow-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getSubmissionColor = (status: string) => {
  switch (status) {
    case "已发表": return "text-green-600"
    case "已接收": return "text-blue-600"
    case "审稿中": return "text-yellow-600"
    case "未提交": return "text-gray-600"
    default: return "text-gray-600"
  }
}

const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "planned": return "即将参加"
    case "attended": return "已参加"
    case "pending": return "待申请"
    default: return status
  }
}

export default function ConferencesPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "analysis">("list")
  const [selectedConference, setSelectedConference] = useState<ConferenceListItem | null>(null)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    start_date: "",
    end_date: "",
    status: "待申请",
    submission_status: "",
    participants: "",
    budget: "",
    used: "",
    category: "",
    description: "",
  })

  const [createForm, setCreateForm] = useState({
    name: "",
    location: "",
    start_date: "",
    end_date: "",
    status: "待申请",
    submission_status: "",
    participants: "",
    budget: "",
    used: "",
    category: "",
    description: "",
  })

  const { data: stats, loading: statsLoading } = useApi(() => conferencesApi.getStats())
  const {
    data: conferences,
    pagination,
    loading: conferencesLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchConferences,
  } = usePaginatedApi(
    (params) => conferencesApi.getList(params),
    { size: 10 }
  )

  // 前端筛选显示的会议列表
  const displayConferences = useMemo(() => {
    if (!conferences) return []
    
    return conferences.filter((conference: ConferenceListItem) => {
      // 状态筛选
      if (statusFilter !== "all" && conference.status !== statusFilter) {
        return false
      }
      
      // 搜索筛选（前端）
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase()
        const matchName = conference.name?.toLowerCase().includes(searchLower)
        const matchLocation = conference.location?.toLowerCase().includes(searchLower)
        const matchDescription = conference.description?.toLowerCase().includes(searchLower)
        
        if (!matchName && !matchLocation && !matchDescription) {
          return false
        }
      }
      
      // 类别筛选
      if (categoryFilter.trim()) {
        const categoryLower = categoryFilter.toLowerCase()
        if (!conference.category?.toLowerCase().includes(categoryLower)) {
          return false
        }
      }
      
      // 日期范围筛选（基于开始日期）
      if (startDateFilter || endDateFilter) {
        if (!conference.start_date) return false
        const conferenceDate = new Date(conference.start_date)
        
        if (startDateFilter) {
          const startDate = new Date(startDateFilter)
          if (conferenceDate < startDate) return false
        }
        
        if (endDateFilter) {
          const endDate = new Date(endDateFilter)
          endDate.setHours(23, 59, 59, 999) // 包含整天
          if (conferenceDate > endDate) return false
        }
      }
      
      return true
    })
  }, [conferences, statusFilter, searchText, categoryFilter, startDateFilter, endDateFilter])

  // 基于真实数据的统计计算
  const realTimeStats = useMemo(() => {
    if (!conferences) return null
    
    const statusCounts = conferences.reduce((acc, conference) => {
      const status = conference.status || "未知"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalBudget = conferences.reduce((sum, conference) => 
      sum + (conference.budget || 0), 0
    )
    
    const totalUsed = conferences.reduce((sum, conference) => 
      sum + (conference.used || 0), 0
    )
    
    return {
      statusCounts,
      totalBudget,
      totalUsed,
      budgetUsageRate: totalBudget > 0 ? (totalUsed / totalBudget * 100) : 0
    }
  }, [conferences])

  // 调试信息
  console.log('Conference stats:', stats)
  console.log('Conference data:', conferences)
  console.log('Real time stats:', realTimeStats)

  const handleSearch = () => {
    if (searchText.trim()) {
      searchBackend(searchText.trim())
    } else {
      searchBackend("")
    }
    setActiveTab("list")
  }

  // 实时搜索（防抖）
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const handleSearchChange = (value: string) => {
    setSearchText(value)
    
    // 清除之前的定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // 设置新的定时器，500ms后自动搜索
    const timeout = setTimeout(() => {
      if (value.trim()) {
        searchBackend(value.trim())
      } else {
        searchBackend("")
      }
    }, 500)
    
    setSearchTimeout(timeout)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    filter({ status: status === "all" ? undefined : status })
  }

  const handleDelete = async () => {
    if (!selectedConference?.id || deleting) return
    const ok = window.confirm("确定要删除该会议记录吗？此操作不可恢复。")
    if (!ok) return
    
    try {
      setDeleting(true)
      await conferencesApi.delete(selectedConference.id)
      await refetchConferences()
      setSelectedConference(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除会议失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedConference) return
    setEditForm({
      name: selectedConference.name || "",
      location: selectedConference.location || "",
      start_date: selectedConference.start_date || "",
      end_date: selectedConference.end_date || "",
      status: selectedConference.status || "待申请",
      submission_status: selectedConference.submission_status || "",
      participants: Array.isArray(selectedConference.participants) 
        ? selectedConference.participants.join(", ") 
        : "",
      budget: selectedConference.budget?.toString() || "",
      used: selectedConference.used?.toString() || "",
      category: selectedConference.category || "",
      description: selectedConference.description || "",
    })
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedConference?.id || !editForm.name.trim()) {
      setFormError("会议名称不能为空")
      return
    }

    try {
      setSaving(true)
      setFormError("")

      const payload: Partial<ConferenceListItem> = {
        name: editForm.name.trim(),
        location: editForm.location.trim() || undefined,
        start_date: editForm.start_date || undefined,
        end_date: editForm.end_date || undefined,
        status: editForm.status,
        submission_status: editForm.submission_status.trim() || undefined,
        participants: editForm.participants.trim() 
          ? editForm.participants.split(",").map(p => p.trim()).filter(Boolean)
          : undefined,
        budget: editForm.budget ? parseFloat(editForm.budget) : undefined,
        used: editForm.used ? parseFloat(editForm.used) : undefined,
        category: editForm.category.trim() || undefined,
        description: editForm.description.trim() || undefined,
      }

      await conferencesApi.update(selectedConference.id, payload)
      await refetchConferences()
      setEditOpen(false)
      
      // 更新选中的会议数据
      const updated = await conferencesApi.getById(selectedConference.id)
      setSelectedConference(updated)
    } catch (error) {
      console.error("编辑会议失败", error)
      setFormError("保存失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setFormError("会议名称不能为空")
      return
    }

    try {
      setSaving(true)
      setFormError("")

      const payload: Partial<ConferenceListItem> = {
        name: createForm.name.trim(),
        location: createForm.location.trim() || undefined,
        start_date: createForm.start_date || undefined,
        end_date: createForm.end_date || undefined,
        status: createForm.status,
        submission_status: createForm.submission_status.trim() || undefined,
        participants: createForm.participants.trim() 
          ? createForm.participants.split(",").map(p => p.trim()).filter(Boolean)
          : undefined,
        budget: createForm.budget ? parseFloat(createForm.budget) : undefined,
        used: createForm.used ? parseFloat(createForm.used) : undefined,
        category: createForm.category.trim() || undefined,
        description: createForm.description.trim() || undefined,
      }

      await conferencesApi.create(payload)
      await refetchConferences()
      
      // 重置表单
      setCreateForm({
        name: "",
        location: "",
        start_date: "",
        end_date: "",
        status: "待申请",
        submission_status: "",
        participants: "",
        budget: "",
        used: "",
        category: "",
        description: "",
      })
      setCreateOpen(false)
    } catch (error) {
      console.error("创建会议失败", error)
      setFormError("创建失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">学术会议</h1>
          <p className="text-sm text-muted-foreground">
            集中管理会议日程、投稿进度与差旅安排。
          </p>
        </div>
        <div className="flex gap-2">
          <ImportDialog
            entityType="conferences"
            entityName="会议"
            apiEndpoint="/api/conferences"
            onImportSuccess={() => refetchConferences()}
            sampleFields={[
              "name", "location", "start_date", "end_date", "category", "status",
              "submission_status", "budget", "used", "participants", "paper_title", "description"
            ]}
          />
          {canCreate && (
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增会议
            </Button>
          )}
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats?.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={
                    stat.trend === "up" ? "text-green-600" : 
                    stat.trend === "down" ? "text-red-600" : "text-gray-600"
                  }>
                    {stat.change}
                  </span>{" "}
                  较上月
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 主要内容区域 - Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>会议管理</CardTitle>
              <CardDescription>管理学术会议的参与、投稿和差旅安排</CardDescription>
            </div>
            <div className="space-y-3">
              {/* 主要筛选行 */}
              <div className="flex items-center gap-3">
                {/* 搜索框 */}
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="搜索会议..."
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-48 h-8"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="outline" size="sm" onClick={handleSearch} className="h-8 px-2">
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* 状态筛选 */}
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="即将参加">即将参加</SelectItem>
                    <SelectItem value="已参加">已参加</SelectItem>
                    <SelectItem value="待申请">待申请</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* 高级筛选切换 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="h-8 px-2 text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  高级筛选
                  {showAdvancedFilters ? (
                    <span className="ml-1">▲</span>
                  ) : (
                    <span className="ml-1">▼</span>
                  )}
                </Button>
                
                {/* 活跃筛选指示器 */}
                {(categoryFilter || startDateFilter || endDateFilter) && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600">已筛选</span>
                  </div>
                )}
              </div>
              
              {/* 高级筛选行（可折叠） */}
              {showAdvancedFilters && (
                <div className="flex items-center gap-2 pl-4 border-l-2 border-muted">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">高级筛选:</span>
                  
                  <Input
                    placeholder="类别"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-20 h-7 text-xs"
                  />
                  
                  <div className="flex items-center gap-1">
                    <Input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="w-28 h-7 text-xs"
                      title="开始日期"
                    />
                    <span className="text-xs text-muted-foreground">~</span>
                    <Input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="w-28 h-7 text-xs"
                      title="结束日期"
                    />
                  </div>
                  
                  {(categoryFilter || startDateFilter || endDateFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("")
                        setStartDateFilter("")
                        setEndDateFilter("")
                      }}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      清除
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between mb-3">
              <TabsList className="h-8">
                <TabsTrigger value="list" className="px-3 text-xs">
                  列表视图
                </TabsTrigger>
                <TabsTrigger value="detail" className="px-3 text-xs">
                  详情视图
                </TabsTrigger>
                <TabsTrigger value="analysis" className="px-3 text-xs">
                  分析视图
                </TabsTrigger>
              </TabsList>
              {selectedConference && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedConference.name}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {conferencesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="space-y-2">
                        <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayConferences && displayConferences.length > 0 ? (
                <div className="space-y-3">
                  {displayConferences.map((conference) => (
                    <button
                      key={conference.id}
                      type="button"
                      onClick={() => {
                        setSelectedConference(conference)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-clamp-1">{conference.name}</h3>
                          <Badge className={getStatusColor(conference.status)}>
                            {formatStatus(conference.status)}
                          </Badge>
                          {conference.category && (
                            <Badge variant="outline" className="text-xs">
                              {conference.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {conference.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">地点：{conference.location}</span>
                            </div>
                          )}
                          {conference.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(conference.start_date).toLocaleDateString("zh-CN")}
                              {conference.end_date && ` - ${new Date(conference.end_date).toLocaleDateString("zh-CN")}`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {conference.budget && (
                          <div className="text-muted-foreground">
                            预算：¥{conference.budget.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无会议数据</p>
                </div>
              )}

              {/* 分页控制 - 始终显示 */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-4">
                  <span>
                    共 <span className="font-medium text-foreground">{pagination.total}</span> 个会议
                  </span>
                  {displayConferences.length !== pagination.total && (
                    <span className="text-blue-600">
                      筛选后显示 <span className="font-medium">{displayConferences.length}</span> 个
                    </span>
                  )}
                  <span>
                    当前第 <span className="font-medium text-foreground">{pagination.page}</span> / {pagination.pages} 页
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(pagination.size)}
                    onValueChange={(v) => changePageSize(Number(v))}
                  >
                    <SelectTrigger className="h-7 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 条/页</SelectItem>
                      <SelectItem value="10">10 条/页</SelectItem>
                      <SelectItem value="20">20 条/页</SelectItem>
                      <SelectItem value="50">50 条/页</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page <= 1 || conferencesLoading}
                      onClick={() => goToPage(1)}
                    >
                      首页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page <= 1 || conferencesLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || conferencesLoading}
                      onClick={() => goToPage(pagination.page + 1)}
                    >
                      下一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || conferencesLoading}
                      onClick={() => goToPage(pagination.pages)}
                    >
                      末页
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 详情视图 */}
            <TabsContent value="detail">
              {selectedConference ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{selectedConference.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedConference.status)}>
                          {formatStatus(selectedConference.status)}
                        </Badge>
                        {selectedConference.category && <span>类别：{selectedConference.category}</span>}
                        {selectedConference.location && <span>地点：{selectedConference.location}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {(selectedConference.start_date || selectedConference.end_date) && (
                      <div>
                        <span className="font-medium">会议时间：</span>
                        <span className="text-muted-foreground">
                          {selectedConference.start_date 
                            ? new Date(selectedConference.start_date).toLocaleDateString("zh-CN")
                            : "未设置"
                          } - {selectedConference.end_date 
                            ? new Date(selectedConference.end_date).toLocaleDateString("zh-CN")
                            : "未设置"
                          }
                        </span>
                      </div>
                    )}

                    {selectedConference.participants && selectedConference.participants.length > 0 && (
                      <div>
                        <span className="font-medium">参会人员：</span>
                        <span className="text-muted-foreground">
                          {selectedConference.participants.join(", ")}
                        </span>
                      </div>
                    )}

                    {selectedConference.submission_status && (
                      <div>
                        <span className="font-medium">投稿状态：</span>
                        <span className={getSubmissionColor(selectedConference.submission_status)}>
                          {selectedConference.submission_status}
                        </span>
                      </div>
                    )}

                    {(selectedConference.budget || selectedConference.used) && (
                      <div className="space-y-2">
                        <span className="font-medium">预算情况：</span>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {selectedConference.budget && (
                            <div>预算：¥{selectedConference.budget.toLocaleString()}</div>
                          )}
                          {selectedConference.used && (
                            <div>已用：¥{selectedConference.used.toLocaleString()}</div>
                          )}
                        </div>
                        {selectedConference.budget && selectedConference.used && (
                          <Progress 
                            value={(selectedConference.used / selectedConference.budget) * 100} 
                            className="h-2" 
                          />
                        )}
                      </div>
                    )}

                    {selectedConference.description && (
                      <div className="space-y-1">
                        <span className="font-medium">会议描述：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedConference.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedConference.id}</span>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={openEditDialog}
                        >
                          <Pencil className="mr-1 h-3 w-3" /> 编辑
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 删除中...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-1 h-3 w-3" /> 删除
                          </>
                        )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setActiveTab("list")}
                      >
                        返回列表
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  暂未选择任何会议，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>会议统计</CardTitle>
                    <CardDescription>会议参与情况统计</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 使用真实统计数据 */}
                    {stats && stats.length > 0 ? (
                      stats.map((stat, index) => (
                        <div key={stat.label} className={`flex items-center gap-3 rounded-lg border p-3 ${
                          index === 0 ? 'border-blue-200 bg-blue-50' :
                          index === 1 ? 'border-green-200 bg-green-50' :
                          index === 2 ? 'border-yellow-200 bg-yellow-50' :
                          'border-purple-200 bg-purple-50'
                        }`}>
                          <Calendar className={`h-4 w-4 ${
                            index === 0 ? 'text-blue-600' :
                            index === 1 ? 'text-green-600' :
                            index === 2 ? 'text-yellow-600' :
                            'text-purple-600'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{stat.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {stat.value} 个会议
                              <span className={`ml-2 ${
                                stat.trend === "up" ? "text-green-600" : 
                                stat.trend === "down" ? "text-red-600" : "text-gray-600"
                              }`}>
                                {stat.change} 较上月
                              </span>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">会议总数</p>
                          <p className="text-xs text-muted-foreground">共 {pagination.total} 个会议</p>
                        </div>
                      </div>
                    )}
                    
                    {displayConferences.length !== pagination.total && (
                      <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <Filter className="h-4 w-4 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">筛选结果</p>
                          <p className="text-xs text-muted-foreground">筛选后显示 {displayConferences.length} 个会议</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">分页信息</p>
                        <p className="text-xs text-muted-foreground">第 {pagination.page} 页，共 {pagination.pages} 页，每页 {pagination.size} 条</p>
                      </div>
                    </div>

                    {(searchText || statusFilter !== "all" || categoryFilter || startDateFilter || endDateFilter) && (
                      <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <Search className="h-4 w-4 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">当前筛选</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {searchText && <div>搜索：{searchText}</div>}
                            {statusFilter !== "all" && <div>状态：{statusFilter}</div>}
                            {categoryFilter && <div>类别：{categoryFilter}</div>}
                            {(startDateFilter || endDateFilter) && (
                              <div>日期：{startDateFilter || "不限"} ~ {endDateFilter || "不限"}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>实时数据分析</CardTitle>
                    <CardDescription>基于当前会议数据的统计分析</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {realTimeStats ? (
                      <>
                        {/* 状态分布 */}
                        {Object.entries(realTimeStats.statusCounts).map(([status, count], index) => (
                          <div key={status} className={`flex items-center gap-3 rounded-lg border p-3 ${
                            status === "已参加" ? 'border-green-200 bg-green-50' :
                            status === "即将参加" ? 'border-blue-200 bg-blue-50' :
                            status === "待申请" ? 'border-yellow-200 bg-yellow-50' :
                            'border-gray-200 bg-gray-50'
                          }`}>
                            <CheckCircle className={`h-4 w-4 ${
                              status === "已参加" ? 'text-green-600' :
                              status === "即将参加" ? 'text-blue-600' :
                              status === "待申请" ? 'text-yellow-600' :
                              'text-gray-600'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{status}</p>
                              <p className="text-xs text-muted-foreground">{count} 个会议</p>
                            </div>
                          </div>
                        ))}
                        
                        {/* 预算统计 */}
                        {realTimeStats.totalBudget > 0 && (
                          <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">预算执行</p>
                              <p className="text-xs text-muted-foreground">
                                已用 ¥{realTimeStats.totalUsed.toLocaleString()} / 
                                总预算 ¥{realTimeStats.totalBudget.toLocaleString()}
                              </p>
                              <div className="mt-1">
                                <Progress value={realTimeStats.budgetUsageRate} className="h-1" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  使用率：{realTimeStats.budgetUsageRate.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <AlertTriangle className="h-4 w-4 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">暂无数据</p>
                          <p className="text-xs text-muted-foreground">请添加会议数据以查看统计信息</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 编辑会议对话框 */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑会议</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">会议名称 *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入会议名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">会议地点</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="请输入会议地点"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">开始日期</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">结束日期</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">参会状态</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="待申请">待申请</SelectItem>
                    <SelectItem value="即将参加">即将参加</SelectItem>
                    <SelectItem value="已参加">已参加</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">会议类别</Label>
                <Input
                  id="edit-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="如：国际会议、国内会议"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-participants">参会人员</Label>
              <Input
                id="edit-participants"
                value={editForm.participants}
                onChange={(e) => setEditForm(prev => ({ ...prev, participants: e.target.value }))}
                placeholder="多个人员用逗号分隔"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budget">预算金额</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="请输入预算金额"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-used">已用金额</Label>
                <Input
                  id="edit-used"
                  type="number"
                  value={editForm.used}
                  onChange={(e) => setEditForm(prev => ({ ...prev, used: e.target.value }))}
                  placeholder="请输入已用金额"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">会议描述</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入会议描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增会议对话框 */}
      <Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增会议</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">会议名称 *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入会议名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-location">会议地点</Label>
                <Input
                  id="create-location"
                  value={createForm.location}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="请输入会议地点"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-start-date">开始日期</Label>
                <Input
                  id="create-start-date"
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-end-date">结束日期</Label>
                <Input
                  id="create-end-date"
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-status">参会状态</Label>
                <Select value={createForm.status} onValueChange={(value) => setCreateForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="待申请">待申请</SelectItem>
                    <SelectItem value="即将参加">即将参加</SelectItem>
                    <SelectItem value="已参加">已参加</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-category">会议类别</Label>
                <Input
                  id="create-category"
                  value={createForm.category}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="如：国际会议、国内会议"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-participants">参会人员</Label>
              <Input
                id="create-participants"
                value={createForm.participants}
                onChange={(e) => setCreateForm(prev => ({ ...prev, participants: e.target.value }))}
                placeholder="多个人员用逗号分隔"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-budget">预算金额</Label>
                <Input
                  id="create-budget"
                  type="number"
                  value={createForm.budget}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="请输入预算金额"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-used">已用金额</Label>
                <Input
                  id="create-used"
                  type="number"
                  value={createForm.used}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, used: e.target.value }))}
                  placeholder="请输入已用金额"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">会议描述</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入会议描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
