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
  Award,
  Clock,
  DollarSign,
  MapPin,
  Plus,
  Filter,
  Search,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
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
import { FormDialog } from "@/components/ui/form-dialog"
import { useApi, usePaginatedApi } from "@/hooks/useApi"
import { patentsApi } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "authorized":
    case "已授权": 
      return "bg-green-100 text-green-800"
    case "under_review":
    case "实质审查": 
      return "bg-yellow-100 text-yellow-800"
    case "preliminary_review":
    case "初步审查": 
      return "bg-blue-100 text-blue-800"
    case "maintenance":
    case "维护中": 
      return "bg-purple-100 text-purple-800"
    default: 
      return "bg-gray-100 text-gray-800"
  }
}

const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "authorized": return "已授权"
    case "under_review": return "实质审查"
    case "preliminary_review": return "初步审查"
    case "maintenance": return "维护中"
    case "pending": return "申请中"
    default: return status
  }
}

const getValueColor = (value: string) => {
  switch (value?.toLowerCase()) {
    case "high":
    case "高": 
      return "text-red-600"
    case "medium":
    case "中": 
      return "text-yellow-600"
    case "low":
    case "低": 
      return "text-green-600"
    default: 
      return "text-gray-600"
  }
}

const formatValue = (value: string) => {
  switch (value?.toLowerCase()) {
    case "high": return "高"
    case "medium": return "中"
    case "low": return "低"
    default: return value || "未评估"
  }
}

export default function PatentsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "analysis">("list")
  const [selectedPatent, setSelectedPatent] = useState<any | null>(null)
  const [searchText, setSearchText] = useState("")
  const [searchScope, setSearchScope] = useState<"all" | "name" | "inventors" | "technology_field">("all")
  const [deleting, setDeleting] = useState(false)
  
  // 筛选状态
  const [filterValues, setFilterValues] = useState<FilterValue>({
    status: "",
    technologyField: "",
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
        { value: "authorized", label: "已授权" },
        { value: "under_review", label: "实质审查" },
        { value: "preliminary_review", label: "初步审查" },
        { value: "pending", label: "待申请" }
      ]
    },
    {
      key: "technologyField",
      label: "技术领域",
      type: "input",
      placeholder: "输入技术领域关键词"
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
    patent_number: "",
    patent_type: "",
    status: "pending",
    technology_field: "",
    inventors: "",
    description: "",
    technical_details: "",
    commercial_applications: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
  })

  const [createForm, setCreateForm] = useState({
    name: "",
    patent_number: "",
    patent_type: "",
    status: "pending",
    technology_field: "",
    inventors: "",
    description: "",
    technical_details: "",
    commercial_applications: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
  })

  const { data: stats, loading: statsLoading } = useApi(() => patentsApi.getStats())
  const {
    data: patents,
    pagination,
    loading: patentsLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchPatents,
  } = usePaginatedApi(
    (params) => patentsApi.getList(params),
    { size: 10 }
  )
  // 暂时注释掉，后端API未实现
  // const { data: inventorContributions, loading: inventorsLoading } = useApi(() => 
  //   patentsApi.getInventorContributions(5)
  // )
  const inventorContributions: any[] | null = null
  const inventorsLoading = false

  // 前端字段搜索：当 scope != all 时只在当前页数据中筛选
  const displayPatents = useMemo(() => {
    if (!patents) return []
    const trimmed = searchText.trim()
    const lower = trimmed.toLowerCase()

    return patents.filter((patent: any) => {
      // 字段搜索
      if (trimmed && searchScope !== "all") {
        if (searchScope === "name") {
          if (!patent.name?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "inventors") {
          const inventors = Array.isArray(patent.inventors)
            ? patent.inventors.join(",")
            : typeof patent.inventors === "string"
            ? patent.inventors
            : patent.inventors
            ? Object.values(patent.inventors).join(",")
            : ""
          if (!inventors.toLowerCase().includes(lower)) return false
        } else if (searchScope === "technology_field") {
          if (!patent.technology_field?.toLowerCase().includes(lower)) return false
        }
      }

      // 技术领域关键字过滤
      if (filterValues.technologyField?.trim()) {
        const tf = filterValues.technologyField.trim().toLowerCase()
        if (!patent.technology_field || !patent.technology_field.toLowerCase().includes(tf)) return false
      }

      // 日期范围过滤（基于 application_date）
      if (filterValues.dateRange?.start || filterValues.dateRange?.end) {
        if (!patent.application_date) return false
        const d = new Date(patent.application_date)
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
  }, [patents, searchText, searchScope, filterValues])

  const handleSearch = () => {
    const trimmed = searchText.trim()
    if (searchScope === "all") {
      // 调用后端全字段模糊搜索
      searchBackend(trimmed || "")
    }
    // 字段搜索仅前端过滤，已在 displayPatents 中处理
    setActiveTab("list")
  }

  const handleDelete = async () => {
    if (!selectedPatent?.id || deleting) return
    const ok = window.confirm("确定要删除该专利记录吗？此操作不可恢复。")
    if (!ok) return
    try {
      setDeleting(true)
      await patentsApi.delete(selectedPatent.id)
      await refetchPatents()
      setSelectedPatent(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除专利失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedPatent) return
    const inventorsStr = Array.isArray(selectedPatent.inventors)
      ? selectedPatent.inventors.join(", ")
      : typeof selectedPatent.inventors === "string"
      ? selectedPatent.inventors
      : selectedPatent.inventors
      ? Object.values(selectedPatent.inventors).join(", ")
      : ""

    setEditForm({
      name: selectedPatent.name || "",
      patent_number: selectedPatent.patent_number || "",
      patent_type: selectedPatent.patent_type || "",
      status: selectedPatent.status || "pending",
      technology_field: selectedPatent.technology_field || "",
      inventors: inventorsStr,
      description: selectedPatent.description || "",
      technical_details: selectedPatent.technical_details || "",
      commercial_applications: selectedPatent.commercial_applications || "",
      imagePath: selectedPatent.image_path || "",
      filePath: selectedPatent.file_path || "",
      relatedProjects: selectedPatent.related_projects
        ? JSON.stringify(selectedPatent.related_projects, null, 2)
        : "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedPatent?.id || saving) return
    setFormError("")
    if (!editForm.name.trim()) {
      setFormError("专利名称为必填项")
      return
    }
    if (!editForm.patent_number.trim()) {
      setFormError("专利号为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: editForm.name.trim(),
        patent_number: editForm.patent_number.trim(),
        patent_type: editForm.patent_type.trim() || null,
        status: editForm.status || "pending",
        technology_field: editForm.technology_field.trim() || null,
        image_path: editForm.imagePath.trim() || null,
        file_path: editForm.filePath.trim() || null,
      }

      if (editForm.inventors.trim()) {
        payload.inventors = editForm.inventors
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

      const updated = await patentsApi.update(selectedPatent.id, payload)
      setSelectedPatent(updated)
      await refetchPatents()
      setEditOpen(false)
    } catch (error) {
      console.error("更新专利失败", error)
      alert("更新失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePatent = async () => {
    if (saving) return
    setFormError("")
    if (!createForm.name.trim()) {
      setFormError("专利名称为必填项")
      return
    }
    if (!createForm.patent_number.trim()) {
      setFormError("专利号为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: createForm.name.trim(),
        patent_number: createForm.patent_number.trim(),
        patent_type: createForm.patent_type.trim() || "发明专利",
        status: createForm.status || "pending",
        technology_field: createForm.technology_field.trim() || null,
        image_path: createForm.imagePath.trim() || null,
        file_path: createForm.filePath.trim() || null,
      }

      if (createForm.inventors.trim()) {
        payload.inventors = createForm.inventors
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

      const created = await patentsApi.create(payload)
      setCreateOpen(false)
      setCreateForm({
        name: "",
        patent_number: "",
        patent_type: "",
        status: "pending",
        technology_field: "",
        inventors: "",
        description: "",
        technical_details: "",
        commercial_applications: "",
        imagePath: "",
        filePath: "",
        relatedProjects: "",
      })
      await refetchPatents()
      setSelectedPatent(created)
      setActiveTab("detail")
    } catch (error) {
      console.error("创建专利失败", error)
      alert("创建失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">专利库</h1>
          <p className="text-sm text-muted-foreground">
            集中管理专利资产，掌握申请进度与价值评估。
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
            entityType="patents"
            entityName="专利"
            apiEndpoint="/api/patents"
            onImportSuccess={() => refetchPatents()}
            sampleFields={[
              "name", "patent_number", "application_date", "authorization_date",
              "patent_type", "status", "technology_field", "commercialization_value",
              "maintenance_deadline", "inventors", "related_projects"
            ]}
          />
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增专利
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
                <Award className="h-4 w-4 text-muted-foreground" />
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

      {/* 专利进展：支持列表视图 + 详情视图 + 分析视图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>专利进展</CardTitle>
              <CardDescription>跟踪各专利的申请节点与当前状态</CardDescription>
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
                    <SelectItem value="name">按专利名</SelectItem>
                    <SelectItem value="inventors">按发明人</SelectItem>
                    <SelectItem value="technology_field">按技术领域</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={handleSearch}
                  disabled={patentsLoading}
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
              {selectedPatent && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedPatent.name}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {patentsLoading ? (
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
              ) : displayPatents && displayPatents.length > 0 ? (
                <div className="space-y-3">
                  {displayPatents.map((patent) => (
                    <button
                      key={patent.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatent(patent)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-clamp-1">{patent.name}</h3>
                          <Badge className={getStatusColor(patent.status)}>
                            {formatStatus(patent.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            <span className="line-clamp-1">
                              专利号：{patent.patent_number || "待申请"}
                            </span>
                          </div>
                          {patent.application_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(patent.application_date).toLocaleDateString("zh-CN")}
                            </div>
                          )}
                          {patent.technology_field && <div>技术领域：{patent.technology_field}</div>}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {patent.patent_type && (
                          <Badge variant="outline" className="text-xs">
                            {patent.patent_type}
                          </Badge>
                        )}
                        {patent.commercialization_value && (
                          <div className={`font-medium ${getValueColor(patent.commercialization_value.toString())}`}>
                            价值评估
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无专利数据</p>
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
                      disabled={pagination.page <= 1 || patentsLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || patentsLoading}
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
              {selectedPatent ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{selectedPatent.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedPatent.status)}>
                          {formatStatus(selectedPatent.status)}
                        </Badge>
                        {selectedPatent.patent_type && <span>类型：{selectedPatent.patent_type}</span>}
                        {selectedPatent.application_date && (
                          <span>
                            申请日期：
                            {new Date(selectedPatent.application_date).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      {selectedPatent.authorization_date && (
                        <span className="text-green-700">
                          授权日期：{new Date(selectedPatent.authorization_date).toLocaleDateString("zh-CN")}
                        </span>
                      )}
                      {selectedPatent.commercialization_value && (
                        <span className="text-muted-foreground">
                          商业价值：{selectedPatent.commercialization_value}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">专利号：</span>
                      <span className="text-muted-foreground">
                        {selectedPatent.patent_number || "待申请"}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">发明人：</span>
                      <span className="text-muted-foreground">
                        {Array.isArray(selectedPatent.inventors)
                          ? selectedPatent.inventors.join(", ")
                          : typeof selectedPatent.inventors === "string"
                          ? selectedPatent.inventors
                          : selectedPatent.inventors
                          ? Object.values(selectedPatent.inventors).join(", ")
                          : "未知发明人"}
                      </span>
                    </div>

                    {selectedPatent.technology_field && (
                      <div>
                        <span className="font-medium">技术领域：</span>
                        <span className="text-muted-foreground">{selectedPatent.technology_field}</span>
                      </div>
                    )}

                    {selectedPatent.description && (
                      <div className="space-y-1">
                        <span className="font-medium">专利描述：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedPatent.description}
                        </p>
                      </div>
                    )}

                    {selectedPatent.technical_details && (
                      <div className="space-y-1">
                        <span className="font-medium">技术细节：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedPatent.technical_details}
                        </p>
                      </div>
                    )}

                    {selectedPatent.commercial_applications && (
                      <div className="space-y-1">
                        <span className="font-medium">商业应用：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedPatent.commercial_applications}
                        </p>
                      </div>
                    )}

                    {selectedPatent.maintenance_deadline && (
                      <div>
                        <span className="font-medium">维护期限：</span>
                        <span className="text-muted-foreground">
                          {new Date(selectedPatent.maintenance_deadline).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    )}

                    {(selectedPatent.image_path || selectedPatent.file_path) && (
                      <div className="space-y-1">
                        <span className="font-medium">附件与图片：</span>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          {selectedPatent.image_path && (
                            <a
                              href={selectedPatent.image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              查看专利图片
                            </a>
                          )}
                          {selectedPatent.file_path && (
                            <a
                              href={selectedPatent.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              下载专利文档
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedPatent.related_projects && (
                      <div className="space-y-1">
                        <span className="font-medium">关联项目：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedPatent.related_projects, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedPatent.id}</span>
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
                  暂未选择任何专利，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图：发明人贡献 + 专利统计 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>发明人贡献</CardTitle>
                    <CardDescription>团队成员的专利产出情况</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 发明人贡献统计功能暂未实现 */}
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">暂无发明人数据</p>
                      <p className="text-xs text-muted-foreground mt-1">此功能将在后续版本中实现</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>专利统计</CardTitle>
                    <CardDescription>专利分布与管理情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">总专利数</span>
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
                        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">维护提醒</p>
                            <p className="text-xs text-muted-foreground">定期检查专利年费缴纳情况</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">审查进度</p>
                            <p className="text-xs text-muted-foreground">关注专利审查进展状态</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">商业化机会</p>
                            <p className="text-xs text-muted-foreground">评估专利商业价值与转化</p>
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

      {/* 编辑专利对话框 */}
      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="编辑专利"
        description="修改专利信息，更新记录内容"
        onSubmit={handleSaveEdit}
        submitText="保存"
        loading={saving}
        maxWidth="3xl"
      >
        {formError && (
          <div className="rounded-md bg-red-50 p-3 mb-4">
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <Label htmlFor="edit-name">专利名称 *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-number">专利号 *</Label>
              <Input
                id="edit-number"
                value={editForm.patent_number}
                onChange={(e) => setEditForm((f) => ({ ...f, patent_number: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-type">专利类型</Label>
              <Input
                id="edit-type"
                placeholder="例如：发明专利、实用新型"
                value={editForm.patent_type}
                onChange={(e) => setEditForm((f) => ({ ...f, patent_type: e.target.value }))}
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
                  <SelectItem value="preliminary_review">初步审查</SelectItem>
                  <SelectItem value="under_review">实质审查</SelectItem>
                  <SelectItem value="authorized">已授权</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-inventors">发明人（逗号分隔）</Label>
              <Input
                id="edit-inventors"
                value={editForm.inventors}
                onChange={(e) => setEditForm((f) => ({ ...f, inventors: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-tech-field">技术领域</Label>
              <Input
                id="edit-tech-field"
                value={editForm.technology_field}
                onChange={(e) => setEditForm((f) => ({ ...f, technology_field: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-image-path">专利图片 URL</Label>
              <Input
                id="edit-image-path"
                placeholder="例如 https://.../patent.png"
                value={editForm.imagePath}
                onChange={(e) => setEditForm((f) => ({ ...f, imagePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-file-path">专利文档 URL</Label>
              <Input
                id="edit-file-path"
                placeholder="例如 https://.../patent.pdf"
                value={editForm.filePath}
                onChange={(e) => setEditForm((f) => ({ ...f, filePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-description">专利描述</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-tech-details">技术细节</Label>
              <Textarea
                id="edit-tech-details"
                rows={3}
                value={editForm.technical_details}
                onChange={(e) => setEditForm((f) => ({ ...f, technical_details: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-commercial">商业应用</Label>
              <Textarea
                id="edit-commercial"
                rows={3}
                value={editForm.commercial_applications}
                onChange={(e) => setEditForm((f) => ({ ...f, commercial_applications: e.target.value }))}
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
      </FormDialog>

      {/* 新增专利对话框 */}
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="新增专利"
        description="填写专利基本信息，创建新的专利记录"
        onSubmit={handleCreatePatent}
        submitText="创建"
        loading={saving}
        maxWidth="3xl"
      >
        {formError && (
          <div className="rounded-md bg-red-50 p-3 mb-4">
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <Label htmlFor="create-name">专利名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-number">专利号 *</Label>
              <Input
                id="create-number"
                value={createForm.patent_number}
                onChange={(e) => setCreateForm((f) => ({ ...f, patent_number: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-type">专利类型</Label>
              <Input
                id="create-type"
                placeholder="例如：发明专利、实用新型"
                value={createForm.patent_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, patent_type: e.target.value }))}
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
                  <SelectItem value="preliminary_review">初步审查</SelectItem>
                  <SelectItem value="under_review">实质审查</SelectItem>
                  <SelectItem value="authorized">已授权</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-inventors">发明人（逗号分隔）</Label>
              <Input
                id="create-inventors"
                value={createForm.inventors}
                onChange={(e) => setCreateForm((f) => ({ ...f, inventors: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-tech-field">技术领域</Label>
              <Input
                id="create-tech-field"
                value={createForm.technology_field}
                onChange={(e) => setCreateForm((f) => ({ ...f, technology_field: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-image-path">专利图片 URL</Label>
              <Input
                id="create-image-path"
                placeholder="例如 https://.../patent.png"
                value={createForm.imagePath}
                onChange={(e) => setCreateForm((f) => ({ ...f, imagePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-file-path">专利文档 URL</Label>
              <Input
                id="create-file-path"
                placeholder="例如 https://.../patent.pdf"
                value={createForm.filePath}
                onChange={(e) => setCreateForm((f) => ({ ...f, filePath: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-description">专利描述</Label>
              <Textarea
                id="create-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-tech-details">技术细节</Label>
              <Textarea
                id="create-tech-details"
                rows={3}
                value={createForm.technical_details}
                onChange={(e) => setCreateForm((f) => ({ ...f, technical_details: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-commercial">商业应用</Label>
              <Textarea
                id="create-commercial"
                rows={3}
                value={createForm.commercial_applications}
                onChange={(e) => setCreateForm((f) => ({ ...f, commercial_applications: e.target.value }))}
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
      </FormDialog>

    </div>
  )
}
