import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calcul du score de risque GAMR (normalisé sur 100)
export function calculateRiskScore(probability: number, vulnerability: number, impact: number): number {
  // Score maximum possible: 3 × 4 × 5 = 60
  // Normalisation: (score / 60) × 100 pour obtenir un pourcentage sur 100
  return Math.round((probability * vulnerability * impact) / 60 * 100)
}

// Détermination de la priorité basée sur le score
export function getPriorityFromScore(score: number): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  if (score >= 20) return 'LOW'
  return 'VERY_LOW'
}

// Formatage des dates
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Formatage des dates courtes
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

// Traduction des priorités en français
export function translatePriority(priority: string): string {
  const translations: Record<string, string> = {
    'CRITICAL': 'CRITIQUE',
    'HIGH': 'ÉLEVÉ',
    'MEDIUM': 'MOYEN',
    'LOW': 'FAIBLE',
    'VERY_LOW': 'TRÈS FAIBLE'
  }
  return translations[priority] || priority
}

// Traduction des niveaux de vulnérabilité en français
export function translateVulnerabilityLevel(level: string): string {
  const translations: Record<string, string> = {
    'VERY_HIGH': 'TRÈS ÉLEVÉ',
    'HIGH': 'ÉLEVÉ',
    'MEDIUM': 'MOYEN',
    'LOW': 'FAIBLE',
    'VERY_LOW': 'TRÈS FAIBLE'
  }
  return translations[level] || level
}

// Traduction des niveaux de risque en français
export function translateRiskLevel(level: string): string {
  const translations: Record<string, string> = {
    'UNACCEPTABLE': 'INACCEPTABLE',
    'TOLERABLE': 'TOLÉRABLE',
    'ACCEPTABLE': 'ACCEPTABLE'
  }
  return translations[level] || level
}
