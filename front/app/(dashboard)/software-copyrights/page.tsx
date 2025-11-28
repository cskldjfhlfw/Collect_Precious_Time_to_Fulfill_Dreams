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
  Code,
  FileText,
  Shield,
  Calendar,
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
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
import { softwareCopyrightsApi } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "registered":
    case "已登记": 
      return "bg-green-100 text-green-800"
    case "pending":
    case "申请中": 
      return "bg-yellow-100 text-yellow-800"
    case "update_required":
    case "待更新": 
      return "bg-blue-100 text-blue-800"
    default: 
      return "bg-gray-100 text-gray-800"
  }
}

const formatStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case "registered": return "已登记"
    case "pending": return "申请中"
    case "update_required": return "待更新"
    case "available": return "可用"
    default: return status || "未知"
  }
}

export default function SoftwareCopyrightsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "analysis">("list")
  const [selectedCopyright, setSelectedCopyright] = useState<any | null>(null)
  const [searchText, setSearchText] = useState("")
  const [searchScope, setSearchScope] = useState<"all" | "name" | "developer" | "resource_type">("all")
  const [deleting, setDeleting] = useState(false)
  
  // 筛选状态
  const [filterValues, setFilterValues] = useState<FilterValue>({
    status: "",
    resourceType: "",
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
        { value: "registered", label: "已登记" },
        { value: "pending", label: "申请中" },
        { value: "update_required", label: "待更新" },
        { value: "available", label: "可用" }
      ]
    },
    {
      key: "resourceType",
      label: "资源类型",
      type: "input",
      placeholder: "输入类型关键词"
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
    registration_number: "",
    version: "",
    status: "pending",
    resource_type: "",
    developer: "",
    language: "",
    description: "",
    technical_features: "",
    software_type: "",
    running_environment: "",
    hardware_environment: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
  })

  const [createForm, setCreateForm] = useState({
    name: "",
    registration_number: "",
    version: "",
    status: "pending",
    resource_type: "",
    developer: "",
    language: "",
    description: "",
    technical_features: "",
    software_type: "",
    running_environment: "",
    hardware_environment: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
  })

  const { data: stats, loading: statsLoading } = useApi(() => softwareCopyrightsApi.getStats())
  const {
    data: copyrights,
    pagination,
    loading: copyrightsLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchCopyrights,
  } = usePaginatedApi(
    (params) => softwareCopyrightsApi.getList(params),
    { size: 10 }
  )
  // 暂时注释掉，后端API未实现
  // const { data: developerContributions, loading: developersLoading } = useApi(() => 
  //   softwareCopyrightsApi.getDeveloperContributions(5)
  // )
  const developerContributions: any[] | null = null
  const developersLoading = false

  // 前端字段搜索：当 scope != all 时只在当前页数据中筛选
  const displayCopyrights = useMemo(() => {
    if (!copyrights) return []
    const trimmed = searchText.trim()
    const lower = trimmed.toLowerCase()

    return copyrights.filter((copyright: any) => {
      // 字段搜索
      if (trimmed && searchScope !== "all") {
        if (searchScope === "name") {
          if (!copyright.name?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "developer") {
          if (!copyright.developer?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "resource_type") {
          if (!copyright.resource_type?.toLowerCase().includes(lower)) return false
        }
      }

      // 资源类型关键字过滤
      if (filterValues.resourceType?.trim()) {
        const rt = filterValues.resourceType.trim().toLowerCase()
        if (!copyright.resource_type || !copyright.resource_type.toLowerCase().includes(rt)) return false
      }

      // 日期范围过滤（基于 created_at）
      if (filterValues.dateRange?.start || filterValues.dateRange?.end) {
        if (!copyright.created_at) return false
        const d = new Date(copyright.created_at)
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
  }, [copyrights, searchText, searchScope, filterValues])

  const handleSearch = () => {
    const trimmed = searchText.trim()
    if (searchScope === "all") {
      // 调用后端全字段模糊搜索
      searchBackend(trimmed || "")
    }
    // 字段搜索仅前端过滤，已在 displayCopyrights 中处理
    setActiveTab("list")
  }

  const handleDelete = async () => {
    if (!selectedCopyright?.id || deleting) return
    const ok = window.confirm("确定要删除该软件著作权记录吗？此操作不可恢复。")
    if (!ok) return
    try {
      setDeleting(true)
      await softwareCopyrightsApi.delete(selectedCopyright.id)
      await refetchCopyrights()
      setSelectedCopyright(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除软著失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedCopyright) return
    setEditForm({
      name: selectedCopyright.name || "",
      registration_number: selectedCopyright.registration_number || "",
      version: selectedCopyright.version || "",
      status: selectedCopyright.status || "pending",
      resource_type: selectedCopyright.resource_type || "",
      developer: selectedCopyright.developer || "",
      language: selectedCopyright.language || "",
      description: selectedCopyright.description || "",
      technical_features: selectedCopyright.technical_features || "",
      software_type: selectedCopyright.software_type || "",
      running_environment: selectedCopyright.running_environment || "",
      hardware_environment: selectedCopyright.hardware_environment || "",
      imagePath: selectedCopyright.image_path || "",
      filePath: selectedCopyright.file_path || "",
      relatedProjects: selectedCopyright.related_projects
        ? JSON.stringify(selectedCopyright.related_projects, null, 2)
        : "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedCopyright?.id || saving) return
    setFormError("")
    if (!editForm.name.trim()) {
      setFormError("软件名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: editForm.name.trim(),
        registration_number: editForm.registration_number.trim() || null,
        version: editForm.version.trim() || null,
        status: editForm.status || "待更新",
        developer: editForm.developer.trim() || null,
        category: editForm.resource_type.trim() || null,
        language: editForm.language.trim() || null,
        description: editForm.description.trim() || null,
      }

      if (editForm.relatedProjects.trim()) {
        try {
          payload.related_projects = JSON.parse(editForm.relatedProjects)
        } catch {
          setFormError("关联项目必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      const updated = await softwareCopyrightsApi.update(selectedCopyright.id, payload)
      setSelectedCopyright(updated)
      await refetchCopyrights()
      setEditOpen(false)
    } catch (error) {
      console.error("更新软著失败", error)
      alert("更新失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCopyright = async () => {
    if (saving) return
    setFormError("")
    if (!createForm.name.trim()) {
      setFormError("软件名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: createForm.name.trim(),
        registration_number: createForm.registration_number.trim() || "未登记",
        version: createForm.version.trim() || "1.0",
        status: createForm.status || "待更新",
        developer: createForm.developer.trim() || null,
        category: createForm.resource_type.trim() || null,
        language: createForm.language.trim() || null,
        description: createForm.description.trim() || null,
      }

      if (createForm.relatedProjects.trim()) {
        try {
          payload.related_projects = JSON.parse(createForm.relatedProjects)
        } catch {
          setFormError("关联项目必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      const created = await softwareCopyrightsApi.create(payload)
      setCreateOpen(false)
      setCreateForm({
        name: "",
        registration_number: "",
        version: "",
        status: "pending",
        resource_type: "",
        developer: "",
        language: "",
        description: "",
        technical_features: "",
        software_type: "",
        running_environment: "",
        hardware_environment: "",
        imagePath: "",
        filePath: "",
        relatedProjects: "",
      })
      await refetchCopyrights()
      setSelectedCopyright(created)
      setActiveTab("detail")
    } catch (error) {
      console.error("创建软著失败", error)
      alert("创建失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">软件著作权</h1>
          <p className="text-sm text-muted-foreground">
            统筹软件著作权登记、材料管理与合规流程。
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
            entityType="software_copyrights"
            entityName="软件著作权"
            apiEndpoint="/api/software-copyrights"
            onImportSuccess={() => refetchCopyrights()}
            sampleFields={[
              "name", "registration_number", "registration_date", "version", "status",
              "development_language", "category", "latest_update", "maintenance_contact",
              "developers", "image_path", "file_path"
            ]}
          />
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增软著
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
                <Code className="h-4 w-4 text-muted-foreground" />
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

      {/* 软著进展：支持列表视图 + 详情视图 + 分析视图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>登记进展</CardTitle>
              <CardDescription>软件著作权登记与证书管理</CardDescription>
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
                    <SelectItem value="name">按软件名</SelectItem>
                    <SelectItem value="developer">按开发者</SelectItem>
                    <SelectItem value="resource_type">按资源类型</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={handleSearch}
                  disabled={copyrightsLoading}
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
              {selectedCopyright && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedCopyright.name}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {copyrightsLoading ? (
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
              ) : displayCopyrights && displayCopyrights.length > 0 ? (
                <div className="space-y-3">
                  {displayCopyrights.map((copyright) => (
                    <button
                      key={copyright.id}
                      type="button"
                      onClick={() => {
                        setSelectedCopyright(copyright)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-clamp-1">{copyright.name}</h3>
                          <Badge className={getStatusColor(copyright.status)}>
                            {formatStatus(copyright.status)}
                          </Badge>
                          {copyright.version && (
                            <Badge variant="outline" className="text-xs">
                              {copyright.version}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {copyright.registration_number && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span className="line-clamp-1">
                                登记号：{copyright.registration_number}
                              </span>
                            </div>
                          )}
                          {copyright.created_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(copyright.created_at).toLocaleDateString("zh-CN")}
                            </div>
                          )}
                          {copyright.developer && <div>开发者：{copyright.developer}</div>}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {copyright.resource_type && (
                          <Badge variant="outline" className="text-xs">
                            {copyright.resource_type}
                          </Badge>
                        )}
                        {copyright.language && (
                          <div className="text-muted-foreground">
                            {copyright.language}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无软件著作权数据</p>
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
                      disabled={pagination.page <= 1 || copyrightsLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || copyrightsLoading}
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
              {selectedCopyright ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{selectedCopyright.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedCopyright.status)}>
                          {formatStatus(selectedCopyright.status)}
                        </Badge>
                        {selectedCopyright.version && <span>版本：{selectedCopyright.version}</span>}
                        {selectedCopyright.created_at && (
                          <span>
                            创建日期：
                            {new Date(selectedCopyright.created_at).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      {selectedCopyright.resource_type && (
                        <span className="text-muted-foreground">
                          资源类型：{selectedCopyright.resource_type}
                        </span>
                      )}
                      {selectedCopyright.language && (
                        <span className="text-muted-foreground">
                          开发语言：{selectedCopyright.language}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">登记号：</span>
                      <span className="text-muted-foreground">
                        {selectedCopyright.registration_number || "待申请"}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">开发者：</span>
                      <span className="text-muted-foreground">
                        {selectedCopyright.developer || "未知开发者"}
                      </span>
                    </div>

                    {selectedCopyright.software_type && (
                      <div>
                        <span className="font-medium">软件类型：</span>
                        <span className="text-muted-foreground">{selectedCopyright.software_type}</span>
                      </div>
                    )}

                    {selectedCopyright.description && (
                      <div className="space-y-1">
                        <span className="font-medium">软件描述：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCopyright.description}
                        </p>
                      </div>
                    )}

                    {selectedCopyright.technical_features && (
                      <div className="space-y-1">
                        <span className="font-medium">技术特点：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCopyright.technical_features}
                        </p>
                      </div>
                    )}

                    {selectedCopyright.running_environment && (
                      <div>
                        <span className="font-medium">运行环境：</span>
                        <span className="text-muted-foreground">{selectedCopyright.running_environment}</span>
                      </div>
                    )}

                    {selectedCopyright.hardware_environment && (
                      <div>
                        <span className="font-medium">硬件环境：</span>
                        <span className="text-muted-foreground">{selectedCopyright.hardware_environment}</span>
                      </div>
                    )}

                    {(selectedCopyright.image_path || selectedCopyright.file_path) && (
                      <div className="space-y-1">
                        <span className="font-medium">附件与图片：</span>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          {selectedCopyright.image_path && (
                            <a
                              href={selectedCopyright.image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              查看软件截图
                            </a>
                          )}
                          {selectedCopyright.file_path && (
                            <a
                              href={selectedCopyright.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              下载证书文档
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedCopyright.related_projects && (
                      <div className="space-y-1">
                        <span className="font-medium">关联项目：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedCopyright.related_projects, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedCopyright.id}</span>
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
                  暂未选择任何软著，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图：开发者贡献 + 软著统计 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>开发者贡献</CardTitle>
                    <CardDescription>团队成员的软著产出情况</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 开发者贡献统计功能暂未实现 */}
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">暂无开发者数据</p>
                      <p className="text-xs text-muted-foreground mt-1">此功能将在后续版本中实现</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>软著统计</CardTitle>
                    <CardDescription>软著分布与管理情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">总软著数</span>
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
                            <p className="text-sm font-medium">合规检查通过</p>
                            <p className="text-xs text-muted-foreground">软著材料完整规范</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">版本更新提醒</p>
                            <p className="text-xs text-muted-foreground">定期检查软件版本更新</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">材料完整性</p>
                            <p className="text-xs text-muted-foreground">申请材料已备份存档</p>
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

      {/* 编辑软著对话框 */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑软件著作权</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="edit-name">软件名称 *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-registration">登记号</Label>
              <Input
                id="edit-registration"
                value={editForm.registration_number}
                onChange={(e) => setEditForm((f) => ({ ...f, registration_number: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-version">版本号</Label>
              <Input
                id="edit-version"
                value={editForm.version}
                onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
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
                  <SelectItem value="pending">申请中</SelectItem>
                  <SelectItem value="registered">已登记</SelectItem>
                  <SelectItem value="update_required">待更新</SelectItem>
                  <SelectItem value="available">可用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-developer">开发者</Label>
              <Input
                id="edit-developer"
                value={editForm.developer}
                onChange={(e) => setEditForm((f) => ({ ...f, developer: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-language">开发语言</Label>
              <Input
                id="edit-language"
                value={editForm.language}
                onChange={(e) => setEditForm((f) => ({ ...f, language: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-resource-type">资源类型</Label>
              <Input
                id="edit-resource-type"
                value={editForm.resource_type}
                onChange={(e) => setEditForm((f) => ({ ...f, resource_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-image-path">软件截图 URL</Label>
              <Input
                id="edit-image-path"
                placeholder="例如 https://.../screenshot.png"
                value={editForm.imagePath}
                onChange={(e) => setEditForm((f) => ({ ...f, imagePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-file-path">证书文档 URL</Label>
              <Input
                id="edit-file-path"
                placeholder="例如 https://.../certificate.pdf"
                value={editForm.filePath}
                onChange={(e) => setEditForm((f) => ({ ...f, filePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-description">软件描述</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-technical-features">技术特点</Label>
              <Textarea
                id="edit-technical-features"
                rows={3}
                value={editForm.technical_features}
                onChange={(e) => setEditForm((f) => ({ ...f, technical_features: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-software-type">软件类型</Label>
              <Input
                id="edit-software-type"
                value={editForm.software_type}
                onChange={(e) => setEditForm((f) => ({ ...f, software_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-running-env">运行环境</Label>
              <Input
                id="edit-running-env"
                value={editForm.running_environment}
                onChange={(e) => setEditForm((f) => ({ ...f, running_environment: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-hardware-env">硬件环境</Label>
              <Input
                id="edit-hardware-env"
                value={editForm.hardware_environment}
                onChange={(e) => setEditForm((f) => ({ ...f, hardware_environment: e.target.value }))}
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

      {/* 新增软著对话框 */}
      <Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增软件著作权</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="create-name">软件名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-registration">登记号</Label>
              <Input
                id="create-registration"
                value={createForm.registration_number}
                onChange={(e) => setCreateForm((f) => ({ ...f, registration_number: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-version">版本号</Label>
              <Input
                id="create-version"
                value={createForm.version}
                onChange={(e) => setCreateForm((f) => ({ ...f, version: e.target.value }))}
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
                  <SelectItem value="pending">申请中</SelectItem>
                  <SelectItem value="registered">已登记</SelectItem>
                  <SelectItem value="update_required">待更新</SelectItem>
                  <SelectItem value="available">可用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-developer">开发者</Label>
              <Input
                id="create-developer"
                value={createForm.developer}
                onChange={(e) => setCreateForm((f) => ({ ...f, developer: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-language">开发语言</Label>
              <Input
                id="create-language"
                value={createForm.language}
                onChange={(e) => setCreateForm((f) => ({ ...f, language: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-resource-type">资源类型</Label>
              <Input
                id="create-resource-type"
                value={createForm.resource_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, resource_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-image-path">软件截图 URL</Label>
              <Input
                id="create-image-path"
                placeholder="例如 https://.../screenshot.png"
                value={createForm.imagePath}
                onChange={(e) => setCreateForm((f) => ({ ...f, imagePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-file-path">证书文档 URL</Label>
              <Input
                id="create-file-path"
                placeholder="例如 https://.../certificate.pdf"
                value={createForm.filePath}
                onChange={(e) => setCreateForm((f) => ({ ...f, filePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-description">软件描述</Label>
              <Textarea
                id="create-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-technical-features">技术特点</Label>
              <Textarea
                id="create-technical-features"
                rows={3}
                value={createForm.technical_features}
                onChange={(e) => setCreateForm((f) => ({ ...f, technical_features: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-software-type">软件类型</Label>
              <Input
                id="create-software-type"
                value={createForm.software_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, software_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-running-env">运行环境</Label>
              <Input
                id="create-running-env"
                value={createForm.running_environment}
                onChange={(e) => setCreateForm((f) => ({ ...f, running_environment: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-hardware-env">硬件环境</Label>
              <Input
                id="create-hardware-env"
                value={createForm.hardware_environment}
                onChange={(e) => setCreateForm((f) => ({ ...f, hardware_environment: e.target.value }))}
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
              onClick={handleCreateCopyright}
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
