import express from 'express'
import { AnalyticsService } from '../services/simpleAnalyticsService'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// GET /api/analytics/dashboard - Get comprehensive dashboard analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { timeRange = '30d' } = req.query

    // Get time range configuration
    const timeRanges = AnalyticsService.getTimeRanges()
    const selectedTimeRange = timeRanges[timeRange as string]

    if (!selectedTimeRange) {
      return res.status(400).json({
        error: 'Période invalide',
        availableRanges: Object.keys(timeRanges)
      })
    }

    // Get analytics data
    const analyticsData = await AnalyticsService.getDashboardAnalytics(
      tenantId,
      selectedTimeRange
    )

    res.json({
      success: true,
      data: analyticsData,
      timeRange: {
        selected: timeRange,
        start: selectedTimeRange.start,
        end: selectedTimeRange.end,
        period: selectedTimeRange.period
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Une erreur est survenue'
    })
  }
})

// GET /api/analytics/overview - Get overview statistics only
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { timeRange = '30d' } = req.query

    const timeRanges = AnalyticsService.getTimeRanges()
    const selectedTimeRange = timeRanges[timeRange as string]

    if (!selectedTimeRange) {
      return res.status(400).json({
        error: 'Période invalide'
      })
    }

    const fullData = await AnalyticsService.getDashboardAnalytics(
      tenantId,
      selectedTimeRange
    )

    res.json({
      success: true,
      data: fullData.overview
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'overview:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur'
    })
  }
})

// GET /api/analytics/risks/distribution - Get risk distribution data
router.get('/risks/distribution', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { timeRange = '30d' } = req.query

    const timeRanges = AnalyticsService.getTimeRanges()
    const selectedTimeRange = timeRanges[timeRange as string]

    if (!selectedTimeRange) {
      return res.status(400).json({
        error: 'Période invalide'
      })
    }

    const fullData = await AnalyticsService.getDashboardAnalytics(
      tenantId,
      selectedTimeRange
    )

    res.json({
      success: true,
      data: fullData.riskDistribution
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de la distribution des risques:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur'
    })
  }
})

// GET /api/analytics/sectors - Get sector analytics
router.get('/sectors', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { timeRange = '30d' } = req.query

    const timeRanges = AnalyticsService.getTimeRanges()
    const selectedTimeRange = timeRanges[timeRange as string]

    if (!selectedTimeRange) {
      return res.status(400).json({
        error: 'Période invalide'
      })
    }

    const fullData = await AnalyticsService.getDashboardAnalytics(
      tenantId,
      selectedTimeRange
    )

    res.json({
      success: true,
      data: fullData.sectorAnalytics
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics sectorielles:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur'
    })
  }
})

// GET /api/analytics/correlations - Get correlation insights
router.get('/correlations', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { timeRange = '30d' } = req.query

    const timeRanges = AnalyticsService.getTimeRanges()
    const selectedTimeRange = timeRanges[timeRange as string]

    if (!selectedTimeRange) {
      return res.status(400).json({
        error: 'Période invalide'
      })
    }

    const fullData = await AnalyticsService.getDashboardAnalytics(
      tenantId,
      selectedTimeRange
    )

    res.json({
      success: true,
      data: fullData.correlations
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des corrélations:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur'
    })
  }
})

// GET /api/analytics/heatmap - Get heatmap data
router.get('/heatmap', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { timeRange = '30d' } = req.query

    const timeRanges = AnalyticsService.getTimeRanges()
    const selectedTimeRange = timeRanges[timeRange as string]

    if (!selectedTimeRange) {
      return res.status(400).json({
        error: 'Période invalide'
      })
    }

    const fullData = await AnalyticsService.getDashboardAnalytics(
      tenantId,
      selectedTimeRange
    )

    res.json({
      success: true,
      data: fullData.heatmapData
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de la heatmap:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur'
    })
  }
})

// GET /api/analytics/time-ranges - Get available time ranges
router.get('/time-ranges', authenticateToken, async (req, res) => {
  try {
    const timeRanges = AnalyticsService.getTimeRanges()
    
    const formattedRanges = Object.entries(timeRanges).map(([key, range]) => ({
      key,
      label: {
        '7d': '7 derniers jours',
        '30d': '30 derniers jours',
        '3m': '3 derniers mois',
        '6m': '6 derniers mois',
        '1y': '1 an'
      }[key] || key,
      start: range.start,
      end: range.end,
      period: range.period
    }))

    res.json({
      success: true,
      data: formattedRanges
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des périodes:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur'
    })
  }
})

// POST /api/analytics/export - Export analytics data
router.post('/export', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { timeRange = '30d', format = 'json' } = req.body

    const timeRanges = AnalyticsService.getTimeRanges()
    const selectedTimeRange = timeRanges[timeRange as string]

    if (!selectedTimeRange) {
      return res.status(400).json({
        error: 'Période invalide'
      })
    }

    const analyticsData = await AnalyticsService.getDashboardAnalytics(
      tenantId,
      selectedTimeRange
    )

    if (format === 'csv') {
      // TODO: Implement CSV export
      res.status(501).json({
        error: 'Export CSV non encore implémenté'
      })
      return
    }

    // JSON export
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json"`)
    
    res.json({
      exportDate: new Date().toISOString(),
      timeRange: {
        selected: timeRange,
        start: selectedTimeRange.start,
        end: selectedTimeRange.end
      },
      data: analyticsData
    })

  } catch (error) {
    console.error('Erreur lors de l\'export des analytics:', error)
    res.status(500).json({
      error: 'Erreur interne du serveur'
    })
  }
})

export { router as analyticsRouter }


