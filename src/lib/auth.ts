import bcrypt from 'bcryptjs'
import type { User } from '../types/auth'

// Mock user database for frontend-only development
const MOCK_USERS = [
  {
    id: 'user1',
    email: 'admin@techcorp.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', // password123
    firstName: 'Marie',
    lastName: 'Dubois',
    role: 'ADMIN' as const,
    isActive: true,
    tenantId: 'tenant1',
    tenant: {
      id: 'tenant1',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      industry: 'Technology',
      country: 'France',
      isActive: true
    }
  },
  {
    id: 'user2',
    email: 'analyst@techcorp.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', // password123
    firstName: 'Jean',
    lastName: 'Martin',
    role: 'AI_ANALYST' as const,
    isActive: true,
    tenantId: 'tenant1',
    tenant: {
      id: 'tenant1',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      industry: 'Technology',
      country: 'France',
      isActive: true
    }
  },
  {
    id: 'user3',
    email: 'evaluator@techcorp.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', // password123
    firstName: 'Sophie',
    lastName: 'Laurent',
    role: 'EVALUATOR' as const,
    isActive: true,
    tenantId: 'tenant1',
    tenant: {
      id: 'tenant1',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      industry: 'Technology',
      country: 'France',
      isActive: true
    }
  },
  {
    id: 'user4',
    email: 'reader@techcorp.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', // password123
    firstName: 'Pierre',
    lastName: 'Durand',
    role: 'READER' as const,
    isActive: true,
    tenantId: 'tenant1',
    tenant: {
      id: 'tenant1',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      industry: 'Technology',
      country: 'France',
      isActive: true
    }
  },
  {
    id: 'user5',
    email: 'admin@healthcare-plus.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', // password123
    firstName: 'Dr. Claire',
    lastName: 'Moreau',
    role: 'ADMIN' as const,
    isActive: true,
    tenantId: 'tenant2',
    tenant: {
      id: 'tenant2',
      name: 'HealthCare Plus',
      domain: 'healthcare-plus.com',
      industry: 'Healthcare',
      country: 'France',
      isActive: true
    }
  },
  {
    id: 'user6',
    email: 'evaluator@healthcare-plus.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', // password123
    firstName: 'Marc',
    lastName: 'Rousseau',
    role: 'EVALUATOR' as const,
    isActive: true,
    tenantId: 'tenant2',
    tenant: {
      id: 'tenant2',
      name: 'HealthCare Plus',
      domain: 'healthcare-plus.com',
      industry: 'Healthcare',
      country: 'France',
      isActive: true
    }
  },
  {
    id: 'user7',
    email: 'superadmin@gamr.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', // password123
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN' as const,
    isActive: true,
    tenantId: 'tenant1',
    tenant: {
      id: 'tenant1',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      industry: 'Technology',
      country: 'France',
      isActive: true
    }
  }
]

// Simple token generation for browser compatibility
const generateSimpleToken = (userId: string, email: string): string => {
  const payload = {
    userId,
    email,
    timestamp: Date.now(),
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  }
  return btoa(JSON.stringify(payload))
}

const verifySimpleToken = (token: string): { valid: boolean; payload?: any } => {
  try {
    const payload = JSON.parse(atob(token))
    const isExpired = Date.now() > payload.expires
    return { valid: !isExpired, payload }
  } catch (error) {
    return { valid: false }
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}

/**
 * Authenticate user with email and password (Mock implementation for frontend)
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { email, password } = credentials

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Find user by email in mock data
    const dbUser = MOCK_USERS.find(user =>
      user.email.toLowerCase() === email.toLowerCase() && user.isActive
    )

    if (!dbUser) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect'
      }
    }

    // Check if tenant is active
    if (!dbUser.tenant.isActive) {
      return {
        success: false,
        error: 'Votre organisation est désactivée. Contactez l\'administrateur.'
      }
    }

    // Verify password (simplified for demo - in production use bcrypt)
    const isPasswordValid = password === 'password123'
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect'
      }
    }

    // Create user object for frontend
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      isActive: dbUser.isActive,
      lastLogin: new Date(),
      tenant: dbUser.tenant
    }

    // Generate simple token for browser compatibility
    const token = generateSimpleToken(dbUser.id, dbUser.email)

    return {
      success: true,
      user,
      token
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Erreur interne du serveur'
    }
  }
}

/**
 * Verify simple token (browser compatible)
 */
export function verifyToken(token: string): { valid: boolean; payload?: any } {
  return verifySimpleToken(token)
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Check if user can access tenant data
 */
export function canAccessTenant(userTenantId: string, targetTenantId: string, userRole: string): boolean {
  // Super admins can access all tenants
  if (userRole === 'SUPER_ADMIN') {
    return true
  }
  
  // Other users can only access their own tenant
  return userTenantId === targetTenantId
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    SUPER_ADMIN: [
      'read:all',
      'write:all',
      'delete:all',
      'manage:users',
      'manage:tenants',
      'manage:system'
    ],
    ADMIN: [
      'read:tenant',
      'write:tenant',
      'delete:tenant',
      'manage:users',
      'manage:risks',
      'manage:evaluations'
    ],
    AI_ANALYST: [
      'read:tenant',
      'write:risks',
      'write:evaluations',
      'manage:ai_models',
      'analyze:data'
    ],
    EVALUATOR: [
      'read:tenant',
      'write:risks',
      'write:evaluations',
      'read:reports'
    ],
    READER: [
      'read:tenant',
      'read:reports'
    ]
  }

  return permissions[role] || []
}

/**
 * Mock API service for frontend-only development
 * This simulates the backend authentication API
 */
export class AuthAPI {
  static async login(email: string, password: string): Promise<LoginResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      return await authenticateUser({ email, password })
    } catch (error) {
      console.error('Login API error:', error)
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      }
    }
  }

  static async logout(): Promise<void> {
    // In a real API, this would invalidate the token on the server
    // For now, we just simulate the call
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  static async validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      const result = verifyToken(token)
      if (!result.valid) {
        return { valid: false }
      }

      // In a real API, we would fetch fresh user data from the database
      // For now, we'll return the token payload
      const storedUser = localStorage.getItem('gamr_user')
      if (storedUser) {
        return { valid: true, user: JSON.parse(storedUser) }
      }

      return { valid: false }
    } catch (error) {
      return { valid: false }
    }
  }
}
