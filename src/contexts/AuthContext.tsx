import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi, handleApiError, apiClient } from '../lib/api'
import type { User, AuthContextType } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('gamr_user')
        const storedToken = localStorage.getItem('gamr_token')
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser)

          // Configurer le token dans l'apiClient
          apiClient.setToken(storedToken)

          // Validate token is not expired (simplified validation)
          try {
            setUser(userData)
            console.log('Session restaurée pour:', userData.email, 'Rôle:', userData.role)
          } catch (error) {
            // Invalid token, clear storage
            localStorage.removeItem('gamr_user')
            localStorage.removeItem('gamr_token')
            apiClient.clearToken()
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error)
        // Clear invalid data
        localStorage.removeItem('gamr_user')
        localStorage.removeItem('gamr_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)

      // Call authentication API
      const result = await authApi.login(email, password)

      if (result.user && result.token) {
        // Store user data and token
        localStorage.setItem('gamr_user', JSON.stringify(result.user))
        localStorage.setItem('gamr_token', result.token)

        // Convert API user to frontend user format
        const frontendUser = {
          ...result.user,
          lastLogin: result.user.lastLogin ? new Date(result.user.lastLogin) : undefined,
          tenant: {
            ...result.user.tenant,
            domain: result.user.tenant.slug, // Map slug to domain for compatibility
            industry: '', // Default value since sector doesn't exist in API response
            country: '', // Default value since location doesn't exist in API response
            isActive: result.user.tenant.isActive ?? true
          }
        }
        setUser(frontendUser)
        return { success: true }
      } else {
        return { success: false, error: 'Échec de la connexion' }
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = handleApiError(error)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear user data and token
      localStorage.removeItem('gamr_user')
      localStorage.removeItem('gamr_token')
      apiClient.clearToken()
      setUser(null)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('gamr_user', JSON.stringify(updatedUser))
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
