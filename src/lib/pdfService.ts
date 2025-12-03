import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { type RiskSheet, type Action, type Evaluation } from './api'

export class PDFService {
  // Ensure there is space left on the page, otherwise create a new one
  private static ensureSpace(doc: jsPDF, yPosition: number, requiredHeight: number = 20): number {
    const pageHeight = doc.internal.pageSize.height
    const bottomMargin = 20
    if (yPosition + requiredHeight > pageHeight - bottomMargin) {
      doc.addPage()
      return 30 // top margin for new page
    }
    return yPosition
  }
  private static addHeader(doc: jsPDF, title: string) {
    // Logo et en-tête
    doc.setFillColor(59, 130, 246) // Bleu primary
    doc.rect(0, 0, 210, 25, 'F')
    
    // Titre
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('GAMRDIGITALE - Gestion Intelligente des Risques', 20, 15)
    
    // Sous-titre
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(title, 20, 22)
    
    // Date
    const date = new Date().toLocaleDateString('fr-FR')
    doc.setFontSize(10)
    doc.text(`Généré le ${date}`, 150, 22)
  }

  private static addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
    const pageHeight = doc.internal.pageSize.height
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200)
    doc.line(20, pageHeight - 20, 190, pageHeight - 20)
    
    // Numéro de page
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.text(`Page ${pageNumber} sur ${totalPages}`, 20, pageHeight - 10)
    
    // Informations de confidentialité
    doc.text('Document confidentiel - GAMRDIGITALE Platform', 105, pageHeight - 10, { align: 'center' })
    
    // Date et heure
    const now = new Date()
    const timestamp = now.toLocaleString('fr-FR')
    doc.text(timestamp, 190, pageHeight - 10, { align: 'right' })
  }

  private static getPriorityColor(priority: string): [number, number, number] {
    switch (priority) {
      case 'CRITICAL': return [239, 68, 68] // Rouge
      case 'HIGH': return [245, 158, 11] // Orange
      case 'MEDIUM': return [59, 130, 246] // Bleu
      case 'LOW': return [34, 197, 94] // Vert
      case 'VERY_LOW': return [107, 114, 128] // Gris
      default: return [107, 114, 128]
    }
  }

  private static addBarChart(doc: jsPDF, x: number, y: number, data: Array<{label: string, value: number, color?: [number, number, number]}>, title?: string) {
    const chartWidth = 150
    const chartHeight = 80
    const maxValue = Math.max(...data.map(d => d.value))

    // Titre du graphique
    if (title) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(title, x, y - 5)
    }

    // Cadre du graphique
    doc.setDrawColor(200, 200, 200)
    doc.rect(x, y, chartWidth, chartHeight)

    // Barres
    const barWidth = chartWidth / data.length * 0.8
    const barSpacing = chartWidth / data.length * 0.2

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * (chartHeight - 20)
      const barX = x + (index * (barWidth + barSpacing)) + barSpacing / 2
      const barY = y + chartHeight - barHeight - 10

      // Couleur de la barre
      const color = item.color || [59, 130, 246]
      doc.setFillColor(color[0], color[1], color[2])
      doc.rect(barX, barY, barWidth, barHeight, 'F')

      // Valeur au-dessus de la barre
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text(item.value.toString(), barX + barWidth / 2, barY - 2, { align: 'center' })

      // Label sous la barre
      doc.setFontSize(7)
      const labelLines = doc.splitTextToSize(item.label, barWidth)
      labelLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, barX + barWidth / 2, y + chartHeight + 5 + (lineIndex * 3), { align: 'center' })
      })
    })
  }

  private static addRiskScoreChart(doc: jsPDF, x: number, y: number, score: number) {
    const radius = 15
    const centerX = x + radius
    const centerY = y + radius
    
    // Cercle de fond
    doc.setFillColor(240, 240, 240)
    doc.circle(centerX, centerY, radius, 'F')
    
    // Cercle de score
    const angle = (score / 100) * 360
    const color = score >= 80 ? [239, 68, 68] : score >= 60 ? [245, 158, 11] : score >= 40 ? [59, 130, 246] : [34, 197, 94]
    doc.setFillColor(color[0], color[1], color[2])
    
    // Arc de cercle (approximation avec des lignes)
    const steps = Math.floor(angle / 5)
    for (let i = 0; i <= steps; i++) {
      const currentAngle = (i * 5) * Math.PI / 180 - Math.PI / 2
      const x1 = centerX + Math.cos(currentAngle) * radius
      const y1 = centerY + Math.sin(currentAngle) * radius
      doc.circle(x1, y1, 1, 'F')
    }
    
    // Score au centre
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(score.toString(), centerX, centerY + 2, { align: 'center' })
    doc.setFontSize(8)
    doc.text('/100', centerX, centerY + 8, { align: 'center' })
  }

  /**
   * Générer un rapport PDF pour une fiche de risque
   */
  static async generateRiskSheetReport(riskSheet: RiskSheet): Promise<void> {
    const doc = new jsPDF()
    let yPosition = 35

    // En-tête
    this.addHeader(doc, 'Rapport de Fiche de Risque')

    // Informations principales
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Analyse de Risque GAMRDIGITALE', 20, yPosition)
    yPosition += 15

    // Cible du risque
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Cible:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(riskSheet.target, 40, yPosition)
    yPosition += 10

    // Scénario
    doc.setFont('helvetica', 'bold')
    doc.text('Scénario:', 20, yPosition)
    yPosition += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const scenarioLines = doc.splitTextToSize(riskSheet.scenario, 170)
    yPosition = this.ensureSpace(doc, yPosition, scenarioLines.length * 6 + 10)
    doc.text(scenarioLines, 20, yPosition)
    yPosition += scenarioLines.length * 6 + 12

    // Score de risque avec graphique
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Score de Risque:', 20, yPosition)
    
    // Graphique circulaire
    this.addRiskScoreChart(doc, 120, yPosition - 10, Math.round(riskSheet.riskScore))
    yPosition += 28

    // Priorité
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Priorité:', 20, yPosition)
    
    const priorityColor = this.getPriorityColor(riskSheet.priority)
    doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2])
    doc.rect(60, yPosition - 5, 30, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(riskSheet.priority, 75, yPosition, { align: 'center' })
    yPosition += 18

    // Métriques détaillées
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Métriques Détaillées:', 20, yPosition)
    yPosition += 10

    const metrics = [
      { label: 'Probabilité', value: `${riskSheet.probability}/5`, color: [59, 130, 246] },
      { label: 'Vulnérabilité', value: `${riskSheet.vulnerability}/5`, color: [245, 158, 11] },
      { label: 'Impact', value: `${riskSheet.impact}/5`, color: [239, 68, 68] }
    ]

    metrics.forEach((metric, index) => {
      const x = 20 + (index * 60)
      
      // Barre de progression
      doc.setFillColor(240, 240, 240)
      doc.rect(x, yPosition, 50, 8, 'F')
      
      const fillWidth = (parseInt(metric.value) / 5) * 50
      doc.setFillColor(metric.color[0], metric.color[1], metric.color[2])
      doc.rect(x, yPosition, fillWidth, 8, 'F')
      
      // Label et valeur
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.text(metric.label, x, yPosition - 2)
      doc.setFont('helvetica', 'bold')
      doc.text(metric.value, x + 25, yPosition + 15, { align: 'center' })
      doc.setFont('helvetica', 'normal')
    })
    yPosition += 28

    // Catégorie et tags
    if (riskSheet.category) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Catégorie:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(riskSheet.category, 60, yPosition)
      yPosition += 12
    }

    // Analyse et Recommandations IA
    if (riskSheet.aiSuggestions) {
      yPosition += 10
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Analyse IA:', 20, yPosition)
      yPosition += 8

      const aiData = riskSheet.aiSuggestions

      // Niveau de confiance
      if (aiData.confidence) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Niveau de confiance:', 20, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(`${Math.round(aiData.confidence * 100)}%`, 90, yPosition)
        yPosition += 8
      }

      // Analyse détaillée
      if (aiData.analysis) {
        doc.setFont('helvetica', 'bold')
        doc.text('Évaluation détaillée:', 20, yPosition)
        yPosition += 6

        // Probabilité
        if (aiData.analysis.probability) {
          doc.setFont('helvetica', 'bold')
          doc.text(`Probabilité (${aiData.analysis.probability.score}/3):`, 25, yPosition)
          yPosition += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const probLines = doc.splitTextToSize(aiData.analysis.probability.explanation, 160)
          yPosition = this.ensureSpace(doc, yPosition, probLines.length * 6 + 6)
          doc.text(probLines, 25, yPosition)
          yPosition += probLines.length * 6 + 6
        }

        // Vulnérabilité
        if (aiData.analysis.vulnerability) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(`Vulnérabilité (${aiData.analysis.vulnerability.score}/4):`, 25, yPosition)
          yPosition += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const vulnLines = doc.splitTextToSize(aiData.analysis.vulnerability.explanation, 160)
          yPosition = this.ensureSpace(doc, yPosition, vulnLines.length * 6 + 6)
          doc.text(vulnLines, 25, yPosition)
          yPosition += vulnLines.length * 6 + 6
        }

        // Impact
        if (aiData.analysis.impact) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(`Repercussions (${aiData.analysis.impact.score}/5):`, 25, yPosition)
          yPosition += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const impactLines = doc.splitTextToSize(aiData.analysis.impact.explanation, 160)
          yPosition = this.ensureSpace(doc, yPosition, impactLines.length * 6 + 8)
          doc.text(impactLines, 25, yPosition)
          yPosition += impactLines.length * 6 + 10
        }
      }

      // Recommandations
      if (aiData.recommendations && aiData.recommendations.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Recommandations:', 20, yPosition)
        yPosition += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        aiData.recommendations.forEach((recommendation: string) => {
          const recLines = doc.splitTextToSize(`• ${recommendation}`, 160)
          yPosition = this.ensureSpace(doc, yPosition, recLines.length * 6 + 4)
          doc.text(recLines, 25, yPosition)
          yPosition += recLines.length * 6 + 4
        })
        yPosition += 6
      }

      // Basé sur les évaluations
      if (aiData.basedOnEvaluations && aiData.basedOnEvaluations.length > 0) {
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Basé sur ${aiData.basedOnEvaluations.length} évaluation(s)`, 20, yPosition)
        yPosition += 5
      }

      // Timestamp
      if (aiData.timestamp) {
        doc.text(`Analyse générée le: ${new Date(aiData.timestamp).toLocaleDateString('fr-FR')}`, 20, yPosition)
        yPosition += 5
      }

      doc.setTextColor(0, 0, 0) // Reset color
    }

    // Informations de création
    yPosition += 16
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Créé le: ${new Date(riskSheet.createdAt).toLocaleDateString('fr-FR')}`, 20, yPosition)
    doc.text(`Dernière mise à jour: ${new Date(riskSheet.updatedAt).toLocaleDateString('fr-FR')}`, 20, yPosition + 5)
    
    if (riskSheet.author) {
      doc.text(`Auteur: ${riskSheet.author.firstName} ${riskSheet.author.lastName}`, 20, yPosition + 10)
    }

    // Pied de page
    this.addFooter(doc, 1, 1)

    // Télécharger le PDF
    const fileName = `Fiche_Risque_${riskSheet.target.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  /**
   * Générer un rapport consolidé pour plusieurs fiches de risques
   */
  static async generateConsolidatedRiskReport(riskSheets: RiskSheet[]): Promise<void> {
    const doc = new jsPDF()
    let yPosition = 35

    // En-tête
    this.addHeader(doc, 'Rapport Consolidé des Risques')

    // Résumé exécutif
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Résumé Exécutif', 20, yPosition)
    yPosition += 15

    // Statistiques générales
    const totalRisks = riskSheets.length
    const criticalRisks = riskSheets.filter(r => r.priority === 'CRITICAL').length
    const highRisks = riskSheets.filter(r => r.priority === 'HIGH').length
    const risksWithAI = riskSheets.filter(r => r.aiSuggestions).length

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total des risques analysés: ${totalRisks}`, 20, yPosition)
    yPosition += 8
    doc.text(`Risques critiques: ${criticalRisks}`, 20, yPosition)
    yPosition += 8
    doc.text(`Risques élevés: ${highRisks}`, 20, yPosition)
    yPosition += 8
    doc.text(`Risques avec analyse IA: ${risksWithAI}`, 20, yPosition)
    yPosition += 15

    // Analyse IA consolidée
    if (risksWithAI > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Analyse IA Consolidée', 20, yPosition)
      yPosition += 10

      const avgConfidence = riskSheets
        .filter(r => r.aiSuggestions?.confidence)
        .reduce((sum, r) => sum + r.aiSuggestions.confidence, 0) / risksWithAI

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Niveau de confiance moyen: ${Math.round(avgConfidence * 100)}%`, 20, yPosition)
      yPosition += 8

      // Recommandations les plus fréquentes
      const allRecommendations: string[] = []
      riskSheets.forEach(risk => {
        if (risk.aiSuggestions?.recommendations) {
          allRecommendations.push(...risk.aiSuggestions.recommendations)
        }
      })

      if (allRecommendations.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text('Recommandations principales:', 20, yPosition)
        yPosition += 6
        doc.setFont('helvetica', 'normal')

        // Prendre les 5 premières recommandations uniques
        const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5)
        uniqueRecommendations.forEach(rec => {
          const recLines = doc.splitTextToSize(`• ${rec}`, 160)
          doc.text(recLines, 25, yPosition)
          yPosition += recLines.length * 4 + 2
        })
        yPosition += 10
      }
    }

    // Nouvelle page pour les détails
    doc.addPage()
    yPosition = 35

    // Liste détaillée des risques
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des Risques', 20, yPosition)
    yPosition += 15

    riskSheets.forEach((risk, index) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 35
      }

      // Titre du risque
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${risk.target}`, 20, yPosition)
      yPosition += 8

      // Score et priorité
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Score: ${Math.round(risk.riskScore)}/100 | Priorité: ${risk.priority}`, 25, yPosition)
      yPosition += 6

      // Scénario (tronqué)
      const scenarioShort = risk.scenario.length > 100
        ? risk.scenario.substring(0, 100) + '...'
        : risk.scenario
      const scenarioLines = doc.splitTextToSize(scenarioShort, 160)
      doc.text(scenarioLines, 25, yPosition)
      yPosition += scenarioLines.length * 4 + 3

      // Analyse IA résumée
      if (risk.aiSuggestions) {
        doc.setFont('helvetica', 'bold')
        doc.text('IA:', 25, yPosition)
        doc.setFont('helvetica', 'normal')
        const confidence = risk.aiSuggestions.confidence
          ? `${Math.round(risk.aiSuggestions.confidence * 100)}%`
          : 'N/A'
        doc.text(`Confiance: ${confidence}`, 40, yPosition)
        yPosition += 5
      }

      yPosition += 8
    })

    // Pied de page
    this.addFooter(doc, 1, 2)

    // Télécharger le PDF
    const fileName = `Rapport_Consolide_Risques_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  /**
   * Générer un rapport PDF pour les actions correctives
   */
  static async generateActionsReport(actions: Action[], title: string = 'Rapport des Actions Correctives'): Promise<void> {
    const doc = new jsPDF()
    let yPosition = 35

    // En-tête
    this.addHeader(doc, title)

    // Statistiques générales
    const totalActions = actions.length
    const completedActions = actions.filter(a => a.status === 'COMPLETED').length
    const overdueActions = actions.filter(a => {
      if (!a.dueDate || a.status === 'COMPLETED' || a.status === 'CANCELLED') return false
      return new Date(a.dueDate) < new Date()
    }).length

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Résumé Exécutif', 20, yPosition)
    yPosition += 15

    // Statistiques en boîtes
    const stats = [
      { label: 'Total', value: totalActions, color: [59, 130, 246] },
      { label: 'Terminées', value: completedActions, color: [34, 197, 94] },
      { label: 'En retard', value: overdueActions, color: [239, 68, 68] }
    ]

    stats.forEach((stat, index) => {
      const x = 20 + (index * 60)
      
      // Boîte colorée
      doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
      doc.rect(x, yPosition, 50, 20, 'F')
      
      // Valeur
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(stat.value.toString(), x + 25, yPosition + 10, { align: 'center' })
      
      // Label
      doc.setFontSize(10)
      doc.text(stat.label, x + 25, yPosition + 16, { align: 'center' })
    })
    yPosition += 35

    // Liste des actions
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des Actions', 20, yPosition)
    yPosition += 10

    actions.forEach((action, index) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 30
      }

      // Titre de l'action
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${action.title}`, 20, yPosition)
      yPosition += 8

      // Statut et priorité
      const statusColor = action.status === 'COMPLETED' ? [34, 197, 94] : 
                         action.status === 'IN_PROGRESS' ? [59, 130, 246] : [107, 114, 128]
      
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
      doc.rect(20, yPosition - 3, 25, 6, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text(action.status, 32.5, yPosition, { align: 'center' })

      const priorityColor = this.getPriorityColor(action.priority)
      doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2])
      doc.rect(50, yPosition - 3, 25, 6, 'F')
      doc.text(action.priority, 62.5, yPosition, { align: 'center' })
      yPosition += 10

      // Description
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(action.description, 170)
      doc.text(descLines, 25, yPosition)
      yPosition += descLines.length * 4 + 5

      // Informations supplémentaires
      if (action.dueDate) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Échéance: ${new Date(action.dueDate).toLocaleDateString('fr-FR')}`, 25, yPosition)
        yPosition += 4
      }

      if (action.assignee) {
        doc.text(`Assigné à: ${action.assignee.firstName} ${action.assignee.lastName}`, 25, yPosition)
        yPosition += 4
      }

      yPosition += 8
    })

    // Pied de page pour toutes les pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      this.addFooter(doc, i, totalPages)
    }

    // Télécharger le PDF
    const fileName = `Actions_Correctives_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  /**
   * Générer un rapport PDF pour une évaluation
   */
  static async generateEvaluationReport(evaluation: Evaluation): Promise<void> {
    const doc = new jsPDF()
    let yPosition = 35

    // En-tête
    this.addHeader(doc, 'Rapport d\'Évaluation GAMRDIGITALE')

    // Informations principales
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Évaluation de Sécurité', 20, yPosition)
    yPosition += 15

    // Nom de l'évaluation
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Nom:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(evaluation.name, 40, yPosition)
    yPosition += 10

    // Description
    if (evaluation.description) {
      doc.setFont('helvetica', 'bold')
      doc.text('Description:', 20, yPosition)
      yPosition += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const descLines = doc.splitTextToSize(evaluation.description, 170)
      doc.text(descLines, 20, yPosition)
      yPosition += descLines.length * 5 + 10
    }

    // Score global
    if (evaluation.totalScore !== undefined) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Score Global:', 20, yPosition)

      // Graphique circulaire pour le score
      this.addRiskScoreChart(doc, 120, yPosition - 10, Math.round(evaluation.totalScore))
      yPosition += 25
    }

    // Statut
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Statut:', 20, yPosition)

    const statusColor = evaluation.status === 'COMPLETED' ? [34, 197, 94] :
                       evaluation.status === 'IN_PROGRESS' ? [59, 130, 246] : [107, 114, 128]
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    doc.rect(60, yPosition - 5, 40, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(evaluation.status, 80, yPosition, { align: 'center' })
    yPosition += 20

    // Résumé des réponses (si disponible)
    if (evaluation.responses && evaluation.responses.length > 0) {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Résumé des Réponses:', 20, yPosition)
      yPosition += 10

      const responseStats = {
        total: evaluation.responses.length,
        completed: evaluation.responses.filter(r => r.answer !== null).length,
        pending: evaluation.responses.filter(r => r.answer === null).length
      }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Questions totales: ${responseStats.total}`, 25, yPosition)
      yPosition += 6
      doc.text(`Réponses complètes: ${responseStats.completed}`, 25, yPosition)
      yPosition += 6
      doc.text(`En attente: ${responseStats.pending}`, 25, yPosition)
      yPosition += 15
    }

    // Informations de création
    yPosition += 10
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Créé le: ${new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}`, 20, yPosition)
    doc.text(`Dernière mise à jour: ${new Date(evaluation.updatedAt).toLocaleDateString('fr-FR')}`, 20, yPosition + 5)

    if (evaluation.author) {
      doc.text(`Auteur: ${evaluation.author.firstName} ${evaluation.author.lastName}`, 20, yPosition + 10)
    }

    // Pied de page
    this.addFooter(doc, 1, 1)

    // Télécharger le PDF
    const fileName = `Evaluation_${evaluation.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  /**
   * Générer un rapport consolidé avec plusieurs types de données
   */
  static async generateConsolidatedReport(data: {
    riskSheets?: RiskSheet[]
    actions?: Action[]
    evaluations?: Evaluation[]
    title?: string
  }): Promise<void> {
    const doc = new jsPDF()
    let yPosition = 35

    // En-tête
    this.addHeader(doc, data.title || 'Rapport Consolidé GAMRDIGITALE')

    // Résumé exécutif
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Résumé Exécutif', 20, yPosition)
    yPosition += 15

    // Statistiques générales avec graphique
    const stats = [
      { label: 'Fiches de Risques', value: data.riskSheets?.length || 0, color: [59, 130, 246] },
      { label: 'Actions Correctives', value: data.actions?.length || 0, color: [34, 197, 94] },
      { label: 'Évaluations', value: data.evaluations?.length || 0, color: [147, 51, 234] }
    ]

    // Graphique en barres
    this.addBarChart(doc, 20, yPosition, stats, 'Vue d\'ensemble des données')
    yPosition += 120

    // Boîtes de statistiques détaillées
    stats.forEach((stat, index) => {
      const x = 20 + (index * 60)

      // Boîte colorée
      doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
      doc.rect(x, yPosition, 50, 20, 'F')

      // Valeur
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(stat.value.toString(), x + 25, yPosition + 10, { align: 'center' })

      // Label
      doc.setFontSize(8)
      doc.text(stat.label, x + 25, yPosition + 16, { align: 'center' })
    })
    yPosition += 35

    // Sections détaillées
    if (data.riskSheets && data.riskSheets.length > 0) {
      if (yPosition > 180) {
        doc.addPage()
        yPosition = 30
      }

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Analyse des Risques', 20, yPosition)
      yPosition += 15

      // Graphique de répartition des priorités
      const priorityStats = data.riskSheets.reduce((acc, risk) => {
        acc[risk.priority] = (acc[risk.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const priorityData = Object.entries(priorityStats).map(([priority, count]) => ({
        label: priority,
        value: count,
        color: this.getPriorityColor(priority)
      }))

      if (priorityData.length > 0) {
        this.addBarChart(doc, 20, yPosition, priorityData, 'Répartition par Priorité')
        yPosition += 120
      }

      // Top 5 des risques les plus critiques
      const topRisks = data.riskSheets
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5)

      if (yPosition > 200) {
        doc.addPage()
        yPosition = 30
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Top 5 des Risques les Plus Critiques', 20, yPosition)
      yPosition += 10

      topRisks.forEach((risk, index) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. ${risk.target}`, 25, yPosition)
        yPosition += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Score: ${Math.round(risk.riskScore)}/100 | Priorité: ${risk.priority}`, 25, yPosition)
        yPosition += 8
      })
      yPosition += 10
    }

    // Analyse des actions correctives
    if (data.actions && data.actions.length > 0) {
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 30
      }

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Analyse des Actions Correctives', 20, yPosition)
      yPosition += 15

      // Graphique de répartition des statuts
      const statusStats = data.actions.reduce((acc, action) => {
        acc[action.status] = (acc[action.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const statusData = Object.entries(statusStats).map(([status, count]) => ({
        label: status === 'TODO' ? 'À faire' :
               status === 'IN_PROGRESS' ? 'En cours' :
               status === 'COMPLETED' ? 'Terminées' :
               status === 'CANCELLED' ? 'Annulées' : status,
        value: count,
        color: status === 'COMPLETED' ? [34, 197, 94] :
               status === 'IN_PROGRESS' ? [59, 130, 246] :
               status === 'CANCELLED' ? [239, 68, 68] : [107, 114, 128]
      }))

      if (statusData.length > 0) {
        this.addBarChart(doc, 20, yPosition, statusData, 'Répartition par Statut')
        yPosition += 120
      }
    }

    // Pied de page pour toutes les pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      this.addFooter(doc, i, totalPages)
    }

    // Télécharger le PDF
    const fileName = `Rapport_Consolide_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  /**
   * Générer un rapport PDF à partir d'un élément HTML
   */
  static async generateFromHTML(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Élément avec l'ID ${elementId} non trouvé`)
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF()
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(fileName)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      throw error
    }
  }
}
