import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { Evaluation, EvaluationResponse } from './api'

// Étendre le type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

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

  private addTable(headers: string[], rows: string[][]) {
    this.checkPageBreak(50)

    this.doc.autoTable({
      head: [headers],
      body: rows,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
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
        return response.booleanValue ? 'Oui' : 'Non'
      case 'TEXT':
        return response.textValue || 'Aucune réponse'
      case 'NUMBER':
        return response.numberValue?.toString() || 'Aucune réponse'
      case 'SCALE':
        return `${response.numberValue || 0}/5`
      default:
        return response.textValue || response.numberValue?.toString() || 'Aucune réponse'
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

        // Grouper les réponses par groupe de questions
        const responsesByGroup = new Map<string, EvaluationResponse[]>()
        
        evaluation.responses.forEach(response => {
          if (response.question?.objective?.group?.title) {
            const groupTitle = response.question.objective.group.title
            if (!responsesByGroup.has(groupTitle)) {
              responsesByGroup.set(groupTitle, [])
            }
            responsesByGroup.get(groupTitle)!.push(response)
          }
        })

        // Afficher les réponses par groupe
        responsesByGroup.forEach((responses, groupTitle) => {
          this.addSection(groupTitle, '')

          const tableRows = responses.map(response => [
            response.question?.text || 'Question inconnue',
            this.formatResponse(response, response.question?.type || 'TEXT'),
            response.comment || ''
          ])

          this.addTable(
            ['Question', 'Réponse', 'Commentaire'],
            tableRows
          )
        })
      }

      // Fiches de risque générées
      if (evaluation.generatedRisks && evaluation.generatedRisks.length > 0) {
        this.addSection('Fiches de Risque Générées', '')

        const riskRows = evaluation.generatedRisks.map(risk => [
          risk.target,
          risk.scenario,
          risk.riskScore?.toString() || 'N/A',
          risk.priority || 'N/A'
        ])

        this.addTable(
          ['Cible', 'Scénario', 'Score', 'Priorité'],
          riskRows
        )
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
