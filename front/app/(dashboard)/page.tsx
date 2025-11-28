"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ResearchOverview } from "@/components/research-overview"
import { RecentAchievements } from "@/components/recent-achievements"
import { AchievementStats } from "@/components/achievement-stats"
import { TrendChart } from "@/components/trend-chart"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Calendar, Filter, X, User } from "lucide-react"

const achievementTypes = [
  { id: 'papers', label: '论文', color: '#3b82f6' },
  { id: 'patents', label: '专利', color: '#22c55e' },
  { id: 'projects', label: '项目', color: '#f97316' },
  { id: 'software', label: '软著', color: '#a855f7' },
  { id: 'competitions', label: '竞赛', color: '#eab308' },
  { id: 'conferences', label: '会议', color: '#ec4899' },
  { id: 'cooperations', label: '合作', color: '#14b8a6' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('6m')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'papers', 'patents', 'projects', 'software'
  ])
  const [showFilters, setShowFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    )
  }

  // 点击外部关闭筛选面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
    }

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  return (
    <div className="space-y-8">
      <header className="relative">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">我的科研成果</h1>
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {user?.username || '当前用户'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              查看您的论文、专利、项目等核心指标，并追踪近月趋势与完成率。
            </p>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            全局筛选
          </Button>
        </div>

        {/* 全局筛选面板 - 浮动效果 */}
        {showFilters && (
          <div ref={filterRef} className="absolute right-0 top-full mt-2 z-50 w-full md:w-auto md:min-w-[600px] animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="shadow-xl border-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <CardContent className="pt-6 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              <div className="grid gap-4 md:grid-cols-2">
                {/* 时间范围选择 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    时间范围
                  </Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3m">近3个月</SelectItem>
                      <SelectItem value="6m">近6个月</SelectItem>
                      <SelectItem value="1y">近12个月</SelectItem>
                      <SelectItem value="all">全部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 成果类型选择 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">成果类型</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {achievementTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`global-${type.id}`}
                          checked={selectedTypes.includes(type.id)}
                          onCheckedChange={() => toggleType(type.id)}
                        />
                        <label
                          htmlFor={`global-${type.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTypes(achievementTypes.map(t => t.id))}
                >
                  全选
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTypes([])}
                >
                  清空
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTypes(['papers', 'patents', 'projects', 'software'])}
                >
                  默认
                </Button>
              </div>
              </CardContent>
            </Card>
          </div>
        )}
      </header>

      <section id="overview" aria-labelledby="overview-heading">
        <h2 className="sr-only" id="overview-heading">
          关键指标概览
        </h2>
        <ResearchOverview />
      </section>

      <section
        id="analytics"
        aria-labelledby="analytics-heading"
        className="grid gap-6 md:grid-cols-2"
      >
        <h2 className="sr-only" id="analytics-heading">
          趋势与统计
        </h2>
        <TrendChart timeRange={timeRange} selectedTypes={selectedTypes} />
        <AchievementStats timeRange={timeRange} selectedTypes={selectedTypes} />
      </section>

      <section id="activities" aria-labelledby="activities-heading">
        <h2 className="sr-only" id="activities-heading">
          最新科研动态
        </h2>
        <RecentAchievements timeRange={timeRange} selectedTypes={selectedTypes} />
      </section>
    </div>
  )
}

