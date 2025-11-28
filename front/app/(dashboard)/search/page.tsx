"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Filter,
  FileText,
  Award,
  Code,
  FolderKanban,
  Trophy,
  Calendar,
  Users,
  Star,
  TrendingUp,
  Clock,
  Bookmark,
  Loader2,
  X,
  Plus,
  Eye,
  Download,
  ExternalLink,
  History,
  Sparkles,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useApi, usePaginatedApi } from "@/hooks/useApi"
import { 
  papersApi, projectsApi, patentsApi, resourcesApi,
  softwareCopyrightsApi, competitionsApi, conferencesApi, cooperationsApi
} from "@/lib/api"
import { FilterPanel, type FilterValue } from "@/components/ui/filter-panel"

// 动态计算搜索统计
const getSearchStats = (
  papers: any[], 
  projects: any[], 
  patents: any[], 
  resources: any[], 
  softwareCopyrights: any[], 
  competitions: any[], 
  conferences: any[], 
  cooperations: any[],
  searchHistory: string[],
  selectedFilters: string[],
  savedViews: any[]
) => {
  const totalResults = (papers?.length || 0) + (projects?.length || 0) + (patents?.length || 0) + 
                      (resources?.length || 0) + (softwareCopyrights?.length || 0) + 
                      (competitions?.length || 0) + (conferences?.length || 0) + (cooperations?.length || 0)
  
  return [
    { label: "搜索结果", value: totalResults, change: `+${Math.max(0, totalResults - 50)}`, trend: totalResults > 50 ? "up" : "stable" },
    { label: "搜索历史", value: searchHistory.length, change: `+${Math.max(0, searchHistory.length - 5)}`, trend: searchHistory.length > 5 ? "up" : "stable" },
    { label: "活跃筛选", value: selectedFilters.length, change: "0", trend: "stable" },
    { label: "保存视图", value: savedViews.length, change: "+1", trend: "up" },
  ]
}

// 热门搜索关键词
const popularSearches = [
  "人工智能",
  "机器学习",
  "深度学习",
  "区块链",
  "物联网",
  "数据挖掘",
  "计算机视觉",
  "自然语言处理",
]

// 删除硬编码的搜索结果数据

// 删除硬编码的保存视图和推荐数据

const getTypeIcon = (type: string) => {
  switch (type) {
    case "论文": return <FileText className="h-4 w-4" />
    case "专利": return <Award className="h-4 w-4" />
    case "软著": return <Code className="h-4 w-4" />
    case "项目": return <FolderKanban className="h-4 w-4" />
    case "比赛": return <Trophy className="h-4 w-4" />
    case "会议": return <Calendar className="h-4 w-4" />
    case "合作": return <Users className="h-4 w-4" />
    case "资源": return <Star className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "论文": return "bg-blue-100 text-blue-800"
    case "专利": return "bg-green-100 text-green-800"
    case "软著": return "bg-purple-100 text-purple-800"
    case "项目": return "bg-orange-100 text-orange-800"
    case "比赛": return "bg-yellow-100 text-yellow-800"
    case "会议": return "bg-pink-100 text-pink-800"
    case "合作": return "bg-indigo-100 text-indigo-800"
    case "资源": return "bg-gray-100 text-gray-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [saveViewOpen, setSaveViewOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  // 高级筛选状态
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [authorFilter, setAuthorFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // 保存视图表单
  const [viewForm, setViewForm] = useState({
    name: "",
    description: "",
  })
  
  // 搜索超时处理
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // 使用统一的分页 Hook，由后端处理搜索和分页
  const {
    data: papers,
    loading: papersLoading,
    search: searchPapers,
  } = usePaginatedApi(
    (params) => papersApi.getList(params),
    { size: 5 }
  )

  const {
    data: projects,
    loading: projectsLoading,
    search: searchProjects,
  } = usePaginatedApi(
    (params) => projectsApi.getList(params),
    { size: 5 }
  )

  const {
    data: patents,
    loading: patentsLoading,
    search: searchPatents,
  } = usePaginatedApi(
    (params) => patentsApi.getList(params),
    { size: 5 }
  )

  const {
    data: resources,
    loading: resourcesLoading,
    search: searchResources,
  } = usePaginatedApi(
    (params) => resourcesApi.getList(params),
    { size: 5 }
  )

  const {
    data: softwareCopyrights,
    loading: softwareLoading,
    search: searchSoftware,
  } = usePaginatedApi(
    (params) => softwareCopyrightsApi.getList(params),
    { size: 5 }
  )

  const {
    data: competitions,
    loading: competitionsLoading,
    search: searchCompetitions,
  } = usePaginatedApi(
    (params) => competitionsApi.getList(params),
    { size: 5 }
  )

  const {
    data: conferences,
    loading: conferencesLoading,
    search: searchConferences,
  } = usePaginatedApi(
    (params) => conferencesApi.getList(params),
    { size: 5 }
  )

  const {
    data: cooperations,
    loading: cooperationsLoading,
    search: searchCooperations,
  } = usePaginatedApi(
    (params) => cooperationsApi.getList(params),
    { size: 5 }
  )
  
  // 是否已执行过搜索
  const [hasSearched, setHasSearched] = useState(false)
  
  // 保存的视图和推荐数据
  const [savedViews, setSavedViews] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])

  // 实时搜索处理
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    // 清除之前的定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // 设置新的定时器，300ms后自动搜索
    if (value.trim()) {
      const timeout = setTimeout(() => {
        handleSearch(value)
      }, 300)
      setSearchTimeout(timeout)
    }
  }
  
  const handleSearch = (query?: string) => {
    const raw = query ?? searchQuery
    const searchTerm = raw.trim()

    // 清空搜索时，重置各模块的 search 参数
    const searchModules = activeTab === "all"
      ? ["papers", "projects", "patents", "resources", "software", "competitions", "conferences", "cooperations"]
      : [activeTab]

    if (!searchTerm) {
      if (searchModules.includes("papers")) searchPapers("")
      if (searchModules.includes("projects")) searchProjects("")
      if (searchModules.includes("patents")) searchPatents("")
      if (searchModules.includes("resources")) searchResources("")
      if (searchModules.includes("software")) searchSoftware("")
      if (searchModules.includes("competitions")) searchCompetitions("")
      if (searchModules.includes("conferences")) searchConferences("")
      if (searchModules.includes("cooperations")) searchCooperations("")
      setHasSearched(false)
      return
    }

    // 添加到搜索历史
    setSearchHistory(prev => {
      const newHistory = [searchTerm, ...prev.filter(item => item !== searchTerm)]
      return newHistory.slice(0, 10)
    })

    setHasSearched(true)

    // 调用各模块的规范 search 方法，由后端处理模糊查询
    if (searchModules.includes("papers")) searchPapers(searchTerm)
    if (searchModules.includes("projects")) searchProjects(searchTerm)
    if (searchModules.includes("patents")) searchPatents(searchTerm)
    if (searchModules.includes("resources")) searchResources(searchTerm)
    if (searchModules.includes("software")) searchSoftware(searchTerm)
    if (searchModules.includes("competitions")) searchCompetitions(searchTerm)
    if (searchModules.includes("conferences")) searchConferences(searchTerm)
    if (searchModules.includes("cooperations")) searchCooperations(searchTerm)
  }
  
  const clearFilters = () => {
    setSelectedFilters([])
    setDateRange({ start: "", end: "" })
    setAuthorFilter("")
    setStatusFilter("all")
    setCategoryFilter("all")
  }
  
  const saveCurrentView = async () => {
    if (!viewForm.name.trim()) return
    
    const totalResults = (papers?.length || 0) + (projects?.length || 0) + (patents?.length || 0) + 
                        (resources?.length || 0) + (softwareCopyrights?.length || 0) + 
                        (competitions?.length || 0) + (conferences?.length || 0) + (cooperations?.length || 0)
    
    const newView = {
      id: Date.now(),
      name: viewForm.name,
      description: viewForm.description,
      filters: `搜索词:${searchQuery}, 类型:${activeTab}, 状态:${statusFilter}`,
      count: totalResults,
      lastUsed: new Date().toLocaleDateString("zh-CN"),
      query: searchQuery,
      tab: activeTab,
      advancedFilters: {
        dateRange,
        authorFilter,
        statusFilter,
        categoryFilter,
      }
    }
    
    // 添加到保存的视图列表
    setSavedViews(prev => [newView, ...prev])
    
    // 重置表单并关闭对话框
    setViewForm({ name: "", description: "" })
    setSaveViewOpen(false)
  }
  
  // 应用保存的视图
  const applyView = (view: any) => {
    setSearchQuery(view.query || "")
    setActiveTab(view.tab || "all")
    setStatusFilter(view.advancedFilters?.statusFilter || "all")
    setAuthorFilter(view.advancedFilters?.authorFilter || "")
    setDateRange(view.advancedFilters?.dateRange || { start: "", end: "" })
    setCategoryFilter(view.advancedFilters?.categoryFilter || "all")
    
    // 更新最后使用时间
    setSavedViews(prev => prev.map(v => 
      v.id === view.id 
        ? { ...v, lastUsed: new Date().toLocaleDateString("zh-CN") }
        : v
    ))
    
    // 如果有搜索词，执行搜索
    if (view.query) {
      handleSearch(view.query)
    }
  }

  // 计算动态统计数据
  const searchStats = useMemo(() => {
    return getSearchStats(
      papers || [], 
      projects || [], 
      patents || [], 
      resources || [], 
      softwareCopyrights || [], 
      competitions || [], 
      conferences || [], 
      cooperations || [],
      searchHistory,
      selectedFilters,
      savedViews
    )
  }, [papers, projects, patents, resources, softwareCopyrights, competitions, conferences, cooperations, searchHistory, selectedFilters])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">智能检索</h1>
          <p className="text-sm text-muted-foreground">
            通过统一检索入口快速发现并管理科研信息。
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            高级筛选
            {showAdvancedFilters ? (
              <span className="ml-1">▲</span>
            ) : (
              <span className="ml-1">▼</span>
            )}
          </Button>
          <Button size="sm" onClick={() => setSaveViewOpen(true)}>
            <Bookmark className="mr-2 h-4 w-4" />
            保存视图
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {searchStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
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
        ))}
      </div>

      {/* 搜索框 */}
      <Card>
        <CardHeader>
          <CardTitle>全局检索</CardTitle>
          <CardDescription>在论文、项目、专利等模块中快速定位所需信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="输入关键词、作者、标题等..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-base"
                />
              </div>
              <Button onClick={() => handleSearch()}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {searchHistory.length > 0 ? "最近搜索:" : "热门搜索:"}
                </p>
                {searchHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchHistory([])}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    清除
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(searchHistory.length > 0 ? searchHistory : popularSearches).map((search: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => {
                      setSearchQuery(search)
                      handleSearch(search)
                    }}
                  >
                    {searchHistory.length > 0 ? (
                      <History className="mr-1 h-3 w-3" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* 高级筛选面板 */}
            {showAdvancedFilters && (
              <FilterPanel
                configs={[
                  {
                    key: "author",
                    label: "作者",
                    type: "input",
                    placeholder: "输入作者姓名"
                  },
                  {
                    key: "status",
                    label: "状态",
                    type: "select",
                    options: [
                      { value: "all", label: "全部状态" },
                      { value: "published", label: "已发表" },
                      { value: "in-progress", label: "进行中" },
                      { value: "completed", label: "已完成" },
                      { value: "pending", label: "待处理" }
                    ]
                  },
                  {
                    key: "dateRange",
                    label: "日期范围",
                    type: "dateRange"
                  }
                ]}
                values={{
                  author: authorFilter,
                  status: statusFilter,
                  dateRange: dateRange
                }}
                onChange={(newValues) => {
                  setAuthorFilter(newValues.author || "")
                  setStatusFilter(newValues.status || "all")
                  setDateRange(newValues.dateRange || { start: "", end: "" })
                }}
                onClear={clearFilters}
                variant="inline"
                className="border-t pt-4"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>搜索结果</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={activeTab === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("all")}
                  >
                    全部
                  </Button>
                  <Button 
                    variant={activeTab === "papers" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("papers")}
                  >
                    论文
                  </Button>
                  <Button 
                    variant={activeTab === "projects" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("projects")}
                  >
                    项目
                  </Button>
                  <Button 
                    variant={activeTab === "patents" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("patents")}
                  >
                    专利
                  </Button>
                  <Button 
                    variant={activeTab === "software" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("software")}
                  >
                    软著
                  </Button>
                  <Button 
                    variant={activeTab === "competitions" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("competitions")}
                  >
                    竞赛
                  </Button>
                  <Button 
                    variant={activeTab === "conferences" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("conferences")}
                  >
                    会议
                  </Button>
                  <Button 
                    variant={activeTab === "cooperations" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveTab("cooperations")}
                  >
                    合作
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 论文结果 */}
                {(activeTab === "all" || activeTab === "papers") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">论文 ({papers?.length || 0})</h4>
                    {papersLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      papers?.slice(0, 3).map((paper: any) => (
                        <div key={paper.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 mt-1 text-blue-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{paper.title}</h3>
                                <Badge className="bg-blue-100 text-blue-800">论文</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                作者: {paper.authors} | 期刊: {paper.journal}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 项目结果 */}
                {(activeTab === "all" || activeTab === "projects") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">项目 ({projects?.length || 0})</h4>
                    {projectsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      projects?.slice(0, 3).map((project: any) => (
                        <div key={project.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <FolderKanban className="h-4 w-4 mt-1 text-green-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{project.name}</h3>
                                <Badge className="bg-green-100 text-green-800">项目</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                负责人: {project.leader || project.principal_investigator} | 状态: {project.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 专利结果 */}
                {(activeTab === "all" || activeTab === "patents") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">专利 ({patents?.length || 0})</h4>
                    {patentsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      patents?.slice(0, 3).map((patent: any) => (
                        <div key={patent.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <Award className="h-4 w-4 mt-1 text-green-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{patent.name}</h3>
                                <Badge className="bg-green-100 text-green-800">专利</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                发明人: {patent.inventors || patent.applicant} | 状态: {patent.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 软著结果 */}
                {(activeTab === "all" || activeTab === "software") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">软著 ({softwareCopyrights?.length || 0})</h4>
                    {softwareLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      softwareCopyrights?.slice(0, 3).map((software: any) => (
                        <div key={software.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <Code className="h-4 w-4 mt-1 text-purple-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{software.name || software.title}</h3>
                                <Badge className="bg-purple-100 text-purple-800">软著</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                开发者: {software.developers || software.applicant} | 状态: {software.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 竞赛结果 */}
                {(activeTab === "all" || activeTab === "competitions") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">竞赛 ({competitions?.length || 0})</h4>
                    {competitionsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      competitions?.slice(0, 3).map((competition: any) => (
                        <div key={competition.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <Trophy className="h-4 w-4 mt-1 text-yellow-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{competition.name || competition.title}</h3>
                                <Badge className="bg-yellow-100 text-yellow-800">竞赛</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                类型: {competition.type || competition.category} | 状态: {competition.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 会议结果 */}
                {(activeTab === "all" || activeTab === "conferences") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">会议 ({conferences?.length || 0})</h4>
                    {conferencesLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      conferences?.slice(0, 3).map((conference: any) => (
                        <div key={conference.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-4 w-4 mt-1 text-pink-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{conference.name || conference.title}</h3>
                                <Badge className="bg-pink-100 text-pink-800">会议</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                地点: {conference.location} | 状态: {conference.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 合作结果 */}
                {(activeTab === "all" || activeTab === "cooperations") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">合作 ({cooperations?.length || 0})</h4>
                    {cooperationsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      cooperations?.slice(0, 3).map((cooperation: any) => (
                        <div key={cooperation.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <Users className="h-4 w-4 mt-1 text-indigo-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{cooperation.name || cooperation.title}</h3>
                                <Badge className="bg-indigo-100 text-indigo-800">合作</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                联系人: {cooperation.contact_person} | 状态: {cooperation.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 资源结果 */}
                {(activeTab === "all" || activeTab === "resources") && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">资源 ({resources?.length || 0})</h4>
                    {resourcesLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4">
                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      resources?.slice(0, 3).map((resource: any) => (
                        <div key={resource.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <Star className="h-4 w-4 mt-1 text-gray-600" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{resource.name}</h3>
                                <Badge className="bg-gray-100 text-gray-800">资源</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                类型: {resource.resource_type || resource.category} | 状态: {resource.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 无搜索结果提示 */}
                {hasSearched && !papersLoading && !projectsLoading && !patentsLoading && 
                 !resourcesLoading && !softwareLoading && !competitionsLoading && 
                 !conferencesLoading && !cooperationsLoading &&
                 (!papers?.length && !projects?.length && !patents?.length && 
                  !resources?.length && !softwareCopyrights?.length && !competitions?.length && 
                  !conferences?.length && !cooperations?.length) && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">未找到相关结果</p>
                    <p className="text-xs text-muted-foreground mt-1">请尝试其他关键词或调整筛选条件</p>
                  </div>
                )}

                {/* 未搜索提示 */}
                {!hasSearched && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">请输入关键词开始搜索</p>
                    <p className="text-xs text-muted-foreground mt-1">支持搜索论文、项目、专利、软著、竞赛、会议、合作、资源</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 保存的视图 */}
          <Card>
            <CardHeader>
              <CardTitle>保存的视图</CardTitle>
              <CardDescription>快速访问常用筛选条件</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedViews.length > 0 ? (
                  savedViews.map((view: any) => (
                    <div 
                      key={view.id} 
                      className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => applyView(view)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{view.name}</h4>
                          <Badge variant="outline">{view.count} 条</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{view.description}</p>
                        <div className="text-xs text-muted-foreground">
                          筛选条件: {view.filters}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          上次使用: {view.lastUsed}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">暂无保存的视图</p>
                    <p className="text-xs text-muted-foreground mt-1">搜索后点击"保存视图"来保存常用筛选条件</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 智能推荐 */}
          <Card>
            <CardHeader>
              <CardTitle>智能推荐</CardTitle>
              <CardDescription>基于您的搜索行为推荐</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.map((rec: any) => (
                    <div key={rec.id} className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(rec.type)}
                          <h4 className="text-sm font-medium">{rec.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                        <div className="flex items-center justify-between text-xs">
                          <Badge className={getTypeColor(rec.type)}>{rec.type}</Badge>
                          <span className="text-green-600">{rec.relevance}% 匹配</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">暂无推荐内容</p>
                    <p className="text-xs text-muted-foreground mt-1">进行几次搜索后，系统将为您推荐相关内容</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 保存视图对话框 */}
      <Dialog open={saveViewOpen} onOpenChange={setSaveViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>保存当前视图</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">视图名称 *</Label>
              <Input
                id="view-name"
                value={viewForm.name}
                onChange={(e) => setViewForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入视图名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="view-description">描述</Label>
              <Textarea
                id="view-description"
                value={viewForm.description}
                onChange={(e) => setViewForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入视图描述（可选）"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>当前筛选条件</Label>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <div>搜索词: {searchQuery || "无"}</div>
                <div>类型: {activeTab === "all" ? "全部" : activeTab}</div>
                <div>状态: {statusFilter === "all" ? "全部" : statusFilter}</div>
                {authorFilter && <div>作者: {authorFilter}</div>}
                {(dateRange.start || dateRange.end) && (
                  <div>日期: {dateRange.start || "不限"} ~ {dateRange.end || "不限"}</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveViewOpen(false)}>
              取消
            </Button>
            <Button onClick={saveCurrentView} disabled={!viewForm.name.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
