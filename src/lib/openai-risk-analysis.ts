// OpenAI Integration for Enhanced Risk Analysis

interface OpenAIConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  verbosity?: 'low' | 'medium' | 'high'
  reasoningEffort?: 'low' | 'medium' | 'high'
}

interface OpenAIResponse {
  score: number
  explanation: string
  positivePoints: string[]
  negativePoints: string[]
  otherPoints: string[]
  conclusion: string
  confidence: number
}

interface AnalysisRequest {
  systemPrompt: string
  userPrompt: string
  outputFormat: string
  criterion: 'probability' | 'vulnerability' | 'impact'
}

/**
 * OpenAI Risk Analysis Service
 * Integrates structured prompts with OpenAI API for real AI analysis
 */
export class OpenAIRiskAnalysisService {
  private config: OpenAIConfig
  private chatCompletionsURL = 'https://api.openai.com/v1/chat/completions'
  private responsesURL = 'https://api.openai.com/v1/responses'

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || import.meta.env.VITE_OPENAI_API_KEY || '',
      model: config.model || 'gpt-5',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.3
    }

    if (!this.config.apiKey) {
      console.warn('⚠️ OpenAI API key not provided. Set OPENAI_API_KEY environment variable.')
    }
  }

  /**
   * Analyzes a single criterion using OpenAI
   */
  async analyzeCriterion(request: AnalysisRequest): Promise<OpenAIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.')
    }

    try {
      // Build request depending on model family
      const isGpt5 = this.config.model?.startsWith('gpt-5')
      let url = this.chatCompletionsURL
      let payload: any
      if (isGpt5) {
        url = this.responsesURL
        const instructions = request.systemPrompt
        const input = `${request.userPrompt}\n\n${request.outputFormat}\n\nVeuillez analyser et répondre au format JSON spécifié.`
        payload = {
          model: this.config.model,
          instructions,
          input,
          stream: false,
          max_output_tokens: this.config.maxTokens,
          ...(this.config.verbosity ? { verbosity: this.config.verbosity } : {}),
          ...(this.config.reasoningEffort ? { reasoning_effort: this.config.reasoningEffort } : {}),
          text: { format: 'json' }
        }
      } else {
        const messages = [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: `${request.userPrompt}\n\n${request.outputFormat}\n\nVeuillez analyser et répondre au format JSON spécifié.` }
        ]
        payload = {
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          response_format: { type: 'json_object' }
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      // Try multiple shapes: chat completions or responses API
      let content = data.choices?.[0]?.message?.content
      if (!content && typeof data.output_text === 'string') {
        content = data.output_text
      }
      if (!content && Array.isArray(data.output)) {
        const first = data.output[0]
        // try different content shapes
        const textNode = first?.content?.find?.((c: any) => c.type === 'output_text' || c.type === 'text') || first?.content?.[0]
        content = textNode?.text || textNode?.text?.value || textNode?.value || textNode?.content
      }

      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      // Parse JSON response
      const parsedResponse = JSON.parse(content)
      
      // Validate and normalize response
      return await this.validateAndNormalizeResponse(parsedResponse, request.criterion)

    } catch (error) {
      console.error(`Error analyzing ${request.criterion}:`, error)
      
      // Return fallback response
      return this.getFallbackResponse(request.criterion, error.message)
    }
  }

  /**
   * Analyzes all three criteria in parallel
   */
  async analyzeAllCriteria(
    probabilityRequest: AnalysisRequest,
    vulnerabilityRequest: AnalysisRequest,
    impactRequest: AnalysisRequest
  ): Promise<{
    probability: OpenAIResponse,
    vulnerability: OpenAIResponse,
    impact: OpenAIResponse
  }> {
    try {
      // Analyze all criteria in parallel for better performance
      const [probability, vulnerability, impact] = await Promise.all([
        this.analyzeCriterion(probabilityRequest),
        this.analyzeCriterion(vulnerabilityRequest),
        this.analyzeCriterion(impactRequest)
      ])

      return { probability, vulnerability, impact }
    } catch (error) {
      console.error('Error in parallel analysis:', error)
      
      // Fallback to sequential analysis
      console.log('Falling back to sequential analysis...')
      
      const probability = await this.analyzeCriterion(probabilityRequest)
      await this.delay(1000) // Rate limiting
      
      const vulnerability = await this.analyzeCriterion(vulnerabilityRequest)
      await this.delay(1000) // Rate limiting
      
      const impact = await this.analyzeCriterion(impactRequest)

      return { probability, vulnerability, impact }
    }
  }

  /**
   * Validates and normalizes OpenAI response
   */
  private async validateAndNormalizeResponse(response: any, criterion: string): Promise<OpenAIResponse> {
    // Determine score range based on criterion
    const maxScore = criterion === 'probability' ? 3 : criterion === 'vulnerability' ? 4 : 5
    
    // Validate score
    let score = parseInt(response.score) || 2
    score = Math.max(1, Math.min(maxScore, score))

    // Validate arrays (raw)
    let positivePoints = Array.isArray(response.points_forts) 
      ? response.points_forts.filter((p: any) => typeof p === 'string' && p.length > 0)
      : Array.isArray(response.positivePoints)
      ? response.positivePoints.filter((p: any) => typeof p === 'string' && p.length > 0)
      : []

    let negativePoints = Array.isArray(response.points_faibles)
      ? response.points_faibles.filter((p: any) => typeof p === 'string' && p.length > 0)
      : Array.isArray(response.negativePoints)
      ? response.negativePoints.filter((p: any) => typeof p === 'string' && p.length > 0)
      : []

    let otherPoints: string[] = [];
    if (Array.isArray(response.otherPoints)) {
      otherPoints = response.otherPoints.filter((p: any) => typeof p === 'string' && p.length > 0);
    } else if (typeof response.otherPoints === 'string') {
      otherPoints = [response.otherPoints];
    }

    // Validate confidence
    let confidence = parseFloat(response.confiance) || parseFloat(response.confidence) || 0.7
    confidence = Math.max(0, Math.min(1, confidence))

    // Reclassify semantically when needed to avoid misplacement of negatives as positives
    try {
      const { reclassifyEvidencePoints } = await import('./semantic-reclassifier');
      if (typeof reclassifyEvidencePoints === 'function') {
        const { positivePoints: p2, negativePoints: n2, otherPoints: o2 } = await reclassifyEvidencePoints(positivePoints, negativePoints);
        positivePoints = p2;
        negativePoints = n2;
        otherPoints = o2;
      }
    } catch {
      // If semantic module not available, continue with basic lists
    }

    // Ensure we have at least some points
    if (positivePoints.length === 0) {
      positivePoints.push('Aucun élément positif spécifique identifié dans les évaluations')
    }
    if (negativePoints.length === 0) {
      negativePoints.push('Aucun élément négatif spécifique identifié dans les évaluations')
    }

    return {
      score,
      explanation: response.explication || response.explanation || `Analyse ${criterion} générée par IA`,
      positivePoints,
      negativePoints,
      otherPoints,
      conclusion: response.conclusion || `Score ${criterion}: ${score}/${maxScore}`,
      confidence
    };
  }

  /**
   * Returns fallback response when OpenAI fails
   */
  private getFallbackResponse(criterion: string, errorMessage: string): OpenAIResponse {
    const maxScore = criterion === 'probability' ? 3 : criterion === 'vulnerability' ? 4 : 5
    const defaultScore = Math.ceil(maxScore / 2) // Middle score

    return {
      score: defaultScore,
      explanation: `Analyse de base pour ${criterion} (erreur OpenAI: ${errorMessage})`,
      positivePoints: ['Analyse de base utilisée en raison d\'une erreur technique'],
      negativePoints: ['Données insuffisantes pour une analyse détaillée'],
      otherPoints: [],
      conclusion: `Score ${criterion}: ${defaultScore}/${maxScore} (analyse de base)`,
      confidence: 0.3
    };
  }

  /**
   * Rate limiting helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Tests OpenAI connection
   */
  async testConnection(): Promise<{ success: boolean, message: string }> {
    if (!this.config.apiKey) {
      return {
        success: false,
        message: 'OpenAI API key not configured'
      }
    }

    try {
      const isGpt5Test = this.config.model?.startsWith('gpt-5')
      const testURL = isGpt5Test ? this.responsesURL : this.chatCompletionsURL
      const testPayload: any = isGpt5Test
        ? {
            model: this.config.model,
            input: 'Test connection',
            max_output_tokens: 10,
            ...(this.config.verbosity ? { verbosity: this.config.verbosity } : {}),
            ...(this.config.reasoningEffort ? { reasoning_effort: this.config.reasoningEffort } : {}),
            text: { format: 'json' }
          }
        : {
            model: this.config.model,
            messages: [ { role: 'user', content: 'Test connection' } ],
            max_tokens: 10,
            temperature: 0
          }
      const response = await fetch(testURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      })

      if (response.ok) {
        return {
          success: true,
          message: `Connected to OpenAI ${this.config.model}`
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      }
    }
  }

  /**
   * Gets current configuration
   */
  getConfig(): Omit<OpenAIConfig, 'apiKey'> & { hasApiKey: boolean } {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      hasApiKey: !!this.config.apiKey
    }
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Default instance
export const openAIService = new OpenAIRiskAnalysisService()

// Helper function to create analysis requests from prompts
export function createAnalysisRequest(
  prompt: any,
  criterion: 'probability' | 'vulnerability' | 'impact'
): AnalysisRequest {
  return {
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    outputFormat: prompt.outputFormat,
    criterion
  }
}

// Environment configuration helper
export function configureOpenAI(config: Partial<OpenAIConfig>): void {
  openAIService.updateConfig(config)
}

// Connection test helper
export async function testOpenAIConnection(): Promise<{ success: boolean, message: string }> {
  return openAIService.testConnection()
}
