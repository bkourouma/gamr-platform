// AI Configuration Panel Component

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Settings, 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  TestTube,
  Zap
} from 'lucide-react'
import { testOpenAIConnection, OpenAIRiskAnalysisService } from '../lib/openai-risk-analysis'
import { aiConfig } from '../lib/ai-config'

interface AIConfigPanelProps {
  onConfigChange?: (config: any) => void
}

export function AIConfigPanel({ onConfigChange }: AIConfigPanelProps) {
  const [config, setConfig] = useState(aiConfig.getConfig())
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean
    success: boolean
    message: string
  }>({ tested: false, success: false, message: '' })
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const currentConfig = aiConfig.getConfig()
    setConfig(currentConfig)
  }, [])

  const handleConfigUpdate = (section: 'openai' | 'features', updates: any) => {
    const newConfig = {
      ...config,
      [section]: { ...config[section], ...updates }
    }
    setConfig(newConfig)
    setHasChanges(true)
    setConnectionStatus({ tested: false, success: false, message: '' })
  }

  const handleSaveConfig = () => {
    if (config.openai) {
      aiConfig.updateOpenAIConfig(config.openai)
    }
    if (config.features) {
      aiConfig.updateFeatures(config.features)
    }
    setHasChanges(false)
    onConfigChange?.(config)
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      // Create temporary service with current config
      const testService = new OpenAIRiskAnalysisService(config.openai)
      const result = await testService.testConnection()
      
      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.message
      })
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: `Test failed: ${error.message}`
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const validation = aiConfig.validateConfig()
  const status = aiConfig.getConfigStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span>Configuration IA - Analyse des Risques</span>
            {status.openai.configured ? (
              <Badge variant="default" className="ml-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configuré
              </Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">
                <XCircle className="w-3 h-3 mr-1" />
                Non configuré
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Configurez l'intégration OpenAI pour l'analyse IA avancée des risques avec citations et preuves.
          </div>
        </CardContent>
      </Card>

      {/* OpenAI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuration OpenAI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">Clé API OpenAI</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={config.openai.apiKey}
                  onChange={(e) => handleConfigUpdate('openai', { apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                onClick={handleTestConnection}
                disabled={!config.openai.apiKey || isTestingConnection}
                variant="outline"
                size="sm"
              >
                {isTestingConnection ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    <span>Test...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <TestTube className="w-4 h-4" />
                    <span>Tester</span>
                  </div>
                )}
              </Button>
            </div>
            {connectionStatus.tested && (
              <Alert className={connectionStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center space-x-2">
                  {connectionStatus.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={connectionStatus.success ? 'text-green-700' : 'text-red-700'}>
                    {connectionStatus.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Modèle OpenAI</Label>
            <select
              id="model"
              value={config.openai.model}
              onChange={(e) => handleConfigUpdate('openai', { model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpt-5">GPT-5 (Alpha)</option>
              <option value="gpt-4-turbo-preview">GPT-4 Turbo (Recommandé)</option>
              <option value="gpt-4">GPT-4 (Qualité maximale)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Économique)</option>
              <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
            </select>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Tokens Maximum</Label>
              <Input
                id="maxTokens"
                type="number"
                value={config.openai.maxTokens}
                onChange={(e) => handleConfigUpdate('openai', { maxTokens: parseInt(e.target.value) })}
                min="500"
                max="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Température</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={config.openai.temperature}
                onChange={(e) => handleConfigUpdate('openai', { temperature: parseFloat(e.target.value) })}
                min="0"
                max="1"
              />
              {String(config.openai.model || '').startsWith('gpt-5') && (
                <div className="text-xs text-gray-500">Ignorée pour GPT-5 (valeur par défaut: 1)</div>
              )}
            </div>
          </div>

          {/* GPT-5 specific parameters */}
          {String(config.openai.model || '').startsWith('gpt-5') && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="verbosity">Verbosity (GPT-5)</Label>
                <select
                  id="verbosity"
                  value={config.openai.verbosity || 'medium'}
                  onChange={(e) => handleConfigUpdate('openai', { verbosity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
                <div className="text-xs text-gray-500">Ajuste la longueur et la profondeur de la réponse.</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reasoningEffort">Reasoning effort (GPT-5)</Label>
                <select
                  id="reasoningEffort"
                  value={config.openai.reasoningEffort || 'high'}
                  onChange={(e) => handleConfigUpdate('openai', { reasoningEffort: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
                <div className="text-xs text-gray-500">Compromis entre rapidité et qualité du raisonnement.</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Fonctionnalités</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Analyse IA Activée</Label>
                <div className="text-sm text-gray-500">Active l'analyse IA des risques</div>
              </div>
              <Switch
                checked={config.features.enableAIAnalysis}
                onCheckedChange={(checked) => handleConfigUpdate('features', { enableAIAnalysis: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Prompts Structurés</Label>
                <div className="text-sm text-gray-500">Utilise des prompts avancés avec contexte</div>
              </div>
              <Switch
                checked={config.features.enableEnhancedPrompts}
                onCheckedChange={(checked) => handleConfigUpdate('features', { enableEnhancedPrompts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Citations d'Évidence</Label>
                <div className="text-sm text-gray-500">Inclut les citations des évaluations</div>
              </div>
              <Switch
                checked={config.features.enableEvidenceCitations}
                onCheckedChange={(checked) => handleConfigUpdate('features', { enableEvidenceCitations: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mode Simulation</Label>
                <div className="text-sm text-gray-500">Utilise des réponses simulées (test)</div>
              </div>
              <Switch
                checked={config.features.mockAIResponses}
                onCheckedChange={(checked) => handleConfigUpdate('features', { mockAIResponses: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Issues */}
      {!validation.isValid && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <div className="font-medium mb-2">Problèmes de configuration:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.issues.map((issue, index) => (
                <li key={index} className="text-sm">{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSaveConfig} className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Sauvegarder la Configuration</span>
          </Button>
        </div>
      )}
    </div>
  )
}
