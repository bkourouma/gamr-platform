import type { EmbeddingConfig } from './semantic-reclassifier'
import { reclassifyEvidencePoints } from './semantic-reclassifier'

type Label = 0 | 1 | 2 // 0: no impact, 1: positive impact, 2: negative impact

interface QAItem {
  index: number
  question: string
  answer: string
  source?: string
}

interface ClassificationResult {
  index: number
  label: Label
  point: string
}

const ENABLE_LLM_CLASSIFIER: boolean =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENABLE_LLM_CLASSIFIER === 'true'

const MAX_LLM_ITEMS = 80
// Cap total displayed relevant points (positives + negatives) per criterion
const MAX_POINTS_PER_CRITERION: number = 5

async function callLLMForClassification(
  items: QAItem[],
  criterion: 'probability' | 'vulnerability' | 'impact'
): Promise<ClassificationResult[] | null> {
  // Fast path: disabled by default or too many items
  if (!ENABLE_LLM_CLASSIFIER || items.length === 0 || items.length > MAX_LLM_ITEMS) {
    return null
  }

  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || ''
  if (!apiKey) return null

  // Build compact instruction to label the batch
  const system = `Tu es un expert sécurité. Pour chaque item, renvoie un label selon ${
    criterion === 'probability' ? 'la PROBABILITÉ' : criterion === 'vulnerability' ? 'la VULNÉRABILITÉ' : 'les RÉPERCUSSIONS'
  }.
Règles:
- 0: la question n\'impacte pas directement ${criterion}
- 1: l\'élément réduit ${criterion} (impact positif)
- 2: l\'élément augmente ${criterion} (impact négatif)
Retourne du JSON strict: { "items": [ { "index": number, "label": 0|1|2, "point": "phrase courte" } ] }.
` 

  const user = {
    items: items.map(({ index, question, answer, source }) => ({ index, question, answer, source }))
  }

  const payload = {
    model: 'gpt-5',
    instructions: system,
    input: JSON.stringify(user),
    max_output_tokens: 700,
    stream: false,
    text: { format: 'json' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!resp.ok) return null
    const data = await resp.json()
    let content: string | undefined = data.output_text
    if (!content && Array.isArray(data.output)) {
      const first = data.output[0]
      const node = first?.content?.find?.((c: any) => c.type === 'output_text' || c.type === 'text') || first?.content?.[0]
      content = node?.text || node?.value || node?.content
    }
    if (!content) return null
    const parsed = JSON.parse(content)
    const out: ClassificationResult[] = (parsed.items || []).map((it: any) => ({
      index: it.index,
      label: it.label as Label,
      point: String(it.point || '')
    }))
    return out
  } catch {
    return null
  }
}

export async function classifyEvaluationResponses(
  evaluations: any[],
  criterion: 'probability' | 'vulnerability' | 'impact',
  riskData?: { target?: string; scenario?: string }
): Promise<{ positives: string[]; negatives: string[]; neutrals: string[] }> {
  // Deterministic lists populated after AI-driven relevance filtering (when enabled)
  const positives: string[] = []
  const negatives: string[] = []
  const neutrals: string[] = []

  const scenario = (riskData?.scenario || '').toLowerCase()
  const target = (riskData?.target || '').toLowerCase()

  const tokenSplit = /[^a-z0-9àâçéèêëîïôûùüÿñæœ]+/i
  const scenarioTokens = scenario.split(tokenSplit).filter(Boolean)
  const targetTokens = target.split(tokenSplit).filter(Boolean)

  function buildContextIndex(evals: any[]): Map<string, { group?: string; objective?: string }> {
    const index = new Map<string, { group?: string; objective?: string }>()
    // Use the first evaluation with a template to build the map
    const withTpl = evals.find(e => e?.template && Array.isArray(e.template.questionGroups))
    if (!withTpl) return index
    withTpl.template.questionGroups.forEach((g: any) => {
      (g.objectives || []).forEach((o: any) => {
        (o.questions || []).forEach((q: any) => {
          if (q?.id) index.set(q.id, { group: g.title, objective: o.title })
        })
      })
    })
    return index
  }

  const ctxIndex = buildContextIndex(evaluations)

  // Fallback keyword relevance (used when LLM relevance is unavailable)
  function keywordIsRelevant(questionText: string, questionId?: string): boolean {
    const q = (questionText || '').toLowerCase()
    const ctx = ctxIndex.get(questionId || '')
    const groupText = (ctx?.group || '').toLowerCase()
    const objectiveText = (ctx?.objective || '').toLowerCase()
    const full = `${q} ${groupText} ${objectiveText}`
    const has = (tokens: string[]) => tokens.some(t => full.includes(t))

    // Target-specialized filters: if target is server room, bias towards server/network/IT/room security
    const targetIsServerRoom = /serveur|server|data\s*center|salle\s*de\s*serveurs/.test(target)
    const includeServerTokens = ['serveur', 'server', 'baie', 'rack', 'data', 'centre de données', 'data center', 'salle de serveurs', 'local serveur', 'onduleur', 'ups', 'extinction', 'incendie', 'fm200', 'novec', 'refroidissement', 'climatisation', 'contrôle d\'accès', 'badge', 'biométr', 'sas', 'vidéo', 'caméra', 'détection intrusion', 'ids', 'pare-feu', 'firewall', 'réseau', 'switch', 'routeur', 'câblage', 'alimentation', 'groupe électrogène']
    const excludePeripheralTokens = ['voie d\'accès', 'route', 'bitumage', 'double sens', 'embouteillage', 'affluence', 'intersection', 'peinture', 'nuisance', 'occupation anarchique']

    if (targetIsServerRoom) {
      if (!has(includeServerTokens)) return false
      if (has(excludePeripheralTokens)) return false
    }

    if (criterion === 'probability') {
      const base = ['ouverture', 'heures', '24h', '24/24', 'accès', 'surveillance', 'vidéo', 'camera', 'maintenance', 'défaillance', 'disponibilité', 'panne']
      return has(base) || has(scenarioTokens) || has(targetTokens)
    }
    if (criterion === 'vulnerability') {
      const base = ['protection', 'contrôle', "contrôle d'accès", 'clé', 'badge', 'biométr', 'porte', 'verrou', 'fermeture', 'alarme', 'éclairage', 'surveillance', 'caméra', 'vidéo', 'gardien']
      return has(base) || has(scenarioTokens)
    }
    // impact
    const base = ['critique', 'important', 'conséquence', 'arrêt', 'coût', 'perte', 'continuité', 'récupération', 'incendie', 'panne', 'électrique', 'serveur']
    return has(base) || has(scenarioTokens)
  }

  // 1) Flatten all responses with indices to enable AI relevance labeling
  type Flat = { index: number; evaluationTitle: string; response: any; questionId?: string; questionText: string }
  const flat: Flat[] = []
  let runningIndex = 0
  evaluations.forEach((evaluation: any) => {
    const evaluationTitle = evaluation.title || evaluation.evaluationTitle || 'Évaluation'
    const responses = evaluation.responses || []
    responses.forEach((r: any) => {
      const questionText = r.questionText || r.question?.text || ''
      flat.push({
        index: runningIndex++,
        evaluationTitle,
        response: r,
        questionId: r.questionId || r?.question?.id,
        questionText
      })
    })
  })

  // 2) Ask LLM which items are relevant for the current criterion in the given context
  let relevantIndexSet: Set<number> | null = null
  try {
    const itemsForLLM = flat.map(({ index, questionText, questionId, response, evaluationTitle }) => {
      const ctx = ctxIndex.get(questionId || '')
      const contextHeader = [`Contexte: Cible: ${riskData?.target || ''}`, `Scénario: ${riskData?.scenario || ''}`, `Critère: ${criterion}`]
        .filter(Boolean)
        .join(' | ')
      const enrichedQuestion = [contextHeader, questionText, ctx?.group ? `Groupe: ${ctx.group}` : '', ctx?.objective ? `Objectif: ${ctx.objective}` : '']
        .filter(Boolean)
        .join(' | ')
      let answerLabel = ''
      if (typeof response.booleanValue === 'boolean') {
        answerLabel = response.booleanValue ? 'Oui' : 'Non'
      } else if (typeof response.numberValue === 'number') {
        answerLabel = String(response.numberValue)
      } else if (typeof response.textValue === 'string') {
        answerLabel = response.textValue
      }
      return {
        index,
        question: enrichedQuestion,
        answer: answerLabel,
        source: evaluationTitle
      }
    })

    const llmOut = await callLLMForClassification(itemsForLLM, criterion)
    if (llmOut && llmOut.length > 0) {
      relevantIndexSet = new Set(llmOut.filter(it => it.label !== 0).map(it => it.index))
    }
  } catch {
    // ignore LLM errors; fallback to keywords
    relevantIndexSet = null
  }

  // 3) Build points using existing polarity logic, but keep only relevant items
  flat.forEach(({ evaluationTitle, response, questionId, questionText, index }) => {
    const isRelevant = relevantIndexSet
      ? relevantIndexSet.has(index)
      : keywordIsRelevant(questionText, questionId)
    if (!isRelevant) return

    let position: 'positive' | 'negative' | 'neutral' = 'neutral'
    let answerLabel = ''

    if (typeof response.booleanValue === 'boolean') {
      const oui = response.booleanValue === true
      const qYesMeansPositive = response?.question?.ouiMeansPositive !== false
      answerLabel = oui ? 'Oui' : 'Non'
      position = (oui && qYesMeansPositive) || (!oui && !qYesMeansPositive) ? 'positive' : 'negative'
    } else if (typeof response.numberValue === 'number') {
      answerLabel = String(response.numberValue)
    } else if (typeof response.textValue === 'string') {
      answerLabel = response.textValue
    }

    const point = `${questionText} - ${answerLabel || '—'} (Source: ${evaluationTitle})`
    const displayedCount = positives.length + negatives.length
    if (position === 'positive') {
      if (displayedCount < MAX_POINTS_PER_CRITERION) positives.push(point)
    } else if (position === 'negative') {
      if (displayedCount < MAX_POINTS_PER_CRITERION) negatives.push(point)
    } else {
      // neutrals are not displayed in UI currently; do not affect the cap
      neutrals.push(point)
    }
  })

  return { positives, negatives, neutrals }
}


