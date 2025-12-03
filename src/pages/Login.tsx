import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Sparkles, Lock, Mail, Zap, Users, TrendingUp, BarChart3 } from 'lucide-react'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [securityIndex, setSecurityIndex] = useState(0)
  
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Security index animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityIndex(prev => {
        if (prev >= 52) return 0
        return prev + 1
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  const getSecurityColor = (value: number) => {
    if (value <= 10) return 'bg-red-500'
    if (value <= 20) return 'bg-red-400'
    if (value <= 30) return 'bg-orange-500'
    if (value <= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getSecurityLabel = (value: number) => {
    if (value <= 10) return 'Critique'
    if (value <= 20) return 'Élevé'
    if (value <= 30) return 'Modéré'
    if (value <= 40) return 'Faible'
    return 'Excellent'
  }

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          
          {/* Top Section - Branding */}
          <div className="text-center mb-12 space-y-6">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-gray-800">
                GAMRDIGITALE
              </h1>
              <p className="text-xl text-gray-600 font-medium">
                Plateforme Intelligente de Gestion des Risques
              </p>
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Sécurité Renforcée par l'IA</span>
              </div>
            </div>
          </div>

          {/* Security Index and Stats Row */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto">
            {/* Security Index Display */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Indice de Sécurité</h3>
                </div>
                
                {/* Security Index Bar */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getSecurityColor(securityIndex)} transition-all duration-300 ease-out rounded-full flex items-center justify-end pr-3`}
                        style={{ width: `${(securityIndex / 60) * 100}%` }}
                      >
                        <span className="text-white font-bold text-sm">{securityIndex}</span>
                      </div>
                    </div>
                    {/* Scale markers */}
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>1</span>
                      <span>10</span>
                      <span>20</span>
                      <span>30</span>
                      <span>40</span>
                      <span>50</span>
                      <span>60</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      securityIndex <= 10 ? 'bg-red-500/20 text-red-700' :
                      securityIndex <= 20 ? 'bg-red-400/20 text-red-700' :
                      securityIndex <= 30 ? 'bg-orange-500/20 text-orange-700' :
                      securityIndex <= 40 ? 'bg-yellow-500/20 text-yellow-700' :
                      'bg-green-500/20 text-green-700'
                    }`}>
                      {getSecurityLabel(securityIndex)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  Notre IA calcule automatiquement l'indice de sécurité de votre organisation
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:bg-white/70 transition-all duration-300 shadow-md">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">42</div>
                </div>
                <div className="text-xs text-gray-600">Objectifs d'évaluation</div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:bg-white/70 transition-all duration-300 shadow-md">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">IA</div>
                </div>
                <div className="text-xs text-gray-600">Assistant intelligent</div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:bg-white/70 transition-all duration-300 shadow-md">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">100%</div>
                </div>
                <div className="text-xs text-gray-600">Précision IA</div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:bg-white/70 transition-all duration-300 shadow-md">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">24/7</div>
                </div>
                <div className="text-xs text-gray-600">Surveillance</div>
              </div>
            </div>
          </div>

          {/* Login Form and Logo Row */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Login Form */}
            <div className="h-full">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg h-full">
                <CardHeader className="text-center space-y-4 pb-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      Connexion
                    </CardTitle>
                  </div>
                  <p className="text-gray-600">
                    Accédez à votre tableau de bord sécurisé
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Adresse email</span>
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        autoComplete="username"
                        disabled={isLoading}
                        className="bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Mot de passe</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLoading || !email || !password}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          Se connecter
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Logo Section */}
            <div className="flex justify-center lg:justify-end h-full">
              <div className="relative group h-full w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 h-full flex items-center justify-center shadow-lg">
                  <img
                    src="/images/logo.jpg"
                    alt="GAMRDIGITALE Logo"
                    className="w-64 h-64 object-contain rounded-lg"
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
