"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Calendar, Filter, X } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { dashboardApi } from "@/lib/api"

const formatMonth = (monthStr: string) => {
  // 将 "2024-01" 格式转换为 "1月"
  const [year, month] = monthStr.split('-')
  return `${parseInt(month)}月`
}

interface TrendChartProps {
  timeRange?: string
  selectedTypes?: string[]
}

export function TrendChart({ timeRange = '6m', selectedTypes = ['papers', 'patents', 'projects', 'software'] }: TrendChartProps = {}) {

  const { data: overview, loading, error } = useApi(() => dashboardApi.getOverview())

  // 转换数据格式 - 必须在条件判断之前调用 hooks
  const chartData = useMemo(() => {
    if (!overview?.trend_data) return []
    
    let data = overview.trend_data
    
    // 根据时间范围筛选
    const monthsToShow = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : timeRange === '1y' ? 12 : data.length
    data = data.slice(-monthsToShow)
    
    return data.map((item: any) => ({
      month: formatMonth(item.month),
      论文: item.papers || 0,
      专利: item.patents || 0,
      项目: item.projects || 0,
      软著: item.software || 0,
      竞赛: item.competitions || 0,
      会议: item.conferences || 0,
      合作: item.cooperations || 0,
    }))
  }, [overview, timeRange])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成果趋势</CardTitle>
          <CardDescription>全年各类成果发布趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">加载图表数据...</p>
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
          <CardTitle>成果趋势</CardTitle>
          <CardDescription>全年各类成果发布趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">加载图表失败</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!overview?.trend_data || overview.trend_data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成果趋势</CardTitle>
          <CardDescription>全年各类成果发布趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">暂无趋势数据</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>成果趋势</CardTitle>
        <CardDescription>
          {timeRange === '3m' ? '近3个月' : timeRange === '6m' ? '近6个月' : timeRange === '1y' ? '近12个月' : '全部'}各类成果发布趋势
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconSize={12}
            />
            {selectedTypes.includes('papers') && (
              <Line type="monotone" dataKey="论文" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {selectedTypes.includes('patents') && (
              <Line type="monotone" dataKey="专利" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {selectedTypes.includes('projects') && (
              <Line type="monotone" dataKey="项目" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {selectedTypes.includes('software') && (
              <Line type="monotone" dataKey="软著" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {selectedTypes.includes('competitions') && (
              <Line type="monotone" dataKey="竞赛" stroke="#eab308" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="5 5" />
            )}
            {selectedTypes.includes('conferences') && (
              <Line type="monotone" dataKey="会议" stroke="#ec4899" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="5 5" />
            )}
            {selectedTypes.includes('cooperations') && (
              <Line type="monotone" dataKey="合作" stroke="#14b8a6" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="5 5" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
