import React from 'react'
import { AdvancedAnalyticsDashboard } from '../components/AdvancedAnalyticsDashboard'
import { useAuth } from '../contexts/AuthContext'

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez être connecté pour accéder aux analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdvancedAnalyticsDashboard tenantId={user.tenant.id} />
      </div>
    </div>
  )
}
