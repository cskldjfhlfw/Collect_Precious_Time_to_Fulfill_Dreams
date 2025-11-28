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
  Database,
  Server,
  HardDrive,
  Cpu,
  Plus,
  Filter,
  Search,
  Calendar,
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ExternalLink,
  Trash2,
  Pencil,
  TrendingUp,
  Monitor,
  Settings,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApi, usePaginatedApi } from "@/hooks/useApi"
import { resourcesApi } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "available":
    case "在线": 
      return "bg-green-100 text-green-800"
    case "in_use":
    case "使用中": 
      return "bg-blue-100 text-blue-800"
    case "maintenance":
    case "维护中": 
      return "bg-yellow-100 text-yellow-800"
    case "offline":
    case "离线": 
      return "bg-gray-100 text-gray-800"
    default: 
      return "bg-gray-100 text-gray-800"
  }
}

const formatStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case "available": return "在线"
    case "in_use": return "使用中"
    case "maintenance": return "维护中"
    case "offline": return "离线"
    default: return status || "未知"
  }
}

const getUsageColor = (usage: number) => {
  if (usage >= 80) return "text-red-600"
  if (usage >= 60) return "text-yellow-600"
  return "text-green-600"
}

const getResourceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "computing":
    case "计算资源": 
      return <Cpu className="h-4 w-4" />
    case "data":
    case "数据资源": 
      return <Database className="h-4 w-4" />
    case "storage":
    case "存储资源": 
      return <HardDrive className="h-4 w-4" />
    default: 
      return <Server className="h-4 w-4" />
  }
}

export default function ResourcesPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "analysis">("list")
  const [selectedResource, setSelectedResource] = useState<any | null>(null)
  const [searchText, setSearchText] = useState("")
  const [searchScope, setSearchScope] = useState<"all" | "name" | "current_user" | "resource_type">("all")
  const [deleting, setDeleting] = useState(false)
  
  // 筛选状态
  const [filterValues, setFilterValues] = useState<FilterValue>({
    status: "",
    resourceType: "",
    location: "",
    dateRange: { start: "", end: "" }
  })

  // 筛选配置
  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "状态",
      type: "select",
      options: [
        { value: "all", label: "全部状态" },
        { value: "available", label: "在线" },
        { value: "in_use", label: "使用中" },
        { value: "maintenance", label: "维护中" },
        { value: "offline", label: "离线" }
      ]
    },
    {
      key: "resourceType",
      label: "资源类型",
      type: "input",
      placeholder: "输入资源类型关键词"
    },
    {
      key: "location",
      label: "位置",
      type: "input",
      placeholder: "输入位置关键词"
    },
    {
      key: "dateRange",
      label: "日期范围",
      type: "dateRange"
    }
  ]

  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [editForm, setEditForm] = useState({
    name: "",
    resource_type: "",
    status: "available",
    location: "",
    specifications: "",
    current_user: "",
    maintainer: "",
    usage_percentage: "",
    description: "",
    capacity: "",
    operating_system: "",
    network_config: "",
    access_credentials: "",
    usage_history: "",
    maintenance_schedule: "",
    cost_per_hour: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
    hardwareDetails: "",
  })

  const [createForm, setCreateForm] = useState({
    name: "",
    resource_type: "",
    status: "available",
    location: "",
    specifications: "",
    current_user: "",
    maintainer: "",
    usage_percentage: "",
    description: "",
    capacity: "",
    operating_system: "",
    network_config: "",
    access_credentials: "",
    usage_history: "",
    maintenance_schedule: "",
    cost_per_hour: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
    hardwareDetails: "",
  })

  const { data: statsData, loading: statsLoading } = useApi(() => resourcesApi.getStats())
  const stats = statsData?.overview || []
  
  // 调试日志
  console.log('Resources statsData:', statsData)
  console.log('Resources stats:', stats)
  const {
    data: resources,
    pagination,
    loading: resourcesLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchResources,
  } = usePaginatedApi(
    (params) => resourcesApi.getList(params),
    { size: 10 }
  )
  // 暂时注释掉，后端API未实现
  // const { data: userUsageContributions, loading: usageLoading } = useApi(() => 
  //   resourcesApi.getUserUsageContributions(5)
  // )
  const userUsageContributions: any[] | null = null
  const usageLoading = false

  // 前端字段搜索和筛选
  const displayResources = useMemo(() => {
    if (!resources) return []
    const trimmed = searchText.trim()
    const lower = trimmed.toLowerCase()

    return resources.filter((resource: any) => {
      // 字段搜索
      if (trimmed && searchScope !== "all") {
        if (searchScope === "name") {
          if (!resource.name?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "current_user") {
          if (!resource.current_user?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "resource_type") {
          if (!resource.resource_type?.toLowerCase().includes(lower)) return false
        }
      }

      // 资源类型关键字过滤
      if (filterValues.resourceType?.trim()) {
        const rt = filterValues.resourceType.trim().toLowerCase()
        if (!resource.resource_type || !resource.resource_type.toLowerCase().includes(rt)) return false
      }

      // 位置过滤
      if (filterValues.location?.trim()) {
        const loc = filterValues.location.trim().toLowerCase()
        if (!resource.location || !resource.location.toLowerCase().includes(loc)) return false
      }

      // 日期范围过滤（基于 created_at）
      if (filterValues.dateRange?.start || filterValues.dateRange?.end) {
        if (!resource.created_at) return false
        const d = new Date(resource.created_at)
        if (filterValues.dateRange.start) {
          const start = new Date(filterValues.dateRange.start)
          if (d < start) return false
        }
        if (filterValues.dateRange.end) {
          const end = new Date(filterValues.dateRange.end)
          end.setHours(23, 59, 59, 999)
          if (d > end) return false
        }
      }

      return true
    })
  }, [resources, searchText, searchScope, filterValues])

  const handleSearch = () => {
    const trimmed = searchText.trim()
    if (searchScope === "all") {
      searchBackend(trimmed || "")
    }
    setActiveTab("list")
  }

  const handleDelete = async () => {
    if (!selectedResource?.id || deleting) return
    const ok = window.confirm("确定要删除该资源记录吗？此操作不可恢复。")
    if (!ok) return
    try {
      setDeleting(true)
      await resourcesApi.delete(selectedResource.id)
      await refetchResources()
      setSelectedResource(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除资源失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedResource) return
    setEditForm({
      name: selectedResource.name || "",
      resource_type: selectedResource.resource_type || "",
      status: selectedResource.status || "available",
      location: selectedResource.location || "",
      specifications: selectedResource.specifications || "",
      current_user: selectedResource.current_user || "",
      maintainer: selectedResource.maintainer || "",
      usage_percentage: selectedResource.usage_percentage?.toString() || "",
      description: selectedResource.description || "",
      capacity: selectedResource.capacity || "",
      operating_system: selectedResource.operating_system || "",
      network_config: selectedResource.network_config || "",
      access_credentials: selectedResource.access_credentials || "",
      usage_history: selectedResource.usage_history || "",
      maintenance_schedule: selectedResource.maintenance_schedule || "",
      cost_per_hour: selectedResource.cost_per_hour?.toString() || "",
      imagePath: selectedResource.image_path || "",
      filePath: selectedResource.file_path || "",
      relatedProjects: selectedResource.related_projects
        ? JSON.stringify(selectedResource.related_projects, null, 2)
        : "",
      hardwareDetails: selectedResource.hardware_details
        ? JSON.stringify(selectedResource.hardware_details, null, 2)
        : "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedResource?.id || saving) return
    setFormError("")
    if (!editForm.name.trim()) {
      setFormError("资源名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: editForm.name.trim(),
        resource_type: editForm.resource_type.trim() || undefined,
        maintainer: editForm.maintainer.trim() || undefined,
        description: editForm.description.trim() || undefined,
        image_path: editForm.imagePath.trim() || undefined,
        file_path: editForm.filePath.trim() || undefined,
      }

      // 暂时不处理JSON字段，因为后端schema中没有这些字段

      const updated = await resourcesApi.update(selectedResource.id, payload)
      setSelectedResource(updated)
      await refetchResources()
      setEditOpen(false)
    } catch (error) {
      console.error("更新资源失败", error)
      alert("更新失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateResource = async () => {
    if (saving) return
    setFormError("")
    if (!createForm.name.trim()) {
      setFormError("资源名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: createForm.name.trim(),
        resource_type: createForm.resource_type.trim() || "其他",
        maintainer: createForm.maintainer.trim() || null,
        description: createForm.description.trim() || null,
        image_path: createForm.imagePath.trim() || null,
        file_path: createForm.filePath.trim() || null,
        download_count: 0,
        is_public: true,
      }

      // 暂时不处理JSON字段，因为后端schema中没有这些字段

      const created = await resourcesApi.create(payload)
      setCreateOpen(false)
      setCreateForm({
        name: "",
        resource_type: "",
        status: "available",
        location: "",
        specifications: "",
        current_user: "",
        maintainer: "",
        usage_percentage: "",
        description: "",
        capacity: "",
        operating_system: "",
        network_config: "",
        access_credentials: "",
        usage_history: "",
        maintenance_schedule: "",
        cost_per_hour: "",
        imagePath: "",
        filePath: "",
        relatedProjects: "",
        hardwareDetails: "",
      })
      await refetchResources()
      setSelectedResource(created)
      setActiveTab("detail")
    } catch (error) {
      console.error("创建资源失败", error)
      alert("创建失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">资源管理</h1>
          <p className="text-sm text-muted-foreground">
            统一管理科研资源，确保高效、安全与可追溯的使用。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterPanel
            configs={filterConfigs}
            values={filterValues}
            onChange={(newValues) => {
              setFilterValues(newValues)
              // 同步到后端筛选
              if (newValues.status && newValues.status !== "all") {
                filter({ status: newValues.status })
              } else {
                filter({ status: undefined })
              }
            }}
            variant="popover"
            triggerText="筛选条件"
          />
          <ImportDialog
            entityType="resources"
            entityName="资源"
            apiEndpoint="/api/resources"
            onImportSuccess={() => refetchResources()}
            sampleFields={[
              "name", "resource_type", "description", "version", "maintainer",
              "maintenance_cycle_days", "next_maintenance_date", "license",
              "download_count", "usage_rate", "image_path", "file_path",
              "external_url", "tags", "is_public"
            ]}
          />
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增资源
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
        ) : stats && stats.length > 0 ? (
          stats.map((stat) => {
            // 根据统计类型选择图标
            const getStatIcon = (label: string) => {
              const lowerLabel = label.toLowerCase()
              if (lowerLabel.includes('总资源') || lowerLabel.includes('总数')) {
                return <Database className="h-4 w-4 text-blue-600" />
              } else if (lowerLabel.includes('公开') || lowerLabel.includes('public')) {
                return <TrendingUp className="h-4 w-4 text-green-600" />
              } else if (lowerLabel.includes('私有') || lowerLabel.includes('private')) {
                return <Settings className="h-4 w-4 text-orange-600" />
              } else if (lowerLabel.includes('活跃') || lowerLabel.includes('active')) {
                return <Activity className="h-4 w-4 text-purple-600" />
              } else if (lowerLabel.includes('服务器') || lowerLabel.includes('server')) {
                return <Server className="h-4 w-4 text-muted-foreground" />
              } else if (lowerLabel.includes('存储') || lowerLabel.includes('storage')) {
                return <HardDrive className="h-4 w-4 text-muted-foreground" />
              } else if (lowerLabel.includes('网络') || lowerLabel.includes('network')) {
                return <Cpu className="h-4 w-4 text-muted-foreground" />
              } else {
                return <Monitor className="h-4 w-4 text-muted-foreground" />
              }
            }

            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  {getStatIcon(stat.label)}
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
            )
          })
        ) : (
          <div className="col-span-4 text-center py-8">
            <p className="text-sm text-muted-foreground">暂无统计数据</p>
          </div>
        )}
      </div>

      {/* 资源管理：支持列表视图 + 详情视图 + 分析视图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>资源目录</CardTitle>
              <CardDescription>集中浏览数据集、实验平台及常用工具</CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <Input
                  placeholder="输入关键词..."
                  className="h-8 w-40 md:w-56 text-xs"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch()
                  }}
                />
                <Select
                  value={searchScope}
                  onValueChange={(v) => setSearchScope(v as typeof searchScope)}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue placeholder="搜索范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全字段模糊</SelectItem>
                    <SelectItem value="name">按资源名</SelectItem>
                    <SelectItem value="current_user">按使用者</SelectItem>
                    <SelectItem value="resource_type">按资源类型</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={handleSearch}
                  disabled={resourcesLoading}
                >
                  <Search className="mr-1 h-3 w-3" />
                  搜索
                </Button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>"全字段模糊" 使用后端搜索；其他选项为当前页字段过滤。</span>
              </div>
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
              {selectedResource && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedResource.name}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {resourcesLoading ? (
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
              ) : displayResources && displayResources.length > 0 ? (
                <div className="space-y-3">
                  {displayResources.map((resource) => (
                    <button
                      key={resource.id}
                      type="button"
                      onClick={() => {
                        setSelectedResource(resource)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getResourceIcon(resource.resource_type)}
                          <h3 className="font-medium line-clamp-1">{resource.name}</h3>
                          <Badge className={getStatusColor(resource.status)}>
                            {formatStatus(resource.status)}
                          </Badge>
                          {resource.resource_type && (
                            <Badge variant="outline" className="text-xs">
                              {resource.resource_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {resource.location && (
                            <div>位置：{resource.location}</div>
                          )}
                          {resource.current_user && (
                            <div>使用者：{resource.current_user}</div>
                          )}
                          {resource.specifications && (
                            <div className="line-clamp-1">配置：{resource.specifications}</div>
                          )}
                        </div>
                        {resource.usage_percentage !== undefined && resource.usage_percentage > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>使用率</span>
                              <span className={getUsageColor(resource.usage_percentage)}>
                                {resource.usage_percentage}%
                              </span>
                            </div>
                            <Progress value={resource.usage_percentage} className="h-1" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {resource.maintainer && (
                          <div className="text-muted-foreground">
                            维护：{resource.maintainer}
                          </div>
                        )}
                        {resource.cost_per_hour && (
                          <div className="text-muted-foreground">
                            ¥{resource.cost_per_hour}/小时
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无资源数据</p>
                </div>
              )}

              {/* 分页控制 */}
              {pagination.pages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div>
                    共 {pagination.total} 项，当前第 {pagination.page} / {pagination.pages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page <= 1 || resourcesLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || resourcesLoading}
                      onClick={() => goToPage(pagination.page + 1)}
                    >
                      下一页
                    </Button>
                    <Select
                      value={String(pagination.size)}
                      onValueChange={(v) => changePageSize(Number(v))}
                    >
                      <SelectTrigger className="h-7 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">每页 5 项</SelectItem>
                        <SelectItem value="10">每页 10 项</SelectItem>
                        <SelectItem value="20">每页 20 项</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 详情视图 */}
            <TabsContent value="detail">
              {selectedResource ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug flex items-center gap-2">
                        {getResourceIcon(selectedResource.resource_type)}
                        {selectedResource.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedResource.status)}>
                          {formatStatus(selectedResource.status)}
                        </Badge>
                        {selectedResource.resource_type && <span>类型：{selectedResource.resource_type}</span>}
                        {selectedResource.location && <span>位置：{selectedResource.location}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      {selectedResource.cost_per_hour && (
                        <span className="text-muted-foreground">
                          成本：¥{selectedResource.cost_per_hour}/小时
                        </span>
                      )}
                      {selectedResource.capacity && (
                        <span className="text-muted-foreground">
                          容量：{selectedResource.capacity}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">当前使用者：</span>
                      <span className="text-muted-foreground">
                        {selectedResource.current_user || "空闲"}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">维护负责人：</span>
                      <span className="text-muted-foreground">
                        {selectedResource.maintainer || "未指定"}
                      </span>
                    </div>

                    {selectedResource.specifications && (
                      <div>
                        <span className="font-medium">配置规格：</span>
                        <span className="text-muted-foreground">{selectedResource.specifications}</span>
                      </div>
                    )}

                    {selectedResource.usage_percentage !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">资源使用率：</span>
                          <span className={`font-medium ${getUsageColor(selectedResource.usage_percentage)}`}>
                            {selectedResource.usage_percentage}%
                          </span>
                        </div>
                        <Progress value={selectedResource.usage_percentage} className="h-2" />
                      </div>
                    )}

                    {selectedResource.description && (
                      <div className="space-y-1">
                        <span className="font-medium">资源描述：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedResource.description}
                        </p>
                      </div>
                    )}

                    {selectedResource.operating_system && (
                      <div>
                        <span className="font-medium">操作系统：</span>
                        <span className="text-muted-foreground">{selectedResource.operating_system}</span>
                      </div>
                    )}

                    {selectedResource.network_config && (
                      <div className="space-y-1">
                        <span className="font-medium">网络配置：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedResource.network_config}
                        </p>
                      </div>
                    )}

                    {selectedResource.access_credentials && (
                      <div className="space-y-1">
                        <span className="font-medium">访问凭证：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground font-mono text-xs bg-muted p-2 rounded">
                          {selectedResource.access_credentials}
                        </p>
                      </div>
                    )}

                    {selectedResource.usage_history && (
                      <div className="space-y-1">
                        <span className="font-medium">使用历史：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedResource.usage_history}
                        </p>
                      </div>
                    )}

                    {selectedResource.maintenance_schedule && (
                      <div className="space-y-1">
                        <span className="font-medium">维护计划：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedResource.maintenance_schedule}
                        </p>
                      </div>
                    )}

                    {(selectedResource.created_at || selectedResource.last_maintenance) && (
                      <div className="space-y-1">
                        <span className="font-medium">时间记录：</span>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {selectedResource.created_at && (
                            <div>创建时间：{new Date(selectedResource.created_at).toLocaleDateString("zh-CN")}</div>
                          )}
                          {selectedResource.last_maintenance && (
                            <div>上次维护：{new Date(selectedResource.last_maintenance).toLocaleDateString("zh-CN")}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {(selectedResource.image_path || selectedResource.file_path) && (
                      <div className="space-y-1">
                        <span className="font-medium">相关文档：</span>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          {selectedResource.image_path && (
                            <a
                              href={selectedResource.image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              查看资源图片
                            </a>
                          )}
                          {selectedResource.file_path && (
                            <a
                              href={selectedResource.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              下载相关文档
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedResource.hardware_details && (
                      <div className="space-y-1">
                        <span className="font-medium">硬件详情：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedResource.hardware_details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedResource.related_projects && (
                      <div className="space-y-1">
                        <span className="font-medium">关联项目：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedResource.related_projects, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedResource.id}</span>
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
                  暂未选择任何资源，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图：用户使用统计 + 资源监控 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>用户使用统计</CardTitle>
                    <CardDescription>成员资源使用情况</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 用户使用统计功能暂未实现 */}
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">暂无使用数据</p>
                      <p className="text-xs text-muted-foreground mt-1">此功能将在后续版本中实现</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>资源监控</CardTitle>
                    <CardDescription>资源状态与管理信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">总资源数</span>
                        <span className="text-sm font-medium">{pagination.total}项</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">当前页面</span>
                        <span className="text-sm font-medium">
                          {pagination.page} / {pagination.pages}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">每页显示</span>
                        <span className="text-sm font-medium">{pagination.size}项</span>
                      </div>
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">系统运行正常</p>
                            <p className="text-xs text-muted-foreground">所有关键资源运行稳定</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <Monitor className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">实时监控</p>
                            <p className="text-xs text-muted-foreground">资源使用率和性能指标</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <Settings className="h-4 w-4 text-yellow-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">维护提醒</p>
                            <p className="text-xs text-muted-foreground">定期维护保障资源可用性</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 编辑资源对话框 */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑资源</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="edit-name">资源名称 *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-resource-type">资源类型</Label>
              <Input
                id="edit-resource-type"
                value={editForm.resource_type}
                onChange={(e) => setEditForm((f) => ({ ...f, resource_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-status">状态</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger id="edit-status" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">在线</SelectItem>
                  <SelectItem value="in_use">使用中</SelectItem>
                  <SelectItem value="maintenance">维护中</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-location">位置</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-current-user">当前使用者</Label>
              <Input
                id="edit-current-user"
                value={editForm.current_user}
                onChange={(e) => setEditForm((f) => ({ ...f, current_user: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-maintainer">维护负责人</Label>
              <Input
                id="edit-maintainer"
                value={editForm.maintainer}
                onChange={(e) => setEditForm((f) => ({ ...f, maintainer: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-usage-percentage">使用率（%）</Label>
              <Input
                id="edit-usage-percentage"
                type="number"
                min="0"
                max="100"
                value={editForm.usage_percentage}
                onChange={(e) => setEditForm((f) => ({ ...f, usage_percentage: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-cost-per-hour">成本/小时（元）</Label>
              <Input
                id="edit-cost-per-hour"
                type="number"
                step="0.01"
                value={editForm.cost_per_hour}
                onChange={(e) => setEditForm((f) => ({ ...f, cost_per_hour: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-specifications">配置规格</Label>
              <Input
                id="edit-specifications"
                value={editForm.specifications}
                onChange={(e) => setEditForm((f) => ({ ...f, specifications: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-capacity">容量</Label>
              <Input
                id="edit-capacity"
                value={editForm.capacity}
                onChange={(e) => setEditForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-os">操作系统</Label>
              <Input
                id="edit-os"
                value={editForm.operating_system}
                onChange={(e) => setEditForm((f) => ({ ...f, operating_system: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-image-path">资源图片 URL</Label>
              <Input
                id="edit-image-path"
                placeholder="例如 https://.../resource.jpg"
                value={editForm.imagePath}
                onChange={(e) => setEditForm((f) => ({ ...f, imagePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-file-path">相关文档 URL</Label>
              <Input
                id="edit-file-path"
                placeholder="例如 https://.../document.pdf"
                value={editForm.filePath}
                onChange={(e) => setEditForm((f) => ({ ...f, filePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-description">资源描述</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-network-config">网络配置</Label>
              <Textarea
                id="edit-network-config"
                rows={3}
                value={editForm.network_config}
                onChange={(e) => setEditForm((f) => ({ ...f, network_config: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-access-credentials">访问凭证</Label>
              <Textarea
                id="edit-access-credentials"
                rows={3}
                value={editForm.access_credentials}
                onChange={(e) => setEditForm((f) => ({ ...f, access_credentials: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-usage-history">使用历史</Label>
              <Textarea
                id="edit-usage-history"
                rows={3}
                value={editForm.usage_history}
                onChange={(e) => setEditForm((f) => ({ ...f, usage_history: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-maintenance-schedule">维护计划</Label>
              <Textarea
                id="edit-maintenance-schedule"
                rows={3}
                value={editForm.maintenance_schedule}
                onChange={(e) => setEditForm((f) => ({ ...f, maintenance_schedule: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-hardware-details">硬件详情（JSON）</Label>
              <Textarea
                id="edit-hardware-details"
                rows={3}
                placeholder='例如 {"CPU": "Intel i7", "RAM": "32GB"}'
                value={editForm.hardwareDetails}
                onChange={(e) => setEditForm((f) => ({ ...f, hardwareDetails: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-related-projects">关联项目（JSON）</Label>
              <Textarea
                id="edit-related-projects"
                rows={3}
                placeholder='例如 {"project_id": "xxx", "name": "项目名称"}'
                value={editForm.relatedProjects}
                onChange={(e) => setEditForm((f) => ({ ...f, relatedProjects: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => !saving && setEditOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增资源对话框 */}
      <Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增资源</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="create-name">资源名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-resource-type">资源类型</Label>
              <Input
                id="create-resource-type"
                value={createForm.resource_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, resource_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-status">状态</Label>
              <Select
                value={createForm.status}
                onValueChange={(value) => setCreateForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger id="create-status" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">在线</SelectItem>
                  <SelectItem value="in_use">使用中</SelectItem>
                  <SelectItem value="maintenance">维护中</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-location">位置</Label>
              <Input
                id="create-location"
                value={createForm.location}
                onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-current-user">当前使用者</Label>
              <Input
                id="create-current-user"
                value={createForm.current_user}
                onChange={(e) => setCreateForm((f) => ({ ...f, current_user: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-maintainer">维护负责人</Label>
              <Input
                id="create-maintainer"
                value={createForm.maintainer}
                onChange={(e) => setCreateForm((f) => ({ ...f, maintainer: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-usage-percentage">使用率（%）</Label>
              <Input
                id="create-usage-percentage"
                type="number"
                min="0"
                max="100"
                value={createForm.usage_percentage}
                onChange={(e) => setCreateForm((f) => ({ ...f, usage_percentage: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-cost-per-hour">成本/小时（元）</Label>
              <Input
                id="create-cost-per-hour"
                type="number"
                step="0.01"
                value={createForm.cost_per_hour}
                onChange={(e) => setCreateForm((f) => ({ ...f, cost_per_hour: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-specifications">配置规格</Label>
              <Input
                id="create-specifications"
                value={createForm.specifications}
                onChange={(e) => setCreateForm((f) => ({ ...f, specifications: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-capacity">容量</Label>
              <Input
                id="create-capacity"
                value={createForm.capacity}
                onChange={(e) => setCreateForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-os">操作系统</Label>
              <Input
                id="create-os"
                value={createForm.operating_system}
                onChange={(e) => setCreateForm((f) => ({ ...f, operating_system: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-image-path">资源图片 URL</Label>
              <Input
                id="create-image-path"
                placeholder="例如 https://.../resource.jpg"
                value={createForm.imagePath}
                onChange={(e) => setCreateForm((f) => ({ ...f, imagePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-file-path">相关文档 URL</Label>
              <Input
                id="create-file-path"
                placeholder="例如 https://.../document.pdf"
                value={createForm.filePath}
                onChange={(e) => setCreateForm((f) => ({ ...f, filePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-description">资源描述</Label>
              <Textarea
                id="create-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-network-config">网络配置</Label>
              <Textarea
                id="create-network-config"
                rows={3}
                value={createForm.network_config}
                onChange={(e) => setCreateForm((f) => ({ ...f, network_config: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-access-credentials">访问凭证</Label>
              <Textarea
                id="create-access-credentials"
                rows={3}
                value={createForm.access_credentials}
                onChange={(e) => setCreateForm((f) => ({ ...f, access_credentials: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-usage-history">使用历史</Label>
              <Textarea
                id="create-usage-history"
                rows={3}
                value={createForm.usage_history}
                onChange={(e) => setCreateForm((f) => ({ ...f, usage_history: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-maintenance-schedule">维护计划</Label>
              <Textarea
                id="create-maintenance-schedule"
                rows={3}
                value={createForm.maintenance_schedule}
                onChange={(e) => setCreateForm((f) => ({ ...f, maintenance_schedule: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-hardware-details">硬件详情（JSON）</Label>
              <Textarea
                id="create-hardware-details"
                rows={3}
                placeholder='例如 {"CPU": "Intel i7", "RAM": "32GB"}'
                value={createForm.hardwareDetails}
                onChange={(e) => setCreateForm((f) => ({ ...f, hardwareDetails: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-related-projects">关联项目（JSON）</Label>
              <Textarea
                id="create-related-projects"
                rows={3}
                placeholder='例如 {"project_id": "xxx", "name": "项目名称"}'
                value={createForm.relatedProjects}
                onChange={(e) => setCreateForm((f) => ({ ...f, relatedProjects: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => !saving && setCreateOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleCreateResource}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
