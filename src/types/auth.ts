// Authentication types for the GAMR platform

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

// Note: LoginCredentials and LoginResponse are now defined in ../lib/auth.ts
// to avoid circular import issues

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
