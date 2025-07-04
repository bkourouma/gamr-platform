import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Shield } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallbackPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Shield className="w-16 h-16 text-primary-600 mx-auto" />
            <Loader2 className="w-6 h-6 text-accent-600 animate-spin absolute -top-1 -right-1" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">GAMR</h2>
            <p className="text-gray-600">Vérification de l'authentification...</p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check role-based access if required roles are specified
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role)
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Accès refusé</h2>
                <p className="text-gray-600 mt-2">
                  Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm">
                <p className="font-medium text-red-800">Votre rôle actuel: {user.role}</p>
                <p className="text-red-600 mt-1">
                  Rôles requis: {requiredRoles.join(', ')}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      )
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

// Higher-order component for role-based protection
export const withRoleProtection = (
  Component: React.ComponentType<any>,
  requiredRoles: string[]
) => {
  return (props: any) => (
    <ProtectedRoute requiredRoles={requiredRoles}>
      <Component {...props} />
    </ProtectedRoute>
  )
}

// Specific role-based route components
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
    {children}
  </ProtectedRoute>
)

export const AnalystRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN', 'AI_ANALYST']}>
    {children}
  </ProtectedRoute>
)

export const EvaluatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN', 'AI_ANALYST', 'EVALUATOR']}>
    {children}
  </ProtectedRoute>
)

export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
    {children}
  </ProtectedRoute>
)
