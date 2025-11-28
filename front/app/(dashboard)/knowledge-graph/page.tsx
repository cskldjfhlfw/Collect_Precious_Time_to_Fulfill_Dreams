"use client"

import { useMemo, useState } from "react"
import type { ComponentType } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Network,
  Users,
  FileText,
  Award,
  Code,
  FolderKanban,
  Plus,
  Filter,
  Search,
  TrendingUp,
  Target,
  Lightbulb,
  GitBranch,
  Loader2,
  X,
} from "lucide-react"
import { useApi } from "@/hooks/useApi"

type GraphNode = {
  id: string
  label: string
  type: string
  properties: Record<string, any>
}

type GraphEdge = {
  source: string
  target: string
  relationship: string
  weight: number
}

type GraphStats = {
  total_nodes: number
  total_edges: number
  node_types: Record<string, number>
}

type KnowledgeGraphResponse = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: GraphStats
}

type KeyRelationship = {
  source: string
  target: string
  relationship: string
  strength: number
  type: string
}

type Domain = {
  name: string
  entities: number
  connections: number
  growth: string
}

type RelationshipAnalysisResponse = {
  key_relationships: KeyRelationship[]
  domains: Domain[]
}

// 简单的 ForceGraph2D props 类型（只做约束，不影响运行时）
type ForceGraph2DProps = Record<string, any>

// 动态引入 2D 力导向图组件，避免加载 3D/VR 相关依赖
const ForceGraph2D = dynamic<ForceGraph2DProps>(
  () => import("react-force-graph-2d"),
  { ssr: false },
)

const typeDisplayConfig: Record<
  string,
  { label: string; color: string; icon: ComponentType<{ className?: string }> }
> = {
  paper: { label: "论文", color: "bg-blue-500", icon: FileText },
  patent: { label: "专利", color: "bg-green-500", icon: Award },
  project: { label: "项目", color: "bg-orange-500", icon: FolderKanban },
  author: { label: "作者", color: "bg-pink-500", icon: Users },
  organization: { label: "机构", color: "bg-indigo-500", icon: Network },
}

const getStrengthColor = (strength: number) => {
  if (strength >= 80) return "text-green-600"
  if (strength >= 60) return "text-yellow-600"
  return "text-gray-600"
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "人员-项目":
      return "bg-blue-100 text-blue-800"
    case "项目-论文":
      return "bg-green-100 text-green-800"
    case "人员-人员":
      return "bg-purple-100 text-purple-800"
    case "机构-项目":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function KnowledgeGraphPage() {
  const [selectedType, setSelectedType] = useState<string | "all">("all")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview")
  const [showSidebar, setShowSidebar] = useState(true)
  const [showAddEntityDialog, setShowAddEntityDialog] = useState(false)
  const [newEntity, setNewEntity] = useState({
    label: "",
    type: "",
    properties: {} as Record<string, string>
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [analysisTab, setAnalysisTab] = useState<"relations" | "domains" | "suggestions">("relations")

  const {
    data: graphData,
    loading: loadingGraph,
    error: graphError,
    refetch,
  } = useApi<KnowledgeGraphResponse>(async () => {
    const res = await fetch("http://localhost:8000/api/knowledge-graph/graph?limit=200")
    if (!res.ok) throw new Error("无法加载知识图谱数据")
    return res.json()
  })

  const {
    data: relationsData,
    loading: loadingRelations,
  } = useApi<RelationshipAnalysisResponse>(async () => {
    const res = await fetch("http://localhost:8000/api/knowledge-graph/relationships")
    if (!res.ok) throw new Error("无法加载关系分析数据")
    return res.json()
  })

  const statsCards = useMemo(() => {
    if (!graphData) return []
    return [
      {
        label: "实体节点",
        value: graphData.stats.total_nodes,
      },
      {
        label: "关系连接",
        value: graphData.stats.total_edges,
      },
      {
        label: "知识类型",
        value: Object.keys(graphData.stats.node_types || {}).length,
      },
      {
        label: "科研相关实体",
        value:
          (graphData.stats.node_types["paper"] || 0) +
          (graphData.stats.node_types["patent"] || 0) +
          (graphData.stats.node_types["project"] || 0),
      },
    ]
  }, [graphData])

  const entityTypeList = useMemo(() => {
    if (!graphData) return []
    return Object.entries(graphData.stats.node_types || {}).map(([type, count]) => {
      const config = typeDisplayConfig[type] || {
        label: type,
        color: "bg-gray-500",
        icon: Network,
      }
      return {
        type,
        count,
        ...config,
      }
    })
  }, [graphData])

  const filteredNodes = useMemo(() => {
    if (!graphData) return []
    let nodes = graphData.nodes.filter((node) => selectedType === "all" || node.type === selectedType)
    
    // 添加搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      nodes = nodes.filter((node) => 
        node.label.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query) ||
        Object.values(node.properties || {}).some(value => 
          String(value).toLowerCase().includes(query)
        )
      )
    }
    
    return nodes
  }, [graphData, selectedType, searchQuery])

  const selectedNode = useMemo(
    () => graphData?.nodes.find((n) => n.id === selectedNodeId) || null,
    [graphData, selectedNodeId],
  )

  const relatedEdges = useMemo(() => {
    if (!graphData || !selectedNodeId) return []
    return graphData.edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
  }, [graphData, selectedNodeId])

  const relatedNodes = useMemo(() => {
    if (!graphData || !selectedNodeId) return []
    const idSet = new Set<string>()
    relatedEdges.forEach((e) => {
      idSet.add(e.source)
      idSet.add(e.target)
    })
    idSet.delete(selectedNodeId)
    return graphData.nodes.filter((n) => idSet.has(n.id))
  }, [graphData, relatedEdges, selectedNodeId])

  // 处理添加实体
  const handleAddEntity = async () => {
    if (!newEntity.label || !newEntity.type) {
      setSubmitError("请填写实体名称和类型")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const response = await fetch("http://localhost:8000/api/knowledge-graph/entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: newEntity.label,
          type: newEntity.type,
          properties: newEntity.properties,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "添加实体失败" }))
        throw new Error(errorData.detail || "添加实体失败")
      }

      // 显示成功提示
      setSubmitSuccess(true)

      // 重新加载图谱数据
      await refetch()
      
      // 延迟关闭对话框，让用户看到成功提示
      setTimeout(() => {
        setNewEntity({ label: "", type: "", properties: {} })
        setShowAddEntityDialog(false)
        setSubmitSuccess(false)
      }, 1500)
    } catch (error) {
      console.error("添加实体失败:", error)
      setSubmitError(error instanceof Error ? error.message : "添加实体失败，请稍后重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 添加属性字段
  const addProperty = () => {
    const key = `property_${Object.keys(newEntity.properties).length + 1}`
    setNewEntity(prev => ({
      ...prev,
      properties: { ...prev.properties, [key]: "" }
    }))
  }

  // 删除属性字段
  const removeProperty = (key: string) => {
    setNewEntity(prev => {
      const { [key]: removed, ...rest } = prev.properties
      return { ...prev, properties: rest }
    })
  }

  // 更新属性值
  const updateProperty = (key: string, value: string) => {
    setNewEntity(prev => ({
      ...prev,
      properties: { ...prev.properties, [key]: value }
    }))
  }

  const maxNodesForVisualization = 200
  const forceGraphData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] } as {
      nodes: (GraphNode & { id: string })[]
      links: GraphEdge[]
    }

    // 限制节点数量，避免图谱过于拥挤
    const baseNodes = graphData.nodes.slice(0, maxNodesForVisualization)
    const idSet = new Set(baseNodes.map((n) => n.id))
    const baseEdges = graphData.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target))

    return {
      nodes: baseNodes,
      links: baseEdges,
    }
  }, [graphData])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">知识图谱</h1>
          <p className="text-sm text-muted-foreground">
            基于 Neo4j 的科研知识图谱，可视化展示论文、项目、专利、作者等实体间的真实关联关系。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={viewMode === "overview" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("overview")}
          >
            概览模式
          </Button>
          <Button 
            variant={viewMode === "detailed" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("detailed")}
          >
            详细模式
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? "隐藏" : "显示"}侧栏
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loadingGraph}>
            {loadingGraph ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
            重新加载
          </Button>
          <Button size="sm" onClick={() => setShowAddEntityDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加实体
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.length === 0 && loadingGraph && (
          <Card className="col-span-4">
            <CardContent className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在从 Neo4j 加载知识图谱数据...
            </CardContent>
          </Card>
        )}
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">来自 Neo4j 实时统计</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索和筛选工具栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索节点、实体或属性..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>显示 {filteredNodes.length} / {graphData?.nodes.length ?? 0} 个节点</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 知识图谱主视图 */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* 侧边栏：实体类型和节点列表 */}
        {showSidebar && (
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">实体类型</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedType("all")}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${
                      selectedType === "all" ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="rounded-full p-2 bg-gray-500">
                      <Network className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">全部类型</p>
                      <p className="text-xs text-muted-foreground">{graphData?.nodes.length || 0} 个节点</p>
                    </div>
                  </button>
                  {entityTypeList.map((entity) => {
                    const IconComponent = entity.icon
                    const active = selectedType === entity.type
                    return (
                      <button
                        key={entity.type}
                        type="button"
                        onClick={() => setSelectedType((prev) => (prev === entity.type ? "all" : entity.type))}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${
                          active ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className={`rounded-full p-2 ${entity.color}`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entity.label}</p>
                          <p className="text-xs text-muted-foreground">{entity.count} 个节点</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">节点列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 space-y-2 overflow-auto pr-1 text-xs custom-scrollbar">
                  {filteredNodes.map((node) => {
                    const config = typeDisplayConfig[node.type]
                    const IconComponent = config?.icon || Network
                    const isActive = node.id === selectedNodeId
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-background ${
                          isActive ? "bg-background shadow-sm" : ""
                        }`}
                      >
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-muted`}>
                          <IconComponent className="h-3 w-3" />
                        </span>
                        <span className="flex-1 truncate text-[11px] font-medium">{node.label}</span>
                        <Badge variant="outline" className="ml-1 text-[10px]">
                          {config?.label || node.type}
                        </Badge>
                      </button>
                    )
                  })}
                  {filteredNodes.length === 0 && (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {loadingGraph ? "正在加载节点..." : "当前筛选条件下没有节点"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 主图谱可视化区域 */}
        <div className={`space-y-4 ${showSidebar ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>知识图谱可视化</CardTitle>
                  <CardDescription>
                    {viewMode === "overview" ? "概览模式：展示整体图谱结构" : "详细模式：深入探索节点关系"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {graphError && (
                <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  知识图谱数据加载失败：{String(graphError)}
                </div>
              )}

              {/* Force-directed 图谱可视化 */}
              <div className="mb-6 rounded-lg border bg-muted/40 p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Network className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">图谱可视化</span>
                  </div>
                  <span className="text-muted-foreground">
                    {viewMode === "overview" ? `展示前 ${maxNodesForVisualization} 个节点` : "详细探索模式"}
                  </span>
                </div>
                <div className={`relative w-full overflow-hidden rounded-md bg-background ${
                  viewMode === "overview" ? "h-[550px]" : "h-[750px]"
                }`}>
              {loadingGraph && !graphData ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> 正在加载图谱...
                </div>
              ) : forceGraphData.nodes.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  暂无可视化数据，请检查 Neo4j 中是否存在节点。
                </div>
              ) : (
                <ForceGraph2D
                  width={showSidebar ? 900 : 1200}
                  height={viewMode === "overview" ? 550 : 750}
                  graphData={forceGraphData as any}
                  nodeId="id"
                  nodeLabel={(node: any) => node.label}
                  linkDirectionalArrowLength={4}
                  linkDirectionalArrowRelPos={1}
                  linkCurvature={0.15}
                  linkWidth={(link: any) => {
                    if (!selectedNodeId) return 1.5
                    return link.source?.id === selectedNodeId || link.target?.id === selectedNodeId ? 3 : 1
                  }}
                  linkColor={(link: any) => {
                    if (!selectedNodeId) return "#9ca3af"
                    return link.source?.id === selectedNodeId || link.target?.id === selectedNodeId
                      ? "#3b82f6"
                      : "#d1d5db"
                  }}
                  nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const graphNode = node as GraphNode & { x?: number; y?: number }
                    const config = typeDisplayConfig[graphNode.type]
                    const isSelected = selectedNodeId === graphNode.id
                    const isNeighbor =
                      selectedNodeId &&
                      forceGraphData.links.some(
                        (e) =>
                          (e.source as any)?.id === selectedNodeId && (e.target as any)?.id === graphNode.id ||
                          (e.target as any)?.id === selectedNodeId && (e.source as any)?.id === graphNode.id,
                      )

                    const baseColor = config?.color || "bg-gray-500"
                    const fillColor = isSelected
                      ? "#3b82f6"
                      : isNeighbor
                        ? "#93c5fd"
                        : baseColor.includes("blue")
                          ? "#60a5fa"
                          : baseColor.includes("green")
                            ? "#34d399"
                            : baseColor.includes("orange")
                              ? "#fb923c"
                              : baseColor.includes("pink")
                                ? "#f472b6"
                                : baseColor.includes("indigo")
                                  ? "#818cf8"
                                  : "#9ca3af"

                    const radius = isSelected ? 8 : isNeighbor ? 6 : 5
                    const label = graphNode.label || graphNode.id

                    ctx.beginPath()
                    ctx.arc(graphNode.x || 0, graphNode.y || 0, radius, 0, 2 * Math.PI, false)
                    ctx.fillStyle = fillColor
                    ctx.fill()
                    ctx.strokeStyle = isSelected ? "#1d4ed8" : "white"
                    ctx.lineWidth = isSelected ? 2 : 1.5
                    ctx.stroke()

                    // 显示标签
                    if (isSelected || isNeighbor) {
                      const fontSize = isSelected ? 14 / globalScale : 12 / globalScale
                      ctx.font = `${isSelected ? 'bold' : 'normal'} ${fontSize}px sans-serif`
                      ctx.fillStyle = isSelected ? "#1e293b" : "#64748b"
                      ctx.textAlign = "center"
                      ctx.textBaseline = "top"
                      
                      // 添加文字背景
                      const text = label.length > 20 ? `${label.slice(0, 20)}...` : label
                      const textWidth = ctx.measureText(text).width
                      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
                      ctx.fillRect(
                        (graphNode.x || 0) - textWidth / 2 - 4,
                        (graphNode.y || 0) + radius + 4,
                        textWidth + 8,
                        fontSize + 4
                      )
                      
                      ctx.fillStyle = isSelected ? "#1e293b" : "#64748b"
                      ctx.fillText(
                        text,
                        (graphNode.x || 0),
                        (graphNode.y || 0) + radius + 6,
                      )
                    }
                  }}
                  nodeRelSize={5}
                  cooldownTicks={100}
                  d3VelocityDecay={0.3}
                  // 力导向引擎停止后保持当前布局
                  onEngineStop={() => {
                    /* 可以在这里做一些布局冻结逻辑，如有需要再扩展 */
                  }}
                  onNodeClick={(node: any) => {
                    setSelectedNodeId(node.id as string)
                  }}
                  enableNodeDrag
                />
              )}
                </div>
              </div>

              {/* 选中节点详情面板 */}
              {selectedNode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">节点详情</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Network className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold leading-tight">{selectedNode.label}</h3>
                            <p className="text-xs text-muted-foreground">
                              节点类型：{typeDisplayConfig[selectedNode.type]?.label || selectedNode.type}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          ID: {selectedNode.id}
                        </Badge>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        {Object.entries(selectedNode.properties || {}).map(([key, value]) => (
                          <div key={key} className="rounded-md bg-muted/60 px-2 py-1.5 text-[11px]">
                            <span className="text-muted-foreground">{key}：</span>
                            <span className="break-all font-medium">
                              {typeof value === 'object' && value !== null 
                                ? JSON.stringify(value) 
                                : String(value)
                              }
                            </span>
                          </div>
                        ))}
                        {Object.keys(selectedNode.properties || {}).length === 0 && (
                          <p className="text-xs text-muted-foreground">该节点暂无额外属性。</p>
                        )}
                      </div>

                      <div className="border-t pt-3">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium text-muted-foreground">关联关系</span>
                          <span className="text-muted-foreground">共 {relatedEdges.length} 条</span>
                        </div>
                        <div className="h-32 space-y-2 overflow-auto pr-1 text-xs">
                          {relatedEdges.length > 0 ? (
                            relatedEdges.map((edge, idx) => {
                              const otherId = edge.source === selectedNode.id ? edge.target : edge.source
                              const otherNode = graphData?.nodes.find((n) => n.id === otherId)
                              return (
                                <div
                                  key={`${edge.source}-${edge.target}-${idx}`}
                                  className="flex items-center justify-between rounded-md border bg-muted/40 px-2 py-1.5"
                                >
                                  <div className="flex flex-1 items-center gap-2">
                                    <span className="truncate font-medium">{edge.relationship}</span>
                                    <GitBranch className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate text-[11px] text-muted-foreground">
                                      {otherNode?.label || otherId}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">权重 {edge.weight.toFixed(1)}</span>
                                </div>
                              )
                            })
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              该节点当前没有关联关系
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 分析面板：重点关系、知识域分析、拓展建议 */}
      <div>
        <Card>
          <Tabs value={analysisTab} onValueChange={(v) => setAnalysisTab(v as any)}>
          <CardHeader className="pb-4">
            <CardTitle>分析面板</CardTitle>
            <TabsList className="grid w-full max-w-md grid-cols-3 mt-4">
              <TabsTrigger value="relations" className="text-xs">重点关系</TabsTrigger>
              <TabsTrigger value="domains" className="text-xs">知识域分析</TabsTrigger>
              <TabsTrigger value="suggestions" className="text-xs">拓展建议</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            {/* 重点关系标签页 */}
            <TabsContent value="relations" className="mt-0">
            {loadingRelations && (
              <div className="mb-4 flex items-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" /> 正在加载关系分析数据...
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relationsData?.key_relationships.map((rel, index) => (
                <div key={`${rel.source}-${rel.target}-${index}`} className="rounded-lg border p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getTypeColor(rel.type)}>{rel.type}</Badge>
                      <span className={`text-sm font-medium ${getStrengthColor(rel.strength)}`}>
                        {rel.strength}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium truncate">{rel.source}</span>
                        <GitBranch className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{rel.target}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rel.relationship}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>关系强度</span>
                        <span>{rel.strength}%</span>
                      </div>
                      <Progress value={rel.strength} className="h-1" />
                    </div>
                  </div>
                </div>
              ))}
              {!loadingRelations && !relationsData && (
                <p className="text-xs text-muted-foreground">暂无关系分析数据。</p>
              )}
            </div>
            </TabsContent>

            {/* 知识域分析标签页 */}
            <TabsContent value="domains" className="mt-0">
              {loadingRelations && (
                <div className="mb-4 flex items-center text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> 正在加载知识域数据...
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {relationsData?.domains.map((domain) => (
                  <div key={domain.name} className="rounded-lg border p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{domain.name}</h4>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-medium">{domain.growth}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">实体数: </span>
                          <span className="font-medium">{domain.entities}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">连接数: </span>
                          <span className="font-medium">{domain.connections}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!loadingRelations && !relationsData && (
                  <p className="text-xs text-muted-foreground">暂无知识域统计数据。</p>
                )}
              </div>
            </TabsContent>

            {/* 拓展建议标签页 */}
            <TabsContent value="suggestions" className="mt-0">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-foreground">潜在合作者挖掘</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    可基于图谱中的共同项目、共同领域和共同作者关系，自动推荐潜在的合作对象。
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-foreground">研究热点发现</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    结合时间维度，识别正在快速发展的研究热点方向。
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-foreground">资源配置优化</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    根据图谱结构中节点的重要性与中心性指标，辅助决策科研资源配置。
                  </p>
                </div>
              </div>
            </TabsContent>
          </CardContent>
          </Tabs>
          </Card>
      </div>

      {/* 添加实体对话框 */}
      <Dialog open={showAddEntityDialog} onOpenChange={(open) => {
        if (!isSubmitting) {
          setShowAddEntityDialog(open)
          if (!open) {
            setNewEntity({ label: "", type: "", properties: {} })
            setSubmitError(null)
            setSubmitSuccess(false)
          }
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              添加新实体
            </DialogTitle>
            <DialogDescription>
              向 Neo4j 知识图谱中添加一个新的实体节点，支持自定义属性。
            </DialogDescription>
          </DialogHeader>
          
          {/* 错误和成功提示 */}
          {submitError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="rounded-md border border-green-500/50 bg-green-50 px-3 py-2 text-sm text-green-700">
              ✓ 实体添加成功！正在刷新图谱数据...
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entity-label" className="flex items-center gap-2">
                实体名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="entity-label"
                placeholder="例如：深度学习研究、张三等"
                value={newEntity.label}
                onChange={(e) => {
                  setNewEntity(prev => ({ ...prev, label: e.target.value }))
                  if (submitError) setSubmitError(null)
                }}
                disabled={isSubmitting || submitSuccess}
                className={submitError && !newEntity.label ? "border-red-500" : ""}
              />
              {submitError && !newEntity.label && (
                <p className="text-xs text-red-500">请输入实体名称</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-type" className="flex items-center gap-2">
                实体类型 <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={newEntity.type} 
                onValueChange={(value) => {
                  setNewEntity(prev => ({ ...prev, type: value }))
                  if (submitError) setSubmitError(null)
                }}
                disabled={isSubmitting || submitSuccess}
              >
                <SelectTrigger className={submitError && !newEntity.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="选择实体类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      论文
                    </div>
                  </SelectItem>
                  <SelectItem value="patent">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      专利
                    </div>
                  </SelectItem>
                  <SelectItem value="project">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      项目
                    </div>
                  </SelectItem>
                  <SelectItem value="author">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      作者
                    </div>
                  </SelectItem>
                  <SelectItem value="organization">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      机构
                    </div>
                  </SelectItem>
                  <SelectItem value="technology">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      技术
                    </div>
                  </SelectItem>
                  <SelectItem value="keyword">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      关键词
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {submitError && !newEntity.type && (
                <p className="text-xs text-red-500">请选择实体类型</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  自定义属性 <span className="text-xs">(可选)</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProperty}
                  disabled={isSubmitting || submitSuccess}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  添加属性
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {Object.entries(newEntity.properties).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-start bg-muted/30 p-2 rounded-md">
                    <Input
                      placeholder="例如：year"
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value
                        setNewEntity(prev => {
                          const { [key]: oldValue, ...rest } = prev.properties
                          return {
                            ...prev,
                            properties: { ...rest, [newKey]: value }
                          }
                        })
                      }}
                      className="flex-1 h-8 text-sm"
                      disabled={isSubmitting || submitSuccess}
                    />
                    <Input
                      placeholder="例如：2024"
                      value={value}
                      onChange={(e) => updateProperty(key, e.target.value)}
                      className="flex-1 h-8 text-sm"
                      disabled={isSubmitting || submitSuccess}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProperty(key)}
                      disabled={isSubmitting || submitSuccess}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {Object.keys(newEntity.properties).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed rounded-md">
                    <p className="text-sm text-muted-foreground">
                      暂无自定义属性
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      点击上方按钮添加属性，例如：year: 2024
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddEntityDialog(false)
                setNewEntity({ label: "", type: "", properties: {} })
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              onClick={handleAddEntity}
              disabled={!newEntity.label || !newEntity.type || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                "添加实体"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
