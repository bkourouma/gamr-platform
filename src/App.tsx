import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import { ProtectedRoute, EvaluatorRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { RiskSheets } from './pages/RiskSheets'
import { CreateRiskSheet } from './pages/CreateRiskSheet'
import { RiskSheetDetail } from './pages/RiskSheetDetail'
import { EditRiskSheet } from './pages/EditRiskSheet'
import { Evaluations } from './pages/Evaluations'
import { NewEvaluation } from './pages/NewEvaluation'
import { EvaluationDetail } from './pages/EvaluationDetail'
import { EvaluationQuestionnaire } from './pages/EvaluationQuestionnaire'
import { Templates } from './pages/Templates'
import { CreateTemplate } from './pages/CreateTemplate'
import { EditTemplate } from './pages/EditTemplate'
import { TemplateDetail } from './pages/TemplateDetail'
import { ActionsPage } from './pages/ActionsPage'
import { ReportsPage } from './pages/ReportsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { TenantsManagement } from './pages/TenantsManagement'
import { UsersManagement } from './pages/UsersManagement'
import { ChatPage } from './pages/ChatPage'

import { Login } from './pages/Login'
import { Layout } from './components/Layout'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/risks" element={
              <ProtectedRoute>
                <Layout>
                  <RiskSheets />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/risks/new" element={
              <EvaluatorRoute>
                <Layout>
                  <CreateRiskSheet />
                </Layout>
              </EvaluatorRoute>
            } />

            <Route path="/risks/:id" element={
              <ProtectedRoute>
                <Layout>
                  <RiskSheetDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/risks/:id/edit" element={
              <EvaluatorRoute>
                <Layout>
                  <EditRiskSheet />
                </Layout>
              </EvaluatorRoute>
            } />

            <Route path="/evaluations" element={
              <ProtectedRoute>
                <Layout>
                  <Evaluations />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/evaluations/new" element={
              <EvaluatorRoute>
                <Layout>
                  <NewEvaluation />
                </Layout>
              </EvaluatorRoute>
            } />

            <Route path="/evaluations/:id" element={
              <ProtectedRoute>
                <Layout>
                  <EvaluationDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/evaluations/:id/questionnaire" element={
              <EvaluatorRoute>
                <Layout>
                  <EvaluationQuestionnaire />
                </Layout>
              </EvaluatorRoute>
            } />

            <Route path="/templates" element={
              <ProtectedRoute>
                <Layout>
                  <Templates />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/templates/new" element={
              <EvaluatorRoute>
                <Layout>
                  <CreateTemplate />
                </Layout>
              </EvaluatorRoute>
            } />

            <Route path="/templates/:id" element={
              <ProtectedRoute>
                <Layout>
                  <TemplateDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/templates/:id/edit" element={
              <EvaluatorRoute>
                <Layout>
                  <EditTemplate />
                </Layout>
              </EvaluatorRoute>
            } />

            <Route path="/actions" element={
              <ProtectedRoute>
                <Layout>
                  <ActionsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <ReportsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/tenants" element={
              <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
                <Layout>
                  <TenantsManagement />
                </Layout>
              </ProtectedRoute>
            } />

			<Route path="/chat" element={
			  <ProtectedRoute>
				<Layout>
				  <ChatPage />
				</Layout>
			  </ProtectedRoute>
			} />
			
            <Route path="/users" element={
              <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                <Layout>
                  <UsersManagement />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </ToastProvider>
  )
}

export default App
