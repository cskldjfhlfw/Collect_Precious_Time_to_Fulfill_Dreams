"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollText, Search, Filter, Eye, TrendingUp, Users, FileText, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// 日志数据类型
interface AuditLog {
  _id: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  changes?: {
    before?: any
    after?: any
  }
  ip_address?: string
  user_agent?: string
  status: string
  error_message?: string
  timestamp: string
  created_at: string
}

// 统计数据类型
interface LogStatistics {
  total: number
  by_action: Record<string, number>
  by_resource: Record<string, number>
}

export default function LogsAdminPage() {
  const router = useRouter()
  const { token, user, isSuperAdmin, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  
  // 分页
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  
  // 筛选和搜索
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // 统计数据
  const [statistics, setStatistics] = useState<LogStatistics | null>(null)
  
  // 日志详情对话框
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // 严格的权限检查
  useEffect(() => {
    if (authLoading) return

    if (!token || !user) {
      console.log('[日志管理] 未登录，重定向到登录页')
      router.push('/auth')
      return
    }

    if (!isSuperAdmin || user.role !== 'superadmin') {
      console.log('[日志管理] 权限不足，重定向到首页')
      alert('访问被拒绝：您没有权限访问此页面')
      router.push('/papers')
      return
    }

    console.log('[日志管理] 验证通过')
    setAuthorized(true)
  }, [authLoading, token, user, isSuperAdmin, router])

  // 加载日志数据
  useEffect(() => {
    if (!authorized || !token) return
    
    fetchLogs()
    fetchStatistics()
  }, [authorized, token, actionFilter, resourceFilter, statusFilter, page, pageSize])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('limit', pageSize.toString())
      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (resourceFilter !== 'all') params.append('resource_type', resourceFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`http://localhost:8000/api/audit-logs/recent?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('获取日志失败')
      
      const data = await response.json()
      setLogs(data.logs || [])
      // 假设后端不返回total，用logs长度估算
      setTotal(data.total || (data.logs || []).length)
    } catch (error) {
      console.error('加载日志失败:', error)
      alert('加载日志失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/audit-logs/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('获取统计失败')
      
      const data = await response.json()
      setStatistics(data)
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchLogs()
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/api/audit-logs/search?q=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('搜索失败')
      
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('搜索失败:', error)
      alert('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const viewLogDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailOpen(true)
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'view': return 'bg-gray-100 text-gray-800'
      case 'export': return 'bg-purple-100 text-purple-800'
      case 'login': return 'bg-yellow-100 text-yellow-800'
      case 'logout': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    )
  }

  // 权限检查中或未授权时的加载状态
  if (authLoading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">验证权限中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="h-8 w-8" />
            操作日志管理
          </h1>
          <p className="text-muted-foreground mt-2">
            查看和管理系统操作日志（存储于MongoDB）
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总日志数</CardTitle>
              <ScrollText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">创建操作</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.by_action.create || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">更新操作</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.by_action.update || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">删除操作</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.by_action.delete || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选和搜索
          </CardTitle>
          <CardDescription>根据操作类型、资源类型、状态等筛选日志</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">操作类型</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="create">创建</SelectItem>
                  <SelectItem value="update">更新</SelectItem>
                  <SelectItem value="delete">删除</SelectItem>
                  <SelectItem value="view">查看</SelectItem>
                  <SelectItem value="export">导出</SelectItem>
                  <SelectItem value="login">登录</SelectItem>
                  <SelectItem value="logout">登出</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">资源类型</label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="paper">论文</SelectItem>
                  <SelectItem value="project">项目</SelectItem>
                  <SelectItem value="patent">专利</SelectItem>
                  <SelectItem value="user">用户</SelectItem>
                  <SelectItem value="report">报告</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">每页显示</label>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10条</SelectItem>
                  <SelectItem value="20">20条</SelectItem>
                  <SelectItem value="50">50条</SelectItem>
                  <SelectItem value="100">100条</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">关键词搜索</label>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志表格 */}
      <Card>
        <CardHeader>
          <CardTitle>操作日志列表</CardTitle>
          <CardDescription>
            {loading ? '加载中...' : `共 ${logs.length} 条日志`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">状态</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>资源类型</TableHead>
                  <TableHead>资源ID</TableHead>
                  <TableHead>用户ID</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      暂无日志数据
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {getStatusIcon(log.status)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.resource_type}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.resource_id ? log.resource_id.substring(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-xs">{log.ip_address || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(log.timestamp).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewLogDetail(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页控件 */}
          {total > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                共 {total} 条日志，第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 日志详情对话框 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">操作:</span>
                  <Badge className={`ml-2 ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">状态:</span>
                  <span className="ml-2">{selectedLog.status}</span>
                </div>
                <div>
                  <span className="font-medium">资源类型:</span>
                  <span className="ml-2">{selectedLog.resource_type}</span>
                </div>
                <div>
                  <span className="font-medium">资源ID:</span>
                  <span className="ml-2 font-mono text-xs">{selectedLog.resource_id || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">用户ID:</span>
                  <span className="ml-2 font-mono text-xs">{selectedLog.user_id}</span>
                </div>
                <div>
                  <span className="font-medium">IP地址:</span>
                  <span className="ml-2">{selectedLog.ip_address || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">时间:</span>
                  <span className="ml-2">{new Date(selectedLog.timestamp).toLocaleString('zh-CN')}</span>
                </div>
              </div>

              {selectedLog.user_agent && (
                <div>
                  <span className="font-medium text-sm">User Agent:</span>
                  <p className="text-xs text-muted-foreground mt-1 break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <span className="font-medium text-sm text-red-600">错误信息:</span>
                  <p className="text-sm text-red-600 mt-1">{selectedLog.error_message}</p>
                </div>
              )}

              {selectedLog.changes && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">数据变更:</span>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
