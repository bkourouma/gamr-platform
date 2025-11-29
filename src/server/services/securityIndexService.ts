import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SecurityIndexComponents {
  evaluationScore: number        // Score Évaluations (1-60 selon méthodologie GAMR)
  correctiveActionCoverage: number  // Couverture Actions Correctives (1-60)
  criticalRisksResolutionRate: number  // Taux Résolution Risques Critiques (1-60)
  securityObjectivesCompliance: number  // Conformité Objectifs Sécurité (1-60)
  globalSecurityIndex: number    // Indice Global GAMR (1-60)
}

/**
 * Service pour calculer l'Indice Global de Sécurité selon la méthodologie GAMR
 * L'indice GAMR s'étend de 1 à 60, avec :
 * - 1-15 : Risque Faible (Sécurité satisfaisante)
 * - 15-30 : Risque Moyen-Faible (Sécurité acceptable)
 * - 30-45 : Risque Moyen-Élevé (Sécurité préoccupante)
 * - 45-60 : Risque Élevé (Sécurité critique)
 * 
 * Algorithme de calcul :
 * Indice de Sécurité GAMR = (
 *   Score Évaluations × 40% +
 *   Couverture Actions Correctives × 30% +
 *   Taux Résolution Risques Critiques × 20% +
 *   Conformité Objectifs Sécurité × 10%
 * )
 * Tous les composants sont normalisés sur l'échelle GAMR (1-60)
 */
export class SecurityIndexService {
  /**
   * Calcule l'Indice Global de Sécurité pour un tenant
   */
  static async calculateSecurityIndex(tenantId: string): Promise<SecurityIndexComponents> {
    // Récupérer toutes les données nécessaires en parallèle
    const [
      evaluations,
      criticalRisks,
      allActions,
      allRisks
    ] = await Promise.all([
      // Évaluations complétées avec leurs scores
      prisma.evaluation.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
          totalScore: { not: null }
        },
        select: {
          totalScore: true
        }
      }),
      
      // Risques critiques non archivés
      prisma.riskSheet.findMany({
        where: {
          tenantId,
          isArchived: false,
          priority: 'CRITICAL'
        },
        include: {
          actions: {
            select: {
              id: true,
              status: true,
              completedAt: true
            }
          }
        }
      }),
      
      // Toutes les actions correctives
      prisma.action.findMany({
        where: {
          tenantId,
          status: { not: 'CANCELLED' }
        },
        select: {
          id: true,
          riskSheetId: true,
          status: true,
          completedAt: true
        }
      }),
      
      // Tous les risques non archivés
      prisma.riskSheet.findMany({
        where: {
          tenantId,
          isArchived: false
        },
        include: {
          actions: {
            select: {
              id: true,
              status: true
            }
          }
        }
      })
    ])

    // 1. Calculer le Score Évaluations (40%)
    const evaluationScore = this.calculateEvaluationScore(evaluations)

    // 2. Calculer la Couverture Actions Correctives (30%)
    // Pourcentage de risques critiques qui ont au moins une action corrective
    const correctiveActionCoverage = this.calculateCorrectiveActionCoverage(criticalRisks)

    // 3. Calculer le Taux Résolution Risques Critiques (20%)
    // Pourcentage de risques critiques qui ont au moins une action complétée
    const criticalRisksResolutionRate = this.calculateCriticalRisksResolutionRate(criticalRisks)

    // 4. Calculer la Conformité Objectifs Sécurité (10%)
    // Basé sur le ratio d'actions complétées par rapport aux actions planifiées pour les risques critiques
    const securityObjectivesCompliance = this.calculateSecurityObjectivesCompliance(criticalRisks)

    // 5. Calculer l'Indice Global pondéré (sur échelle GAMR 1-60)
    const globalSecurityIndex = 
      evaluationScore * 0.40 +
      correctiveActionCoverage * 0.30 +
      criticalRisksResolutionRate * 0.20 +
      securityObjectivesCompliance * 0.10

    // S'assurer que l'indice est dans la plage GAMR (1-60)
    const clampedIndex = Math.max(1, Math.min(60, globalSecurityIndex))

    return {
      evaluationScore: Math.round(evaluationScore * 10) / 10,
      correctiveActionCoverage: Math.round(correctiveActionCoverage * 10) / 10,
      criticalRisksResolutionRate: Math.round(criticalRisksResolutionRate * 10) / 10,
      securityObjectivesCompliance: Math.round(securityObjectivesCompliance * 10) / 10,
      globalSecurityIndex: Math.round(clampedIndex * 10) / 10
    }
  }

  /**
   * 1. Score Évaluations (40%)
   * Moyenne des scores des évaluations complétées, normalisée sur l'échelle GAMR (1-60)
   * Les scores d'évaluation peuvent être sur différentes échelles, on les normalise en GAMR
   */
  private static calculateEvaluationScore(evaluations: Array<{ totalScore: number | null }>): number {
    if (evaluations.length === 0) return 1 // Minimum GAMR

    const validScores = evaluations
      .map(e => e.totalScore)
      .filter((score): score is number => score !== null && score !== undefined)

    if (validScores.length === 0) return 1 // Minimum GAMR

    const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    
    // Normaliser sur l'échelle GAMR (1-60)
    // Si les scores sont sur 0-100, on les convertit en 1-60
    // Si les scores sont déjà sur 1-60, on les garde tels quels
    let normalizedScore: number
    
    if (averageScore <= 60) {
      // Déjà sur l'échelle GAMR ou inférieur, garder tel quel
      normalizedScore = Math.max(1, Math.min(60, averageScore))
    } else {
      // Score sur 0-100, convertir en 1-60
      // Formule : (score / 100) * 59 + 1 pour avoir une plage de 1-60
      normalizedScore = Math.max(1, Math.min(60, (averageScore / 100) * 59 + 1))
    }
    
    return normalizedScore
  }

  /**
   * 2. Couverture Actions Correctives (30%)
   * Convertit le pourcentage en échelle GAMR (1-60)
   * Si aucun risque critique, on considère que la sécurité est bonne (1 = risque faible)
   */
  private static calculateCorrectiveActionCoverage(
    criticalRisks: Array<{
      id: string
      actions: Array<{ id: string; status: string }>
    }>
  ): number {
    // Si aucun risque critique, sécurité excellente (1 = risque faible sur échelle GAMR)
    if (criticalRisks.length === 0) return 1

    const risksWithActions = criticalRisks.filter(risk => risk.actions.length > 0)
    const coveragePercentage = (risksWithActions.length / criticalRisks.length) * 100
    
    // Convertir le pourcentage (0-100%) en échelle GAMR (1-60)
    // 100% de couverture = 1 (risque faible), 0% = 60 (risque élevé)
    // Formule inversée : 60 - (pourcentage / 100) * 59
    return Math.max(1, Math.min(60, 60 - (coveragePercentage / 100) * 59))
  }

  /**
   * 3. Taux Résolution Risques Critiques (20%)
   * Convertit le pourcentage en échelle GAMR (1-60)
   * Si aucun risque critique, on considère que la résolution est complète (1 = risque faible)
   */
  private static calculateCriticalRisksResolutionRate(
    criticalRisks: Array<{
      id: string
      actions: Array<{ id: string; status: string; completedAt: Date | null }>
    }>
  ): number {
    // Si aucun risque critique, sécurité excellente (1 = risque faible)
    if (criticalRisks.length === 0) return 1

    const risksWithCompletedActions = criticalRisks.filter(risk =>
      risk.actions.some(action => action.status === 'COMPLETED')
    )
    
    const resolutionPercentage = (risksWithCompletedActions.length / criticalRisks.length) * 100
    
    // Convertir le pourcentage (0-100%) en échelle GAMR (1-60)
    // 100% de résolution = 1 (risque faible), 0% = 60 (risque élevé)
    return Math.max(1, Math.min(60, 60 - (resolutionPercentage / 100) * 59))
  }

  /**
   * 4. Conformité Objectifs Sécurité (10%)
   * Convertit le ratio en échelle GAMR (1-60)
   * Si aucune action pour les risques critiques, on considère la conformité comme complète (1 = risque faible)
   */
  private static calculateSecurityObjectivesCompliance(
    criticalRisks: Array<{
      id: string
      actions: Array<{ id: string; status: string; completedAt: Date | null }>
    }>
  ): number {
    // Compter toutes les actions des risques critiques (sauf annulées)
    const allActions = criticalRisks.flatMap(risk => 
      risk.actions.filter(action => action.status !== 'CANCELLED')
    )

    // Si aucune action pour les risques critiques, sécurité excellente (1 = risque faible)
    if (allActions.length === 0) return 1

    const completedActions = allActions.filter(action => action.status === 'COMPLETED')
    const compliancePercentage = (completedActions.length / allActions.length) * 100
    
    // Convertir le pourcentage (0-100%) en échelle GAMR (1-60)
    // 100% de conformité = 1 (risque faible), 0% = 60 (risque élevé)
    return Math.max(1, Math.min(60, 60 - (compliancePercentage / 100) * 59))
  }

  /**
   * Méthode utilitaire pour obtenir seulement l'indice global (sans les détails)
   */
  static async getGlobalSecurityIndex(tenantId: string): Promise<number> {
    const components = await this.calculateSecurityIndex(tenantId)
    return components.globalSecurityIndex
  }
}
