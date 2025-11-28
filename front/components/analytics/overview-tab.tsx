"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { useApi } from "@/hooks/useApi"
import { FileText, Award, Code, FolderKanban, Trophy, Calendar, Users, TrendingUp, Activity, Loader2 } from "lucide-react"

export function OverviewTab() {
  const [comparisonPeriod, setComparisonPeriod] = useState("previous_month")
  const [systemHealthData, setSystemHealthData] = useState<any[]>([])
  const [weeklyActivityData, setWeeklyActivityData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [performanceLoading, setPerformanceLoading] = useState(true)

  // 调用analytics API获取数据
  const { data: analyticsData, loading, error: apiError } = useApi(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('未登录,请先登录')
    }
    const response = await fetch('http://localhost:8000/api/analytics/overview', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('权限不足')
      } else if (response.status === 401) {
        throw new Error('认证失败,请重新登录')
      }
      throw new Error(`获取数据失败: ${response.status}`)
    }
    const data = await response.json()
    console.log('Overview analytics data:', data)
    return data
  })

  // 获取系统健康状态
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/system/health')
        const data = await response.json()
        setSystemHealthData(data.services || [])
      } catch (error) {
        console.error('获取系统健康状态失败:', error)
        // 如果API不可用，显示默认值
        setSystemHealthData([
          { name: "数据库连接", status: "未知", value: 0 },
          { name: "API响应", status: "未知", value: 0 },
          { name: "文件存储", status: "未知", value: 0 },
          { name: "搜索服务", status: "未知", value: 0 },
        ])
      } finally {
        setHealthLoading(false)
      }
    }
    fetchSystemHealth()
  }, [])

  // 获取每周活动数据
  useEffect(() => {
    const fetchWeeklyActivity = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('http://localhost:8000/api/analytics/weekly-activity', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          setWeeklyActivityData(data.weekly_data || [])
        } else {
          setWeeklyActivityData([])
        }
      } catch (error) {
        console.error('获取每周活动数据失败:', error)
        setWeeklyActivityData([])
      }
    }
    fetchWeeklyActivity()
  }, [])

  // 获取系统性能数据
  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/system/performance')
        const data = await response.json()
        setPerformanceData(data)
      } catch (error) {
        console.error('获取系统性能数据失败:', error)
        setPerformanceData(null)
      } finally {
        setPerformanceLoading(false)
      }
    }
    fetchPerformance()
    
    // 每30秒刷新一次性能数据
    const interval = setInterval(fetchPerformance, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold">系统概览</h3>
          <p className="text-muted-foreground mt-1">科研成果管理系统运行状态与基础数据</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">对比周期:</span>
          <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择周期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous_month">上个月</SelectItem>
              <SelectItem value="previous_quarter">上个季度</SelectItem>
              <SelectItem value="previous_year">去年同期</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 系统状态卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {healthLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-2 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        ) : systemHealthData.length > 0 ? (
          systemHealthData.map((item) => {
            const getStatusVariant = (status: string) => {
              if (status === "正常" || status === "healthy") return "secondary"
              if (status === "警告" || status === "warning") return "outline"
              return "destructive"
            }
            
            const getStatusColor = (status: string, value: number) => {
              if (status === "正常" || status === "healthy" || value >= 95) return "text-green-600"
              if (status === "警告" || status === "warning" || value >= 80) return "text-yellow-600"
              return "text-red-600"
            }

            return (
              <Card key={item.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                  <Activity className={`h-4 w-4 ${getStatusColor(item.status, item.value)}`} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-bold">{item.value}%</div>
                    <Badge variant={getStatusVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-4 text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>正在连接系统监控服务...</p>
          </div>
        )}
      </div>

      {/* 主要图表区域 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">每周活跃度统计</CardTitle>
            <CardDescription>各类科研成果的每日新增数量</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyActivityData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p>正在加载每周活动数据...</p>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivityData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="papers" fill="#3b82f6" name="论文" />
                <Bar dataKey="patents" fill="#22c55e" name="专利" />
                <Bar dataKey="projects" fill="#f97316" name="项目" />
                <Bar dataKey="conferences" fill="#ec4899" name="会议" />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">数据总览</CardTitle>
            <CardDescription>各模块数据统计</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-8 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : apiError ? (
              <div className="text-center py-4">
                <p className="text-destructive font-medium mb-2">{apiError}</p>
                <p className="text-sm text-muted-foreground">请刷新页面重试</p>
              </div>
            ) : !analyticsData ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">暂无数据</p>
                <p className="text-xs text-muted-foreground mt-1">请先添加科研成果数据</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    论文数量
                  </span>
                  <span className="font-bold">{analyticsData?.summary?.total_papers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    专利数量
                  </span>
                  <span className="font-bold">{analyticsData?.summary?.total_patents || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-orange-600" />
                    项目数量
                  </span>
                  <span className="font-bold">{analyticsData?.summary?.total_projects || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-purple-600" />
                    软著数量
                  </span>
                  <span className="font-bold">{analyticsData?.summary?.total_software_copyrights || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    竞赛数量
                  </span>
                  <span className="font-bold">{analyticsData?.summary?.total_competitions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-pink-600" />
                    会议数量
                  </span>
                  <span className="font-bold">{analyticsData?.summary?.total_conferences || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    合作数量
                  </span>
                  <span className="font-bold">{analyticsData?.summary?.total_cooperations || 0}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 系统性能监控 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">系统性能监控</CardTitle>
          <CardDescription>实时服务器资源使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : performanceData && !performanceData.error ? (
            <div className="grid gap-4 md:grid-cols-3">
              {/* CPU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU使用率</span>
                  <Badge variant={performanceData.cpu.status === 'normal' ? 'secondary' : 'destructive'}>
                    {performanceData.cpu.status === 'normal' ? '正常' : '警告'}
                  </Badge>
                </div>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={[{ name: 'CPU', value: performanceData.cpu.usage }]}>
                      <Bar dataKey="value" fill={performanceData.cpu.status === 'normal' ? '#3b82f6' : '#ef4444'} radius={[4, 4, 0, 0]} />
                      <YAxis domain={[0, 100]} hide />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{performanceData.cpu.usage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 内存 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">内存使用率</span>
                  <Badge variant={performanceData.memory.status === 'normal' ? 'secondary' : 'destructive'}>
                    {performanceData.memory.status === 'normal' ? '正常' : '警告'}
                  </Badge>
                </div>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={[{ name: 'Memory', value: performanceData.memory.usage }]}>
                      <Bar dataKey="value" fill={performanceData.memory.status === 'normal' ? '#22c55e' : '#ef4444'} radius={[4, 4, 0, 0]} />
                      <YAxis domain={[0, 100]} hide />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{performanceData.memory.usage.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">
                        {(performanceData.memory.available / 1024 / 1024 / 1024).toFixed(1)}GB 可用
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 磁盘 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">磁盘使用率</span>
                  <Badge variant={performanceData.disk.status === 'normal' ? 'secondary' : 'destructive'}>
                    {performanceData.disk.status === 'normal' ? '正常' : '警告'}
                  </Badge>
                </div>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={[{ name: 'Disk', value: performanceData.disk.usage }]}>
                      <Bar dataKey="value" fill={performanceData.disk.status === 'normal' ? '#f97316' : '#ef4444'} radius={[4, 4, 0, 0]} />
                      <YAxis domain={[0, 100]} hide />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{performanceData.disk.usage.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">
                        {(performanceData.disk.free / 1024 / 1024 / 1024).toFixed(0)}GB 剩余
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>无法获取系统性能数据</p>
              {performanceData?.error && (
                <p className="text-xs text-red-500 mt-2">{performanceData.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 趋势分析 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">月度增长趋势</CardTitle>
            <CardDescription>近6个月各类成果的增长情况</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData?.trends || []}>
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="papers" stroke="#3b82f6" name="论文" strokeWidth={2} />
                <Line type="monotone" dataKey="patents" stroke="#22c55e" name="专利" strokeWidth={2} />
                <Line type="monotone" dataKey="projects" stroke="#f97316" name="项目" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">快速操作</CardTitle>
            <CardDescription>常用功能快速访问</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <button className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  新建论文
                </span>
                <span className="text-xs text-muted-foreground">Ctrl+N</span>
              </button>
              <button className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <span className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  创建项目
                </span>
                <span className="text-xs text-muted-foreground">Ctrl+P</span>
              </button>
              <button className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  数据导出
                </span>
                <span className="text-xs text-muted-foreground">Ctrl+E</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
