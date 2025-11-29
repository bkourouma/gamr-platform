// Service API pour communiquer avec le backend
// Default to relative path so Vite proxy and production reverse proxy handle routing
// In development, if we detect we're not on the standard Vite port (5173), use direct backend connection
const isDev = import.meta.env.DEV
const isNonStandardPort = isDev && window.location.port !== '5173' && window.location.port !== ''
const directBackendUrl = `http://localhost:${import.meta.env.VITE_BACKEND_PORT || '3002'}/api`

const API_BASE_URL = (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) 
  || (isNonStandardPort ? directBackendUrl : '/api')

// Log the API URL in development for debugging
if (isDev) {
  console.log('[GAMR API] Using API base URL:', API_BASE_URL)
  console.log('[GAMR API] Current port:', window.location.port)
  console.log('[GAMR API] Backend port from env:', import.meta.env.VITE_BACKEND_PORT || '3002 (default)')
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface RiskSheet {
  id: string
  target: string
  scenario: string
  probability: number
  vulnerability: number
  impact: number
  riskScore: number
  priority: string
  category?: string
  aiSuggestions?: any // Recommandations IA
  version: number
  isArchived: boolean
  reviewDate?: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AI_ANALYST' | 'EVALUATOR' | 'READER'
  isActive: boolean
  lastLogin?: string
  createdAt: string
  tenantId: string
  tenant: {
    id: string
    name: string
    slug: string
    domain?: string
    industry?: string
    country?: string
    isActive: boolean
  }
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'RISK_CRITICAL' | 'ACTION_OVERDUE' | 'REVIEW_DUE' | 'AI_ALERT' | 'CORRELATION_ALERT' | 'SYSTEM'
  isRead: boolean
  isSent: boolean
  createdAt: Date
  readAt?: Date
  sentAt?: Date
  userId?: string
  tenantId?: string
}

// Classe pour gérer les erreurs API
export class ApiError extends Error {
  public status: number
  public details?: any

  constructor(
    message: string,
    status: number,
    details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// Utilitaire pour gérer les requêtes HTTP
class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.loadToken()
  }

  private loadToken() {
    this.token = localStorage.getItem('gamr_token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('gamr_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('gamr_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as any).Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Gérer les réponses sans contenu (204 No Content)
      if (response.status === 204) {
        if (!response.ok) {
          throw new ApiError(
            'Erreur lors de l\'opération',
            response.status
          )
        }
        return null as T
      }

      // Pour les autres réponses, parser le JSON si possible
      let data: any = null
      const text = await response.text()
      try {
        data = text ? JSON.parse(text) : null
      } catch (e) {
        // Non-JSON (e.g., HTML) for some error responses like proxies; construct a fallback
        data = { error: text || 'Réponse non-JSON du serveur' }
      }

      if (!response.ok) {
        throw new ApiError(
          (data && data.error) || 'Une erreur est survenue',
          response.status,
          data && data.details
        )
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Vérifier si c'est une erreur de parsing JSON
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw new ApiError(
          'Réponse invalide du serveur',
          500
        )
      }

      // Erreur réseau ou autre
      throw new ApiError(
        'Erreur de connexion au serveur',
        0,
        error
      )
    }
  }

  // Méthodes HTTP
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Instance globale du client API
const apiClient = new ApiClient(API_BASE_URL)

// Services API spécialisés

// Service d'authentification
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    })
    
    if (response.token) {
      apiClient.setToken(response.token)
    }
    
    return response
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      apiClient.clearToken()
    }
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/me')
  },

  async updateProfile(data: { firstName: string; lastName: string }): Promise<User> {
    return apiClient.put<User>('/auth/profile', data)
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiClient.post('/auth/password', data)
  },

  async getPermissions(): Promise<{ role: string; permissions: string[] }> {
    return apiClient.get('/auth/permissions')
  },
}

// Service des fiches de risque
export const riskSheetsApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    priority?: string
  }): Promise<PaginatedResponse<RiskSheet>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<RiskSheet>>(
      `/risk-sheets${query ? `?${query}` : ''}`
    )
  },

  async getById(id: string): Promise<RiskSheet> {
    return apiClient.get<RiskSheet>(`/risk-sheets/${id}`)
  },

  async create(data: {
    target: string
    scenario: string
    probability: number
    vulnerability: number
    impact: number
    category?: string
    aiSuggestions?: any
  }): Promise<RiskSheet> {
    return apiClient.post<RiskSheet>('/risk-sheets', data)
  },

  async update(id: string, data: {
    target: string
    scenario: string
    probability: number
    vulnerability: number
    impact: number
    category?: string
    aiSuggestions?: any
  }): Promise<RiskSheet> {
    return apiClient.put<RiskSheet>(`/risk-sheets/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/risk-sheets/${id}`)
  },

  async getStats(): Promise<{
    totalRisks: number
    criticalRisks: number
    highRisks: number
    recentRisks: number
    risksByCategory: Array<{ category: string; count: number }>
    averageRiskScore: number
    averageSecurityIndex?: number  // Indice Global de Sécurité (nouveau calcul)
    securityIndexDetails?: {
      evaluationScore: number
      correctiveActionCoverage: number
      criticalRisksResolutionRate: number
      securityObjectivesCompliance: number
    }
  }> {
    return apiClient.get('/risk-sheets/stats/dashboard')
  },
}

// Service des utilisateurs - déclaration supprimée (dupliquée plus bas)

// Service des notifications
export const notificationsApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
    type?: string
  }): Promise<PaginatedResponse<Notification>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<Notification>>(
      `/notifications${query ? `?${query}` : ''}`
    )
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/notifications/unread-count')
  },

  async create(data: {
    title: string
    message: string
    type: string
    userId?: string
  }): Promise<Notification> {
    return apiClient.post<Notification>('/notifications', data)
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.put<Notification>(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    return apiClient.put<{ updated: number }>('/notifications/mark-all-read')
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/notifications/${id}`)
  },
}

// Service des actions correctives
export const actionsApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    priority?: string
    assigneeId?: string
    riskSheetId?: string
    overdue?: boolean
  }): Promise<PaginatedResponse<Action>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<Action>>(
      `/actions${query ? `?${query}` : ''}`
    )
  },

  async getById(id: string): Promise<Action> {
    return apiClient.get<Action>(`/actions/${id}`)
  },

  async getStats(): Promise<{
    totalActions: number
    todoActions: number
    inProgressActions: number
    completedActions: number
    overdueActions: number
    actionsByPriority: Array<{ priority: string; count: number }>
    actionsByStatus: Array<{ status: string; count: number }>
  }> {
    return apiClient.get('/actions/stats')
  },

  async create(data: {
    title: string
    description: string
    dueDate?: Date
    status?: string
    priority?: string
    assigneeId?: string
    riskSheetId: string
    successProbability?: number
    estimatedCost?: number
    estimatedDuration?: number
  }): Promise<Action> {
    return apiClient.post<Action>('/actions', data)
  },

  async update(id: string, data: {
    title?: string
    description?: string
    dueDate?: Date
    status?: string
    priority?: string
    assigneeId?: string
    successProbability?: number
    estimatedCost?: number
    estimatedDuration?: number
  }): Promise<Action> {
    return apiClient.put<Action>(`/actions/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/actions/${id}`)
  },
}

// Interface pour les actions
export interface Action {
  id: string
  title: string
  description: string
  dueDate?: Date
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  successProbability?: number
  estimatedCost?: number
  estimatedDuration?: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  tenantId: string
  riskSheetId: string
  assigneeId?: string
  assignee?: User
  riskSheet?: RiskSheet
}

// Service des corrélations de risques
export const correlationsApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    correlationType?: string
    minCoefficient?: number
    sourceRiskId?: string
    targetRiskId?: string
    isActive?: boolean
  }): Promise<PaginatedResponse<RiskCorrelation>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<RiskCorrelation>>(
      `/correlations${query ? `?${query}` : ''}`
    )
  },

  async getStats(): Promise<{
    totalCorrelations: number
    strongCorrelations: number
    correlationsByType: Array<{ type: string; count: number }>
    averageCoefficient: number
    topCorrelatedRisks: Array<any>
  }> {
    return apiClient.get('/correlations/stats')
  },

  async getNetwork(riskId: string, params?: {
    depth?: number
    minCoefficient?: number
  }): Promise<{
    nodes: Array<any>
    edges: Array<any>
    centerNode: string
  }> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return apiClient.get(
      `/correlations/network/${riskId}${query ? `?${query}` : ''}`
    )
  },

  async create(data: {
    sourceRiskId: string
    targetRiskId: string
    coefficient: number
    correlationType: 'CAUSAL' | 'CONDITIONAL' | 'TEMPORAL' | 'RESOURCE' | 'GEOGRAPHIC'
  }): Promise<RiskCorrelation> {
    return apiClient.post<RiskCorrelation>('/correlations', data)
  },

  async update(id: string, data: {
    coefficient?: number
    correlationType?: string
    isActive?: boolean
  }): Promise<RiskCorrelation> {
    return apiClient.put<RiskCorrelation>(`/correlations/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/correlations/${id}`)
  },
}

// Interface pour les corrélations
export interface RiskCorrelation {
  id: string
  coefficient: number
  correlationType: 'CAUSAL' | 'CONDITIONAL' | 'TEMPORAL' | 'RESOURCE' | 'GEOGRAPHIC'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  sourceRiskId: string
  targetRiskId: string
  sourceRisk?: RiskSheet
  targetRisk?: RiskSheet
}

// Service des logs d'audit
export const auditApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    action?: string
    entity?: string
    entityId?: string
    userId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<PaginatedResponse<AuditLog>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date) {
            searchParams.append(key, value.toISOString())
          } else {
            searchParams.append(key, value.toString())
          }
        }
      })
    }

    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<AuditLog>>(
      `/audit${query ? `?${query}` : ''}`
    )
  },

  async getStats(period?: string): Promise<{
    totalLogs: number
    period: string
    logsByAction: Array<{ action: string; count: number }>
    logsByEntity: Array<{ entity: string; count: number }>
    logsByUser: Array<{ userId: string; count: number; user: any }>
    recentActivity: Array<AuditLog>
  }> {
    const query = period ? `?period=${period}` : ''
    return apiClient.get(`/audit/stats${query}`)
  },

  async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>(`/audit/entity/${entityType}/${entityId}`)
  },

  async create(data: {
    action: string
    entity: string
    entityId: string
    oldValues?: any
    newValues?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<AuditLog> {
    return apiClient.post<AuditLog>('/audit', data)
  },

  async cleanup(olderThanDays?: number): Promise<{
    message: string
    deletedCount: number
    cutoffDate: Date
  }> {
    const query = olderThanDays ? `?olderThanDays=${olderThanDays}` : ''
    return apiClient.delete(`/audit/cleanup${query}`)
  },
}

// Interface pour les logs d'audit
export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  oldValues?: any
  newValues?: any
  createdAt: Date
  ipAddress?: string
  userAgent?: string
  userId?: string
  user?: User
}

// Gestion des erreurs globales
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    // Gestion spécifique des erreurs d'authentification
    if (error.status === 401) {
      apiClient.clearToken()
      window.location.href = '/login'
      return 'Session expirée, veuillez vous reconnecter'
    }
    
    return error.message
  }
  
  return 'Une erreur inattendue est survenue'
}

// ===== EVALUATIONS API =====

export interface Evaluation {
  id: string
  title: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'VALIDATED' | 'ARCHIVED'
  startedAt?: string
  completedAt?: string
  progress: number
  totalScore?: number
  riskLevel?: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  entityInfo?: any
  templateId: string
  template?: {
    id: string
    name: string
    description?: string
    questionGroups?: {
      id: string
      title: string
      description?: string
      orderIndex: number
      objectives: {
        id: string
        title: string
        description?: string
        orderIndex: number
        questions: {
          id: string
          text: string
          type: string
          orderIndex: number
          isRequired: boolean
          helpText?: string
          placeholder?: string
        }[]
      }[]
    }[]
  }
  evaluatorId: string
  evaluator?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  responses?: EvaluationResponse[]
  attachments?: MediaAttachment[]
  generatedRisks?: RiskSheet[]
  createdAt: string
  updatedAt: string
}

export interface EvaluationTemplate {
  id: string
  name: string
  description?: string
  version: string
  isActive: boolean
  questionGroups?: QuestionGroup[]
  createdAt: string
  updatedAt: string
}

export interface QuestionGroup {
  id: string
  title: string
  description?: string
  orderIndex: number
  objectives?: Objective[]
}

export interface Objective {
  id: string
  title: string
  description?: string
  orderIndex: number
  weight: number
  questions?: Question[]
}

export interface Question {
  id: string
  text: string
  type: 'YES_NO' | 'TEXT' | 'NUMBER' | 'SCALE' | 'MULTIPLE_CHOICE' | 'FILE_UPLOAD' | 'DATE' | 'TIME'
  orderIndex: number
  isRequired: boolean
  dependsOn?: any
  helpText?: string
  placeholder?: string
  weight: number
  options?: string[]
  ouiMeansPositive?: boolean
}

export interface EvaluationResponse {
  id: string
  booleanValue?: boolean
  textValue?: string
  numberValue?: number
  jsonValue?: any
  facilityScore?: number
  constraintScore?: number
  description?: string
  comment?: string
  answeredAt: string
  updatedAt: string
  evaluationId: string
  questionId: string
  question?: Question
}

export interface MediaAttachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  description?: string
  category: 'PHOTO' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'PLAN' | 'CERTIFICATE' | 'OTHER'
  latitude?: number
  longitude?: number
  evaluationId: string
  questionId?: string
  uploadedAt: string
}

export const evaluationsApi = {
  async getAll(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginatedResponse<Evaluation>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.search) searchParams.append('search', params.search)

    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<Evaluation>>(`/evaluations${query ? `?${query}` : ''}`)
  },

  async getById(id: string): Promise<Evaluation> {
    return apiClient.get<Evaluation>(`/evaluations/${id}`)
  },

  async create(data: {
    title: string
    templateId: string
    entityInfo?: any
  }): Promise<Evaluation> {
    return apiClient.post<Evaluation>('/evaluations', data)
  },

  async update(id: string, data: {
    title?: string
    status?: string
    entityInfo?: any
  }): Promise<Evaluation> {
    return apiClient.put<Evaluation>(`/evaluations/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/evaluations/${id}`)
  },

  async getResponses(evaluationId: string): Promise<EvaluationResponse[]> {
    return apiClient.get<EvaluationResponse[]>(`/evaluations/${evaluationId}/responses`)
  },

  async saveResponse(evaluationId: string, data: {
    questionId: string
    booleanValue?: boolean
    textValue?: string
    numberValue?: number
    jsonValue?: any
    facilityScore?: number
    constraintScore?: number
    description?: string
    comment?: string
  }): Promise<EvaluationResponse> {
    return apiClient.post<EvaluationResponse>(`/evaluations/${evaluationId}/responses`, data)
  },

  async updateResponse(evaluationId: string, responseId: string, data: {
    booleanValue?: boolean
    textValue?: string
    numberValue?: number
    jsonValue?: any
    facilityScore?: number
    constraintScore?: number
    description?: string
    comment?: string
  }): Promise<EvaluationResponse> {
    return apiClient.put<EvaluationResponse>(`/evaluations/${evaluationId}/responses/${responseId}`, data)
  },

  async deleteResponse(evaluationId: string, responseId: string): Promise<void> {
    return apiClient.delete(`/evaluations/${evaluationId}/responses/${responseId}`)
  }
}

export const templatesApi = {
  async getAll(params?: { page?: number; limit?: number; search?: string; isActive?: boolean }): Promise<PaginatedResponse<EvaluationTemplate>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())

    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<EvaluationTemplate>>(`/templates${query ? `?${query}` : ''}`)
  },

  async getById(id: string): Promise<EvaluationTemplate> {
    return apiClient.get<EvaluationTemplate>(`/templates/${id}`)
  },

  async create(data: {
    name: string
    description?: string
    version?: string
    questionGroups?: any[]
  }): Promise<EvaluationTemplate> {
    return apiClient.post<EvaluationTemplate>('/templates', data)
  },

  async update(id: string, data: {
    name?: string
    description?: string
    version?: string
    isActive?: boolean
  }): Promise<EvaluationTemplate> {
    return apiClient.put<EvaluationTemplate>(`/templates/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/templates/${id}`)
  },

  async updateQuestionGroups(id: string, questionGroups: any[]): Promise<EvaluationTemplate> {
    return apiClient.put<EvaluationTemplate>(`/templates/${id}/questionGroups`, { questionGroups })
  },

  async getStatistics(id: string): Promise<{
    totalEvaluations: number
    completedEvaluations: number
    inProgressEvaluations: number
    completionRate: number
    evaluationsByMonth: Array<{ month: string; count: number }>
  }> {
    return apiClient.get(`/templates/${id}/statistics`)
  }
}

// API pour la gestion des tenants (Super Admin uniquement)
export const tenantsApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    sector?: string
    isActive?: boolean
    _t?: number // Timestamp pour éviter le cache
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.sector) searchParams.append('sector', params.sector)
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())
    if (params?._t) searchParams.append('_t', params._t.toString())

    return apiClient.get(`/tenants?${searchParams.toString()}`)
  },

  async getById(id: string): Promise<any> {
    return apiClient.get(`/tenants/${id}`)
  },

  async create(tenantData: {
    name: string
    slug: string
    description?: string
    sector?: string
    size?: string
    location?: string
    riskLevels?: any
    threatTypes?: any
    reviewFrequency?: string
  }): Promise<any> {
    return apiClient.post('/tenants', tenantData)
  },

  async update(id: string, tenantData: Partial<{
    name: string
    description: string
    sector: string
    size: string
    location: string
    riskLevels: any
    threatTypes: any
    reviewFrequency: string
    isActive: boolean
  }>): Promise<any> {
    return apiClient.put(`/tenants/${id}`, tenantData)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/tenants/${id}`)
  },

  async toggleStatus(id: string): Promise<any> {
    return apiClient.patch(`/tenants/${id}/toggle-status`)
  },

  async getStatistics(id: string): Promise<{
    totalUsers: number
    activeUsers: number
    totalRiskSheets: number
    totalEvaluations: number
    risksByCategory: Array<{ category: string; count: number }>
    usersByRole: Array<{ role: string; count: number }>
  }> {
    return apiClient.get(`/tenants/${id}/statistics`)
  }
}

// API pour la gestion des utilisateurs (Admin et Super Admin)
export const usersApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isActive?: boolean
    tenantId?: string
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.role) searchParams.append('role', params.role)
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())
    if (params?.tenantId) searchParams.append('tenantId', params.tenantId)

    return apiClient.get(`/users?${searchParams.toString()}`)
  },

  async getById(id: string): Promise<User> {
    return apiClient.get(`/users/${id}`)
  },

  async create(userData: {
    email: string
    firstName: string
    lastName: string
    password: string
    role?: string
    tenantId?: string
  }): Promise<User> {
    return apiClient.post('/users', userData)
  },

  async update(id: string, userData: Partial<{
    firstName: string
    lastName: string
    email: string
    role: string
    isActive: boolean
  }>): Promise<User> {
    return apiClient.put(`/users/${id}`, userData)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`)
  },

  async toggleStatus(id: string): Promise<User> {
    return apiClient.patch(`/users/${id}/toggle-status`)
  },

  async changePassword(id: string, newPassword: string): Promise<void> {
    return apiClient.patch(`/users/${id}/password`, { password: newPassword })
  }
}

// ===== ANALYTICS API =====

export interface AnalyticsTimeRange {
  start: Date
  end: Date
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface AnalyticsDashboardData {
  overview: {
    totalRisks: number
    criticalRisks: number
    evaluationsCompleted: number
    averageScore: number
    trends: {
      risks: any[]
      evaluations: any[]
      scores: any[]
    }
  }
  riskDistribution: any[]
  sectorAnalytics: any[]
  correlations: any[]
  timeSeriesData: any
  heatmapData: any
}

// Helper functions for API calls
const getAuthHeaders = () => {
  const token = localStorage.getItem('gamr_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP error! status: ${response.status}`)
  }
  return await response.json()
}

export const analyticsApi = {
  // Get comprehensive dashboard analytics
  getDashboard: async (timeRange: string = '30d'): Promise<ApiResponse<AnalyticsDashboardData>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard?timeRange=${timeRange}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get overview statistics only
  getOverview: async (timeRange: string = '30d'): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/overview?timeRange=${timeRange}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get risk distribution
  getRiskDistribution: async (timeRange: string = '30d'): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/risks/distribution?timeRange=${timeRange}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get sector analytics
  getSectorAnalytics: async (timeRange: string = '30d'): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/sectors?timeRange=${timeRange}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get correlation insights
  getCorrelations: async (timeRange: string = '30d'): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/correlations?timeRange=${timeRange}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get heatmap data
  getHeatmap: async (timeRange: string = '30d'): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/heatmap?timeRange=${timeRange}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get available time ranges
  getTimeRanges: async (): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/time-ranges`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Export analytics data
  exportData: async (timeRange: string = '30d', format: string = 'json'): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/analytics/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ timeRange, format })
    })
    return handleResponse(response)
  }
}

export const api = {
  riskSheets: riskSheetsApi,
  actions: actionsApi,
  evaluations: evaluationsApi,
  templates: templatesApi,
  notifications: notificationsApi,
  correlations: correlationsApi,
  audit: auditApi,
  tenants: tenantsApi,
  users: usersApi,
  analytics: analyticsApi
}
export { apiClient }
