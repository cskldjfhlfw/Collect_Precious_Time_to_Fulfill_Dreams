"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Award, Code, FolderKanban, Trophy, Calendar, Users, TrendingUp, Star, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { useEffect, useState } from "react"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

export function ResearchOverviewTab() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // 从localStorage获取认证token
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          setError('未登录,请先登录')
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:8000/api/analytics/overview', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // 检查响应状态
        if (!response.ok) {
          if (response.status === 403) {
            setError('权限不足,无法访问数据')
          } else if (response.status === 401) {
            setError('认证失败,请重新登录')
          } else {
            setError(`获取数据失败: ${response.status}`)
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log('Analytics data received:', data)
        
        // 检查数据是否有效
        if (!data || !data.summary) {
          console.warn('Analytics data is missing summary:', data)
          setError('数据格式错误,请检查后端API')
          return
        }
        
        setAnalyticsData(data)
        setError(null)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        setError('网络错误,请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
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
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              请刷新页面重试或联系管理员
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">数据加载完成但暂无内容</p>
            <p className="text-sm text-muted-foreground">
              可能原因：数据库中尚未添加任何科研成果数据
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              请先添加论文、项目、专利等数据后再查看统计分析
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary, trends, top_authors, growth_rate, monthly_target } = analyticsData

  // 安全地计算总成果数,添加null检查
  const totalAchievements = summary && typeof summary === 'object'
    ? Object.values(summary).reduce((acc: number, val: any) => {
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
    : 0

  // 计算增长率（基于趋势数据）
  const calculateGrowthRate = () => {
    if (!trends || trends.length < 2) return { rate: 0, isPositive: true }
    const current = trends[trends.length - 1]
    const previous = trends[trends.length - 2]
    
    const currentTotal = Object.values(current).reduce((sum: number, val: any) => 
      sum + (typeof val === 'number' ? val : 0), 0)
    const previousTotal = Object.values(previous).reduce((sum: number, val: any) => 
      sum + (typeof val === 'number' ? val : 0), 0)
    
    if (previousTotal === 0) return { rate: 0, isPositive: true }
    const rate = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
    return { rate: Math.abs(parseFloat(rate)), isPositive: currentTotal >= previousTotal }
  }

  const growthData = growth_rate || calculateGrowthRate()

  // 月度目标数据（如果API提供则使用，否则基于当前月数据计算）
  const monthlyTargetData = monthly_target || {
    completed: trends?.[trends.length - 1] ? 
      Object.values(trends[trends.length - 1]).reduce((sum: number, val: any) => 
        sum + (typeof val === 'number' ? val : 0), 0) : 0,
    target: totalAchievements > 0 ? Math.ceil(totalAchievements / 12) : 50,
  }

  const completionPercentage = monthlyTargetData.target > 0 
    ? Math.round((monthlyTargetData.completed / monthlyTargetData.target) * 100)
    : 0

  // 计算预计剩余天数
  const calculateRemainingDays = () => {
    const now = new Date()
    const currentDay = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const remainingDays = daysInMonth - currentDay
    
    if (monthlyTargetData.completed >= monthlyTargetData.target) return 0
    if (monthlyTargetData.completed === 0) return remainingDays
    
    const dailyRate = monthlyTargetData.completed / currentDay
    const remainingItems = monthlyTargetData.target - monthlyTargetData.completed
    const estimatedDays = Math.ceil(remainingItems / dailyRate)
    
    return Math.min(estimatedDays, remainingDays)
  }

  const remainingDays = calculateRemainingDays()

  // 概览卡片数据 - 添加安全访问
  const overviewCards = [
    { 
      icon: FileText, 
      label: "论文", 
      value: summary?.total_papers || 0, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      desc: "已发表论文总数"
    },
    { 
      icon: FolderKanban, 
      label: "项目", 
      value: summary?.total_projects || 0, 
      color: "text-green-600", 
      bg: "bg-green-50",
      desc: "在研及已结项目"
    },
    { 
      icon: Award, 
      label: "专利", 
      value: summary?.total_patents || 0, 
      color: "text-yellow-600", 
      bg: "bg-yellow-50",
      desc: "已申请专利数量"
    },
    { 
      icon: Code, 
      label: "软著", 
      value: summary?.total_software_copyrights || 0, 
      color: "text-purple-600", 
      bg: "bg-purple-50",
      desc: "软件著作权登记"
    },
    { 
      icon: Trophy, 
      label: "竞赛", 
      value: summary?.total_competitions || 0, 
      color: "text-orange-600", 
      bg: "bg-orange-50",
      desc: "参与竞赛活动"
    },
    { 
      icon: Calendar, 
      label: "会议", 
      value: summary?.total_conferences || 0, 
      color: "text-pink-600", 
      bg: "bg-pink-50",
      desc: "参加学术会议"
    },
    { 
      icon: Users, 
      label: "合作", 
      value: summary?.total_cooperations || 0, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50",
      desc: "校企合作项目"
    },
    { 
      icon: Star, 
      label: "资源", 
      value: summary?.total_resources || 0, 
      color: "text-gray-600", 
      bg: "bg-gray-50",
      desc: "科研资源管理"
    },
  ]

  return (
    <div className="space-y-6">
      {/* 总览统计 - 增强版 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">科研成果总览</CardTitle>
            <CardDescription>统计截止至今日，包含所有类型的科研成果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">成果总数</p>
                <p className="text-5xl font-bold text-primary">{totalAchievements}</p>
                <div className="flex items-center gap-2 mt-2">
                  {growthData.rate > 0 && (
                    <div className={`flex items-center gap-1 ${growthData.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {growthData.isPositive ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {growthData.isPositive ? '+' : '-'}{growthData.rate}%
                      </span>
                    </div>
                  )}
                  {growthData.rate === 0 && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Minus className="h-4 w-4" />
                      <span className="text-sm font-medium">持平</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">较上月</span>
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-full">
                <TrendingUp className="h-12 w-12 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>月度目标</CardTitle>
            <CardDescription>本月成果达成情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">完成度</span>
                  <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>已完成 {monthlyTargetData.completed}/{monthlyTargetData.target} 个成果</p>
                {remainingDays > 0 && completionPercentage < 100 && (
                  <p className="mt-1">预计还需 {remainingDays} 天</p>
                )}
                {completionPercentage >= 100 && (
                  <p className="mt-1 text-green-600 font-medium">已达成月度目标！</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 月度趋势图表 */}
      {trends && trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>成果趋势分析</CardTitle>
            <CardDescription>最近6个月各类成果的变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart" className="space-y-4">
              <TabsList>
                <TabsTrigger value="chart">图表视图</TabsTrigger>
                <TabsTrigger value="table">表格视图</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="papers" stroke="#3b82f6" name="论文" strokeWidth={2} />
                    <Line type="monotone" dataKey="projects" stroke="#22c55e" name="项目" strokeWidth={2} />
                    <Line type="monotone" dataKey="patents" stroke="#eab308" name="专利" strokeWidth={2} />
                    <Line type="monotone" dataKey="software_copyrights" stroke="#a855f7" name="软著" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="table">
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 text-sm font-medium text-muted-foreground">
                    <div>月份</div>
                    <div className="text-center">论文</div>
                    <div className="text-center">项目</div>
                    <div className="text-center">专利</div>
                    <div className="text-center">软著</div>
                    <div className="text-center">竞赛</div>
                    <div className="text-center">会议</div>
                  </div>
                  {trends.slice(0, 6).map((trend: any) => (
                    <div key={trend.period} className="grid grid-cols-7 gap-2 text-sm border-t pt-2 hover:bg-muted/50 rounded px-2 -mx-2">
                      <div className="font-medium">{trend.period}</div>
                      <div className="text-center text-blue-600 font-semibold">{trend.papers}</div>
                      <div className="text-center text-green-600 font-semibold">{trend.projects}</div>
                      <div className="text-center text-yellow-600 font-semibold">{trend.patents}</div>
                      <div className="text-center text-purple-600 font-semibold">{trend.software_copyrights}</div>
                      <div className="text-center text-orange-600 font-semibold">{trend.competitions}</div>
                      <div className="text-center text-pink-600 font-semibold">{trend.conferences}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* 顶级作者/研究者 */}
      {top_authors && top_authors.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>高产作者</CardTitle>
              <CardDescription>按论文数量排名的前10位作者</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top_authors.slice(0, 5).map((author: any, index: number) => (
                  <div key={author.name} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {author.papers}篇论文 · {author.projects}个项目
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">H指数</p>
                      <p className="text-lg font-bold text-blue-600">{author.h_index}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>成果分布</CardTitle>
              <CardDescription>各类型成果的占比情况</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bar" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bar">柱状图</TabsTrigger>
                  <TabsTrigger value="progress">进度条</TabsTrigger>
                </TabsList>
                
                <TabsContent value="bar">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={overviewCards.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="progress">
                  <div className="space-y-4">
                    {overviewCards.slice(0, 5).map((card) => {
                      const percentage = totalAchievements > 0 
                        ? Math.round((card.value / totalAchievements) * 100) 
                        : 0
                      return (
                        <div key={card.label} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                                <card.icon className={`h-3 w-3 ${card.color}`} />
                              </div>
                              <span className="font-medium">{card.label}</span>
                            </div>
                            <span className="font-bold">{card.value} ({percentage}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
