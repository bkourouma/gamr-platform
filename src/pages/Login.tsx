import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Sparkles } from 'lucide-react'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Échec de la connexion')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const testAccounts = [
    { email: 'admin@techcorp.com', role: 'ADMIN', name: 'Marie Dubois', org: 'TechCorp Solutions' },
    { email: 'analyst@techcorp.com', role: 'AI_ANALYST', name: 'Jean Martin', org: 'TechCorp Solutions' },
    { email: 'evaluator@techcorp.com', role: 'EVALUATOR', name: 'Sophie Laurent', org: 'TechCorp Solutions' },
    { email: 'reader@techcorp.com', role: 'READER', name: 'Pierre Durand', org: 'TechCorp Solutions' },
    { email: 'admin@healthcare-plus.com', role: 'ADMIN', name: 'Dr. Claire Moreau', org: 'HealthCare Plus' },
    { email: 'superadmin@gamr.com', role: 'SUPER_ADMIN', name: 'Super Admin', org: 'GAMR Platform' },
  ]

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail)
    setPassword('password123')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Shield className="w-16 h-16 text-primary-600" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full animate-pulse-soft flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient">GAMR</h1>
                <p className="text-lg text-gray-600">Plateforme Intelligente de Gestion des Risques</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Sécurisez votre organisation avec l'IA
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Analysez, évaluez et gérez vos risques de sécurité avec notre plateforme 
                intelligente multi-tenant. Bénéficiez d'analyses prédictives et de 
                recommandations personnalisées.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-xl border border-primary-100">
                <div className="text-2xl font-bold text-primary-600">42</div>
                <div className="text-sm text-gray-600">Objectifs d'évaluation</div>
              </div>
              <div className="glass p-4 rounded-xl border border-accent-100">
                <div className="text-2xl font-bold text-accent-600">IA</div>
                <div className="text-sm text-gray-600">Assistant intelligent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md mx-auto space-y-6">
          <Card className="shadow-xl border-0 glass">
            <CardHeader className="text-center space-y-2">
              <div className="flex lg:hidden items-center justify-center space-x-3 mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
                <span className="text-2xl font-bold text-gradient">GAMR</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Connexion
              </CardTitle>
              <p className="text-gray-600">
                Accédez à votre tableau de bord sécurisé
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>

              {/* Test accounts */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Comptes de test disponibles:
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {testAccounts.map((account, index) => (
                    <button
                      key={index}
                      onClick={() => fillTestAccount(account.email)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                      disabled={isLoading}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-primary-700">
                            {account.name}
                          </div>
                          <div className="text-xs text-gray-500">{account.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-primary-600">{account.role}</div>
                          <div className="text-xs text-gray-500">{account.org}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Mot de passe pour tous les comptes: <code className="bg-gray-100 px-1 rounded">password123</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
