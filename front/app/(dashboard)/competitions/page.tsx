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
  Trophy,
  Users,
  Calendar,
  Award,
  Plus,
  Filter,
  Search,
  Clock,
  Star,
  Medal,
  Loader2,
  ExternalLink,
  Trash2,
  Pencil,
  TrendingUp,
  Target,
  CheckCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApi, usePaginatedApi } from "@/hooks/useApi"
import { competitionsApi } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"


const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "进行中": 
    case "ongoing": 
      return "bg-blue-100 text-blue-800"
    case "已结束": 
    case "completed":
      return "bg-green-100 text-green-800"
    case "待报名": 
    case "registration":
      return "bg-yellow-100 text-yellow-800"
    case "取消":
    case "cancelled":
      return "bg-red-100 text-red-800"
    default: 
      return "bg-gray-100 text-gray-800"
  }
}

const formatStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case "ongoing": return "进行中"
    case "completed": return "已结束" 
    case "registration": return "待报名"
    case "cancelled": return "取消"
    default: return status || "未知"
  }
}

const getLevelColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case "国家级": 
    case "national":
      return "text-red-600"
    case "省部级": 
    case "provincial":
      return "text-blue-600"
    case "市级": 
    case "municipal":
      return "text-green-600"
    case "校级":
    case "school":
      return "text-purple-600"
    default: 
      return "text-gray-600"
  }
}

const formatLevel = (level: string) => {
  switch (level?.toLowerCase()) {
    case "national": return "国家级"
    case "provincial": return "省部级"
    case "municipal": return "市级"
    case "school": return "校级"
    default: return level || "未知"
  }
}

const getAwardIcon = (award: string | null) => {
  if (!award) return null
  const lowerAward = award.toLowerCase()
  if (lowerAward.includes("一等") || lowerAward.includes("first")) {
    return <Medal className="h-4 w-4 text-yellow-500" />
  }
  if (lowerAward.includes("二等") || lowerAward.includes("second")) {
    return <Medal className="h-4 w-4 text-gray-400" />
  }
  if (lowerAward.includes("三等") || lowerAward.includes("third")) {
    return <Medal className="h-4 w-4 text-amber-600" />
  }
  return <Award className="h-4 w-4 text-blue-500" />
}

export default function CompetitionsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "analysis">("list")
  const [selectedCompetition, setSelectedCompetition] = useState<any | null>(null)
  const [searchText, setSearchText] = useState("")
  const [searchScope, setSearchScope] = useState<"all" | "name" | "team_leader" | "competition_type">("all")
  const [deleting, setDeleting] = useState(false)
  
  // 筛选状态
  const [filterValues, setFilterValues] = useState<FilterValue>({
    status: "",
    level: "",
    competitionType: "",
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
        { value: "registration", label: "报名中" },
        { value: "ongoing", label: "进行中" },
        { value: "completed", label: "已结束" }
      ]
    },
    {
      key: "level",
      label: "级别",
      type: "select",
      options: [
        { value: "all", label: "全部级别" },
        { value: "national", label: "国家级" },
        { value: "provincial", label: "省部级" },
        { value: "municipal", label: "市级" },
        { value: "school", label: "校级" }
      ]
    },
    {
      key: "competitionType",
      label: "竞赛类型",
      type: "input",
      placeholder: "输入竞赛类型关键词"
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
    competition_type: "",
    level: "school",
    status: "registration",
    organizer: "",
    category: "",
    participants: "",
    team_leader: "",
    registration_deadline: "",
    competition_date: "",
    result_date: "",
    award: "",
    description: "",
    objectives: "",
    requirements: "",
    evaluation_criteria: "",
    team_composition: "",
    preparation_plan: "",
    cost: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
    competitionDetails: "",
  })

  const [createForm, setCreateForm] = useState({
    name: "",
    competition_type: "",
    level: "school",
    status: "registration",
    organizer: "",
    category: "",
    participants: "",
    team_leader: "",
    registration_deadline: "",
    competition_date: "",
    result_date: "",
    award: "",
    description: "",
    objectives: "",
    requirements: "",
    evaluation_criteria: "",
    team_composition: "",
    preparation_plan: "",
    cost: "",
    imagePath: "",
    filePath: "",
    relatedProjects: "",
    competitionDetails: "",
  })

  const { data: stats, loading: statsLoading } = useApi(() => competitionsApi.getStats())
  const {
    data: competitions,
    pagination,
    loading: competitionsLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchCompetitions,
  } = usePaginatedApi(
    (params) => competitionsApi.getList(params),
    { size: 10 }
  )
  // 暂时注释掉，后端API未实现
  // const { data: participantContributions, loading: participantLoading } = useApi(() => 
  //   competitionsApi.getParticipantContributions(5)
  // )
  const participantContributions: any[] | null = null
  const participantLoading = false

  // 前端字段搜索和筛选
  const displayCompetitions = useMemo(() => {
    if (!competitions) return []
    const trimmed = searchText.trim()
    const lower = trimmed.toLowerCase()

    return competitions.filter((competition: any) => {
      // 字段搜索
      if (trimmed && searchScope !== "all") {
        if (searchScope === "name") {
          if (!competition.name?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "team_leader") {
          if (!competition.team_leader?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "competition_type") {
          if (!competition.competition_type?.toLowerCase().includes(lower)) return false
        }
      }

      // 级别过滤
      if (filterValues.level && filterValues.level !== "all") {
        if (competition.level !== filterValues.level) return false
      }

      // 比赛类型过滤
      if (filterValues.competitionType?.trim()) {
        const type = filterValues.competitionType.trim().toLowerCase()
        if (!competition.competition_type || !competition.competition_type.toLowerCase().includes(type)) return false
      }

      // 日期范围过滤（基于比赛日期）
      if (filterValues.dateRange?.start || filterValues.dateRange?.end) {
        if (!competition.competition_date) return false
        const d = new Date(competition.competition_date)
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
  }, [competitions, searchText, searchScope, filterValues])

  const handleSearch = () => {
    const trimmed = searchText.trim()
    if (searchScope === "all") {
      searchBackend(trimmed || "")
    }
    setActiveTab("list")
  }

  const handleDelete = async () => {
    if (!selectedCompetition?.id || deleting) return
    const ok = window.confirm("确定要删除该比赛记录吗？此操作不可恢复。")
    if (!ok) return
    try {
      setDeleting(true)
      await competitionsApi.delete(selectedCompetition.id)
      await refetchCompetitions()
      setSelectedCompetition(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除比赛失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedCompetition) return
    setEditForm({
      name: selectedCompetition.name || "",
      competition_type: selectedCompetition.competition_type || "",
      level: selectedCompetition.level || "school",
      status: selectedCompetition.status || "registration",
      organizer: selectedCompetition.organizer || "",
      category: selectedCompetition.category || "",
      participants: selectedCompetition.participants || "",
      team_leader: selectedCompetition.team_leader || "",
      registration_deadline: selectedCompetition.registration_deadline || "",
      competition_date: selectedCompetition.competition_date || "",
      result_date: selectedCompetition.result_date || "",
      award: selectedCompetition.award || "",
      description: selectedCompetition.description || "",
      objectives: selectedCompetition.objectives || "",
      requirements: selectedCompetition.requirements || "",
      evaluation_criteria: selectedCompetition.evaluation_criteria || "",
      team_composition: selectedCompetition.team_composition || "",
      preparation_plan: selectedCompetition.preparation_plan || "",
      cost: selectedCompetition.cost?.toString() || "",
      imagePath: selectedCompetition.image_path || "",
      filePath: selectedCompetition.file_path || "",
      relatedProjects: selectedCompetition.related_projects
        ? JSON.stringify(selectedCompetition.related_projects, null, 2)
        : "",
      competitionDetails: selectedCompetition.competition_details
        ? JSON.stringify(selectedCompetition.competition_details, null, 2)
        : "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedCompetition?.id || saving) return
    setFormError("")
    if (!editForm.name.trim()) {
      setFormError("比赛名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: editForm.name.trim(),
        competition_type: editForm.competition_type.trim() || null,
        level: editForm.level,
        status: editForm.status,
        organizer: editForm.organizer.trim() || null,
        category: editForm.category.trim() || null,
        participants: editForm.participants.trim() || null,
        team_leader: editForm.team_leader.trim() || null,
        registration_deadline: editForm.registration_deadline || null,
        competition_date: editForm.competition_date || null,
        result_date: editForm.result_date || null,
        award: editForm.award.trim() || null,
        description: editForm.description.trim() || null,
        objectives: editForm.objectives.trim() || null,
        requirements: editForm.requirements.trim() || null,
        evaluation_criteria: editForm.evaluation_criteria.trim() || null,
        team_composition: editForm.team_composition.trim() || null,
        preparation_plan: editForm.preparation_plan.trim() || null,
        cost: editForm.cost ? parseFloat(editForm.cost) : null,
        image_path: editForm.imagePath.trim() || null,
        file_path: editForm.filePath.trim() || null,
      }

      // JSON字段处理
      if (editForm.relatedProjects.trim()) {
        try {
          payload.related_projects = JSON.parse(editForm.relatedProjects)
        } catch {
          setFormError("关联项目必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (editForm.competitionDetails.trim()) {
        try {
          payload.competition_details = JSON.parse(editForm.competitionDetails)
        } catch {
          setFormError("比赛详情必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      const updated = await competitionsApi.update(selectedCompetition.id, payload)
      setSelectedCompetition(updated)
      await refetchCompetitions()
      setEditOpen(false)
    } catch (error) {
      console.error("更新比赛失败", error)
      alert("更新失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCompetition = async () => {
    if (saving) return
    setFormError("")
    if (!createForm.name.trim()) {
      setFormError("比赛名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: createForm.name.trim(),
        competition_type: createForm.competition_type.trim() || null,
        level: createForm.level,
        status: createForm.status,
        organizer: createForm.organizer.trim() || null,
        category: createForm.category.trim() || null,
        participants: createForm.participants.trim() || null,
        team_leader: createForm.team_leader.trim() || null,
        registration_deadline: createForm.registration_deadline || null,
        competition_date: createForm.competition_date || null,
        result_date: createForm.result_date || null,
        award: createForm.award.trim() || null,
        description: createForm.description.trim() || null,
        objectives: createForm.objectives.trim() || null,
        requirements: createForm.requirements.trim() || null,
        evaluation_criteria: createForm.evaluation_criteria.trim() || null,
        team_composition: createForm.team_composition.trim() || null,
        preparation_plan: createForm.preparation_plan.trim() || null,
        cost: createForm.cost ? parseFloat(createForm.cost) : null,
        image_path: createForm.imagePath.trim() || null,
        file_path: createForm.filePath.trim() || null,
      }

      // JSON字段处理
      if (createForm.relatedProjects.trim()) {
        try {
          payload.related_projects = JSON.parse(createForm.relatedProjects)
        } catch {
          setFormError("关联项目必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (createForm.competitionDetails.trim()) {
        try {
          payload.competition_details = JSON.parse(createForm.competitionDetails)
        } catch {
          setFormError("比赛详情必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      const created = await competitionsApi.create(payload)
      setCreateOpen(false)
      setCreateForm({
        name: "",
        competition_type: "",
        level: "school",
        status: "registration",
        organizer: "",
        category: "",
        participants: "",
        team_leader: "",
        registration_deadline: "",
        competition_date: "",
        result_date: "",
        award: "",
        description: "",
        objectives: "",
        requirements: "",
        evaluation_criteria: "",
        team_composition: "",
        preparation_plan: "",
        cost: "",
        imagePath: "",
        filePath: "",
        relatedProjects: "",
        competitionDetails: "",
      })
      await refetchCompetitions()
      setSelectedCompetition(created)
      setActiveTab("detail")
    } catch (error) {
      console.error("创建比赛失败", error)
      alert("创建失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">赛事活动</h1>
          <p className="text-sm text-muted-foreground">
            统一管理团队赛事参与情况，及时掌握进度与成果。
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
            entityType="competitions"
            entityName="竞赛"
            apiEndpoint="/api/competitions"
            onImportSuccess={() => refetchCompetitions()}
            sampleFields={[
              "name", "level", "award_level", "award_date", "registration_deadline",
              "submission_deadline", "progress_percent", "mentor", "team_members", "status"
            ]}
          />
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增竞赛
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
          stats?.map((stat) => {
            // 根据统计类型选择图标
            const getStatIcon = (label: string) => {
              const lowerLabel = label.toLowerCase()
              if (lowerLabel.includes('总赛事') || lowerLabel.includes('总数')) {
                return <Trophy className="h-4 w-4 text-blue-600" />
              } else if (lowerLabel.includes('获奖') || lowerLabel.includes('award')) {
                return <Medal className="h-4 w-4 text-yellow-600" />
              } else if (lowerLabel.includes('进行中') || lowerLabel.includes('ongoing')) {
                return <Target className="h-4 w-4 text-green-600" />
              } else if (lowerLabel.includes('完成') || lowerLabel.includes('completed')) {
                return <CheckCircle className="h-4 w-4 text-purple-600" />
              } else {
                return <Trophy className="h-4 w-4 text-muted-foreground" />
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
        )}
      </div>

      {/* 赛事管理：支持列表视图 + 详情视图 + 分析视图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>赛事总览</CardTitle>
              <CardDescription>了解团队参与的各类赛事与获奖情况</CardDescription>
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
                    <SelectItem value="name">按比赛名</SelectItem>
                    <SelectItem value="team_leader">按团队负责人</SelectItem>
                    <SelectItem value="competition_type">按比赛类型</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={handleSearch}
                  disabled={competitionsLoading}
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
              {selectedCompetition && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedCompetition.name}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {competitionsLoading ? (
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
              ) : displayCompetitions && displayCompetitions.length > 0 ? (
                <div className="space-y-3">
                  {displayCompetitions.map((competition) => (
                    <button
                      key={competition.id}
                      type="button"
                      onClick={() => {
                        setSelectedCompetition(competition)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium line-clamp-1">{competition.name}</h3>
                          <Badge className={getStatusColor(competition.status)}>
                            {formatStatus(competition.status)}
                          </Badge>
                          {competition.level && (
                            <Badge variant="outline" className={getLevelColor(competition.level)}>
                              {formatLevel(competition.level)}
                            </Badge>
                          )}
                          {competition.award && getAwardIcon(competition.award)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {competition.competition_type && (
                            <div>类型：{competition.competition_type}</div>
                          )}
                          {competition.team_leader && (
                            <div>负责人：{competition.team_leader}</div>
                          )}
                          {competition.competition_date && (
                            <div>比赛时间：{new Date(competition.competition_date).toLocaleDateString("zh-CN")}</div>
                          )}
                        </div>
                        {competition.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {competition.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {competition.organizer && (
                          <div className="text-muted-foreground">
                            主办：{competition.organizer}
                          </div>
                        )}
                        {competition.cost && (
                          <div className="text-muted-foreground">
                            费用：¥{competition.cost}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无赛事数据</p>
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
                      disabled={pagination.page <= 1 || competitionsLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || competitionsLoading}
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
              {selectedCompetition ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-muted-foreground" />
                        {selectedCompetition.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedCompetition.status)}>
                          {formatStatus(selectedCompetition.status)}
                        </Badge>
                        {selectedCompetition.level && (
                          <Badge variant="outline" className={getLevelColor(selectedCompetition.level)}>
                            {formatLevel(selectedCompetition.level)}
                          </Badge>
                        )}
                        {selectedCompetition.award && (
                          <div className="flex items-center gap-1">
                            {getAwardIcon(selectedCompetition.award)}
                            <span>{selectedCompetition.award}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      {selectedCompetition.cost && (
                        <span className="text-muted-foreground">
                          费用：¥{selectedCompetition.cost}
                        </span>
                      )}
                      {selectedCompetition.category && (
                        <span className="text-muted-foreground">
                          类别：{selectedCompetition.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">比赛类型：</span>
                      <span className="text-muted-foreground">
                        {selectedCompetition.competition_type || "未指定"}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">主办方：</span>
                      <span className="text-muted-foreground">
                        {selectedCompetition.organizer || "未指定"}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">团队负责人：</span>
                      <span className="text-muted-foreground">
                        {selectedCompetition.team_leader || "未指定"}
                      </span>
                    </div>

                    {selectedCompetition.participants && (
                      <div>
                        <span className="font-medium">参赛人员：</span>
                        <span className="text-muted-foreground">{selectedCompetition.participants}</span>
                      </div>
                    )}

                    {(selectedCompetition.registration_deadline || selectedCompetition.competition_date || selectedCompetition.result_date) && (
                      <div className="space-y-2">
                        <span className="font-medium">重要时间：</span>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {selectedCompetition.registration_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>报名截止：{new Date(selectedCompetition.registration_deadline).toLocaleDateString("zh-CN")}</span>
                            </div>
                          )}
                          {selectedCompetition.competition_date && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>比赛时间：{new Date(selectedCompetition.competition_date).toLocaleDateString("zh-CN")}</span>
                            </div>
                          )}
                          {selectedCompetition.result_date && (
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3" />
                              <span>结果公布：{new Date(selectedCompetition.result_date).toLocaleDateString("zh-CN")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedCompetition.description && (
                      <div className="space-y-1">
                        <span className="font-medium">比赛描述：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCompetition.description}
                        </p>
                      </div>
                    )}

                    {selectedCompetition.objectives && (
                      <div className="space-y-1">
                        <span className="font-medium">比赛目标：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCompetition.objectives}
                        </p>
                      </div>
                    )}

                    {selectedCompetition.requirements && (
                      <div className="space-y-1">
                        <span className="font-medium">参赛要求：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCompetition.requirements}
                        </p>
                      </div>
                    )}

                    {selectedCompetition.evaluation_criteria && (
                      <div className="space-y-1">
                        <span className="font-medium">评估标准：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCompetition.evaluation_criteria}
                        </p>
                      </div>
                    )}

                    {selectedCompetition.team_composition && (
                      <div className="space-y-1">
                        <span className="font-medium">团队组成：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCompetition.team_composition}
                        </p>
                      </div>
                    )}

                    {selectedCompetition.preparation_plan && (
                      <div className="space-y-1">
                        <span className="font-medium">准备计划：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedCompetition.preparation_plan}
                        </p>
                      </div>
                    )}

                    {(selectedCompetition.image_path || selectedCompetition.file_path) && (
                      <div className="space-y-1">
                        <span className="font-medium">相关文档：</span>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          {selectedCompetition.image_path && (
                            <a
                              href={selectedCompetition.image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              查看比赛图片
                            </a>
                          )}
                          {selectedCompetition.file_path && (
                            <a
                              href={selectedCompetition.file_path}
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

                    {selectedCompetition.related_projects && (
                      <div className="space-y-1">
                        <span className="font-medium">关联项目：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedCompetition.related_projects, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedCompetition.competition_details && (
                      <div className="space-y-1">
                        <span className="font-medium">比赛详情：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedCompetition.competition_details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedCompetition.created_at && (
                      <div className="space-y-1">
                        <span className="font-medium">创建时间：</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedCompetition.created_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedCompetition.id}</span>
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
                  暂未选择任何比赛，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图：参赛者贡献统计 + 赛事监控 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>参赛者贡献统计</CardTitle>
                    <CardDescription>成员参赛情况和获奖统计</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 参赛者贡献统计功能暂未实现 */}
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">暂无参赛数据</p>
                      <p className="text-xs text-muted-foreground mt-1">此功能将在后续版本中实现</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>赛事监控</CardTitle>
                    <CardDescription>赛事状态与管理信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">总赛事数</span>
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
                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <Trophy className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">赛事管理</p>
                            <p className="text-xs text-muted-foreground">统一管理各类赛事信息</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <Medal className="h-4 w-4 text-yellow-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">成果跟踪</p>
                            <p className="text-xs text-muted-foreground">记录参赛成果与获奖情况</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                          <Clock className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">进度监控</p>
                            <p className="text-xs text-muted-foreground">实时跟踪参赛进度</p>
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

      {/* 编辑比赛对话框 */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑比赛</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="edit-name">比赛名称 *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-competition-type">比赛类型</Label>
              <Input
                id="edit-competition-type"
                value={editForm.competition_type}
                onChange={(e) => setEditForm((f) => ({ ...f, competition_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-level">比赛级别</Label>
              <Select
                value={editForm.level}
                onValueChange={(value) => setEditForm((f) => ({ ...f, level: value }))}
              >
                <SelectTrigger id="edit-level" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">校级</SelectItem>
                  <SelectItem value="municipal">市级</SelectItem>
                  <SelectItem value="provincial">省部级</SelectItem>
                  <SelectItem value="national">国家级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-status">比赛状态</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger id="edit-status" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">待报名</SelectItem>
                  <SelectItem value="ongoing">进行中</SelectItem>
                  <SelectItem value="completed">已结束</SelectItem>
                  <SelectItem value="cancelled">取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-organizer">主办方</Label>
              <Input
                id="edit-organizer"
                value={editForm.organizer}
                onChange={(e) => setEditForm((f) => ({ ...f, organizer: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-category">比赛类别</Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-team-leader">团队负责人</Label>
              <Input
                id="edit-team-leader"
                value={editForm.team_leader}
                onChange={(e) => setEditForm((f) => ({ ...f, team_leader: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-participants">参赛人员</Label>
              <Input
                id="edit-participants"
                value={editForm.participants}
                onChange={(e) => setEditForm((f) => ({ ...f, participants: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-registration-deadline">报名截止日期</Label>
              <Input
                id="edit-registration-deadline"
                type="date"
                value={editForm.registration_deadline}
                onChange={(e) => setEditForm((f) => ({ ...f, registration_deadline: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-competition-date">比赛日期</Label>
              <Input
                id="edit-competition-date"
                type="date"
                value={editForm.competition_date}
                onChange={(e) => setEditForm((f) => ({ ...f, competition_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-result-date">结果公布日期</Label>
              <Input
                id="edit-result-date"
                type="date"
                value={editForm.result_date}
                onChange={(e) => setEditForm((f) => ({ ...f, result_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-award">获奖情况</Label>
              <Input
                id="edit-award"
                value={editForm.award}
                onChange={(e) => setEditForm((f) => ({ ...f, award: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-cost">参赛费用（元）</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                value={editForm.cost}
                onChange={(e) => setEditForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-image-path">比赛图片 URL</Label>
              <Input
                id="edit-image-path"
                placeholder="例如 https://.../competition.jpg"
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
              <Label htmlFor="edit-description">比赛描述</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-objectives">比赛目标</Label>
              <Textarea
                id="edit-objectives"
                rows={3}
                value={editForm.objectives}
                onChange={(e) => setEditForm((f) => ({ ...f, objectives: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-requirements">参赛要求</Label>
              <Textarea
                id="edit-requirements"
                rows={3}
                value={editForm.requirements}
                onChange={(e) => setEditForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-evaluation-criteria">评估标准</Label>
              <Textarea
                id="edit-evaluation-criteria"
                rows={3}
                value={editForm.evaluation_criteria}
                onChange={(e) => setEditForm((f) => ({ ...f, evaluation_criteria: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-team-composition">团队组成</Label>
              <Textarea
                id="edit-team-composition"
                rows={3}
                value={editForm.team_composition}
                onChange={(e) => setEditForm((f) => ({ ...f, team_composition: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-preparation-plan">准备计划</Label>
              <Textarea
                id="edit-preparation-plan"
                rows={3}
                value={editForm.preparation_plan}
                onChange={(e) => setEditForm((f) => ({ ...f, preparation_plan: e.target.value }))}
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
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-competition-details">比赛详情（JSON）</Label>
              <Textarea
                id="edit-competition-details"
                rows={3}
                placeholder='例如 {"rules": "比赛规则", "schedule": "日程安排"}'
                value={editForm.competitionDetails}
                onChange={(e) => setEditForm((f) => ({ ...f, competitionDetails: e.target.value }))}
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

      {/* 新增比赛对话框 */}
      <Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增比赛</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="create-name">比赛名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-competition-type">比赛类型</Label>
              <Input
                id="create-competition-type"
                value={createForm.competition_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, competition_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-level">比赛级别</Label>
              <Select
                value={createForm.level}
                onValueChange={(value) => setCreateForm((f) => ({ ...f, level: value }))}
              >
                <SelectTrigger id="create-level" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">校级</SelectItem>
                  <SelectItem value="municipal">市级</SelectItem>
                  <SelectItem value="provincial">省部级</SelectItem>
                  <SelectItem value="national">国家级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-status">比赛状态</Label>
              <Select
                value={createForm.status}
                onValueChange={(value) => setCreateForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger id="create-status" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">待报名</SelectItem>
                  <SelectItem value="ongoing">进行中</SelectItem>
                  <SelectItem value="completed">已结束</SelectItem>
                  <SelectItem value="cancelled">取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-organizer">主办方</Label>
              <Input
                id="create-organizer"
                value={createForm.organizer}
                onChange={(e) => setCreateForm((f) => ({ ...f, organizer: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-category">比赛类别</Label>
              <Input
                id="create-category"
                value={createForm.category}
                onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-team-leader">团队负责人</Label>
              <Input
                id="create-team-leader"
                value={createForm.team_leader}
                onChange={(e) => setCreateForm((f) => ({ ...f, team_leader: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-participants">参赛人员</Label>
              <Input
                id="create-participants"
                value={createForm.participants}
                onChange={(e) => setCreateForm((f) => ({ ...f, participants: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-registration-deadline">报名截止日期</Label>
              <Input
                id="create-registration-deadline"
                type="date"
                value={createForm.registration_deadline}
                onChange={(e) => setCreateForm((f) => ({ ...f, registration_deadline: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-competition-date">比赛日期</Label>
              <Input
                id="create-competition-date"
                type="date"
                value={createForm.competition_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, competition_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-result-date">结果公布日期</Label>
              <Input
                id="create-result-date"
                type="date"
                value={createForm.result_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, result_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-award">获奖情况</Label>
              <Input
                id="create-award"
                value={createForm.award}
                onChange={(e) => setCreateForm((f) => ({ ...f, award: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-cost">参赛费用（元）</Label>
              <Input
                id="create-cost"
                type="number"
                step="0.01"
                value={createForm.cost}
                onChange={(e) => setCreateForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-image-path">比赛图片 URL</Label>
              <Input
                id="create-image-path"
                placeholder="例如 https://.../competition.jpg"
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
              <Label htmlFor="create-description">比赛描述</Label>
              <Textarea
                id="create-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-objectives">比赛目标</Label>
              <Textarea
                id="create-objectives"
                rows={3}
                value={createForm.objectives}
                onChange={(e) => setCreateForm((f) => ({ ...f, objectives: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-requirements">参赛要求</Label>
              <Textarea
                id="create-requirements"
                rows={3}
                value={createForm.requirements}
                onChange={(e) => setCreateForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-evaluation-criteria">评估标准</Label>
              <Textarea
                id="create-evaluation-criteria"
                rows={3}
                value={createForm.evaluation_criteria}
                onChange={(e) => setCreateForm((f) => ({ ...f, evaluation_criteria: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-team-composition">团队组成</Label>
              <Textarea
                id="create-team-composition"
                rows={3}
                value={createForm.team_composition}
                onChange={(e) => setCreateForm((f) => ({ ...f, team_composition: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-preparation-plan">准备计划</Label>
              <Textarea
                id="create-preparation-plan"
                rows={3}
                value={createForm.preparation_plan}
                onChange={(e) => setCreateForm((f) => ({ ...f, preparation_plan: e.target.value }))}
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
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-competition-details">比赛详情（JSON）</Label>
              <Textarea
                id="create-competition-details"
                rows={3}
                placeholder='例如 {"rules": "比赛规则", "schedule": "日程安排"}'
                value={createForm.competitionDetails}
                onChange={(e) => setCreateForm((f) => ({ ...f, competitionDetails: e.target.value }))}
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
              onClick={handleCreateCompetition}
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
