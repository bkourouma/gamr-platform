// Main types for the GAMR platform

// User and Authentication types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AI_ANALYST' | 'EVALUATOR' | 'READER'
  isActive: boolean
  lastLogin?: Date
  tenant: {
    id: string
    name: string
    domain: string
    industry: string
    country: string
    isActive: boolean
  }
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (user: User) => void
}

// Notification types - SUPPRIMÉ: utiliser le type depuis /src/lib/api.ts

// Risk Sheet types
export interface RiskSheet {
  id: string
  target: string
  scenario: string
  probability: number
  vulnerability: number
  impact: number
  riskScore: number
  priority: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category?: string
  tags?: any
  aiSuggestions?: any
  version: number
  isArchived: boolean
  reviewDate?: Date
  createdAt: Date
  updatedAt: Date
  tenantId: string
  authorId: string
  author?: User
  sourceEvaluationId?: string
}

// Action types
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

// Tenant types
export interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  sector?: string
  size?: string
  location?: string
  riskLevels?: any
  threatTypes?: any
  reviewFrequency?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Evaluation types
export interface Evaluation {
  id: string
  title: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'VALIDATED' | 'ARCHIVED'
  startedAt?: Date
  completedAt?: Date
  progress: number
  totalScore?: number
  riskLevel?: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  entityInfo?: any
  templateId: string
  tenantId: string
  evaluatorId: string
  createdAt: Date
  updatedAt: Date
}

// Correlation types
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

// Audit Log types
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

// Pagination types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface CreateRiskSheetData {
  target: string
  scenario: string
  probability: number
  vulnerability: number
  impact: number
  category?: string
}

export interface CreateActionData {
  title: string
  description: string
  dueDate?: Date
  priority: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  assigneeId?: string
  riskSheetId: string
}

export interface CreateNotificationData {
  title: string
  message: string
  type: 'RISK_CRITICAL' | 'ACTION_OVERDUE' | 'REVIEW_DUE' | 'AI_ALERT' | 'CORRELATION_ALERT' | 'SYSTEM'
  userId?: string
}

// Filter types
export interface RiskSheetFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  priority?: string
  isArchived?: boolean
}

export interface ActionFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  assigneeId?: string
  riskSheetId?: string
}

export interface NotificationFilters {
  page?: number
  limit?: number
  unreadOnly?: boolean
  type?: string
}

// Statistics types
export interface DashboardStats {
  totalRisks: number
  criticalRisks: number
  highRisks: number
  recentRisks: number
  risksByCategory: Array<{ category: string; count: number }>
  totalActions: number
  overdueActions: number
  completedActions: number
  unreadNotifications: number
}
