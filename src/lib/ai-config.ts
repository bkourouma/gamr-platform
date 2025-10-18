// AI Configuration Management for GAMR Platform

interface AIConfig {
  openai: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
    timeout: number
    maxConcurrentRequests: number
    verbosity?: 'low' | 'medium' | 'high'
    reasoningEffort?: 'low' | 'medium' | 'high'
  }
  features: {
    enableAIAnalysis: boolean
    enableEnhancedPrompts: boolean
    enableEvidenceCitations: boolean
    mockAIResponses: boolean
    enableDebugLogging: boolean
  }
}

/**
 * AI Configuration Manager
 * Handles configuration for OpenAI and other AI services
 */
export class AIConfigManager {
  private static instance: AIConfigManager
  private config: AIConfig

  private constructor() {
    this.config = this.loadConfiguration()
  }

  public static getInstance(): AIConfigManager {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager()
    }
    return AIConfigManager.instance
  }

  /**
   * Loads configuration from environment variables
   */
  private loadConfiguration(): AIConfig {
    return {
      openai: {
        apiKey: this.getEnvVar('OPENAI_API_KEY', ''),
        model: this.getEnvVar('OPENAI_MODEL', 'gpt-5'),
        maxTokens: parseInt(this.getEnvVar('OPENAI_MAX_TOKENS', '2000')),
        temperature: parseFloat(this.getEnvVar('OPENAI_TEMPERATURE', '0.3')),
        timeout: parseInt(this.getEnvVar('AI_ANALYSIS_TIMEOUT', '30000')),
        maxConcurrentRequests: parseInt(this.getEnvVar('MAX_CONCURRENT_AI_REQUESTS', '3')),
        verbosity: (this.getEnvVar('OPENAI_VERBOSITY', 'medium') as any),
        reasoningEffort: (this.getEnvVar('OPENAI_REASONING_EFFORT', 'high') as any)
      },
      features: {
        enableAIAnalysis: this.getBooleanEnvVar('ENABLE_AI_ANALYSIS', true),
        enableEnhancedPrompts: this.getBooleanEnvVar('ENABLE_ENHANCED_PROMPTS', true),
        enableEvidenceCitations: this.getBooleanEnvVar('ENABLE_EVIDENCE_CITATIONS', true),
        mockAIResponses: this.getBooleanEnvVar('MOCK_AI_RESPONSES', false),
        enableDebugLogging: this.getBooleanEnvVar('ENABLE_DEBUG_LOGGING', false)
      }
    }
  }

  /**
   * Gets environment variable with fallback
   */
  private getEnvVar(name: string, defaultValue: string): string {
    // In Vite, environment variables are available via import.meta.env
    // and must be prefixed with VITE_ to be available in the browser
    const viteEnvName = name.startsWith('VITE_') ? name : `VITE_${name}`

    if (import.meta.env && import.meta.env[viteEnvName]) {
      return import.meta.env[viteEnvName] || defaultValue
    }

    // Fallback for Node.js environment (SSR, build time)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name] || defaultValue
    }

    return defaultValue
  }

  /**
   * Gets boolean environment variable
   */
  private getBooleanEnvVar(name: string, defaultValue: boolean): boolean {
    const value = this.getEnvVar(name, defaultValue.toString()).toLowerCase()
    return value === 'true' || value === '1' || value === 'yes'
  }

  /**
   * Gets OpenAI configuration
   */
  public getOpenAIConfig() {
    return { ...this.config.openai }
  }

  /**
   * Gets feature flags
   */
  public getFeatures() {
    return { ...this.config.features }
  }

  /**
   * Gets complete configuration
   */
  public getConfig(): AIConfig {
    return JSON.parse(JSON.stringify(this.config))
  }

  /**
   * Updates OpenAI configuration
   */
  public updateOpenAIConfig(updates: Partial<AIConfig['openai']>): void {
    this.config.openai = { ...this.config.openai, ...updates }
  }

  /**
   * Updates feature flags
   */
  public updateFeatures(updates: Partial<AIConfig['features']>): void {
    this.config.features = { ...this.config.features, ...updates }
  }

  /**
   * Validates configuration
   */
  public validateConfig(): { isValid: boolean, issues: string[] } {
    const issues: string[] = []

    // Validate OpenAI configuration
    if (this.config.features.enableAIAnalysis && !this.config.features.mockAIResponses) {
      if (!this.config.openai.apiKey) {
        issues.push('OpenAI API key is required when AI analysis is enabled')
      }
      
      if (this.config.openai.maxTokens < 500) {
        issues.push('OpenAI max tokens should be at least 500 for quality analysis')
      }
      
      if (this.config.openai.temperature < 0 || this.config.openai.temperature > 1) {
        issues.push('OpenAI temperature should be between 0 and 1')
      }
      
      if (this.config.openai.timeout < 5000) {
        issues.push('AI analysis timeout should be at least 5 seconds')
      }
    }

    // Validate model availability
    const supportedModels = [
      'gpt-5',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ]
    
    if (!supportedModels.includes(this.config.openai.model)) {
      issues.push(`Unsupported OpenAI model: ${this.config.openai.model}`)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Gets configuration status for display
   */
  public getConfigStatus(): {
    openai: { configured: boolean, model: string, hasApiKey: boolean }
    features: AIConfig['features']
    validation: { isValid: boolean, issues: string[] }
  } {
    const validation = this.validateConfig()
    
    return {
      openai: {
        configured: !!this.config.openai.apiKey,
        model: this.config.openai.model,
        hasApiKey: !!this.config.openai.apiKey
      },
      features: this.config.features,
      validation
    }
  }

  /**
   * Logs configuration status (for debugging)
   */
  public logConfigStatus(): void {
    if (!this.config.features.enableDebugLogging) return

    const status = this.getConfigStatus()
    
    console.log('🔧 AI Configuration Status:')
    console.log(`  OpenAI Configured: ${status.openai.configured ? '✅' : '❌'}`)
    console.log(`  Model: ${status.openai.model}`)
    console.log(`  AI Analysis: ${status.features.enableAIAnalysis ? '✅' : '❌'}`)
    console.log(`  Enhanced Prompts: ${status.features.enableEnhancedPrompts ? '✅' : '❌'}`)
    console.log(`  Evidence Citations: ${status.features.enableEvidenceCitations ? '✅' : '❌'}`)
    console.log(`  Mock Responses: ${status.features.mockAIResponses ? '✅' : '❌'}`)
    
    if (!status.validation.isValid) {
      console.warn('⚠️ Configuration Issues:')
      status.validation.issues.forEach(issue => console.warn(`  - ${issue}`))
    }
  }
}

// Singleton instance
export const aiConfig = AIConfigManager.getInstance()

// Convenience functions
export function getOpenAIConfig() {
  return aiConfig.getOpenAIConfig()
}

export function getAIFeatures() {
  return aiConfig.getFeatures()
}

export function isAIAnalysisEnabled(): boolean {
  const features = aiConfig.getFeatures()
  return features.enableAIAnalysis
}

export function shouldUseMockResponses(): boolean {
  const features = aiConfig.getFeatures()
  return features.mockAIResponses || !features.enableAIAnalysis
}

export function validateAIConfig() {
  return aiConfig.validateConfig()
}

// Initialize and log configuration on import
if (typeof window === 'undefined') {
  // Server-side initialization
  aiConfig.logConfigStatus()
}
