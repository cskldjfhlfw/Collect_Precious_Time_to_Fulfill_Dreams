"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowUpDown,
  Calendar,
  FileText,
  File,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  Search,
  Users,
  TrendingUp,
  ExternalLink,
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
import { papersApi } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "published": 
    case "已发表": 
      return "bg-green-100 text-green-800"
    case "under_review":
    case "reviewing":
    case "审稿中": 
      return "bg-yellow-100 text-yellow-800"
    case "draft":
    case "撰写中": 
      return "bg-blue-100 text-blue-800"
    default: 
      return "bg-gray-100 text-gray-800"
  }
}

const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "published": return "已发表"
    case "under_review": 
    case "reviewing": return "审稿中"
    case "draft": return "撰写中"
    default: return status
  }
}

export default function PapersPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list")
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null)
  const [detailedPaper, setDetailedPaper] = useState<any | null>(null) // 存储完整详情
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [searchScope, setSearchScope] = useState<"all" | "title" | "authors" | "journal">("all")
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [fileType, setFileType] = useState<string | null>(null)
  
  // 筛选状态
  const [filterValues, setFilterValues] = useState<FilterValue>({
    status: "",
    journal: "",
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
        { value: "published", label: "已发表" },
        { value: "reviewing", label: "审稿中" },
        { value: "draft", label: "撰写中" }
      ]
    },
    {
      key: "journal",
      label: "期刊",
      type: "input",
      placeholder: "输入期刊关键词"
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
    title: "",
    authors: "",
    journal: "",
    status: "draft",
    doi: "",
    url: "",
    abstract: "",
    keywords: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
  })

  const [createForm, setCreateForm] = useState({
    title: "",
    authors: "",
    journal: "",
    status: "draft",
    doi: "",
    url: "",
    abstract: "",
    keywords: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
  })

  const { data: stats, loading: statsLoading } = useApi(() => papersApi.getStats())
  const {
    data: papers,
    pagination,
    loading: papersLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchPapers,
  } = usePaginatedApi(
    (params) => papersApi.getList(params),
    { size: 10 }
  )
  const { data: authorContributions, loading: authorsLoading } = useApi(() => 
    papersApi.getAuthorContributions(5)
  )

  // 前端字段搜索：当 scope != all 时只在当前页数据中筛选
  const displayPapers = useMemo(() => {
    if (!papers) return []
    const trimmed = searchText.trim()
    const lower = trimmed.toLowerCase()

    return papers.filter((paper: any) => {
      // 字段搜索
      if (trimmed && searchScope !== "all") {
        if (searchScope === "title") {
          if (!paper.title?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "authors") {
          const authors = Array.isArray(paper.authors)
            ? paper.authors.join(",")
            : typeof paper.authors === "string"
            ? paper.authors
            : paper.authors
            ? Object.values(paper.authors).join(",")
            : ""
          if (!authors.toLowerCase().includes(lower)) return false
        } else if (searchScope === "journal") {
          if (!paper.journal?.toLowerCase().includes(lower)) return false
        }
      }

      // 期刊关键字过滤
      if (filterValues.journal?.trim()) {
        const jf = filterValues.journal.trim().toLowerCase()
        if (!paper.journal || !paper.journal.toLowerCase().includes(jf)) return false
      }

      // 日期范围过滤（开始/结束日期，基于 publish_date）
      if (filterValues.dateRange?.start || filterValues.dateRange?.end) {
        if (!paper.publish_date) return false
        const d = new Date(paper.publish_date)
        if (filterValues.dateRange.start) {
          const start = new Date(filterValues.dateRange.start)
          if (d < start) return false
        }
        if (filterValues.dateRange.end) {
          const end = new Date(filterValues.dateRange.end)
          // 结束日期按整天计算：日期大于 end 当天则剔除
          end.setHours(23, 59, 59, 999)
          if (d > end) return false
        }
      }

      return true
    })
  }, [papers, searchText, searchScope, filterValues])

  const handleSearch = () => {
    const trimmed = searchText.trim()
    if (searchScope === "all") {
      // 调用后端全字段模糊搜索（title + abstract）
      searchBackend(trimmed || "")
    }
    // 字段搜索仅前端过滤，已在 displayPapers 中处理
    setActiveTab("list")
  }

  const handleDeletePaper = async () => {
    if (!selectedPaper?.id || deleting) return
    if (!confirm(`确定要删除论文「${selectedPaper.title}」吗？`))
      return
    try {
      setDeleting(true)
      await papersApi.delete(selectedPaper.id)
      await refetchPapers()
      setSelectedPaper(null)
      setDetailedPaper(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除论文失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  // 当选中论文并切换到详情视图时，加载完整详情
  useEffect(() => {
    const loadPaperDetail = async () => {
      if (selectedPaper && activeTab === "detail") {
        try {
          setLoadingDetail(true)
          console.log('加载论文详情:', selectedPaper.id)
          const detail = await papersApi.getDetail(selectedPaper.id)
          console.log('详情数据:', detail)
          console.log('image_path:', detail.image_path)
          console.log('file_path:', detail.file_path)
          setDetailedPaper(detail)
        } catch (error) {
          console.error("加载论文详情失败", error)
        } finally {
          setLoadingDetail(false)
        }
      }
    }
    loadPaperDetail()
  }, [selectedPaper, activeTab])

  // 处理文件下载
  // 检测文件类型（每次详情论文变化时重新检测）
  useEffect(() => {
    if (detailedPaper?.file_path) {
      // 从文件路径中提取文件扩展名
      const filePath = detailedPaper.file_path;
      const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
      if (extension === '.pdf') {
        setFileType('pdf');
      } else if (extension === '.doc' || extension === '.docx') {
        setFileType('word');
      } else {
        setFileType('unknown');
      }
    } else {
      setFileType(null);
    }
  }, [detailedPaper?.file_path]); // 只依赖file_path，不依赖fileType
  
  const handleDownloadFile = async () => {
    if (!selectedPaper?.id || downloading) return
    
    if (!confirm(`确定要下载该论文${fileType === 'pdf' ? 'PDF' : fileType === 'word' ? 'Word' : ''}文件吗？`)) return
    
    try {
      setDownloading(true)
      const result = await papersApi.downloadFile(
        selectedPaper.id, 
        `${selectedPaper.title}.${fileType === 'pdf' ? 'pdf' : fileType === 'word' ? 'docx' : 'pdf'}`
      )
      setFileType(result.fileType) // 更新文件类型
    } catch (error) {
      console.error("下载失败", error)
      alert("下载失败，请稍后重试。")
    } finally {
      setDownloading(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedPaper) return
    const authorsStr = Array.isArray(selectedPaper.authors)
      ? selectedPaper.authors.join(", ")
      : typeof selectedPaper.authors === "string"
      ? selectedPaper.authors
      : selectedPaper.authors
      ? Object.values(selectedPaper.authors).join(", ")
      : ""
    const keywordsStr = Array.isArray(selectedPaper.keywords)
      ? selectedPaper.keywords.join(", ")
      : selectedPaper.keywords || ""

    setEditForm({
      title: selectedPaper.title || "",
      authors: authorsStr,
      journal: selectedPaper.journal || "",
      status: selectedPaper.status || "draft",
      doi: selectedPaper.doi || "",
      url: selectedPaper.url || "",
      abstract: selectedPaper.abstract || "",
      keywords: keywordsStr,
      imagePath: selectedPaper.image_path || "",
      filePath: selectedPaper.file_path || "",
      relatedProjects: selectedPaper.related_projects
        ? JSON.stringify(selectedPaper.related_projects, null, 2)
        : "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedPaper?.id || saving) return
    setFormError("")
    if (!editForm.title.trim()) {
      setFormError("标题为必填项")
      return
    }
    if (editForm.doi && !/^10\.\d{4,9}\/[-._;()\/:A-Z0-9]+$/i.test(editForm.doi.trim())) {
      setFormError("DOI 格式看起来不正确，请检查后再保存")
      return
    }
    if (editForm.url && !/^https?:\/\//i.test(editForm.url.trim())) {
      setFormError("外部链接必须以 http:// 或 https:// 开头")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        title: editForm.title.trim(),
        journal: editForm.journal.trim() || null,
        status: editForm.status,
        doi: editForm.doi.trim() || null,
        abstract: editForm.abstract.trim() || null,
        url: editForm.url.trim() || null,
        image_path: editForm.imagePath.trim() || null,
        file_path: editForm.filePath.trim() || null,
      }
      
      // 调试日志：检查文件路径
      console.log('保存论文 - editForm:', editForm)
      console.log('保存论文 - payload:', payload)

      if (editForm.authors.trim()) {
        payload.authors = editForm.authors
      }

      if (editForm.keywords.trim()) {
        payload.keywords = editForm.keywords
          .split(/[,，]/)
          .map((k) => k.trim())
          .filter(Boolean)
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

      const updated = await papersApi.update(selectedPaper.id, payload)
      setSelectedPaper(updated)
      await refetchPapers()
      setEditOpen(false)
    } catch (error) {
      console.error("更新论文失败", error)
      alert("更新失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePaper = async () => {
    if (saving) return
    setFormError("")
    if (!createForm.title.trim()) {
      setFormError("标题为必填项")
      return
    }
    if (createForm.doi && !/^10\.\d{4,9}\/[-._;()\/:A-Z0-9]+$/i.test(createForm.doi.trim())) {
      setFormError("DOI 格式看起来不正确，请检查后再创建")
      return
    }
    if (createForm.url && !/^https?:\/\//i.test(createForm.url.trim())) {
      setFormError("外部链接必须以 http:// 或 https:// 开头")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        title: createForm.title.trim(),
        journal: createForm.journal.trim() || null,
        status: createForm.status,
        doi: createForm.doi.trim() || null,
        abstract: createForm.abstract.trim() || null,
        url: createForm.url.trim() || null,
        image_path: createForm.imagePath.trim() || null,
        file_path: createForm.filePath.trim() || null,
      }

      if (createForm.authors.trim()) {
        payload.authors = createForm.authors
      }

      if (createForm.keywords.trim()) {
        payload.keywords = createForm.keywords
          .split(/[,，]/)
          .map((k) => k.trim())
          .filter(Boolean)
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

      const created = await papersApi.create(payload)
      setCreateOpen(false)
      setCreateForm({
        title: "",
        authors: "",
        journal: "",
        status: "draft",
        doi: "",
        url: "",
        abstract: "",
        keywords: "",
        imagePath: "",
        filePath: "",
        relatedProjects: "",
      })
      await refetchPapers()
      setSelectedPaper(created)
      setActiveTab("detail")
    } catch (error) {
      console.error("创建论文失败", error)
      alert("创建失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">论文库</h1>
          <p className="text-sm text-muted-foreground">
            集中管理团队论文成果，监控撰写进度与引用表现。
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
            entityType="papers"
            entityName="论文"
            apiEndpoint="/api/papers"
            onImportSuccess={() => {
              // 刷新论文列表
              refetchPapers()
            }}
            sampleFields={[
              "title",
              "authors",
              "journal",
              "conference",
              "publish_date",
              "doi",
              "impact_factor",
              "citation_count",
              "writing_progress",
              "status",
              "abstract",
              "keywords",
              "related_projects",
              "image_path",
              "file_path"
            ]}
          />
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增论文
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
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                    {stat.change}
                  </span>{" "}
                  较上月
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 论文进展：支持列表视图 + 详情视图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>论文进展</CardTitle>
              <CardDescription>追踪撰写、评审与发表流程中的关键节点</CardDescription>
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
                    <SelectItem value="title">按标题</SelectItem>
                    <SelectItem value="authors">按作者</SelectItem>
                    <SelectItem value="journal">按期刊</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={handleSearch}
                  disabled={papersLoading}
                >
                  <Search className="mr-1 h-3 w-3" />
                  搜索
                </Button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>“全字段模糊” 使用后端搜索；其他选项为当前页字段过滤。</span>
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
              {selectedPaper && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedPaper.title}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {papersLoading ? (
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
              ) : displayPapers && displayPapers.length > 0 ? (
                <div className="space-y-3">
                  {displayPapers.map((paper) => (
                    <button
                      key={paper.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaper(paper)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-clamp-1">{paper.title}</h3>
                          <Badge className={getStatusColor(paper.status)}>
                            {formatStatus(paper.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="line-clamp-1">
                              {Array.isArray(paper.authors) ? paper.authors.join(", ") : "未知作者"}
                            </span>
                          </div>
                          {paper.publish_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(paper.publish_date).toLocaleDateString("zh-CN")}
                            </div>
                          )}
                          {paper.journal && <div>期刊：{paper.journal}</div>}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {paper.citation_count > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            引用 {paper.citation_count}
                          </div>
                        )}
                        {paper.impact_factor && paper.impact_factor > 0 && (
                          <div className="text-muted-foreground">影响因子 {paper.impact_factor}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无论文数据</p>
                </div>
              )}

              {/* 分页控制 */}
              {pagination.pages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div>
                    共 {pagination.total} 篇，当前第 {pagination.page} / {pagination.pages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page <= 1 || papersLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || papersLoading}
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
                        <SelectItem value="5">每页 5 篇</SelectItem>
                        <SelectItem value="10">每页 10 篇</SelectItem>
                        <SelectItem value="20">每页 20 篇</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 详情视图 */}
            <TabsContent value="detail">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
                </div>
              ) : selectedPaper ? (
                <div className="space-y-6 rounded-lg border p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{selectedPaper.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedPaper.status)}>
                          {formatStatus(selectedPaper.status)}
                        </Badge>
                        {selectedPaper.journal && <span>期刊：{selectedPaper.journal}</span>}
                        {selectedPaper.publish_date && (
                          <span>
                            发表日期：
                            {new Date(selectedPaper.publish_date).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      {selectedPaper.citation_count !== undefined && (
                        <span className="text-green-700">
                          引用次数：{selectedPaper.citation_count}
                        </span>
                      )}
                      {selectedPaper.impact_factor && (
                        <span className="text-muted-foreground">
                          影响因子：{selectedPaper.impact_factor}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">作者：</span>
                      <span className="text-muted-foreground">
                        {Array.isArray(selectedPaper.authors)
                          ? selectedPaper.authors.join(", ")
                          : typeof selectedPaper.authors === "string"
                          ? selectedPaper.authors
                          : selectedPaper.authors
                          ? Object.values(selectedPaper.authors).join(", ")
                          : "未知作者"}
                      </span>
                    </div>

                    {selectedPaper.keywords && Array.isArray(selectedPaper.keywords) && (
                      <div className="space-y-1">
                        <span className="font-medium">关键词：</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedPaper.keywords.map((kw: string) => (
                            <Badge key={kw} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPaper.abstract && (
                      <div className="space-y-1">
                        <span className="font-medium">摘要：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedPaper.abstract}
                        </p>
                      </div>
                    )}

                    {selectedPaper.doi && (
                      <div className="space-y-1">
                        <span className="font-medium">DOI：</span>
                        <span className="text-muted-foreground break-all">{selectedPaper.doi}</span>
                      </div>
                    )}

                    {selectedPaper.notes && (
                      <div className="space-y-1">
                        <span className="font-medium">备注：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedPaper.notes}
                        </p>
                      </div>
                    )}

                    {/* 论文图片预览 */}
                    {detailedPaper?.image_path && (
                      <div className="space-y-2">
                        <span className="font-medium">论文介绍图片：</span>
                        <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={`http://localhost:8000/api/papers/${selectedPaper.id}/image`}
                            alt="论文介绍图"
                            className="h-auto w-full object-contain"
                            style={{ maxHeight: '500px' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center h-48 text-sm text-muted-foreground">图片加载失败或不存在</div>'
                              }
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          图片路径：{detailedPaper.image_path}
                        </p>
                      </div>
                    )}

                    {/* 文件下载 */}
                    {detailedPaper?.file_path && (
                      <div className="space-y-2">
                        <span className="font-medium">论文文件：</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadFile}
                            disabled={downloading}
                            className="h-9"
                          >
                            {downloading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                下载中...
                              </>
                            ) : (
                              <>
                                {fileType === 'pdf' ? (
                                  <File className="mr-2 h-4 w-4 text-red-500" />
                                ) : fileType === 'word' ? (
                                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                ) : (
                                  <FileText className="mr-2 h-4 w-4" />
                                )}
                                下载{fileType === 'pdf' ? 'PDF' : fileType === 'word' ? 'Word' : ''}文件
                              </>
                            )}
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {fileType ? 
                              `点击下载论文的${fileType === 'pdf' ? 'PDF' : fileType === 'word' ? 'Word' : ''}文件` : 
                              '正在识别文件类型...'}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedPaper.related_projects && (
                      <div className="space-y-1">
                        <span className="font-medium">关联项目：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedPaper.related_projects, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedPaper.id}</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const externalUrl = selectedPaper.url
                          || (selectedPaper.doi ? `https://doi.org/${selectedPaper.doi}` : "")
                        return externalUrl ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                          >
                            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1 h-3 w-3" /> 外部链接
                            </a>
                          </Button>
                        ) : null
                      })()}
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
                          onClick={handleDeletePaper}
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
                  暂未选择任何论文，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图：作者贡献 + 发表趋势 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>作者贡献</CardTitle>
                    <CardDescription>团队成员的论文产出情况</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {authorsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-8 bg-muted animate-pulse rounded" />
                          </div>
                          <div className="h-2 w-full bg-muted animate-pulse rounded" />
                        </div>
                      ))
                    ) : authorContributions && authorContributions.length > 0 ? (
                      authorContributions.map((author) => {
                        const maxPapers = Math.max(...authorContributions.map(a => a.paper_count))
                        const percentage = (author.paper_count / maxPapers) * 100
                        
                        return (
                          <div key={author.author_name} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{author.author_name}</span>
                              <span className="text-sm text-muted-foreground">{author.paper_count}篇</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">暂无作者数据</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>发表趋势</CardTitle>
                    <CardDescription>近期论文发表情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">总论文数</span>
                        <span className="text-sm font-medium">{pagination.total}篇</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">当前页面</span>
                        <span className="text-sm font-medium">
                          {pagination.page} / {pagination.pages}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">每页显示</span>
                        <span className="text-sm font-medium">{pagination.size}篇</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 编辑论文对话框 */}
      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="编辑论文"
        description="修改论文信息，更新记录内容"
        onSubmit={handleSaveEdit}
        submitText="保存"
        loading={saving}
        maxWidth="2xl"
        maxHeight="90vh"
      >
        {formError && (
          <div className="rounded-md bg-red-50 p-3 mb-4">
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-title" className="text-sm font-medium">标题 <span className="text-red-500">*</span></Label>
            <Input
              id="edit-title"
              placeholder="请输入论文标题"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-authors" className="text-sm font-medium">作者</Label>
            <Input
              id="edit-authors"
              placeholder="多个作者用逗号分隔"
              value={editForm.authors}
              onChange={(e) => setEditForm((f) => ({ ...f, authors: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-journal" className="text-sm font-medium">期刊/会议</Label>
            <Input
              id="edit-journal"
              placeholder="发表期刊或会议名称"
              value={editForm.journal}
              onChange={(e) => setEditForm((f) => ({ ...f, journal: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-status" className="text-sm font-medium">状态</Label>
            <Select
              value={editForm.status}
              onValueChange={(value) => setEditForm((f) => ({ ...f, status: value }))}
            >
              <SelectTrigger id="edit-status" className="h-9">
                <SelectValue placeholder="选择论文状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">撰写中</SelectItem>
                <SelectItem value="reviewing">审稿中</SelectItem>
                <SelectItem value="published">已发表</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-doi" className="text-sm font-medium">DOI</Label>
            <Input
              id="edit-doi"
              placeholder="数字对象唯一标识符"
              value={editForm.doi}
              onChange={(e) => setEditForm((f) => ({ ...f, doi: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-url" className="text-sm font-medium">外部链接</Label>
            <Input
              id="edit-url"
              placeholder="论文在线地址或相关链接"
              value={editForm.url}
              onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-keywords" className="text-sm font-medium">关键词</Label>
            <Input
              id="edit-keywords"
              placeholder="多个关键词用逗号分隔"
              value={editForm.keywords}
              onChange={(e) => setEditForm((f) => ({ ...f, keywords: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-abstract" className="text-sm font-medium">摘要</Label>
            <Textarea
              id="edit-abstract"
              placeholder="论文摘要或简介"
              rows={4}
              value={editForm.abstract}
              onChange={(e) => setEditForm((f) => ({ ...f, abstract: e.target.value }))}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-image" className="text-sm font-medium">
              封面图片
            </Label>
            <Input
              id="edit-image"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  try {
                    const result = await papersApi.uploadFile(file, 'image')
                    setEditForm((f) => ({ ...f, imagePath: result.file_path }))
                    alert(`图片上传成功：${result.new_filename}`)
                  } catch (error) {
                    alert(`图片上传失败：${error}`)
                  }
                }
              }}
              className="h-9"
            />
            {editForm.imagePath && (
              <p className="text-xs text-green-600">
                已上传：{editForm.imagePath}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              选择图片文件将自动上传到服务器
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-file" className="text-sm font-medium">
              原文文件
            </Label>
            <Input
              id="edit-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  try {
                    console.log('开始上传文件:', file.name, '类型:', file.type)
                    const result = await papersApi.uploadFile(file, 'document')
                    console.log('文件上传成功:', result)
                    setEditForm((f) => ({ ...f, filePath: result.file_path }))
                    alert(`文件上传成功：${result.new_filename}\n路径：${result.file_path}`)
                  } catch (error) {
                    console.error('文件上传失败:', error)
                    alert(`文件上传失败：${error}`)
                  }
                }
              }}
              className="h-9"
            />
            {editForm.filePath && (
              <p className="text-xs text-green-600">
                已上传：{editForm.filePath}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              选择PDF或Word文件将自动上传到服务器
            </p>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-related" className="text-sm font-medium">关联项目（JSON格式）</Label>
            <Textarea
              id="edit-related"
              placeholder='{"project_id": "xxx", "name": "项目名称"}'
              rows={3}
              value={editForm.relatedProjects}
              onChange={(e) => setEditForm((f) => ({ ...f, relatedProjects: e.target.value }))}
              className="resize-none font-mono text-xs"
            />
          </div>
        </div>
      </FormDialog>

      {/* 新增论文对话框 */}
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="新增论文"
        description="填写论文基本信息，创建新的论文记录"
        onSubmit={handleCreatePaper}
        submitText="创建"
        loading={saving}
        maxWidth="2xl"
        maxHeight="90vh"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-title" className="text-sm font-medium">标题 <span className="text-red-500">*</span></Label>
            <Input
              id="create-title"
              placeholder="请输入论文标题"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="create-authors" className="text-sm font-medium">作者</Label>
            <Input
              id="create-authors"
              placeholder="多个作者用逗号分隔"
              value={createForm.authors}
              onChange={(e) => setCreateForm((f) => ({ ...f, authors: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="create-journal" className="text-sm font-medium">期刊/会议</Label>
            <Input
              id="create-journal"
              placeholder="发表期刊或会议名称"
              value={createForm.journal}
              onChange={(e) => setCreateForm((f) => ({ ...f, journal: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="create-status" className="text-sm font-medium">状态</Label>
            <Select
              value={createForm.status}
              onValueChange={(value) => setCreateForm((f) => ({ ...f, status: value }))}
            >
              <SelectTrigger id="create-status" className="h-9">
                <SelectValue placeholder="选择论文状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">撰写中</SelectItem>
                <SelectItem value="reviewing">审稿中</SelectItem>
                <SelectItem value="published">已发表</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="create-doi" className="text-sm font-medium">DOI</Label>
            <Input
              id="create-doi"
              placeholder="数字对象唯一标识符"
              value={createForm.doi}
              onChange={(e) => setCreateForm((f) => ({ ...f, doi: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-url" className="text-sm font-medium">外部链接</Label>
            <Input
              id="create-url"
              placeholder="论文在线地址或相关链接"
              value={createForm.url}
              onChange={(e) => setCreateForm((f) => ({ ...f, url: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-keywords" className="text-sm font-medium">关键词</Label>
            <Input
              id="create-keywords"
              placeholder="多个关键词用逗号分隔"
              value={createForm.keywords}
              onChange={(e) => setCreateForm((f) => ({ ...f, keywords: e.target.value }))}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-abstract" className="text-sm font-medium">摘要</Label>
            <Textarea
              id="create-abstract"
              placeholder="论文摘要或简介"
              rows={4}
              value={createForm.abstract}
              onChange={(e) => setCreateForm((f) => ({ ...f, abstract: e.target.value }))}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="create-image" className="text-sm font-medium">
              封面图片
            </Label>
            <Input
              id="create-image"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  try {
                    const result = await papersApi.uploadFile(file, 'image')
                    setCreateForm((f) => ({ ...f, imagePath: result.file_path }))
                    alert(`图片上传成功：${result.new_filename}`)
                  } catch (error) {
                    alert(`图片上传失败：${error}`)
                  }
                }
              }}
              className="h-9"
            />
            {createForm.imagePath && (
              <p className="text-xs text-green-600">
                已上传：{createForm.imagePath}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              选择图片文件将自动上传到服务器
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="create-file" className="text-sm font-medium">
              原文文件
            </Label>
            <Input
              id="create-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  try {
                    const result = await papersApi.uploadFile(file, 'document')
                    setCreateForm((f) => ({ ...f, filePath: result.file_path }))
                    alert(`文件上传成功：${result.new_filename}`)
                  } catch (error) {
                    alert(`文件上传失败：${error}`)
                  }
                }
              }}
              className="h-9"
            />
            {createForm.filePath && (
              <p className="text-xs text-green-600">
                已上传：{createForm.filePath}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              选择PDF或Word文件将自动上传到服务器
            </p>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-related" className="text-sm font-medium">关联项目（JSON格式）</Label>
            <Textarea
              id="create-related"
              placeholder='{"project_id": "xxx", "name": "项目名称"}'
              rows={3}
              value={createForm.relatedProjects}
              onChange={(e) => setCreateForm((f) => ({ ...f, relatedProjects: e.target.value }))}
              className="resize-none font-mono text-xs"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  )
}
