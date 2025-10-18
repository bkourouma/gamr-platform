import jsPDF from 'jspdf'
import type { Evaluation, EvaluationResponse } from './api'

export class PDFExportService {
  private doc: jsPDF
  private pageHeight: number
  private pageWidth: number
  private margin: number
  private currentY: number

  constructor() {
    this.doc = new jsPDF()
    this.pageHeight = this.doc.internal.pageSize.height
    this.pageWidth = this.doc.internal.pageSize.width
    this.margin = 20
    this.currentY = this.margin
  }

  private addHeader(title: string) {
    // Logo ou en-tête de l'entreprise
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('GAMR - Rapport d\'Évaluation Sécuritaire', this.margin, this.currentY)
    this.currentY += 15

    // Ligne de séparation
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 15

    // Titre de l'évaluation
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 20
  }

  private addSection(title: string, content: string | string[]) {
    this.checkPageBreak(30)

    // Titre de section
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 10

    // Contenu
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')

    if (Array.isArray(content)) {
      content.forEach(line => {
        this.checkPageBreak(8)
        this.doc.text(line, this.margin + 5, this.currentY)
        this.currentY += 7
      })
    } else {
      const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin - 10)
      lines.forEach((line: string) => {
        this.checkPageBreak(8)
        this.doc.text(line, this.margin + 5, this.currentY)
        this.currentY += 7
      })
    }

    this.currentY += 10
  }

  private addText(text: string, fontSize: number = 11, bold: boolean = false) {
    this.checkPageBreak(10)

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal')
    this.doc.text(text, this.margin, this.currentY)
    this.currentY += fontSize * 0.6 + 5
  }

  private addTable(headers: string[], rows: string[][]) {
    this.checkPageBreak(50)

    // Add headers
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFillColor(41, 128, 185)
    this.doc.setTextColor(255, 255, 255)

    // Simple header row
    let headerText = headers.join(' | ')
    this.doc.text(headerText, this.margin, this.currentY)
    this.currentY += 12

    // Reset text color for content
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont('helvetica', 'normal')

    // Add rows
    rows.forEach((row, index) => {
      this.checkPageBreak(15)

      // Alternate background color effect with text
      if (index % 2 === 0) {
        this.doc.setTextColor(0, 0, 0)
      } else {
        this.doc.setTextColor(60, 60, 60)
      }

      // Format each row
      const rowText = row.join(' | ')
      const lines = this.doc.splitTextToSize(rowText, this.pageWidth - 2 * this.margin)

      lines.forEach((line: string) => {
        this.checkPageBreak(8)
        this.doc.text(line, this.margin, this.currentY)
        this.currentY += 8
      })

      this.currentY += 3 // Space between rows
    })

    this.currentY += 10
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Date de génération
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      this.doc.text(`Généré le ${date}`, this.margin, this.pageHeight - 10)
      
      // Numéro de page
      this.doc.text(`Page ${i} sur ${pageCount}`, this.pageWidth - this.margin - 30, this.pageHeight - 10)
    }
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Brouillon'
      case 'IN_PROGRESS': return 'En cours'
      case 'COMPLETED': return 'Terminée'
      case 'VALIDATED': return 'Validée'
      case 'ARCHIVED': return 'Archivée'
      default: return status
    }
  }

  private getRiskLevelLabel(level?: string): string {
    switch (level) {
      case 'VERY_LOW': return 'Très faible'
      case 'LOW': return 'Faible'
      case 'MEDIUM': return 'Moyen'
      case 'HIGH': return 'Élevé'
      case 'CRITICAL': return 'Critique'
      default: return 'Non évalué'
    }
  }

  private formatResponse(response: EvaluationResponse, questionType: string): string {
    switch (questionType) {
      case 'YES_NO':
        return response.booleanValue === true ? 'Oui' : response.booleanValue === false ? 'Non' : 'Non répondu'
      case 'TEXT':
        return response.textValue || 'Aucune réponse'
      case 'NUMBER':
        return response.numberValue?.toString() || 'Aucune réponse'
      case 'SCALE':
        return `${response.numberValue || 0}/5`
      case 'MULTIPLE_CHOICE':
        return response.textValue || response.jsonValue?.toString() || 'Aucune réponse'
      case 'FILE_UPLOAD':
        return response.jsonValue ? 'Fichier joint' : 'Aucun fichier'
      case 'DATE':
        return response.textValue ? new Date(response.textValue).toLocaleDateString('fr-FR') : 'Aucune date'
      case 'TIME':
        return response.textValue || 'Aucune heure'
      default:
        // Essayer de retourner la valeur la plus appropriée
        if (response.booleanValue !== undefined) {
          return response.booleanValue ? 'Oui' : 'Non'
        }
        if (response.textValue) {
          return response.textValue
        }
        if (response.numberValue !== undefined) {
          return response.numberValue.toString()
        }
        if (response.jsonValue) {
          return JSON.stringify(response.jsonValue)
        }
        return 'Aucune réponse'
    }
  }

  public async exportEvaluation(evaluation: Evaluation): Promise<void> {
    try {
      // En-tête du document
      this.addHeader(evaluation.title)

      // Informations générales
      const generalInfo = [
        `Statut: ${this.getStatusLabel(evaluation.status)}`,
        `Évaluateur: ${evaluation.evaluator?.firstName} ${evaluation.evaluator?.lastName}`,
        `Date de création: ${new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}`,
        evaluation.startedAt ? `Date de début: ${new Date(evaluation.startedAt).toLocaleDateString('fr-FR')}` : '',
        evaluation.completedAt ? `Date de fin: ${new Date(evaluation.completedAt).toLocaleDateString('fr-FR')}` : '',
        `Progression: ${Math.round(evaluation.progress)}%`
      ].filter(Boolean)

      this.addSection('Informations Générales', generalInfo)

      // Informations de l'entité
      if (evaluation.entityInfo) {
        const entityInfo = [
          evaluation.entityInfo.name ? `Nom: ${evaluation.entityInfo.name}` : '',
          evaluation.entityInfo.sector ? `Secteur: ${evaluation.entityInfo.sector}` : '',
          evaluation.entityInfo.address ? `Adresse: ${evaluation.entityInfo.address}` : '',
          evaluation.entityInfo.employeeCount ? `Nombre d'employés: ${evaluation.entityInfo.employeeCount}` : ''
        ].filter(Boolean)

        if (entityInfo.length > 0) {
          this.addSection('Entité Évaluée', entityInfo)
        }
      }

      // Résultats (si l'évaluation est terminée)
      if (evaluation.status === 'COMPLETED' && evaluation.totalScore !== undefined) {
        const results = [
          `Score total: ${evaluation.totalScore}/100`,
          `Niveau de risque: ${this.getRiskLevelLabel(evaluation.riskLevel)}`
        ]
        this.addSection('Résultats', results)
      }

      // Réponses aux questions
      if (evaluation.responses && evaluation.responses.length > 0) {
        this.addSection('Réponses aux Questions', '')

        // Créer une map pour organiser les réponses par groupe et objectif
        const responsesByGroup = new Map<string, Map<string, EvaluationResponse[]>>()

        // Organiser les réponses en utilisant les données du template
        evaluation.responses.forEach(response => {
          if (response.question && evaluation.template?.questionGroups) {
            // Trouver le groupe et l'objectif correspondant à cette question
            let foundGroup = null
            let foundObjective = null

            for (const group of evaluation.template.questionGroups) {
              for (const objective of group.objectives || []) {
                if (objective.questions?.some(q => q.id === response.questionId)) {
                  foundGroup = group
                  foundObjective = objective
                  break
                }
              }
              if (foundGroup) break
            }

            if (foundGroup && foundObjective) {
              const groupTitle = foundGroup.title
              const objectiveTitle = foundObjective.title

              if (!responsesByGroup.has(groupTitle)) {
                responsesByGroup.set(groupTitle, new Map())
              }

              const groupMap = responsesByGroup.get(groupTitle)!
              if (!groupMap.has(objectiveTitle)) {
                groupMap.set(objectiveTitle, [])
              }

              groupMap.get(objectiveTitle)!.push(response)
            }
          }
        })

        // Afficher les réponses par groupe et objectif
        if (responsesByGroup.size > 0) {
          responsesByGroup.forEach((objectivesMap, groupTitle) => {
            this.addSection(groupTitle, '')

            objectivesMap.forEach((responses, objectiveTitle) => {
              // Sous-section pour l'objectif
              this.addText(`Objectif: ${objectiveTitle}`, 12, true)
              this.currentY += 5

              const tableRows = responses.map(response => {
                const row = [
                  response.question?.text || 'Question inconnue',
                  this.formatResponse(response, response.question?.type || 'TEXT'),
                  response.description || '',
                  response.comment || ''
                ]

                // Ajouter les scores si disponibles
                if (response.facilityScore || response.constraintScore) {
                  const scores = []
                  if (response.facilityScore) scores.push(`Facilité: ${response.facilityScore}`)
                  if (response.constraintScore) scores.push(`Contrainte: ${response.constraintScore}`)
                  row[3] = (response.comment ? response.comment + ' | ' : '') + scores.join(', ')
                }

                return row
              })

              this.addTable(
                ['Question', 'Réponse', 'Description', 'Commentaire/Scores'],
                tableRows
              )
            })
          })
        } else {
          // Fallback: afficher toutes les réponses sans groupement
          this.addText('Toutes les réponses', 12, true)
          this.currentY += 5

          const tableRows = evaluation.responses.map(response => {
            const row = [
              response.question?.text || `Question ID: ${response.questionId}`,
              this.formatResponse(response, response.question?.type || 'TEXT'),
              response.description || '',
              response.comment || ''
            ]

            // Ajouter les scores si disponibles
            if (response.facilityScore || response.constraintScore) {
              const scores = []
              if (response.facilityScore) scores.push(`Facilité: ${response.facilityScore}`)
              if (response.constraintScore) scores.push(`Contrainte: ${response.constraintScore}`)
              row[3] = (response.comment ? response.comment + ' | ' : '') + scores.join(', ')
            }

            return row
          })

          this.addTable(
            ['Question', 'Réponse', 'Description', 'Commentaire/Scores'],
            tableRows
          )
        }
      }

      // Fiches de risque générées
      if (evaluation.generatedRisks && evaluation.generatedRisks.length > 0) {
        this.addSection('Fiches de Risque Générées', '')

        const riskRows = evaluation.generatedRisks.map(risk => [
          risk.target,
          risk.scenario,
          risk.riskScore?.toString() || 'N/A',
          risk.priority || 'N/A',
          risk.aiSuggestions?.confidence ? `${Math.round(risk.aiSuggestions.confidence * 100)}%` : 'N/A'
        ])

        this.addTable(
          ['Cible', 'Scénario', 'Score', 'Priorité', 'Confiance IA'],
          riskRows
        )

        // Ajouter les détails des analyses IA pour chaque risque
        evaluation.generatedRisks.forEach((risk, index) => {
          if (risk.aiSuggestions && risk.aiSuggestions.analysis) {
            this.addSection(`Analyse IA - ${risk.target}`, '')

            const aiAnalysis = risk.aiSuggestions.analysis
            let analysisText = ''

            if (aiAnalysis.overallAssessment) {
              analysisText += `Évaluation globale: ${aiAnalysis.overallAssessment}\n\n`
            }

            if (aiAnalysis.probability) {
              analysisText += `Probabilité (${aiAnalysis.probability.score}/3): ${aiAnalysis.probability.explanation}\n\n`
            }

            if (aiAnalysis.vulnerability) {
              analysisText += `Vulnérabilité (${aiAnalysis.vulnerability.score}/4): ${aiAnalysis.vulnerability.explanation}\n\n`
            }

            if (aiAnalysis.impact) {
              analysisText += `Repercussions (${aiAnalysis.impact.score}/5): ${aiAnalysis.impact.explanation}\n\n`
            }

            if (risk.aiSuggestions.recommendations && risk.aiSuggestions.recommendations.length > 0) {
              analysisText += 'Recommandations:\n'
              risk.aiSuggestions.recommendations.forEach((rec: string) => {
                analysisText += `• ${rec}\n`
              })
            }

            this.addParagraph(analysisText)
          }
        })
      }

      // Pied de page
      this.addFooter()

      // Télécharger le PDF
      const fileName = `evaluation-${evaluation.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      this.doc.save(fileName)

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      throw new Error('Erreur lors de la génération du PDF')
    }
  }
}

// Instance singleton pour l'export
export const pdfExportService = new PDFExportService()
