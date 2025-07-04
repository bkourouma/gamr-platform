// Analytics type definitions

export interface TrendData {
  date: string
  value: number
  label?: string
}

export interface RiskDistribution {
  priority: string
  count: number
  percentage: number
  color?: string
}

export interface SectorAnalytics {
  sector: string
  riskCount: number
  averageScore: number
  criticalRisks: number
  totalEvaluations: number
  completionRate: number
  riskLevel: string
  color?: string
}

export interface CorrelationInsight {
  id: string
  title: string
  description: string
  correlation: number
  confidence: number
  type: 'positive' | 'negative' | 'neutral'
  factors: string[]
  factor1: string
  factor2: string
  significance: string
}

export interface PredictiveInsight {
  id: string
  metric: string
  trend: 'increasing' | 'decreasing' | 'stable'
  prediction: number
  confidence: number
  timeframe: string
  description: string
}

export interface AnomalyData {
  id: string
  timestamp: string
  metric: string
  value: number
  expectedValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface AnalyticsOverview {
  totalRisks: number
  criticalRisks: number
  completedActions: number
  pendingEvaluations: number
  averageRiskScore: number
  riskTrend: 'up' | 'down' | 'stable'
}

export interface AnalyticsDashboardData {
  overview: AnalyticsOverview
  trends: TrendData[]
  riskDistribution: RiskDistribution[]
  sectorAnalytics: SectorAnalytics[]
  correlations: CorrelationInsight[]
  timeSeriesData: any
  heatmapData: any
}

export interface EnhancedAnalyticsData {
  predictiveInsights: PredictiveInsight[]
  anomalies: AnomalyData[]
  objectivePerformance: any[]
  correlationMatrix: number[][]
  correlationLabels: string[]
  aiInsights: {
    summary: string
    keyFindings: string[]
    recommendations: string[]
    riskTrends: string[]
  }
}
