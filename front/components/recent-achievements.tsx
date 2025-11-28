"use client"

import { useState } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Award, Code, FolderKanban, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { dashboardApi } from "@/lib/api"

interface RecentAchievementsProps {
  timeRange?: string
  selectedTypes?: string[]
}

const typeIconMap: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
  "paper": { icon: FileText, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  "project": { icon: FolderKanban, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  "patent": { icon: Award, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "software": { icon: Code, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  "competition": { icon: Trophy, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "conference": { icon: Calendar, color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400" },
  "cooperation": { icon: Users, color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
}

const formatType = (type: string) => {
  switch (type.toLowerCase()) {
    case "paper": return "论文"
    case "project": return "项目"
    case "patent": return "专利"
    case "software": return "软著"
    case "competition": return "竞赛"
    case "conference": return "会议"
    case "cooperation": return "合作"
    default: return type
  }
}

const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "published": return "已发表"
    case "under_review": return "审稿中"
    case "draft": return "撰写中"
    case "completed": return "已完成"
    case "in_progress": return "进行中"
    case "authorized": return "已授权"
    case "registered": return "已登记"
    case "reviewing": return "审查中"
    case "accepted": return "已接收"
    case "rejected": return "被拒绝"
    case "planned": return "计划中"
    case "negotiating": return "洽谈中"
    case "active": return "活跃"
    default: return status
  }
}

export function RecentAchievements({ timeRange, selectedTypes = [] }: RecentAchievementsProps = {}) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  
  const { data: achievementsResponse, loading, error, refetch } = useApi(() => 
    dashboardApi.getRecentAchievements({ page: currentPage, size: pageSize }),
    [currentPage] // 依赖页码变化
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近成果</CardTitle>
          <CardDescription>最新发布的科研成果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近成果</CardTitle>
          <CardDescription>最新发布的科研成果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">加载数据失败</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!achievementsResponse || !achievementsResponse.items || achievementsResponse.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近成果</CardTitle>
          <CardDescription>最新发布的科研成果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">暂无最新成果</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const achievements = achievementsResponse.items
  const pagination = {
    currentPage: achievementsResponse.page,
    totalPages: achievementsResponse.total_pages,
    hasNext: achievementsResponse.has_next,
    hasPrev: achievementsResponse.has_prev,
    total: achievementsResponse.total
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近成果</CardTitle>
        <CardDescription>最新发布的科研成果</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.map((achievement) => {
            const typeConfig = typeIconMap[achievement.type as keyof typeof typeIconMap] || typeIconMap.paper
            const IconComponent = typeConfig.icon

            return (
              <div
                key={achievement.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className={`p-2 rounded-md ${typeConfig.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formatType(achievement.type)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatStatus(achievement.status)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm leading-relaxed">{achievement.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(achievement.date).toLocaleDateString('zh-CN')}</span>
                    {achievement.description && (
                      <>
                        <span>•</span>
                        <span>{achievement.description}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 分页控制 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              共 {pagination.total} 条成果，第 {pagination.currentPage} / {pagination.totalPages} 页
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              
              {/* 页码按钮 */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[2.5rem]"
                >
                  {pageNum}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
