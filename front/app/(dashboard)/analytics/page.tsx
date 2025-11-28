"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResearchOverviewTab } from "@/components/analytics/research-overview-tab"
import { OverviewTab } from "@/components/analytics/overview-tab"
import { AnalyticsTab } from "@/components/analytics/analytics-tab"
import { ReportsTab } from "@/components/analytics/reports-tab"
import { NotificationsTab } from "@/components/analytics/notifications-tab"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, BarChart3, FileSpreadsheet, FileText, RefreshCw, Filter } from "lucide-react"

export default function AnalyticsPage() {
  const [exportFormat, setExportFormat] = useState<string>("excel")
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("research")
  const [notificationCount, setNotificationCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [overviewStats, setOverviewStats] = useState<any>(null)

  // 获取通知数量和概览统计
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token')
      console.log('🔑 Token存在:', !!token)
      console.log('🔄 开始获取数据...')
      
      // 获取通知数量
      try {
        const response = await fetch('http://localhost:8000/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        console.log('📬 通知API响应:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('📬 通知数据:', data)
          setNotificationCount(data.count || 0)
        } else {
          console.error('❌ 通知API错误:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ 获取通知数量失败:', error)
      }
      
      // 获取概览统计数据
      try {
        const response = await fetch('http://localhost:8000/api/analytics/overview', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        console.log('📊 概览API响应:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('📊 概览数据:', data)
          console.log('📊 Summary:', data.summary)
          setOverviewStats(data)
        } else {
          console.error('❌ 概览API错误:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ 获取概览统计失败:', error)
      }
    }
    fetchData()
  }, [refreshKey])

  const handleExportData = async () => {
    try {
      // 构建导出参数
      const params = new URLSearchParams()
      params.append('format', exportFormat)
      params.append('tab', activeTab)

      console.log('开始导出:', exportFormat, activeTab)

      // 调用导出 API
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/api/analytics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      console.log('Blob大小:', blob.size, 'Blob类型:', blob.type)
      
      // 确定文件扩展名
      let extension = exportFormat
      let mimeType = blob.type
      
      if (exportFormat === 'excel') {
        extension = 'csv'
      }
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics_${activeTab}_${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(a)
      a.click()
      
      // 延迟清理，确保下载完成
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      console.log('导出成功')
    } catch (error) {
      console.error('导出数据失败:', error)
      alert('导出失败，请查看控制台错误信息')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // 触发数据刷新（通过改变key值重新渲染子组件）
    setRefreshKey(prev => prev + 1)
    await new Promise(resolve => setTimeout(resolve, 800))
    setRefreshing(false)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* 页面头部 */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              数据分析大屏
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              科研成果综合数据分析与可视化
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
          </div>
        </div>

        {/* 导出控制栏 */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">导出格式：</span>
            </div>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportData} className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              导出当前数据
            </Button>
          </div>
        </Card>
      </div>
      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="research" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <BarChart3 className="h-4 w-4" />
            <span>科研成果</span>
            <Badge variant="secondary" className="ml-auto md:ml-1 text-xs">New</Badge>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <span>通用概览</span>
            {overviewStats?.summary && (
              <Badge variant="outline" className="ml-auto md:ml-1 text-xs">
                {Object.values(overviewStats.summary).reduce((sum: number, val: any) => 
                  sum + (typeof val === 'number' ? val : 0), 0
                )}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="py-3">数据分析</TabsTrigger>
          <TabsTrigger value="reports" className="py-3">报表</TabsTrigger>
          <TabsTrigger value="notifications" className="py-3">
            <span>通知</span>
            {notificationCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="research" className="space-y-4">
          <ResearchOverviewTab key={`research-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab key={`overview-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab key={`analytics-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

