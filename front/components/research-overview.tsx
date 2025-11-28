"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Award, Code, FolderKanban, Trophy, Calendar, Handshake, Database, Loader2 } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { dashboardApi } from "@/lib/api"

const iconMap = {
  "论文": { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
  "专利": { icon: Award, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
  "软著": { icon: Code, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
  "项目": { icon: FolderKanban, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
  "比赛": { icon: Trophy, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/20" },
  "会议": { icon: Calendar, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/20" },
  "合作": { icon: Handshake, color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/20" },
  "资源": { icon: Database, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/20" },
}

export function ResearchOverview() {
  const { data: overview, loading, error } = useApi(() => dashboardApi.getOverview())

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">加载数据失败</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!overview?.research_overview) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overview.research_overview.map((stat) => {
        const iconConfig = iconMap[stat.label as keyof typeof iconMap] || iconMap["资源"]
        const IconComponent = iconConfig.icon

        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`p-2 rounded-md ${iconConfig.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${iconConfig.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={
                  stat.trend === "up" ? "text-green-600" : 
                  stat.trend === "down" ? "text-red-600" : 
                  "text-gray-600"
                }>
                  {stat.change}
                </span>{" "}
                较上月
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
