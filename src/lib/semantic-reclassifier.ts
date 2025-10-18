// Semantic re-classifier for AI evidence points (points_forts / points_faibles)

type Vector = number[]

interface EmbeddingConfig {
  apiKey?: string
  model?: string
}

/**
 * Lightweight embeddings client with a deterministic fallback when no API key is configured.
 */
class EmbeddingClient {
  private apiKey: string | undefined
  private model: string

  constructor(config: EmbeddingConfig = {}) {
    this.apiKey = config.apiKey || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : undefined)
    this.model = config.model || 'text-embedding-3-small'
  }

  public async embed(texts: string[]): Promise<Vector[]> {
    const cleanTexts = texts.map(t => (t || '').toString().slice(0, 2000))

    if (!this.apiKey) {
      return cleanTexts.map(t => this.simpleHashEmbedding(t))
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: cleanTexts
        })
      })

      if (!response.ok) {
        // Fallback if API error
        return cleanTexts.map(t => this.simpleHashEmbedding(t))
      }

      const data = await response.json()
      const vectors: Vector[] = (data.data || []).map((d: any) => d.embedding as number[])
      return vectors.length === cleanTexts.length ? vectors : cleanTexts.map(t => this.simpleHashEmbedding(t))
    } catch {
      return cleanTexts.map(t => this.simpleHashEmbedding(t))
    }
  }

  private simpleHashEmbedding(text: string, dims: number = 256): Vector {
    const vec: number[] = new Array(dims).fill(0)
    const lower = text.toLowerCase()
    for (let i = 0; i < lower.length; i++) {
      const code = lower.charCodeAt(i)
      const idx = code % dims
      vec[idx] += 1
    }
    return this.normalize(vec)
  }

  private normalize(vec: Vector): Vector {
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
    return vec.map(v => v / norm)
  }
}

function cosineSimilarity(a: Vector, b: Vector): number {
  const len = Math.min(a.length, b.length)
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1
  return dot / denom
}

function isClearlyNegative(text: string): boolean {
  const t = text.toLowerCase()
  const negativeCues = [
    ' - non',
    ' non',
    'aucun',
    'aucune',
    'pas de',
    'pas d\'',
    'absence',
    'absent',
    'défaillant',
    'insuffisant',
    'non conforme',
    'non disponible',
    'non présent'
  ]
  return negativeCues.some(cue => t.includes(cue))
}

function isClearlyPositive(text: string): boolean {
  const t = text.toLowerCase()
  const positiveCues = [
    ' - oui',
    ' oui',
    'présence',
    'en place',
    'opérationnel',
    'opérationnelle',
    'fonctionnel',
    'fonctionnelle',
    'conforme',
    'disponible'
  ]
  return positiveCues.some(cue => t.includes(cue))
}

/**
 * Reclassifies evidence points using semantic similarity with prototype anchors and regex cues.
 */
export async function reclassifyEvidencePoints(
  positivePoints: string[],
  negativePoints: string[],
  config: EmbeddingConfig = {}
): Promise<{ positivePoints: string[]; negativePoints: string[]; otherPoints: string[] }> {
  const allPoints = [
    ...positivePoints.map(p => ({ text: p, initial: 'positive' })),
    ...negativePoints.map(p => ({ text: p, initial: 'negative' }))
  ];

  const client = new EmbeddingClient(config);
  const [protectionProto, exposureProto] = await getPrototypes(client);

  const finalPositive: string[] = [];
  const finalNegative: string[] = [];
  const finalOther: string[] = [];

  for (const point of allPoints) {
    const polarity = await getPolarity(point.text, client, protectionProto, exposureProto);

    if (polarity === 'positive') {
      finalPositive.push(point.text);
    } else if (polarity === 'negative') {
      finalNegative.push(point.text);
    } else {
      finalOther.push(point.text);
    }
  }

  return {
    positivePoints: dedupe(finalPositive),
    negativePoints: dedupe(finalNegative),
    otherPoints: dedupe(finalOther)
  };
}

async function getPrototypes(client: EmbeddingClient): Promise<[Vector, Vector]> {
  const protectionAnchors = [
    'contrôle d\'accès en place', 'sous vidéo surveillance', 'éclairage de sécurité',
    'patrouilles de sécurité', 'clôture périmétrique', 'plan d\'urgence', 'maintenance régulière'
  ]
  const exposureAnchors = [
    'voie publique', 'accès public', 'ouvert au public', 'accès facile depuis la rue',
    'sans contrôle', 'zone non éclairée', 'absence de clôture'
  ]

  const [protVectors, expoVectors] = await Promise.all([
    client.embed(protectionAnchors),
    client.embed(exposureAnchors)
  ])

  return [averageVector(protVectors), averageVector(expoVectors)]
}

async function getPolarity(
  text: string,
  client: EmbeddingClient,
  protectionProto: Vector,
  exposureProto: Vector
): Promise<'positive' | 'negative' | 'neutral'> {
  const parsed = parseQA(text)
  if (!parsed) {
    // No parseable answer, rely on lexical cues as a fallback
    if (isClearlyNegative(text) && !isClearlyPositive(text)) return 'negative'
    if (isClearlyPositive(text) && !isClearlyNegative(text)) return 'positive'
    return 'neutral'
  }

  const [questionVector] = await client.embed([parsed.question])
  const simProt = cosineSimilarity(questionVector, protectionProto)
  const simExpo = cosineSimilarity(questionVector, exposureProto)
  const margin = 0.02
  const looksProtective = simProt >= simExpo + margin
  const looksExposing = simExpo >= simProt + margin

  // Re-classification logic based on question type and answer
  if (looksProtective || looksExposing) {
    const expectedYesIsGood = looksProtective
    const isYes = parsed.answer === 'oui'
    const isGood = expectedYesIsGood ? isYes : !isYes

    if (isGood) {
      return 'positive'
    } else {
      return 'negative'
    }
  }

  // Fallback for uncertain polarity: trust the answer's sentiment
  if (parsed.answer === 'oui') return 'positive'
  if (parsed.answer === 'non') return 'negative'

  return 'neutral'
}

function averageVector(vectors: Vector[]): Vector {
  if (vectors.length === 0) return []
  const dims = vectors[0].length
  const sum: number[] = new Array(dims).fill(0)
  vectors.forEach(v => {
    for (let i = 0; i < dims; i++) sum[i] += v[i]
  })
  const inv = 1 / vectors.length
  return sum.map(x => x * inv)
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const it of items) {
    const key = it.trim().toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(it)
    }
  }
  return out
}

function parseQA(text: string): { question: string; answer: 'oui' | 'non' } | null {
  // Expected pattern: "... ? - Oui/Non (Source: ...)"
  const lower = text.toLowerCase()
  const yes = lower.includes(' - oui') || /\b: oui\b/.test(lower)
  const no = lower.includes(' - non') || /\b: non\b/.test(lower)
  if (!yes && !no) return null
  const idx = text.lastIndexOf(' - ')
  const rawQuestion = idx > -1 ? text.slice(0, idx) : text
  // Trim trailing punctuation
  const q = rawQuestion.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return { question: q, answer: yes ? 'oui' : 'non' }
}

export type { EmbeddingConfig }


