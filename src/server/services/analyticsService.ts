import { prisma } from '../lib/prisma'
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface AnalyticsTimeRange {
  start: Date
  end: Date
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface TrendData {
  date: string
  value: number
  label: string
  change?: number
  changePercent?: number
}

export interface RiskDistribution {
  priority: string
  count: number
  percentage: number
  color: string
}

export interface SectorAnalytics {
  sector: string
  totalEvaluations: number
  averageScore: number
  riskLevel: string
  completionRate: number
  trends: TrendData[]
}

export interface CorrelationInsight {
  factor1: string
  factor2: string
  correlation: number
  significance: 'high' | 'medium' | 'low'
  description: string
}

export interface AnalyticsDashboardData {
  overview: {
    totalRisks: number
    criticalRisks: number
    evaluationsCompleted: number
    averageScore: number
    trends: {
      risks: TrendData[]
      evaluations: TrendData[]
      scores: TrendData[]
    }
  }
  riskDistribution: RiskDistribution[]
  sectorAnalytics: SectorAnalytics[]
  correlations: CorrelationInsight[]
  timeSeriesData: {
    riskCreation: TrendData[]
    evaluationCompletion: TrendData[]
    scoreEvolution: TrendData[]
  }
  heatmapData: {
    objectives: string[]
    sectors: string[]
    scores: number[][]
  }
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard data
   */
  static async getDashboardAnalytics(
    tenantId: string, 
    timeRange: AnalyticsTimeRange
  ): Promise<AnalyticsDashboardData> {
    const [
      overview,
      riskDistribution,
      sectorAnalytics,
      correlations,
      timeSeriesData,
      heatmapData
    ] = await Promise.all([
      this.getOverviewAnalytics(tenantId, timeRange),
      this.getRiskDistribution(tenantId, timeRange),
      this.getSectorAnalytics(tenantId, timeRange),
      this.getCorrelationInsights(tenantId, timeRange),
      this.getTimeSeriesData(tenantId, timeRange),
      this.getHeatmapData(tenantId, timeRange)
    ])

    return {
      overview,
      riskDistribution,
      sectorAnalytics,
      correlations,
      timeSeriesData,
      heatmapData
    }
  }

  /**
   * Get overview analytics with trends
   */
  private static async getOverviewAnalytics(
    tenantId: string, 
    timeRange: AnalyticsTimeRange
  ) {
    // Current period data
    const [risks, evaluations] = await Promise.all([
      prisma.riskSheet.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        }
      }),
      prisma.evaluation.findMany({
        where: {
          tenantId,
          completedAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        }
      })
    ])

    const totalRisks = risks.length
    const criticalRisks = risks.filter(r => r.priority === 'CRITICAL').length
    const evaluationsCompleted = evaluations.filter(e => e.status === 'COMPLETED').length
    const averageScore = evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0) / evaluations.length
      : 0

    // Generate trend data
    const riskTrends = await this.generateRiskTrends(tenantId, timeRange)
    const evaluationTrends = await this.generateEvaluationTrends(tenantId, timeRange)
    const scoreTrends = await this.generateScoreTrends(tenantId, timeRange)

    return {
      totalRisks,
      criticalRisks,
      evaluationsCompleted,
      averageScore: Math.round(averageScore * 100) / 100,
      trends: {
        risks: riskTrends,
        evaluations: evaluationTrends,
        scores: scoreTrends
      }
    }
  }

  /**
   * Generate risk creation trends
   */
  private static async generateRiskTrends(
    tenantId: string, 
    timeRange: AnalyticsTimeRange
  ): Promise<TrendData[]> {
    const periods = this.generateTimePeriods(timeRange)
    const trends: TrendData[] = []

    for (const period of periods) {
      const count = await prisma.riskSheet.count({
        where: {
          tenantId,
          createdAt: {
            gte: period.start,
            lte: period.end
          }
        }
      })

      trends.push({
        date: format(period.start, 'yyyy-MM-dd'),
        value: count,
        label: format(period.start, 'dd MMM', { locale: fr })
      })
    }

    // Calculate change percentages
    for (let i = 1; i < trends.length; i++) {
      const current = trends[i].value
      const previous = trends[i - 1].value
      trends[i].change = current - previous
      trends[i].changePercent = previous > 0 ? ((current - previous) / previous) * 100 : 0
    }

    return trends
  }

  /**
   * Generate evaluation completion trends
   */
  private static async generateEvaluationTrends(
    tenantId: string, 
    timeRange: AnalyticsTimeRange
  ): Promise<TrendData[]> {
    const periods = this.generateTimePeriods(timeRange)
    const trends: TrendData[] = []

    for (const period of periods) {
      const count = await prisma.evaluation.count({
        where: {
          tenantId,
          completedAt: {
            gte: period.start,
            lte: period.end
          },
          status: 'COMPLETED'
        }
      })

      trends.push({
        date: format(period.start, 'yyyy-MM-dd'),
        value: count,
        label: format(period.start, 'dd MMM', { locale: fr })
      })
    }

    return trends
  }

  /**
   * Generate score evolution trends
   */
  private static async generateScoreTrends(
    tenantId: string, 
    timeRange: AnalyticsTimeRange
  ): Promise<TrendData[]> {
    const periods = this.generateTimePeriods(timeRange)
    const trends: TrendData[] = []

    for (const period of periods) {
      const evaluations = await prisma.evaluation.findMany({
        where: {
          tenantId,
          completedAt: {
            gte: period.start,
            lte: period.end
          },
          status: 'COMPLETED',
          totalScore: { not: null }
        },
        select: { totalScore: true }
      })

      const averageScore = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0) / evaluations.length
        : 0

      trends.push({
        date: format(period.start, 'yyyy-MM-dd'),
        value: Math.round(averageScore * 100) / 100,
        label: format(period.start, 'dd MMM', { locale: fr })
      })
    }

    return trends
  }

  /**
   * Generate time periods for analysis
   */
  private static generateTimePeriods(timeRange: AnalyticsTimeRange) {
    const periods: { start: Date; end: Date }[] = []
    const { start, end, period } = timeRange

    let current = new Date(start)
    
    while (current <= end) {
      let periodEnd: Date

      switch (period) {
        case 'day':
          periodEnd = new Date(current)
          periodEnd.setDate(periodEnd.getDate() + 1)
          break
        case 'week':
          periodEnd = endOfWeek(current, { locale: fr })
          break
        case 'month':
          periodEnd = endOfMonth(current)
          break
        default:
          periodEnd = new Date(current)
          periodEnd.setDate(periodEnd.getDate() + 1)
      }

      periods.push({
        start: new Date(current),
        end: periodEnd > end ? end : periodEnd
      })

      switch (period) {
        case 'day':
          current.setDate(current.getDate() + 1)
          break
        case 'week':
          current.setDate(current.getDate() + 7)
          break
        case 'month':
          current.setMonth(current.getMonth() + 1)
          break
      }
    }

    return periods
  }

  /**
   * Get risk distribution by priority
   */
  private static async getRiskDistribution(
    tenantId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<RiskDistribution[]> {
    const risks = await prisma.riskSheet.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      select: { priority: true }
    })

    const total = risks.length
    const distribution = new Map<string, number>()

    risks.forEach(risk => {
      const priority = risk.priority
      distribution.set(priority, (distribution.get(priority) || 0) + 1)
    })

    const priorityColors = {
      'CRITICAL': '#ef4444',
      'HIGH': '#f59e0b',
      'MEDIUM': '#3b82f6',
      'LOW': '#22c55e',
      'VERY_LOW': '#6b7280'
    }

    return Array.from(distribution.entries()).map(([priority, count]) => ({
      priority,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: priorityColors[priority as keyof typeof priorityColors] || '#6b7280'
    }))
  }

  /**
   * Get sector-specific analytics
   */
  private static async getSectorAnalytics(
    tenantId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<SectorAnalytics[]> {
    const tenants = await prisma.tenant.findMany({
      where: { id: tenantId },
      select: { sector: true }
    })

    const evaluations = await prisma.evaluation.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      include: {
        tenant: {
          select: { sector: true }
        }
      }
    })

    const sectorMap = new Map<string, {
      evaluations: any[]
      completed: number
      totalScore: number
    }>()

    evaluations.forEach(evaluation => {
      const sector = evaluation.tenant.sector || 'Non spécifié'
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { evaluations: [], completed: 0, totalScore: 0 })
      }

      const sectorData = sectorMap.get(sector)!
      sectorData.evaluations.push(evaluation)

      if (evaluation.status === 'COMPLETED') {
        sectorData.completed++
        sectorData.totalScore += evaluation.totalScore || 0
      }
    })

    const analytics: SectorAnalytics[] = []

    for (const [sector, data] of sectorMap.entries()) {
      const averageScore = data.completed > 0 ? data.totalScore / data.completed : 0
      const completionRate = data.evaluations.length > 0
        ? (data.completed / data.evaluations.length) * 100
        : 0

      const riskLevel = this.determineRiskLevel(averageScore)
      const trends = await this.generateSectorTrends(tenantId, sector, timeRange)

      analytics.push({
        sector,
        totalEvaluations: data.evaluations.length,
        averageScore: Math.round(averageScore * 100) / 100,
        riskLevel,
        completionRate: Math.round(completionRate),
        trends
      })
    }

    return analytics
  }

  /**
   * Generate sector-specific trends
   */
  private static async generateSectorTrends(
    tenantId: string,
    sector: string,
    timeRange: AnalyticsTimeRange
  ): Promise<TrendData[]> {
    const periods = this.generateTimePeriods(timeRange)
    const trends: TrendData[] = []

    for (const period of periods) {
      const evaluations = await prisma.evaluation.findMany({
        where: {
          tenantId,
          completedAt: {
            gte: period.start,
            lte: period.end
          },
          status: 'COMPLETED',
          tenant: {
            sector: sector === 'Non spécifié' ? null : sector
          }
        },
        select: { totalScore: true }
      })

      const averageScore = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0) / evaluations.length
        : 0

      trends.push({
        date: format(period.start, 'yyyy-MM-dd'),
        value: Math.round(averageScore * 100) / 100,
        label: format(period.start, 'dd MMM', { locale: fr })
      })
    }

    return trends
  }

  /**
   * Determine risk level based on score
   */
  private static determineRiskLevel(score: number): string {
    if (score >= 80) return 'CRITIQUE'
    if (score >= 60) return 'ÉLEVÉ'
    if (score >= 40) return 'MOYEN'
    if (score >= 20) return 'FAIBLE'
    return 'TRÈS FAIBLE'
  }

  /**
   * Get correlation insights
   */
  private static async getCorrelationInsights(
    tenantId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<CorrelationInsight[]> {
    // This is a simplified correlation analysis
    // In a real implementation, you'd use statistical methods
    const insights: CorrelationInsight[] = [
      {
        factor1: 'Taille de l\'entreprise',
        factor2: 'Score de sécurité',
        correlation: 0.72,
        significance: 'high',
        description: 'Les grandes entreprises ont tendance à avoir de meilleurs scores de sécurité'
      },
      {
        factor1: 'Secteur technologique',
        factor2: 'Risques critiques',
        correlation: -0.45,
        significance: 'medium',
        description: 'Le secteur technologique présente moins de risques critiques physiques'
      },
      {
        factor1: 'Formation du personnel',
        factor2: 'Incidents de sécurité',
        correlation: -0.68,
        significance: 'high',
        description: 'Une meilleure formation réduit significativement les incidents'
      }
    ]

    return insights
  }

  /**
   * Get time series data for charts
   */
  private static async getTimeSeriesData(
    tenantId: string,
    timeRange: AnalyticsTimeRange
  ) {
    const riskCreation = await this.generateRiskTrends(tenantId, timeRange)
    const evaluationCompletion = await this.generateEvaluationTrends(tenantId, timeRange)
    const scoreEvolution = await this.generateScoreTrends(tenantId, timeRange)

    return {
      riskCreation,
      evaluationCompletion,
      scoreEvolution
    }
  }

  /**
   * Get heatmap data for objective vs sector analysis
   */
  private static async getHeatmapData(
    tenantId: string,
    timeRange: AnalyticsTimeRange
  ) {
    // Simplified heatmap data
    const objectives = [
      'Périmètre', 'Accès', 'Infrastructure', 'Personnel',
      'Communication', 'Sécurité incendie', 'Documentation'
    ]

    const sectors = ['Technologie', 'Santé', 'Finance', 'Industrie', 'Commerce']

    // Generate mock scores for demonstration
    const scores = sectors.map(() =>
      objectives.map(() => Math.floor(Math.random() * 100))
    )

    return {
      objectives,
      sectors,
      scores
    }
  }

  /**
   * Get predefined time ranges
   */
  static getTimeRanges(): { [key: string]: AnalyticsTimeRange } {
    const now = new Date()

    return {
      '7d': {
        start: subDays(now, 7),
        end: now,
        period: 'day'
      },
      '30d': {
        start: subDays(now, 30),
        end: now,
        period: 'day'
      },
      '3m': {
        start: subMonths(now, 3),
        end: now,
        period: 'week'
      },
      '6m': {
        start: subMonths(now, 6),
        end: now,
        period: 'month'
      },
      '1y': {
        start: subMonths(now, 12),
        end: now,
        period: 'month'
      }
    }
  }
}


