import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { actionsApi, riskSheetsApi, type Action, type RiskSheet, type PaginatedResponse } from './api'

type RiskActionReportOptions = {
  title?: string
  startDate?: string
  endDate?: string
}

function sanitize(text: string): string {
  if (!text) return ''
  // Remove control characters except tab (\t), line feed (\n), carriage return (\r)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

export class WordService {
  static async generateRiskActionReport(options: RiskActionReportOptions = {}): Promise<void> {
    const [risks, actions] = await Promise.all([
      this.fetchAllRisks(),
      this.fetchAllActions(),
    ])

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({ text: sanitize(options.title || 'Rapport Consolidé GAMRDIGITALE — Risques et Actions'), bold: true, size: 40 })
              ],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({ text: sanitize(`Généré le ${new Date().toLocaleString('fr-FR')}`), color: '666666', size: 20 }),
              ],
            }),

            // Overview
            new Paragraph({ text: 'Résumé Exécutif', heading: HeadingLevel.HEADING_1 }),
            ...this.buildOverview(risks, actions),

            // Risk stats
            new Paragraph({ text: 'Statistiques des Risques', heading: HeadingLevel.HEADING_1 }),
            ...this.buildRiskStats(risks),

            // Actions stats
            new Paragraph({ text: 'Statistiques des Actions', heading: HeadingLevel.HEADING_1 }),
            ...this.buildActionStats(actions),

            // Recommendations at bottom
            new Paragraph({ text: 'Recommandations IA', heading: HeadingLevel.HEADING_1 }),
            ...this.buildAIRecommendations(risks),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    const fileName = `Rapport_GAMRDIGITALE_Risques_Actions_${new Date().toISOString().split('T')[0]}.docx`
    // Ensure correct MIME type for Word documents to avoid corruption issues when opening in MS Word
    const typedBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    saveAs(typedBlob, fileName)
  }

  private static async fetchAllRisks(): Promise<RiskSheet[]> {
    const pageSize = 100
    let page = 1
    const all: RiskSheet[] = []
    // First page
    let res: PaginatedResponse<RiskSheet> = await riskSheetsApi.getAll({ page, limit: pageSize })
    all.push(...res.data)
    const totalPages = res.pagination?.pages ?? 1
    while (page < totalPages) {
      page += 1
      res = await riskSheetsApi.getAll({ page, limit: pageSize })
      all.push(...res.data)
    }
    return all
  }

  private static async fetchAllActions(): Promise<Action[]> {
    const pageSize = 100
    let page = 1
    const all: Action[] = []
    // First page
    let res: PaginatedResponse<Action> = await actionsApi.getAll({ page, limit: pageSize })
    all.push(...res.data)
    const totalPages = res.pagination?.pages ?? 1
    while (page < totalPages) {
      page += 1
      res = await actionsApi.getAll({ page, limit: pageSize })
      all.push(...res.data)
    }
    return all
  }

  private static buildOverview(risks: RiskSheet[], actions: Action[]) {
    const totalRisks = risks.length
    const criticalRisks = risks.filter(r => r.priority === 'CRITICAL').length
    const averageRiskScore = totalRisks > 0
      ? Math.round((risks.reduce((sum, r) => sum + (r.riskScore || 0), 0) / totalRisks) * 100) / 100
      : 0

    const totalActions = actions.length
    const completedActions = actions.filter(a => a.status === 'COMPLETED').length
    const overdueActions = actions.filter(a => {
      if (!a.dueDate || a.status === 'COMPLETED' || a.status === 'CANCELLED') return false
      return new Date(a.dueDate) < new Date()
    }).length

    const rows = [
      ['Indicateur', 'Valeur'],
      ['Fiches de Risques', String(totalRisks)],
      ['Risques Critiques', String(criticalRisks)],
      ['Score de Risque Moyen', String(averageRiskScore)],
      ['Actions Totales', String(totalActions)],
      ['Actions Terminées', String(completedActions)],
      ['Actions en Retard', String(overdueActions)],
    ]

    return [
      this.table(rows, [50, 50]),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ]
  }

  private static buildRiskStats(risks: RiskSheet[]) {
    if (risks.length === 0) {
      return [new Paragraph({ text: 'Aucune fiche de risque disponible.', spacing: { after: 200 } })]
    }

    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW']
    const countsByPriority = priorities.map(p => [
      this.prettyPriority(p),
      String(risks.filter(r => r.priority === p).length),
    ])

    const rows = [
      ['Priorité', 'Nombre'],
      ...countsByPriority,
    ]

    return [
      this.table(rows, [60, 40]),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ]
  }

  private static buildActionStats(actions: Action[]) {
    if (actions.length === 0) {
      return [new Paragraph({ text: 'Aucune action disponible.', spacing: { after: 200 } })]
    }

    const statuses: Action['status'][] = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    const rows = [
      ['Statut', 'Nombre'],
      ...statuses.map(s => [this.prettyStatus(s), String(actions.filter(a => a.status === s).length)])
    ]

    return [
      this.table(rows, [60, 40]),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ]
  }

  private static buildAIRecommendations(risks: RiskSheet[]) {
    const recommendations: string[] = []
    risks.forEach(r => {
      const recs = (r as any).aiSuggestions?.recommendations as string[] | undefined
      if (Array.isArray(recs)) {
        recs.forEach(rec => {
          if (typeof rec === 'string' && rec.trim().length > 0) {
            recommendations.push(sanitize(rec.trim()))
          }
        })
      }
    })

    const unique = Array.from(new Set(recommendations))

    if (unique.length === 0) {
      return [new Paragraph({ text: 'Aucune recommandation IA disponible pour le périmètre sélectionné.' })]
    }

    const items = unique.slice(0, 20).map((text) =>
      new Paragraph({ children: [ new TextRun({ text: `• ${text}` }) ] })
    )

    return items
  }

  private static prettyPriority(p: string) {
    switch (p) {
      case 'CRITICAL': return 'Critique'
      case 'HIGH': return 'Élevée'
      case 'MEDIUM': return 'Moyenne'
      case 'LOW': return 'Faible'
      case 'VERY_LOW': return 'Très faible'
      default: return p
    }
  }

  private static prettyStatus(s: Action['status']) {
    switch (s) {
      case 'TODO': return 'À faire'
      case 'IN_PROGRESS': return 'En cours'
      case 'COMPLETED': return 'Terminée'
      case 'CANCELLED': return 'Annulée'
      default: return s
    }
  }

  private static table(rows: string[][], widthsPercent: number[]) {
    const tableRows = rows.map((cols, rowIdx) => new TableRow({
      children: cols.map((text, colIdx) => new TableCell({
        width: { size: widthsPercent[colIdx], type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: colIdx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
            children: [
              new TextRun({ text: sanitize(String(text)), bold: rowIdx === 0 }),
            ],
          }),
        ],
      })),
    }))

    return [
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }),
    ]
  }
}

export const wordService = WordService


