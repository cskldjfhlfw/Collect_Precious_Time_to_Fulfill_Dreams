"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useApi } from "@/hooks/useApi"
import { dashboardApi } from "@/lib/api"

interface AchievementStatsProps {
  timeRange?: string
  selectedTypes?: string[]
}

const categoryColors = {
  "papers": "bg-blue-500",
  "patents": "bg-green-500",
  "projects": "bg-orange-500",
  "software": "bg-purple-500",
  "competitions": "bg-yellow-500",
  "conferences": "bg-pink-500",
  "cooperations": "bg-teal-500",
}

const categoryNames = {
  "papers": "论文",
  "patents": "专利", 
  "projects": "项目",
  "software": "软著",
  "competitions": "竞赛",
  "conferences": "会议",
  "cooperations": "合作",
}

export function AchievementStats({ timeRange, selectedTypes = [] }: AchievementStatsProps = {}) {
  const { data: overview, loading, error } = useApi(() => dashboardApi.getOverview())

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成果统计</CardTitle>
          <CardDescription>各类成果完成情况</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成果统计</CardTitle>
          <CardDescription>各类成果完成情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">加载统计数据失败</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!overview?.achievement_stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成果统计</CardTitle>
          <CardDescription>各类成果完成情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">暂无统计数据</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = overview.achievement_stats
  const categoryStats = Object.entries(stats).map(([key, data]) => ({
    name: categoryNames[key as keyof typeof categoryNames] || key,
    current: data.current,
    target: data.target,
    completion: data.completion,
    label: (data as any).label || "完成情况",
    color: categoryColors[key as keyof typeof categoryColors] || "bg-gray-500"
  }))

  // 计算总体完成率
  const totalCompletion = categoryStats.length > 0 
    ? Math.round(categoryStats.reduce((sum, stat) => sum + stat.completion, 0) / categoryStats.length)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>成果统计</CardTitle>
        <CardDescription>各类成果完成情况</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryStats.map((stat) => (
          <div key={stat.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stat.name}</span>
              <span className="text-muted-foreground">
                {stat.current} / {stat.target}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{stat.label}</span>
              <span>{stat.completion}%</span>
            </div>
            <Progress value={stat.completion} className="h-2" indicatorClassName={stat.color} />
          </div>
        ))}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">总体完成率</span>
            <span className="text-2xl font-bold">{totalCompletion}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
