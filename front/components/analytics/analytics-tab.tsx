"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, ScatterChart, Scatter } from "recharts"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useApi } from "@/hooks/useApi"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Loader2, Users } from "lucide-react"

export function AnalyticsTab() {
  const { theme } = useTheme()
  const [timeFrame, setTimeFrame] = useState("last_30_days")
  const [deepAnalysisData, setDeepAnalysisData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 获取深度分析数据
  useEffect(() => {
    const fetchDeepAnalysis = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('http://localhost:8000/api/analytics/deep-analysis', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          console.log('深度分析数据:', data)
          console.log('研究领域数据:', data.research_fields)
          setDeepAnalysisData(data)
        } else {
          console.error('获取深度分析数据失败:', response.status)
        }
      } catch (error) {
        console.error('获取深度分析数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDeepAnalysis()
  }, [])

  // 使用API数据或默认值
  const researchFieldData = deepAnalysisData?.research_fields || []
  const qualityAnalysisData = deepAnalysisData?.quality_trends || []
  const collaborationEfficiencyData = deepAnalysisData?.collaboration_efficiency || []
  const impactScatterData = deepAnalysisData?.impact_scatter || []
  const impactDistribution = deepAnalysisData?.impact_distribution || [
    { name: "高影响力", value: 25, fill: "#22c55e" },
    { name: "中等影响力", value: 45, fill: "#3b82f6" },
    { name: "一般影响力", value: 30, fill: "#f97316" },
  ]
  const keyMetrics = deepAnalysisData?.key_metrics || {
    avg_impact_factor: 0,
    h_index: 0,
    collaboration_index: 0,
    conversion_rate: 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载深度分析数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold">深度数据分析</h3>
          <p className="text-muted-foreground mt-1">科研成果的质量、影响力与合作效益分析</p>
        </div>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择分析周期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7_days">近7天</SelectItem>
            <SelectItem value="last_30_days">近30天</SelectItem>
            <SelectItem value="last_90_days">近90天</SelectItem>
            <SelectItem value="last_12_months">近12个月</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 第一行：研究领域分布 + 成果质量趋势 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              研究领域分布分析
            </CardTitle>
            <CardDescription>各研究方向的成果数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            {researchFieldData.length === 0 || researchFieldData.every((d: any) => d.count === 0) ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无研究领域数据</p>
                  <p className="text-xs mt-1">添加论文后将显示领域分布</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={researchFieldData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="field" type="category" width={120} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: any) => [`数量: ${value}`, '']}
                  />
                  <Bar dataKey="count" fill={theme === "dark" ? "#adfa1d" : "#3b82f6"} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              影响力分布
            </CardTitle>
            <CardDescription>成果影响力等级占比</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={impactDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 第二行：成果质量趋势 + 关键指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">成果质量趋势分析</CardTitle>
            <CardDescription>按影响力级别分类的月度趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={qualityAnalysisData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="highImpact" fill="#22c55e" name="高影响力" />
                <Bar dataKey="mediumImpact" fill="#3b82f6" name="中等影响力" />
                <Bar dataKey="lowImpact" fill="#f97316" name="一般影响力" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">关键分析指标</CardTitle>
            <CardDescription>核心科研表现指标</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">平均影响因子</p>
                <p className="text-2xl font-bold">{keyMetrics.avg_impact_factor}</p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                基于论文
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">H指数</p>
                <p className="text-2xl font-bold">{keyMetrics.h_index}</p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                学术影响
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">合作效率指数</p>
                <p className="text-2xl font-bold">{keyMetrics.collaboration_index}</p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                合作质量
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">成果转化率</p>
                <p className="text-2xl font-bold">{keyMetrics.conversion_rate}%</p>
              </div>
              <Badge variant={keyMetrics.conversion_rate > 20 ? "secondary" : "outline"} className="flex items-center gap-1">
                {keyMetrics.conversion_rate > 20 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                转化指标
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 第三行：合作效益 + 影响力散点图 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">合作机构效益分析</CardTitle>
            <CardDescription>各合作机构的科研产出与效率评估</CardDescription>
          </CardHeader>
          <CardContent>
            {collaborationEfficiencyData.length === 0 || collaborationEfficiencyData[0]?.institution === "暂无合作数据" ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无合作机构数据</p>
                  <p className="text-xs mt-1">添加合作后将显示效益分析</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {collaborationEfficiencyData.map((institution: any, index: number) => (
                  <div key={institution.institution + index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{institution.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        论文{institution.papers} | 专利{institution.patents} | 项目{institution.projects}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{institution.efficiency}</p>
                      <p className="text-xs text-muted-foreground">效率分</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">成果数量与影响力关系</CardTitle>
            <CardDescription>各类成果的数量与影响力散点分布</CardDescription>
          </CardHeader>
          <CardContent>
            {impactScatterData.length === 0 || impactScatterData[0]?.name === "暂无数据" ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无成果数据</p>
                  <p className="text-xs mt-1">添加成果后将显示影响力分析</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={impactScatterData}>
                  <XAxis 
                    dataKey="count" 
                    name="数量"
                    label={{ value: '成果数量', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="impact" 
                    name="影响力"
                    label={{ value: '影响力指数', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: any, name: any, props: any) => {
                      if (name === 'impact') return [`影响力: ${value.toFixed(1)}`, props.payload.name]
                      return [value, name]
                    }}
                  />
                  <Scatter 
                    dataKey="impact" 
                    fill={theme === "dark" ? "#adfa1d" : "#3b82f6"}
                    r={8}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
