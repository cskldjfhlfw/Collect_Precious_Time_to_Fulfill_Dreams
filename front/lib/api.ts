// API 基础配置和工具函数
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// 通用 API 请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  // 从localStorage获取token
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),  // 自动添加token
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

// 类型定义
export interface StatsResponse {
  label: string
  value: number
  change: string
  trend: 'up' | 'down' | 'stable'
}

export interface PaperListItem {
  id: string
  title: string
  authors: string[] | string | Record<string, any>
  journal?: string
  status: string
  publish_date?: string
  citation_count: number
  impact_factor?: number
  writing_progress: number
  // 详情视图可能使用到的扩展字段
  abstract?: string
  keywords?: string[]
  doi?: string
  notes?: string
  url?: string
  image_path?: string
  file_path?: string
  related_projects?: Record<string, any>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface DashboardOverview {
  research_overview: StatsResponse[]
  trend_data: Array<{
    month: string
    papers: number
    patents: number
    projects: number
  }>
  achievement_stats: {
    papers: { current: number; target: number; completion: number }
    patents: { current: number; target: number; completion: number }
    projects: { current: number; target: number; completion: number }
  }
}

export interface RecentAchievement {
  id: string
  type: string
  title: string
  status: string
  date: string
  description: string
}

export interface AuthorContribution {
  author_name: string
  paper_count: number
  total_citations: number
  avg_impact_factor: number
}

export interface PatentListItem {
  id: string
  name: string
  patent_number: string
  patent_type: string
  status: string
  technology_field?: string
  application_date?: string
  authorization_date?: string
  maintenance_deadline?: string
  commercialization_value?: number
  inventors?: string[] | string | Record<string, any>
  // 详情视图可能使用到的扩展字段
  description?: string
  technical_details?: string
  commercial_applications?: string
  image_path?: string
  file_path?: string
  related_projects?: Record<string, any>
}

export interface InventorContribution {
  inventor_name: string
  patent_count: number
  contribution_percent: number
}

export interface SoftwareCopyrightListItem {
  id: string
  name: string
  registration_number?: string
  status: string
  version?: string
  developer?: string
  language?: string
  resource_type?: string
  created_at?: string
  // 详情字段
  description?: string
  source_code_lines?: number
  technical_features?: string
  software_type?: string
  running_environment?: string
  hardware_environment?: string
  image_path?: string
  file_path?: string
  related_projects?: Record<string, any>
}

export interface DeveloperContribution {
  developer_name: string
  copyright_count: number
  contribution_percent: number
}

export interface ProjectListItem {
  id: string
  name: string
  project_number: string  // 修正：code → project_number
  project_type: string
  status: string
  progress_percent: number  // 修正：progress → progress_percent
  budget?: number
  budget_used?: number
  start_date?: string
  end_date?: string
  priority?: string
  principal?: string  // 修正：leader → principal
  risk_level?: string
  description?: string
  image_path?: string
  // 其他字段保持可选
  objectives?: string
  deliverables?: string
  risks?: string
  team_members?: string[] | string | Record<string, any>
  milestones?: Record<string, any>
  budget_breakdown?: Record<string, any>
  resources_required?: string
  file_path?: string
  related_papers?: Record<string, any>
  related_patents?: Record<string, any>
}

export interface TeamMemberContribution {
  member_name: string
  project_count: number
  total_budget: number
  contribution_percent: number
}

export interface ResourceListItem {
  id: string
  name: string
  resource_type: string
  status: string
  location?: string
  specifications?: string
  current_user?: string
  maintainer?: string
  usage_percentage?: number
  created_at?: string
  last_maintenance?: string
  // 详情字段
  description?: string
  capacity?: string
  operating_system?: string
  network_config?: string
  access_credentials?: string
  usage_history?: string
  maintenance_schedule?: string
  cost_per_hour?: number
  image_path?: string
  file_path?: string
  related_projects?: Record<string, any>
  hardware_details?: Record<string, any>
}

export interface UserUsageContribution {
  user_name: string
  resource_count: number
  total_usage_hours: number
  contribution_percent: number
}

export interface CompetitionListItem {
  id: string
  name: string
  competition_type: string
  level: string
  status: string
  organizer?: string
  category?: string
  participants?: string
  team_leader?: string
  registration_deadline?: string
  competition_date?: string
  result_date?: string
  award?: string
  created_at?: string
  // 详情字段
  description?: string
  objectives?: string
  requirements?: string
  evaluation_criteria?: string
  team_composition?: string
  preparation_plan?: string
  cost?: number
  image_path?: string
  file_path?: string
  related_projects?: Record<string, any>
  competition_details?: Record<string, any>
}

export interface ParticipantContribution {
  participant_name: string
  competition_count: number
  award_count: number
  contribution_percent: number
}

export interface ConferenceListItem {
  id: string
  name: string
  location?: string
  start_date?: string
  end_date?: string
  status: string
  submission_status?: string
  participants?: string[]
  budget?: number
  used?: number
  category?: string
  paper_title?: string | null
  description?: string
  created_at?: string
  updated_at?: string
}

export interface CooperationListItem {
  id: string
  name: string
  type?: string
  location?: string
  status: string
  projects: number
  contact_person?: string
  email?: string
  phone?: string
  established_date?: string
  last_contact?: string
  value?: string
  field?: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface RecentAchievementsResponse {
  items: RecentAchievement[]
  total: number
  page: number
  size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Dashboard API
export const dashboardApi = {
  getOverview: (): Promise<DashboardOverview> =>
    apiRequest('/dashboard/overview'),
  
  getRecentAchievements: (params: {
    page?: number
    size?: number
  } = {}): Promise<RecentAchievementsResponse> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    
    return apiRequest(`/dashboard/recent-achievements?${searchParams.toString()}`)
  },
}

// Papers API
export const papersApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    search?: string
  } = {}): Promise<PaginatedResponse<PaperListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/papers?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<StatsResponse[]> => {
    try {
      const stats = await apiRequest('/papers/stats') as StatsResponse[]
      return Array.isArray(stats) ? stats : []
    } catch (error) {
      console.error('Papers stats API error:', error)
      return []
    }
  },
  
  getAuthorContributions: (limit = 10): Promise<AuthorContribution[]> =>
    apiRequest(`/papers/authors/contributions?limit=${limit}`),
  
  getById: (id: string): Promise<PaperListItem> =>
    apiRequest(`/papers/${id}`),

  // 获取论文完整详情（包含图片路径等）
  getDetail: (id: string): Promise<PaperListItem> =>
    apiRequest(`/papers/${id}/detail`),

  // 下载论文文件
  downloadFile: async (id: string, filename?: string): Promise<{ fileType: string }> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const response = await fetch(`${API_BASE_URL}/papers/${id}/download`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })
    
    if (!response.ok) {
      throw new Error('下载失败')
    }
    
    // 从响应头中获取文件类型
    const fileType = response.headers.get('X-File-Type') || 'unknown'
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `paper_${id}.${fileType === 'pdf' ? 'pdf' : 'docx'}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    // 返回文件类型信息
    return { fileType }
  },

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/papers/${id}`, { method: "DELETE" }),

  update: (id: string, data: Partial<PaperListItem>): Promise<PaperListItem> =>
    apiRequest(`/papers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // 上传文件（图片或文档）
  uploadFile: async (file: File, fileType: 'image' | 'document'): Promise<{ file_path: string; new_filename: string }> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/papers/upload-file?file_type=${fileType}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '文件上传失败')
    }
    
    return await response.json()
  },

  create: (data: Partial<PaperListItem>): Promise<PaperListItem> =>
    apiRequest(`/papers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Projects API
export const projectsApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    project_type?: string
    priority?: string
    search?: string
  } = {}): Promise<PaginatedResponse<ProjectListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.project_type) searchParams.set('project_type', params.project_type)
    if (params.priority) searchParams.set('priority', params.priority)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/projects?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<StatsResponse[]> => {
    try {
      const stats = await apiRequest('/projects/stats') as StatsResponse[]
      return Array.isArray(stats) ? stats : []
    } catch (error) {
      console.error('Projects stats API error:', error)
      return []
    }
  },

  getById: (id: string): Promise<ProjectListItem> =>
    apiRequest(`/projects/${id}`),

  // 获取项目完整详情（包含图片路径等）
  getDetail: (id: string): Promise<ProjectListItem> =>
    apiRequest(`/projects/${id}/detail`),

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/projects/${id}`, { method: "DELETE" }),

  update: (id: string, data: Partial<ProjectListItem>): Promise<ProjectListItem> =>
    apiRequest(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  create: (data: Partial<ProjectListItem>): Promise<ProjectListItem> =>
    apiRequest(`/projects`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTeamContributions: (limit = 10): Promise<TeamMemberContribution[]> =>
    apiRequest(`/projects/team/contributions?limit=${limit}`),

  // 上传项目图片
  uploadFile: async (file: File, fileType: 'image'): Promise<{ file_path: string; new_filename: string }> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/projects/upload-file?file_type=${fileType}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '文件上传失败')
    }
    
    return await response.json()
  },

  // 启动项目
  start: (id: string): Promise<{
    message: string;
    startup_id?: string;
    start_time?: string;
    end_time?: string;
    duration_hours?: number;
    auto_shutdown?: boolean;
    user_role: string;
    requires_approval?: boolean;
  }> =>
    apiRequest(`/projects/${id}/start`, { method: "POST" }),

  // 获取项目启动状态
  getStartupStatus: (id: string): Promise<{
    is_running: boolean;
    startup_id?: string;
    status?: string;
    start_time?: string;
    end_time?: string;
    auto_shutdown?: boolean;
    request_reason?: string;
    message?: string;
  }> =>
    apiRequest(`/projects/${id}/startup-status`),

  // 停止项目
  stop: (id: string): Promise<{
    message: string;
    stopped_processes?: number[];
    user_role: string;
  }> =>
    apiRequest(`/projects/${id}/stop`, { method: "POST" }),
}

// Patents API
export const patentsApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    technology_field?: string
    search?: string
  } = {}): Promise<PaginatedResponse<PatentListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.technology_field) searchParams.set('technology_field', params.technology_field)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/patents?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<StatsResponse[]> => {
    try {
      const stats = await apiRequest('/patents/stats') as StatsResponse[]
      return Array.isArray(stats) ? stats : []
    } catch (error) {
      console.error('Patents stats API error:', error)
      return []
    }
  },

  getById: (id: string): Promise<PatentListItem> =>
    apiRequest(`/patents/${id}`),

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/patents/${id}`, { method: "DELETE" }),

  update: (id: string, data: Partial<PatentListItem>): Promise<PatentListItem> =>
    apiRequest(`/patents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  create: (data: Partial<PatentListItem>): Promise<PatentListItem> =>
    apiRequest(`/patents`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInventorContributions: (limit = 10): Promise<InventorContribution[]> =>
    apiRequest(`/patents/inventors/contributions?limit=${limit}`),
}

// Resources API
export const resourcesApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    resource_type?: string
    location?: string
    search?: string
  } = {}): Promise<PaginatedResponse<ResourceListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.resource_type) searchParams.set('resource_type', params.resource_type)
    if (params.location) searchParams.set('location', params.location)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/resources?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<{overview: StatsResponse[], by_type: any}> => {
    try {
      console.log('Calling resources stats API...')
      const response = await apiRequest('/resources/stats')
      console.log('Resources stats API response:', response)
      
      if (response && typeof response === 'object' && 'overview' in response) {
        const typedResponse = response as {overview: any[], by_type?: any}
        return {
          overview: Array.isArray(typedResponse.overview) ? typedResponse.overview : [],
          by_type: typedResponse.by_type || {}
        }
      } else {
        console.warn('Unexpected response structure:', response)
        return {overview: [], by_type: {}}
      }
    } catch (error) {
      console.error('Resources stats API error:', error)
      return {overview: [], by_type: {}}
    }
  },

  getById: (id: string): Promise<ResourceListItem> =>
    apiRequest(`/resources/${id}`),

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/resources/${id}`, { method: "DELETE" }),

  update: (id: string, data: Partial<ResourceListItem>): Promise<ResourceListItem> =>
    apiRequest(`/resources/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  create: (data: Partial<ResourceListItem>): Promise<ResourceListItem> =>
    apiRequest(`/resources`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserUsageContributions: (limit = 10): Promise<UserUsageContribution[]> =>
    apiRequest(`/resources/users/usage?limit=${limit}`),
}

// Software Copyrights API
export const softwareCopyrightsApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    resource_type?: string
    search?: string
  } = {}): Promise<PaginatedResponse<SoftwareCopyrightListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.resource_type) searchParams.set('resource_type', params.resource_type)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/software-copyrights?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<StatsResponse[]> => {
    try {
      const stats = await apiRequest('/software-copyrights/stats') as StatsResponse[]
      return Array.isArray(stats) ? stats : []
    } catch (error) {
      console.error('Software Copyrights stats API error:', error)
      return []
    }
  },

  getById: (id: string): Promise<SoftwareCopyrightListItem> =>
    apiRequest(`/software-copyrights/${id}`),

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/software-copyrights/${id}`, { method: "DELETE" }),

  update: (id: string, data: Partial<SoftwareCopyrightListItem>): Promise<SoftwareCopyrightListItem> =>
    apiRequest(`/software-copyrights/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  create: (data: Partial<SoftwareCopyrightListItem>): Promise<SoftwareCopyrightListItem> =>
    apiRequest(`/software-copyrights`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDeveloperContributions: (limit = 10): Promise<DeveloperContribution[]> =>
    apiRequest(`/software-copyrights/developers/contributions?limit=${limit}`),
}

// Competitions API
export const competitionsApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    level?: string
    competition_type?: string
    search?: string
  } = {}): Promise<PaginatedResponse<CompetitionListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.level) searchParams.set('level', params.level)
    if (params.competition_type) searchParams.set('competition_type', params.competition_type)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/competitions?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<StatsResponse[]> => {
    try {
      const stats = await apiRequest('/competitions/stats') as StatsResponse[]
      return Array.isArray(stats) ? stats : []
    } catch (error) {
      console.error('Competitions stats API error:', error)
      return []
    }
  },

  getById: (id: string): Promise<CompetitionListItem> =>
    apiRequest(`/competitions/${id}`),

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/competitions/${id}`, { method: "DELETE" }),

  update: (id: string, data: Partial<CompetitionListItem>): Promise<CompetitionListItem> =>
    apiRequest(`/competitions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  create: (data: Partial<CompetitionListItem>): Promise<CompetitionListItem> =>
    apiRequest(`/competitions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getParticipantContributions: (limit = 10): Promise<ParticipantContribution[]> =>
    apiRequest(`/competitions/participants/contributions?limit=${limit}`),
}

// Conferences API
export const conferencesApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    search?: string
  } = {}): Promise<PaginatedResponse<ConferenceListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/conferences?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<StatsResponse[]> => {
    try {
      const stats = await apiRequest('/conferences/stats') as StatsResponse[]
      return Array.isArray(stats) ? stats : []
    } catch (error) {
      console.error('Conferences stats API error:', error)
      return []
    }
  },

  getById: (id: string): Promise<ConferenceListItem> =>
    apiRequest(`/conferences/${id}`),

  create: (data: Partial<ConferenceListItem>): Promise<ConferenceListItem> =>
    apiRequest(`/conferences`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<ConferenceListItem>): Promise<ConferenceListItem> =>
    apiRequest(`/conferences/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/conferences/${id}`, { method: "DELETE" }),
}

// Cooperations API
export const cooperationsApi = {
  getList: (params: {
    page?: number
    size?: number
    status?: string
    search?: string
  } = {}): Promise<PaginatedResponse<CooperationListItem>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.size) searchParams.set('size', params.size.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.search) searchParams.set('search', params.search)
    
    return apiRequest(`/cooperations?${searchParams.toString()}`)
  },
  
  getStats: async (): Promise<StatsResponse[]> => {
    try {
      const stats = await apiRequest('/cooperations/stats') as StatsResponse[]
      return Array.isArray(stats) ? stats : []
    } catch (error) {
      console.error('Cooperations stats API error:', error)
      return []
    }
  },

  getById: (id: string): Promise<CooperationListItem> =>
    apiRequest(`/cooperations/${id}`),

  create: (data: Partial<CooperationListItem>): Promise<CooperationListItem> =>
    apiRequest(`/cooperations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CooperationListItem>): Promise<CooperationListItem> =>
    apiRequest(`/cooperations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> =>
    apiRequest(`/cooperations/${id}`, { method: "DELETE" }),
}

// Health Check API
export const healthApi = {
  check: (): Promise<{ status: string; timestamp: string }> =>
    apiRequest('/health'),
}
