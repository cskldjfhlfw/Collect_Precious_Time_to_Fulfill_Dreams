"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  BarChart2,
  FileText,
  Award,
  Code,
  FolderKanban,
  Trophy,
  Calendar,
  Handshake,
  Database,
  Search,
  Network,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft,
  TrendingUp,
  Eye,
  Plus,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useApi } from "@/hooks/useApi"

const navigation = [
  { 
    name: "首页", 
    href: "/", 
    icon: Home, 
    color: "text-blue-600", 
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    category: "overview"
  },
  { 
    name: "统计分析", 
    href: "/analytics", 
    icon: BarChart2, 
    color: "text-green-600", 
    bgColor: "bg-green-100 dark:bg-green-900/20",
    category: "analytics"
  },
  { 
    name: "论文", 
    href: "/papers", 
    icon: FileText, 
    color: "text-blue-600", 
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    dataKey: "total_papers",
    category: "research"
  },
  { 
    name: "专利", 
    href: "/patents", 
    icon: Award, 
    color: "text-yellow-600", 
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    dataKey: "total_patents",
    category: "research"
  },
  { 
    name: "软件著作权", 
    href: "/software-copyrights", 
    icon: Code, 
    color: "text-purple-600", 
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    dataKey: "total_software_copyrights",
    category: "research"
  },
  { 
    name: "项目", 
    href: "/projects", 
    icon: FolderKanban, 
    color: "text-orange-600", 
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    dataKey: "total_projects",
    category: "management"
  },
  { 
    name: "比赛", 
    href: "/competitions", 
    icon: Trophy, 
    color: "text-red-600", 
    bgColor: "bg-red-100 dark:bg-red-900/20",
    dataKey: "total_competitions",
    category: "activities"
  },
  { 
    name: "会议", 
    href: "/conferences", 
    icon: Calendar, 
    color: "text-indigo-600", 
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    dataKey: "total_conferences",
    category: "activities"
  },
  { 
    name: "合作", 
    href: "/cooperations", 
    icon: Handshake, 
    color: "text-teal-600", 
    bgColor: "bg-teal-100 dark:bg-teal-900/20",
    dataKey: "total_cooperations",
    category: "partnerships"
  },
  { 
    name: "资源管理", 
    href: "/resources", 
    icon: Database, 
    color: "text-gray-600", 
    bgColor: "bg-gray-100 dark:bg-gray-900/20",
    dataKey: "total_resources",
    category: "management"
  },
  { 
    name: "搜索", 
    href: "/search", 
    icon: Search, 
    color: "text-cyan-600", 
    bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    category: "tools"
  },
  { 
    name: "知识图谱", 
    href: "/knowledge-graph", 
    icon: Network, 
    color: "text-pink-600", 
    bgColor: "bg-pink-100 dark:bg-pink-900/20",
    category: "tools"
  },
]

const bottomNavigation = [
  { 
    name: "设置", 
    href: "/settings", 
    icon: Settings, 
    color: "text-gray-600", 
    bgColor: "bg-gray-100 dark:bg-gray-900/20"
  },
  { 
    name: "帮助", 
    href: "/help", 
    icon: HelpCircle, 
    color: "text-blue-600", 
    bgColor: "bg-blue-100 dark:bg-blue-900/20"
  },
]

const categoryLabels = {
  overview: "概览",
  analytics: "分析",
  research: "科研成果",
  management: "管理",
  activities: "学术活动",
  partnerships: "合作交流",
  tools: "工具"
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // 获取统计数据
  const { data: analyticsData, loading } = useApi(async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch('http://localhost:8000/api/analytics/overview', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      console.error('Sidebar: 获取统计数据失败', response.status)
      throw new Error(`获取数据失败: ${response.status}`)
    }
    return response.json()
  })

  const handleQuickView = (item: any, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (item.dataKey && analyticsData?.summary) {
      // 跳转到对应的详情页面
      router.push(item.href)
    }
  }

  const NavItem = ({ item, isBottom = false }: { item: any, isBottom?: boolean }) => {
    const count = item.dataKey && analyticsData?.summary ? analyticsData.summary[item.dataKey] : null
    const isActive = pathname === item.href

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="relative group">
            <Link
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? `${item.bgColor} ${item.color} shadow-sm border border-border/50`
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                isCollapsed && "justify-center px-2",
                "hover:scale-[1.02] hover:shadow-sm"
              )}
            >
              {/* 背景动画效果 */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              )}
              
              <div className={cn("flex items-center", !isCollapsed && "mr-3")}>
                <div className={cn(
                  "flex items-center justify-center rounded-md p-1.5",
                  isActive ? "bg-white/20" : "group-hover:bg-muted/30"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive && item.color)} />
                </div>
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="truncate">{item.name}</span>
                  {count !== null && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5",
                          isActive && "bg-white/20 text-current border-current/20"
                        )}
                      >
                        {count}
                      </Badge>
                      <Button
                        variant="ghost" 
                        size="sm"
                        className={cn(
                          "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200",
                          isActive && "text-current hover:bg-white/20"
                        )}
                        onClick={(e) => handleQuickView(item, e)}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* 活跃状态指示器 */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-current rounded-r-full" />
              )}
            </Link>
          </div>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{item.name}</span>
            {count !== null && (
              <Badge variant="outline" className="text-xs">
                {count}
              </Badge>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    )
  }

  // 按类别分组导航项
  const groupedNavigation = Object.entries(
    navigation.reduce((groups: Record<string, typeof navigation>, item) => {
      const category = item.category || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
      return groups
    }, {})
  )

  return (
    <TooltipProvider>
      <>
        <button
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-lg shadow-lg border"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-20 flex flex-col bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out border-r shadow-lg",
            isCollapsed ? "w-[80px]" : "w-80",
            isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* 头部 */}
          <div className="border-b border-border/50 bg-muted/30">
            <div className={cn("flex h-16 items-center gap-3 px-4", isCollapsed && "justify-center px-2")}>
              {!isCollapsed && (
                <Link href="/" className="flex items-center gap-3 font-semibold group">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg text-primary-foreground">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <span className="text-lg group-hover:text-primary transition-colors">
                    科研成果管理
                  </span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "ml-auto h-8 w-8 rounded-lg hover:bg-muted", 
                  isCollapsed && "ml-0"
                )}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronLeft className={cn(
                  "h-4 w-4 transition-transform duration-300", 
                  isCollapsed && "rotate-180"
                )} />
                <span className="sr-only">
                  {isCollapsed ? "展开" : "收起"} 侧边栏
                </span>
              </Button>
            </div>
          </div>

          {/* 导航区域 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="p-3">
              {!isCollapsed && (
                <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">数据概览</span>
                    </div>
                  </div>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                      <span>加载中...</span>
                    </div>
                  ) : analyticsData?.summary ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Object.values(analyticsData.summary).reduce((sum: number, val: any) => 
                            sum + (typeof val === 'number' ? val : 0), 0)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">项成果</span>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      暂无数据
                    </div>
                  )}
                </div>
              )}

              {/* 分组导航 */}
              <nav className="space-y-6">
                {groupedNavigation.map(([category, items]) => (
                  <div key={category}>
                    {!isCollapsed && (
                      <div className="flex items-center gap-2 mb-3 px-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {categoryLabels[category as keyof typeof categoryLabels] || category}
                        </span>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>
                    )}
                    <div className="space-y-1">
                      {items.map((item) => (
                        <NavItem key={item.name} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* 底部导航 */}
          <div className="border-t border-border/50 bg-muted/30 p-3">
            <nav className="space-y-1">
              {bottomNavigation.map((item) => (
                <NavItem key={item.name} item={item} isBottom />
              ))}
            </nav>
          </div>
        </div>

        {/* 移动端遮罩 */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </>
    </TooltipProvider>
  )
}
