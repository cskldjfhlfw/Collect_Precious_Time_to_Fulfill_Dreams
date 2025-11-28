"use client"

import { useMemo, useState, useEffect } from "react"
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
  FolderKanban,
  Users,
  Calendar,
  DollarSign,
  Plus,
  Filter,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Trash2,
  Pencil,
  Play,
  TrendingUp,
  Target,
  FileText,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApi, usePaginatedApi } from "@/hooks/useApi"
import { projectsApi } from "@/lib/api"
import { FilterPanel, type FilterConfig, type FilterValue } from "@/components/ui/filter-panel"
import { ImportDialog } from "@/components/import-dialog"
import { usePermissions } from "@/hooks/usePermissions"
import { useAuth } from "@/contexts/auth-context"

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "planning":
    case "规划中": 
      return "bg-purple-100 text-purple-800"
    case "in_progress":
    case "在研": 
      return "bg-blue-100 text-blue-800"
    case "completed":
    case "已结项": 
      return "bg-green-100 text-green-800"
    case "pending":
    case "待立项": 
      return "bg-yellow-100 text-yellow-800"
    case "paused":
    case "暂停": 
      return "bg-gray-100 text-gray-800"
    default: 
      return "bg-gray-100 text-gray-800"
  }
}

const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "planning": return "规划中"
    case "in_progress": return "在研"
    case "completed": return "已结项"
    case "pending": return "待立项"  
    case "paused": return "暂停"
    default: return status
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
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

const formatPriority = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high": return "高"
    case "medium": return "中"
    case "low": return "低"
    default: return priority || "未设置"
  }
}

export default function ProjectsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "analysis">("list")
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [detailedProject, setDetailedProject] = useState<any | null>(null) // 存储完整详情
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [searchScope, setSearchScope] = useState<"all" | "name" | "principal" | "project_type">("all")
  const [deleting, setDeleting] = useState(false)
  
  // 启动相关状态
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [startupStatus, setStartupStatus] = useState<any>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestReason, setRequestReason] = useState("")
  
  // 筛选状态
  const [filterValues, setFilterValues] = useState<FilterValue>({
    status: "",
    priority: "",
    projectType: "",
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
        { value: "planning", label: "规划中" },
        { value: "in_progress", label: "在研" },
        { value: "completed", label: "已结项" },
        { value: "pending", label: "待立项" },
        { value: "paused", label: "暂停" }
      ]
    },
    {
      key: "priority",
      label: "优先级",
      type: "select",
      options: [
        { value: "all", label: "全部优先级" },
        { value: "high", label: "高" },
        { value: "medium", label: "中" },
        { value: "low", label: "低" }
      ]
    },
    {
      key: "projectType",
      label: "项目类型",
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
    project_number: "",
    status: "pending",
    project_type: "",
    priority: "medium",
    principal: "",
    start_date: "",
    end_date: "",
    budget: "",
    progress_percent: "",
    description: "",
    objectives: "",
    deliverables: "",
    risks: "",
    team_members: "",
    resources_required: "",
    image_path: "",
    startup_script_path: "",
    milestones: "",
    budget_breakdown: "",
    relatedPapers: "",
    relatedPatents: "",
  })

  const [createForm, setCreateForm] = useState({
    name: "",
    project_number: "",
    status: "planning",
    project_type: "",
    priority: "medium",
    principal: "",
    start_date: "",
    end_date: "",
    budget: "",
    progress_percent: "",
    description: "",
    objectives: "",
    deliverables: "",
    risks: "",
    team_members: "",
    resources_required: "",
    image_path: "",
    startup_script_path: "",
    milestones: "",
    budget_breakdown: "",
    relatedPapers: "",
    relatedPatents: "",
  })

  const { data: stats, loading: statsLoading } = useApi(() => projectsApi.getStats())
  const {
    data: projects,
    pagination,
    loading: projectsLoading,
    search: searchBackend,
    filter,
    goToPage,
    changePageSize,
    refetch: refetchProjects,
  } = usePaginatedApi(
    (params) => projectsApi.getList(params),
    { size: 10 }
  )
  // 暂时注释掉，后端API未实现
  // const { data: teamContributions, loading: teamLoading } = useApi(() => 
  //   projectsApi.getTeamContributions(5)
  // )
  const teamContributions: any[] | null = null
  const teamLoading = false

  // 前端字段搜索和筛选
  const displayProjects = useMemo(() => {
    if (!projects) return []
    const trimmed = searchText.trim()
    const lower = trimmed.toLowerCase()

    return projects.filter((project: any) => {
      // 字段搜索
      if (trimmed && searchScope !== "all") {
        if (searchScope === "name") {
          if (!project.name?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "principal") {
          if (!project.principal?.toLowerCase().includes(lower)) return false
        } else if (searchScope === "project_type") {
          if (!project.project_type?.toLowerCase().includes(lower)) return false
        }
      }

      // 项目类型关键字过滤
      if (filterValues.projectType?.trim()) {
        const pt = filterValues.projectType.trim().toLowerCase()
        if (!project.project_type || !project.project_type.toLowerCase().includes(pt)) return false
      }

      // 优先级过滤
      if (filterValues.priority && filterValues.priority !== "all") {
        if (project.priority !== filterValues.priority) return false
      }

      // 日期范围过滤（基于 start_date）
      if (filterValues.dateRange?.start || filterValues.dateRange?.end) {
        if (!project.start_date) return false
        const d = new Date(project.start_date)
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
  }, [projects, searchText, searchScope, filterValues])

  // 加载项目详情（按需加载）
  useEffect(() => {
    const loadProjectDetail = async () => {
      if (selectedProject && activeTab === "detail") {
        try {
          setLoadingDetail(true)
          const detail = await projectsApi.getDetail(selectedProject.id)
          setDetailedProject(detail)
          // 同时加载启动状态
          await loadStartupStatus()
        } catch (error) {
          console.error("加载项目详情失败", error)
        } finally {
          setLoadingDetail(false)
        }
      }
    }
    loadProjectDetail()
  }, [selectedProject, activeTab])

  const handleSearch = () => {
    const trimmed = searchText.trim()
    if (searchScope === "all") {
      searchBackend(trimmed || "")
    }
    setActiveTab("list")
  }

  const handleDelete = async () => {
    if (!selectedProject?.id || deleting) return
    const ok = window.confirm("确定要删除该项目记录吗？此操作不可恢复。")
    if (!ok) return
    try {
      setDeleting(true)
      await projectsApi.delete(selectedProject.id)
      await refetchProjects()
      setSelectedProject(null)
      setActiveTab("list")
    } catch (error) {
      console.error("删除项目失败", error)
      alert("删除失败，请稍后重试。")
    } finally {
      setDeleting(false)
    }
  }

  // 启动项目
  const handleStartProject = async () => {
    if (!selectedProject?.id || starting) return
    
    // 检查用户角色，如果是普通用户，显示申请理由对话框
    console.log('当前用户:', user)
    console.log('是否管理员:', isAdmin)
    
    if (!isAdmin) {
      // 普通用户，显示申请理由对话框
      setShowRequestDialog(true)
      return
    }
    
    // 管理员直接启动
    const ok = window.confirm("确定要启动该项目吗？")
    if (!ok) return

    try {
      setStarting(true)
      const result = await projectsApi.start(selectedProject.id)
      
      if (result.user_role === 'admin') {
        alert(`项目启动成功！\n启动时长：${result.duration_hours}小时\n预计结束时间：${new Date(result.end_time!).toLocaleString("zh-CN")}`)
        // 刷新启动状态
        await loadStartupStatus()
      } else {
        alert(result.message)
      }
    } catch (error: any) {
      console.error("启动项目失败", error)
      alert("启动项目失败：" + (error.message || "未知错误"))
    } finally {
      setStarting(false)
    }
  }
  
  // 提交启动申请
  const handleSubmitRequest = async () => {
    if (!selectedProject?.id || !requestReason.trim()) {
      alert("请填写申请理由")
      return
    }
    
    try {
      setStarting(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`http://localhost:8000/api/projects/${selectedProject.id}/start`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_reason: requestReason
        })
      })
      
      if (!response.ok) {
        throw new Error("提交申请失败")
      }
      
      const result = await response.json()
      alert(result.message)
      setShowRequestDialog(false)
      setRequestReason("")
    } catch (error: any) {
      console.error("提交申请失败", error)
      alert("提交申请失败：" + (error.message || "未知错误"))
    } finally {
      setStarting(false)
    }
  }

  // 加载启动状态
  const loadStartupStatus = async () => {
    if (!selectedProject?.id) return
    
    try {
      const status = await projectsApi.getStartupStatus(selectedProject.id)
      setStartupStatus(status)
    } catch (error) {
      console.error("获取启动状态失败", error)
    }
  }

  // 停止项目
  const handleStopProject = async () => {
    if (!selectedProject?.id || stopping) return
    
    const ok = window.confirm("确定要停止该项目吗？")
    if (!ok) return

    try {
      setStopping(true)
      const result = await projectsApi.stop(selectedProject.id)
      
      if (result.user_role === 'admin') {
        if (result.stopped_processes && result.stopped_processes.length > 0) {
          alert(`${result.message}\n停止的进程ID: ${result.stopped_processes.join(', ')}`)
        } else {
          alert(result.message)
        }
        // 刷新启动状态
        await loadStartupStatus()
      } else {
        alert(result.message)
      }
    } catch (error: any) {
      console.error("停止项目失败", error)
      alert("停止项目失败：" + (error.message || "未知错误"))
    } finally {
      setStopping(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedProject) return
    const teamMembersStr = Array.isArray(selectedProject.team_members)
      ? selectedProject.team_members.join(", ")
      : typeof selectedProject.team_members === "string"
      ? selectedProject.team_members
      : selectedProject.team_members && typeof selectedProject.team_members === "object"
      ? (selectedProject.team_members.members 
          ? Array.isArray(selectedProject.team_members.members)
            ? selectedProject.team_members.members.join(", ")
            : String(selectedProject.team_members.members)
          : Object.values(selectedProject.team_members).join(", "))
      : ""

    setEditForm({
      name: selectedProject.name || "",
      project_number: selectedProject.project_number || "",
      status: selectedProject.status || "pending",
      project_type: selectedProject.project_type || "",
      priority: selectedProject.priority || "medium",
      principal: selectedProject.principal || "",
      start_date: selectedProject.start_date ? selectedProject.start_date.split('T')[0] : "",
      end_date: selectedProject.end_date ? selectedProject.end_date.split('T')[0] : "",
      budget: selectedProject.budget?.toString() || "",
      progress_percent: selectedProject.progress_percent?.toString() || "",
      description: selectedProject.description || "",
      objectives: selectedProject.objectives || "",
      deliverables: selectedProject.deliverables || "",
      risks: selectedProject.risks || "",
      team_members: teamMembersStr,
      resources_required: selectedProject.resources_required || "",
      image_path: selectedProject.image_path || "",
      startup_script_path: selectedProject.startup_script_path || "",
      milestones: selectedProject.milestones
        ? JSON.stringify(selectedProject.milestones, null, 2)
        : "",
      budget_breakdown: selectedProject.budget_breakdown
        ? JSON.stringify(selectedProject.budget_breakdown, null, 2)
        : "",
      relatedPapers: selectedProject.related_papers
        ? JSON.stringify(selectedProject.related_papers, null, 2)
        : "",
      relatedPatents: selectedProject.related_patents
        ? JSON.stringify(selectedProject.related_patents, null, 2)
        : "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedProject?.id || saving) return
    setFormError("")
    if (!editForm.name.trim()) {
      setFormError("项目名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: editForm.name.trim(),
        project_number: editForm.project_number.trim() || undefined,
        status: editForm.status,
        project_type: editForm.project_type.trim() || undefined,
        priority: editForm.priority,
        principal: editForm.principal.trim() || null,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        budget: editForm.budget ? parseFloat(editForm.budget) : null,
        progress_percent: editForm.progress_percent ? parseInt(editForm.progress_percent) : null,
        description: editForm.description.trim() || null,
        objectives: editForm.objectives.trim() || null,
        deliverables: editForm.deliverables.trim() || null,
        risks: editForm.risks.trim() || null,
        resources_required: editForm.resources_required.trim() || null,
        image_path: editForm.image_path.trim() || null,
        startup_script_path: editForm.startup_script_path.trim() || null,
      }
      
      // 调试日志
      console.log('保存项目 - editForm:', editForm)
      console.log('保存项目 - payload:', payload)
      console.log('图片路径:', editForm.image_path)

      if (editForm.team_members.trim()) {
        payload.team_members = editForm.team_members
      }

      // JSON字段处理
      if (editForm.milestones.trim()) {
        try {
          payload.milestones = JSON.parse(editForm.milestones)
        } catch {
          setFormError("里程碑必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (editForm.budget_breakdown.trim()) {
        try {
          payload.budget_breakdown = JSON.parse(editForm.budget_breakdown)
        } catch {
          setFormError("预算分解必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (editForm.relatedPapers.trim()) {
        try {
          payload.related_papers = JSON.parse(editForm.relatedPapers)
        } catch {
          setFormError("相关论文必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (editForm.relatedPatents.trim()) {
        try {
          payload.related_patents = JSON.parse(editForm.relatedPatents)
        } catch {
          setFormError("相关专利必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      const updated = await projectsApi.update(selectedProject.id, payload)
      setSelectedProject(updated)
      await refetchProjects()
      setEditOpen(false)
    } catch (error) {
      console.error("更新项目失败", error)
      alert("更新失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateProject = async () => {
    if (saving) return
    setFormError("")
    if (!createForm.name.trim()) {
      setFormError("项目名称为必填项")
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: createForm.name.trim(),
        project_number: createForm.project_number.trim() || `PROJ-${Date.now()}`,
        status: createForm.status,
        project_type: createForm.project_type.trim() || "其他",
        priority: createForm.priority,
        principal: createForm.principal.trim() || null,
        start_date: createForm.start_date || null,
        end_date: createForm.end_date || null,
        budget: createForm.budget ? parseFloat(createForm.budget) : null,
        progress_percent: createForm.progress_percent ? parseInt(createForm.progress_percent) : 0,
        description: createForm.description.trim() || null,
        objectives: createForm.objectives.trim() || null,
        deliverables: createForm.deliverables.trim() || null,
        risks: createForm.risks.trim() || null,
        resources_required: createForm.resources_required.trim() || null,
        image_path: createForm.image_path.trim() || null,
        startup_script_path: createForm.startup_script_path.trim() || null,
      }

      if (createForm.team_members.trim()) {
        payload.team_members = createForm.team_members
      }

      // JSON字段处理
      if (createForm.milestones.trim()) {
        try {
          payload.milestones = JSON.parse(createForm.milestones)
        } catch {
          setFormError("里程碑必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (createForm.budget_breakdown.trim()) {
        try {
          payload.budget_breakdown = JSON.parse(createForm.budget_breakdown)
        } catch {
          setFormError("预算分解必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (createForm.relatedPapers.trim()) {
        try {
          payload.related_papers = JSON.parse(createForm.relatedPapers)
        } catch {
          setFormError("相关论文必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      if (createForm.relatedPatents.trim()) {
        try {
          payload.related_patents = JSON.parse(createForm.relatedPatents)
        } catch {
          setFormError("相关专利必须是合法的 JSON 格式")
          setSaving(false)
          return
        }
      }

      console.log("Creating project with payload:", payload)
      const created = await projectsApi.create(payload)
      setCreateOpen(false)
      setCreateForm({
        name: "",
        project_number: "",
        status: "planning",
        project_type: "",
        priority: "medium",
        principal: "",
        start_date: "",
        end_date: "",
        budget: "",
        progress_percent: "",
        description: "",
        objectives: "",
        deliverables: "",
        risks: "",
        team_members: "",
        resources_required: "",
        image_path: "",
        startup_script_path: "",
        milestones: "",
        budget_breakdown: "",
        relatedPapers: "",
        relatedPatents: "",
      })
      await refetchProjects()
      setSelectedProject(created)
      setActiveTab("detail")
    } catch (error) {
      console.error("创建项目失败", error)
      alert("创建失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">项目管理</h1>
          <p className="text-sm text-muted-foreground">
            集中掌握科研项目的进展、里程碑与资源配置。
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
            entityType="projects"
            entityName="项目"
            apiEndpoint="/api/projects"
            onImportSuccess={() => refetchProjects()}
            sampleFields={[
              "name", "project_number", "project_type", "principal", "start_date", "end_date",
              "budget", "budget_used", "status", "progress_percent", "priority", "risk_level",
              "description", "image_path"
            ]}
          />
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增项目
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
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
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

      {/* 项目管理：支持列表视图 + 详情视图 + 分析视图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>项目组合</CardTitle>
              <CardDescription>总览在研、结项与待立项项目的全局态势</CardDescription>
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
                    <SelectItem value="name">按项目名</SelectItem>
                    <SelectItem value="principal">按负责人</SelectItem>
                    <SelectItem value="project_type">按项目类型</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={handleSearch}
                  disabled={projectsLoading}
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
              {selectedProject && (
                <span className="truncate text-xs text-muted-foreground max-w-xs">
                  当前查看：{selectedProject.name}
                </span>
              )}
            </div>

            {/* 列表视图 */}
            <TabsContent value="list">
              {projectsLoading ? (
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
              ) : displayProjects && displayProjects.length > 0 ? (
                <div className="space-y-3">
                  {displayProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(project)
                        setActiveTab("detail")
                      }}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-clamp-1">{project.name}</h3>
                          <Badge className={getStatusColor(project.status)}>
                            {formatStatus(project.status)}
                          </Badge>
                          {project.project_number && (
                            <Badge variant="outline" className="text-xs">
                              {project.project_number}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {project.principal && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span className="line-clamp-1">
                                负责人：{project.principal}
                              </span>
                            </div>
                          )}
                          {project.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(project.start_date).toLocaleDateString("zh-CN")}
                            </div>
                          )}
                          {project.project_type && <div>类型：{project.project_type}</div>}
                        </div>
                        {project.progress_percent !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>进度</span>
                              <span>{project.progress_percent}%</span>
                            </div>
                            <Progress value={project.progress_percent} className="h-1" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2 text-xs">
                        {project.priority && (
                          <div className={`font-medium ${getPriorityColor(project.priority)}`}>
                            {formatPriority(project.priority)}
                          </div>
                        )}
                        {project.budget && (
                          <div className="text-muted-foreground">
                            ¥{project.budget.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无项目数据</p>
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
                      disabled={pagination.page <= 1 || projectsLoading}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={pagination.page >= pagination.pages || projectsLoading}
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
              {loadingDetail ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedProject ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-snug">{selectedProject.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(selectedProject.status)}>
                          {formatStatus(selectedProject.status)}
                        </Badge>
                        {selectedProject.project_number && <span>项目代码：{selectedProject.project_number}</span>}
                        {selectedProject.project_type && <span>类型：{selectedProject.project_type}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      {selectedProject.priority && (
                        <span className={`font-medium ${getPriorityColor(selectedProject.priority)}`}>
                          优先级：{formatPriority(selectedProject.priority)}
                        </span>
                      )}
                      {selectedProject.budget && (
                        <span className="text-muted-foreground">
                          预算：¥{selectedProject.budget.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 项目图片 */}
                  {(detailedProject || selectedProject).image_path && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">项目图片</h4>
                      <img 
                        src={`http://localhost:8000/api/projects/${selectedProject.id}/image`}
                        alt={(detailedProject || selectedProject).name}
                        style={{
                          maxWidth: '600px',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">项目负责人：</span>
                      <span className="text-muted-foreground">
                        {selectedProject.principal || "未指定"}
                      </span>
                    </div>

                    {(selectedProject.start_date || selectedProject.end_date) && (
                      <div>
                        <span className="font-medium">项目周期：</span>
                        <span className="text-muted-foreground">
                          {selectedProject.start_date 
                            ? new Date(selectedProject.start_date).toLocaleDateString("zh-CN")
                            : "未设置"
                          } - {selectedProject.end_date 
                            ? new Date(selectedProject.end_date).toLocaleDateString("zh-CN")
                            : "未设置"
                          }
                        </span>
                      </div>
                    )}

                    {selectedProject.progress_percent !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">项目进度：</span>
                          <span className="text-muted-foreground">{selectedProject.progress_percent}%</span>
                        </div>
                        <Progress value={selectedProject.progress_percent} className="h-2" />
                      </div>
                    )}

                    {selectedProject.description && (
                      <div className="space-y-1">
                        <span className="font-medium">项目描述：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedProject.description}
                        </p>
                      </div>
                    )}

                    {selectedProject.objectives && (
                      <div className="space-y-1">
                        <span className="font-medium">项目目标：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedProject.objectives}
                        </p>
                      </div>
                    )}

                    {selectedProject.deliverables && (
                      <div className="space-y-1">
                        <span className="font-medium">交付成果：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedProject.deliverables}
                        </p>
                      </div>
                    )}

                    {selectedProject.risks && (
                      <div className="space-y-1">
                        <span className="font-medium">风险评估：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedProject.risks}
                        </p>
                      </div>
                    )}

                    {selectedProject.team_members && (
                      <div>
                        <span className="font-medium">团队成员：</span>
                        <span className="text-muted-foreground">
                          {Array.isArray(selectedProject.team_members)
                            ? selectedProject.team_members.join(", ")
                            : typeof selectedProject.team_members === "string"
                            ? selectedProject.team_members
                            : selectedProject.team_members && typeof selectedProject.team_members === "object"
                            ? (selectedProject.team_members.members 
                                ? Array.isArray(selectedProject.team_members.members)
                                  ? selectedProject.team_members.members.join(", ")
                                  : String(selectedProject.team_members.members)
                                : Object.values(selectedProject.team_members).join(", "))
                            : "未指定"}
                        </span>
                      </div>
                    )}

                    {selectedProject.resources_required && (
                      <div className="space-y-1">
                        <span className="font-medium">所需资源：</span>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {selectedProject.resources_required}
                        </p>
                      </div>
                    )}

                    {selectedProject.startup_script_path && (
                      <div className="space-y-1">
                        <span className="font-medium">项目文档：</span>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <a
                            href={selectedProject.startup_script_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-2"
                          >
                            下载项目文档
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedProject.milestones && (
                      <div className="space-y-1">
                        <span className="font-medium">项目里程碑：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedProject.milestones, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedProject.budget_breakdown && (
                      <div className="space-y-1">
                        <span className="font-medium">预算分解：</span>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                          {JSON.stringify(selectedProject.budget_breakdown, null, 2)}
                        </pre>
                      </div>
                    )}

                    {(selectedProject.related_papers || selectedProject.related_patents) && (
                      <div className="space-y-2">
                        <span className="font-medium">关联成果：</span>
                        {selectedProject.related_papers && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">相关论文：</span>
                            <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                              {JSON.stringify(selectedProject.related_papers, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedProject.related_patents && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">相关专利：</span>
                            <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] text-muted-foreground">
                              {JSON.stringify(selectedProject.related_patents, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>记录 ID：{selectedProject.id}</span>
                    <div className="flex items-center gap-2">
                      {/* 启动/停止按钮 */}
                      {startupStatus?.is_running ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={handleStopProject}
                          disabled={stopping}
                        >
                          {stopping ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 停止中...
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" /> 停止
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={handleStartProject}
                          disabled={starting}
                        >
                          {starting ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 启动中...
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" /> 启动
                            </>
                          )}
                        </Button>
                      )}

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
                  暂未选择任何项目，请先在列表中点击一条记录。
                </div>
              )}
            </TabsContent>

            {/* 分析视图：团队贡献 + 项目统计 */}
            <TabsContent value="analysis">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>团队贡献</CardTitle>
                    <CardDescription>成员项目参与情况</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 团队贡献统计功能暂未实现 */}
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">暂无团队数据</p>
                      <p className="text-xs text-muted-foreground mt-1">此功能将在后续版本中实现</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>项目统计</CardTitle>
                    <CardDescription>项目分布与管理情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">总项目数</span>
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
                            <p className="text-sm font-medium">人力资源</p>
                            <p className="text-xs text-muted-foreground">团队成员正在参与项目研发</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">预算执行</p>
                            <p className="text-xs text-muted-foreground">项目预算合理分配使用</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">设备资源</p>
                            <p className="text-xs text-muted-foreground">实验设备运行良好</p>
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

      {/* 编辑项目对话框 */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="edit-name">项目名称 *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-code">项目代码</Label>
              <Input
                id="edit-code"
                value={editForm.project_number}
                onChange={(e) => setEditForm((f) => ({ ...f, project_number: e.target.value }))}
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
                  <SelectItem value="planning">规划中</SelectItem>
                  <SelectItem value="pending">待立项</SelectItem>
                  <SelectItem value="in_progress">在研</SelectItem>
                  <SelectItem value="completed">已结项</SelectItem>
                  <SelectItem value="paused">暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-priority">优先级</Label>
              <Select
                value={editForm.priority}
                onValueChange={(value) => setEditForm((f) => ({ ...f, priority: value }))}
              >
                <SelectTrigger id="edit-priority" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-leader">项目负责人</Label>
              <Input
                id="edit-leader"
                value={editForm.principal}
                onChange={(e) => setEditForm((f) => ({ ...f, principal: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-project-type">项目类型</Label>
              <Input
                id="edit-project-type"
                value={editForm.project_type}
                onChange={(e) => setEditForm((f) => ({ ...f, project_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-start-date">开始日期</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={editForm.start_date}
                onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-end-date">结束日期</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={editForm.end_date}
                onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-budget">预算（元）</Label>
              <Input
                id="edit-budget"
                type="number"
                value={editForm.budget}
                onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-progress">项目进度（%）</Label>
              <Input
                id="edit-progress"
                type="number"
                min="0"
                max="100"
                value={editForm.progress_percent}
                onChange={(e) => setEditForm((f) => ({ ...f, progress_percent: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-team-members">团队成员（逗号分隔）</Label>
              <Input
                id="edit-team-members"
                value={editForm.team_members}
                onChange={(e) => setEditForm((f) => ({ ...f, team_members: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-image-path">项目图片</Label>
              <Input
                id="edit-image-path"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    try {
                      console.log('开始上传项目图片:', file.name)
                      const result = await projectsApi.uploadFile(file, 'image')
                      console.log('图片上传成功:', result)
                      setEditForm((f) => ({ ...f, image_path: result.file_path }))
                      alert(`图片上传成功：${result.new_filename}`)
                    } catch (error) {
                      console.error('图片上传失败:', error)
                      alert(`图片上传失败：${error}`)
                    }
                  }
                }}
                className="h-9"
              />
              {editForm.image_path && (
                <p className="text-xs text-green-600">
                  已上传：{editForm.image_path}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                选择图片文件将自动上传到服务器
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="edit-file-path">项目文档 URL</Label>
              <Input
                id="edit-file-path"
                placeholder="例如 https://.../document.pdf"
                value={editForm.startup_script_path}
                onChange={(e) => setEditForm((f) => ({ ...f, startup_script_path: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-description">项目描述</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-objectives">项目目标</Label>
              <Textarea
                id="edit-objectives"
                rows={3}
                value={editForm.objectives}
                onChange={(e) => setEditForm((f) => ({ ...f, objectives: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-deliverables">交付成果</Label>
              <Textarea
                id="edit-deliverables"
                rows={3}
                value={editForm.deliverables}
                onChange={(e) => setEditForm((f) => ({ ...f, deliverables: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-risks">风险评估</Label>
              <Textarea
                id="edit-risks"
                rows={3}
                value={editForm.risks}
                onChange={(e) => setEditForm((f) => ({ ...f, risks: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-resources-required">所需资源</Label>
              <Textarea
                id="edit-resources-required"
                rows={3}
                value={editForm.resources_required}
                onChange={(e) => setEditForm((f) => ({ ...f, resources_required: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-milestones">项目里程碑（JSON）</Label>
              <Textarea
                id="edit-milestones"
                rows={3}
                placeholder='例如 {"阶段1": "需求分析", "阶段2": "系统设计"}'
                value={editForm.milestones}
                onChange={(e) => setEditForm((f) => ({ ...f, milestones: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-budget-breakdown">预算分解（JSON）</Label>
              <Textarea
                id="edit-budget-breakdown"
                rows={3}
                placeholder='例如 {"人力成本": 100000, "设备费": 50000}'
                value={editForm.budget_breakdown}
                onChange={(e) => setEditForm((f) => ({ ...f, budget_breakdown: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-related-papers">相关论文（JSON）</Label>
              <Textarea
                id="edit-related-papers"
                rows={3}
                placeholder='例如 {"paper_id": "xxx", "title": "论文标题"}'
                value={editForm.relatedPapers}
                onChange={(e) => setEditForm((f) => ({ ...f, relatedPapers: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-related-patents">相关专利（JSON）</Label>
              <Textarea
                id="edit-related-patents"
                rows={3}
                placeholder='例如 {"patent_id": "xxx", "name": "专利名称"}'
                value={editForm.relatedPatents}
                onChange={(e) => setEditForm((f) => ({ ...f, relatedPatents: e.target.value }))}
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

      {/* 新增项目对话框 */}
      <Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增项目</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {formError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="create-name">项目名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-code">项目代码</Label>
              <Input
                id="create-code"
                value={createForm.project_number}
                onChange={(e) => setCreateForm((f) => ({ ...f, project_number: e.target.value }))}
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
                  <SelectItem value="planning">规划中</SelectItem>
                  <SelectItem value="pending">待立项</SelectItem>
                  <SelectItem value="in_progress">在研</SelectItem>
                  <SelectItem value="completed">已结项</SelectItem>
                  <SelectItem value="paused">暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-priority">优先级</Label>
              <Select
                value={createForm.priority}
                onValueChange={(value) => setCreateForm((f) => ({ ...f, priority: value }))}
              >
                <SelectTrigger id="create-priority" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-leader">项目负责人</Label>
              <Input
                id="create-leader"
                value={createForm.principal}
                onChange={(e) => setCreateForm((f) => ({ ...f, principal: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-project-type">项目类型</Label>
              <Input
                id="create-project-type"
                value={createForm.project_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, project_type: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-start-date">开始日期</Label>
              <Input
                id="create-start-date"
                type="date"
                value={createForm.start_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-end-date">结束日期</Label>
              <Input
                id="create-end-date"
                type="date"
                value={createForm.end_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-budget">预算（元）</Label>
              <Input
                id="create-budget"
                type="number"
                value={createForm.budget}
                onChange={(e) => setCreateForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-progress">项目进度（%）</Label>
              <Input
                id="create-progress"
                type="number"
                min="0"
                max="100"
                value={createForm.progress_percent}
                onChange={(e) => setCreateForm((f) => ({ ...f, progress_percent: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-team-members">团队成员（逗号分隔）</Label>
              <Input
                id="create-team-members"
                value={createForm.team_members}
                onChange={(e) => setCreateForm((f) => ({ ...f, team_members: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-image-path">项目图片</Label>
              <Input
                id="create-image-path"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    try {
                      console.log('开始上传项目图片:', file.name)
                      const result = await projectsApi.uploadFile(file, 'image')
                      console.log('图片上传成功:', result)
                      setCreateForm((f) => ({ ...f, image_path: result.file_path }))
                      alert(`图片上传成功：${result.new_filename}`)
                    } catch (error) {
                      console.error('图片上传失败:', error)
                      alert(`图片上传失败：${error}`)
                    }
                  }
                }}
                className="h-9"
              />
              {createForm.image_path && (
                <p className="text-xs text-green-600">
                  已上传：{createForm.image_path}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                选择图片文件将自动上传到服务器
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="create-file-path">项目文档 URL</Label>
              <Input
                id="create-file-path"
                placeholder="例如 https://.../document.pdf"
                value={createForm.startup_script_path}
                onChange={(e) => setCreateForm((f) => ({ ...f, startup_script_path: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-description">项目描述</Label>
              <Textarea
                id="create-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-objectives">项目目标</Label>
              <Textarea
                id="create-objectives"
                rows={3}
                value={createForm.objectives}
                onChange={(e) => setCreateForm((f) => ({ ...f, objectives: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-deliverables">交付成果</Label>
              <Textarea
                id="create-deliverables"
                rows={3}
                value={createForm.deliverables}
                onChange={(e) => setCreateForm((f) => ({ ...f, deliverables: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-risks">风险评估</Label>
              <Textarea
                id="create-risks"
                rows={3}
                value={createForm.risks}
                onChange={(e) => setCreateForm((f) => ({ ...f, risks: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-resources-required">所需资源</Label>
              <Textarea
                id="create-resources-required"
                rows={3}
                value={createForm.resources_required}
                onChange={(e) => setCreateForm((f) => ({ ...f, resources_required: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-milestones">项目里程碑（JSON）</Label>
              <Textarea
                id="create-milestones"
                rows={3}
                placeholder='例如 {"阶段1": "需求分析", "阶段2": "系统设计"}'
                value={createForm.milestones}
                onChange={(e) => setCreateForm((f) => ({ ...f, milestones: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-budget-breakdown">预算分解（JSON）</Label>
              <Textarea
                id="create-budget-breakdown"
                rows={3}
                placeholder='例如 {"人力成本": 100000, "设备费": 50000}'
                value={createForm.budget_breakdown}
                onChange={(e) => setCreateForm((f) => ({ ...f, budget_breakdown: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-related-papers">相关论文（JSON）</Label>
              <Textarea
                id="create-related-papers"
                rows={3}
                placeholder='例如 {"paper_id": "xxx", "title": "论文标题"}'
                value={createForm.relatedPapers}
                onChange={(e) => setCreateForm((f) => ({ ...f, relatedPapers: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-related-patents">相关专利（JSON）</Label>
              <Textarea
                id="create-related-patents"
                rows={3}
                placeholder='例如 {"patent_id": "xxx", "name": "专利名称"}'
                value={createForm.relatedPatents}
                onChange={(e) => setCreateForm((f) => ({ ...f, relatedPatents: e.target.value }))}
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
              onClick={handleCreateProject}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 启动申请理由对话框 */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申请启动项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>项目名称</Label>
              <div className="text-sm font-medium">{selectedProject?.name}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-reason">申请理由 *</Label>
              <Textarea
                id="request-reason"
                placeholder="请说明需要启动该项目的理由..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false)
                setRequestReason("")
              }}
              disabled={starting}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={starting || !requestReason.trim()}
            >
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                "提交申请"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
