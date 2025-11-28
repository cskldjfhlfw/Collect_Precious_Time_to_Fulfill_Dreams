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
  Handshake,
  Building,
  Users,
  Calendar,
  Plus,
  Filter,
  Search,
  MapPin,
  Phone,
  Mail,
  Star,
  TrendingUp,
  Loader2,
  ExternalLink,
  Trash2,
  Pencil,
  CheckCircle,
  AlertTriangle,
  DollarSign,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApi, usePaginatedApi } from "@/hooks/useApi"
import { cooperationsApi, CooperationListItem } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"

const getStatusColor = (status: string) => {
  switch (status) {
    case "活跃合作": return "bg-green-100 text-green-800"
    case "洽谈中": return "bg-blue-100 text-blue-800"
    case "暂停": return "bg-yellow-100 text-yellow-800"
    case "终止": return "bg-gray-100 text-gray-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getValueColor = (value: string) => {
  switch (value) {
    case "高": return "text-red-600"
    case "中": return "text-yellow-600"
    case "低": return "text-green-600"
    default: return "text-gray-600"
  }
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case "初步接触": return "bg-blue-100 text-blue-800"
    case "方案讨论": return "bg-yellow-100 text-yellow-800"
    case "合同谈判": return "bg-orange-100 text-orange-800"
    case "签约成功": return "bg-green-100 text-green-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "active": return "活跃合作"
    case "negotiating": return "洽谈中"
    case "paused": return "暂停"
    case "terminated": return "终止"
    default: return status
  }
}

export default function CooperationsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "analysis">("list")
  const [selectedCooperation, setSelectedCooperation] = useState<CooperationListItem | null>(null)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState("")
  const [fieldFilter, setFieldFilter] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    location: "",
    status: "洽谈中",
    contact_person: "",
    email: "",
    phone: "",
    established_date: "",
    last_contact: "",
    value: "",
    field: "",
    description: "",
  })

  const [createForm, setCreateForm] = useState({
    name: "",
    type: "",
    location: "",
    status: "洽谈中",
    contact_person: "",
    email: "",
    phone: "",
    established_date: "",
    last_contact: "",
    value: "",
    field: "",
    description: "",
  })

  const { data: stats, loading: statsLoading } = useApi(() => cooperationsApi.getStats())
  const {
    data: cooperations,
    pagination,
    loading: cooperationsLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchCooperations,
  } = usePaginatedApi(
    (params) => cooperationsApi.getList(params),
    { size: 10 }
  )

  // 前端筛选显示的合作列表
  const displayCooperations = useMemo(() => {
    if (!cooperations) return []
    
    return cooperations.filter((cooperation: CooperationListItem) => {
      // 状态筛选
      if (statusFilter !== "all" && cooperation.status !== statusFilter) {
        return false
      }
      
      // 搜索筛选（前端）
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase()
        const matchName = cooperation.name?.toLowerCase().includes(searchLower)
        const matchLocation = cooperation.location?.toLowerCase().includes(searchLower)
        const matchDescription = cooperation.description?.toLowerCase().includes(searchLower)
        const matchContact = cooperation.contact_person?.toLowerCase().includes(searchLower)
        
        if (!matchName && !matchLocation && !matchDescription && !matchContact) {
          return false
        }
      }
      
      // 类型筛选
      if (typeFilter.trim()) {
        const typeLower = typeFilter.toLowerCase()
        if (!cooperation.type?.toLowerCase().includes(typeLower)) {
          return false
        }
      }
      
      // 领域筛选
      if (fieldFilter.trim()) {
        const fieldLower = fieldFilter.toLowerCase()
        if (!cooperation.field?.toLowerCase().includes(fieldLower)) {
          return false
        }
      }
      
      return true
    })
  }, [cooperations, statusFilter, searchText, typeFilter, fieldFilter])

  // 基于真实数据的统计计算
  const realTimeStats = useMemo(() => {
    if (!cooperations) return null
    
    const statusCounts = cooperations.reduce((acc, cooperation) => {
      const status = cooperation.status || "未知"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalProjects = cooperations.reduce((sum, cooperation) => 
      sum + (cooperation.projects || 0), 0
    )
    
    return {
      statusCounts,
      totalProjects,
      averageProjects: cooperations.length > 0 ? totalProjects / cooperations.length : 0
    }
  }, [cooperations])

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

  const handleSearch = () => {
    if (searchText.trim()) {
      searchBackend(searchText.trim())
    } else {
      searchBackend("")
    }
    setActiveTab("list")
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    filter({ status: status === "all" ? undefined : status })
  }

  const handleDelete = async () => {
    if (!selectedCooperation?.id || deleting) return
    const ok = window.confirm("确定要删除该合作记录吗？此操作不可恢复。")
    if (!ok) return
    
    try {
      setDeleting(true)
      await cooperationsApi.delete(selectedCooperation.id)
      await refetchCooperations()
      setSelectedCooperation(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除合作失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedCooperation) return
    setEditForm({
      name: selectedCooperation.name || "",
      type: selectedCooperation.type || "",
      location: selectedCooperation.location || "",
      status: selectedCooperation.status || "洽谈中",
      contact_person: selectedCooperation.contact_person || "",
      email: selectedCooperation.email || "",
      phone: selectedCooperation.phone || "",
      established_date: selectedCooperation.established_date || "",
      last_contact: selectedCooperation.last_contact || "",
      value: selectedCooperation.value || "",
      field: selectedCooperation.field || "",
      description: selectedCooperation.description || "",
    })
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedCooperation?.id || !editForm.name.trim()) {
      setFormError("合作机构名称不能为空")
      return
    }

    try {
      setSaving(true)
      setFormError("")

      const payload: Partial<CooperationListItem> = {
        name: editForm.name.trim(),
        type: editForm.type.trim() || undefined,
        location: editForm.location.trim() || undefined,
        status: editForm.status,
        contact_person: editForm.contact_person.trim() || undefined,
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        established_date: editForm.established_date || undefined,
        last_contact: editForm.last_contact || undefined,
        value: editForm.value || undefined,
        field: editForm.field.trim() || undefined,
        description: editForm.description.trim() || undefined,
      }

      await cooperationsApi.update(selectedCooperation.id, payload)
      await refetchCooperations()
      setEditOpen(false)
      
      // 更新选中的合作数据
      const updated = await cooperationsApi.getById(selectedCooperation.id)
      setSelectedCooperation(updated)
    } catch (error) {
      console.error("编辑合作失败", error)
      setFormError("保存失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setFormError("合作机构名称不能为空")
      return
    }

    try {
      setSaving(true)
      setFormError("")

      const payload: Partial<CooperationListItem> = {
        name: createForm.name.trim(),
        type: createForm.type.trim() || undefined,
        location: createForm.location.trim() || undefined,
        status: createForm.status,
        contact_person: createForm.contact_person.trim() || undefined,
        email: createForm.email.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        established_date: createForm.established_date || undefined,
        last_contact: createForm.last_contact || undefined,
        value: createForm.value || undefined,
        field: createForm.field.trim() || undefined,
        description: createForm.description.trim() || undefined,
      }

      await cooperationsApi.create(payload)
      await refetchCooperations()
      
      // 重置表单
      setCreateForm({
        name: "",
        type: "",
        location: "",
        status: "洽谈中",
        contact_person: "",
        email: "",
        phone: "",
        established_date: "",
        last_contact: "",
        value: "",
        field: "",
        description: "",
      })
      setCreateOpen(false)
    } catch (error) {
      console.error("创建合作失败", error)
      setFormError("创建失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">合作中心</h1>
          <p className="text-sm text-muted-foreground">
            建设科研合作网络，统一管理沟通进展与机会价值。
          </p>
        </div>
        <div className="flex gap-2">
          <ImportDialog
            entityType="cooperations"
            entityName="合作"
            apiEndpoint="/api/cooperations"
            onImportSuccess={() => refetchCooperations()}
            sampleFields={[
              "name", "type", "location", "status", "projects", "contact_person",
              "email", "phone", "established_date", "last_contact", "value", "field", "description"
            ]}
          />
          {canCreate && (
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增合作
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
                <Handshake className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle>合作管理</CardTitle>
              <CardDescription>管理合作机构、企业伙伴与联系人信息</CardDescription>
            </div>
            <div className="space-y-3">
              {/* 主要筛选行 */}
              <div className="flex items-center gap-3">
                {/* 搜索框 */}
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="搜索合作机构..."
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
                    <SelectItem value="活跃合作">活跃合作</SelectItem>
                    <SelectItem value="洽谈中">洽谈中</SelectItem>
                    <SelectItem value="暂停">暂停</SelectItem>
                    <SelectItem value="终止">终止</SelectItem>
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
                {(typeFilter || fieldFilter) && (
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
                    placeholder="合作类型"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-24 h-7 text-xs"
                  />
                  
                  <Input
                    placeholder="合作领域"
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                    className="w-24 h-7 text-xs"
                  />
                  
                  {(typeFilter || fieldFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTypeFilter("")
                        setFieldFilter("")
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
              {selectedCooperation && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedCooperation.name}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {cooperationsLoading ? (
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
              ) : displayCooperations && displayCooperations.length > 0 ? (
                <div className="space-y-3">
                  {displayCooperations.map((cooperation) => (
                    <button
                      key={cooperation.id}
                      type="button"
                      onClick={() => {
                        setSelectedCooperation(cooperation)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-clamp-1">{cooperation.name}</h3>
                          <Badge className={getStatusColor(cooperation.status)}>
                            {formatStatus(cooperation.status)}
                          </Badge>
                          {cooperation.type && (
                            <Badge variant="outline" className="text-xs">
                              {cooperation.type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {cooperation.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">地点：{cooperation.location}</span>
                            </div>
                          )}
                          {cooperation.contact_person && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              联系人：{cooperation.contact_person}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {cooperation.projects && (
                          <div className="text-muted-foreground">
                            项目数：{cooperation.projects}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无合作数据</p>
                </div>
              )}

              {/* 分页控制 - 始终显示 */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-4">
                  <span>
                    共 <span className="font-medium text-foreground">{pagination.total}</span> 个合作
                  </span>
                  {displayCooperations.length !== pagination.total && (
                    <span className="text-blue-600">
                      筛选后显示 <span className="font-medium">{displayCooperations.length}</span> 个
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
                      disabled={pagination.page <= 1 || cooperationsLoading}
                      onClick={() => goToPage(1)}
                    >
                      首页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page <= 1 || cooperationsLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || cooperationsLoading}
                      onClick={() => goToPage(pagination.page + 1)}
                    >
                      下一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || cooperationsLoading}
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
              {selectedCooperation ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{selectedCooperation.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedCooperation.status)}>
                          {formatStatus(selectedCooperation.status)}
                        </Badge>
                        {selectedCooperation.type && <span>类型：{selectedCooperation.type}</span>}
                        {selectedCooperation.location && <span>地点：{selectedCooperation.location}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {selectedCooperation.contact_person && (
                      <div>
                        <span className="font-medium">联系人：</span>
                        <span className="text-muted-foreground">
                          {selectedCooperation.contact_person}
                        </span>
                      </div>
                    )}

                    {(selectedCooperation.email || selectedCooperation.phone) && (
                      <div className="space-y-1">
                        <span className="font-medium">联系方式：</span>
                        <div className="text-muted-foreground space-y-1">
                          {selectedCooperation.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedCooperation.email}
                            </div>
                          )}
                          {selectedCooperation.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {selectedCooperation.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(selectedCooperation.established_date || selectedCooperation.last_contact) && (
                      <div className="space-y-1">
                        <span className="font-medium">时间信息：</span>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {selectedCooperation.established_date && (
                            <div>建立时间：{new Date(selectedCooperation.established_date).toLocaleDateString("zh-CN")}</div>
                          )}
                          {selectedCooperation.last_contact && (
                            <div>最近联系：{new Date(selectedCooperation.last_contact).toLocaleDateString("zh-CN")}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {(selectedCooperation.value || selectedCooperation.field) && (
                      <div className="space-y-1">
                        <span className="font-medium">合作信息：</span>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {selectedCooperation.value && (
                            <div>合作价值：{selectedCooperation.value}</div>
                          )}
                          {selectedCooperation.field && (
                            <div>合作领域：{selectedCooperation.field}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedCooperation.projects && (
                      <div>
                        <span className="font-medium">项目数量：</span>
                        <span className="text-muted-foreground">
                          {selectedCooperation.projects} 个项目
                        </span>
                      </div>
                    )}

                    {selectedCooperation.description && (
                      <div className="space-y-1">
                        <span className="font-medium">合作描述：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCooperation.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedCooperation.id}</span>
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
                  暂未选择任何合作，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>合作统计</CardTitle>
                    <CardDescription>合作机构分布与管理情况</CardDescription>
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
                          <Handshake className={`h-4 w-4 ${
                            index === 0 ? 'text-blue-600' :
                            index === 1 ? 'text-green-600' :
                            index === 2 ? 'text-yellow-600' :
                            'text-purple-600'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{stat.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {stat.value} 个合作
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
                        <Handshake className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">合作总数</p>
                          <p className="text-xs text-muted-foreground">共 {pagination.total} 个合作</p>
                        </div>
                      </div>
                    )}
                    
                    {displayCooperations.length !== pagination.total && (
                      <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <Filter className="h-4 w-4 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">筛选结果</p>
                          <p className="text-xs text-muted-foreground">筛选后显示 {displayCooperations.length} 个合作</p>
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

                    {(searchText || statusFilter !== "all" || typeFilter || fieldFilter) && (
                      <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <Search className="h-4 w-4 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">当前筛选</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {searchText && <div>搜索：{searchText}</div>}
                            {statusFilter !== "all" && <div>状态：{statusFilter}</div>}
                            {typeFilter && <div>类型：{typeFilter}</div>}
                            {fieldFilter && <div>领域：{fieldFilter}</div>}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>实时数据分析</CardTitle>
                    <CardDescription>基于当前合作数据的统计分析</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {realTimeStats ? (
                      <>
                        {/* 状态分布 */}
                        {Object.entries(realTimeStats.statusCounts).map(([status, count], index) => (
                          <div key={status} className={`flex items-center gap-3 rounded-lg border p-3 ${
                            status === "活跃合作" ? 'border-green-200 bg-green-50' :
                            status === "洽谈中" ? 'border-blue-200 bg-blue-50' :
                            status === "暂停" ? 'border-yellow-200 bg-yellow-50' :
                            status === "终止" ? 'border-gray-200 bg-gray-50' :
                            'border-gray-200 bg-gray-50'
                          }`}>
                            <CheckCircle className={`h-4 w-4 ${
                              status === "活跃合作" ? 'text-green-600' :
                              status === "洽谈中" ? 'text-blue-600' :
                              status === "暂停" ? 'text-yellow-600' :
                              status === "终止" ? 'text-gray-600' :
                              'text-gray-600'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{status}</p>
                              <p className="text-xs text-muted-foreground">{count} 个合作</p>
                            </div>
                          </div>
                        ))}
                        
                        {/* 项目统计 */}
                        {realTimeStats.totalProjects > 0 && (
                          <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                            <Building className="h-4 w-4 text-purple-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">项目统计</p>
                              <p className="text-xs text-muted-foreground">
                                总项目数：{realTimeStats.totalProjects}，
                                平均每个合作：{realTimeStats.averageProjects.toFixed(1)} 个项目
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <AlertTriangle className="h-4 w-4 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">暂无数据</p>
                          <p className="text-xs text-muted-foreground">请添加合作数据以查看统计信息</p>
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

      {/* 编辑合作对话框 */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑合作</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">合作机构名称 *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入合作机构名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">合作类型</Label>
                <Input
                  id="edit-type"
                  value={editForm.type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="如：企业合作、学术合作"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">地点</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="请输入地点"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">合作状态</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="洽谈中">洽谈中</SelectItem>
                    <SelectItem value="活跃合作">活跃合作</SelectItem>
                    <SelectItem value="暂停">暂停</SelectItem>
                    <SelectItem value="终止">终止</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contact">联系人</Label>
                <Input
                  id="edit-contact"
                  value={editForm.contact_person}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="请输入联系人姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">邮箱</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">电话</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入电话号码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-field">合作领域</Label>
                <Input
                  id="edit-field"
                  value={editForm.field}
                  onChange={(e) => setEditForm(prev => ({ ...prev, field: e.target.value }))}
                  placeholder="如：人工智能、生物技术"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-established">建立时间</Label>
                <Input
                  id="edit-established"
                  type="date"
                  value={editForm.established_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, established_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-contact">最近联系</Label>
                <Input
                  id="edit-last-contact"
                  type="date"
                  value={editForm.last_contact}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_contact: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">合作价值</Label>
              <Select value={editForm.value} onValueChange={(value) => setEditForm(prev => ({ ...prev, value: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择合作价值" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="高">高</SelectItem>
                  <SelectItem value="中">中</SelectItem>
                  <SelectItem value="低">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">合作描述</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入合作描述"
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

      {/* 新增合作对话框 */}
      <Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增合作</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">合作机构名称 *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入合作机构名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-type">合作类型</Label>
                <Input
                  id="create-type"
                  value={createForm.type}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="如：企业合作、学术合作"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-location">地点</Label>
                <Input
                  id="create-location"
                  value={createForm.location}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="请输入地点"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-status">合作状态</Label>
                <Select value={createForm.status} onValueChange={(value) => setCreateForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="洽谈中">洽谈中</SelectItem>
                    <SelectItem value="活跃合作">活跃合作</SelectItem>
                    <SelectItem value="暂停">暂停</SelectItem>
                    <SelectItem value="终止">终止</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-contact">联系人</Label>
                <Input
                  id="create-contact"
                  value={createForm.contact_person}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="请输入联系人姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">邮箱</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-phone">电话</Label>
                <Input
                  id="create-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入电话号码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-field">合作领域</Label>
                <Input
                  id="create-field"
                  value={createForm.field}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, field: e.target.value }))}
                  placeholder="如：人工智能、生物技术"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-established">建立时间</Label>
                <Input
                  id="create-established"
                  type="date"
                  value={createForm.established_date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, established_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-last-contact">最近联系</Label>
                <Input
                  id="create-last-contact"
                  type="date"
                  value={createForm.last_contact}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, last_contact: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-value">合作价值</Label>
              <Select value={createForm.value} onValueChange={(value) => setCreateForm(prev => ({ ...prev, value: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择合作价值" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="高">高</SelectItem>
                  <SelectItem value="中">中</SelectItem>
                  <SelectItem value="低">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">合作描述</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入合作描述"
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
