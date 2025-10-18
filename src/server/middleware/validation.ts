import express from 'express'

// Validation pour les fiches de risque
export const validateRiskSheet = (req: any, res: any, next: any) => {
  const { target, scenario, probability, vulnerability, impact } = req.body
  const errors: string[] = []

  // Validation des champs obligatoires
  if (!target || typeof target !== 'string' || target.trim().length === 0) {
    errors.push('La cible potentielle est obligatoire')
  }

  if (!scenario || typeof scenario !== 'string' || scenario.trim().length === 0) {
    errors.push('Le scénario de menace est obligatoire')
  }

  // Validation des valeurs numériques
  if (!Number.isInteger(probability) || probability < 1 || probability > 3) {
    errors.push('La probabilité doit être un entier entre 1 et 3')
  }

  if (!Number.isInteger(vulnerability) || vulnerability < 1 || vulnerability > 4) {
    errors.push('La vulnérabilité doit être un entier entre 1 et 4')
  }

  if (!Number.isInteger(impact) || impact < 1 || impact > 5) {
    errors.push('L\'impact doit être un entier entre 1 et 5')
  }

  // Validation de la longueur des champs
  if (target && target.length > 255) {
    errors.push('La cible potentielle ne peut pas dépasser 255 caractères')
  }

  if (scenario && scenario.length > 2000) {
    errors.push('Le scénario de menace ne peut pas dépasser 2000 caractères')
  }

  // Validation de la catégorie (optionnelle)
  if (req.body.category && typeof req.body.category !== 'string') {
    errors.push('La catégorie doit être une chaîne de caractères')
  }

  // Validation des recommandations IA (optionnelles)
  if (req.body.aiSuggestions) {
    if (typeof req.body.aiSuggestions !== 'object') {
      errors.push('Les suggestions IA doivent être un objet')
    } else {
      // Validation de la structure des recommandations IA
      const aiSuggestions = req.body.aiSuggestions

      if (aiSuggestions.recommendations && !Array.isArray(aiSuggestions.recommendations)) {
        errors.push('Les recommandations IA doivent être un tableau')
      }

      if (aiSuggestions.confidence && (typeof aiSuggestions.confidence !== 'number' || aiSuggestions.confidence < 0 || aiSuggestions.confidence > 1)) {
        errors.push('La confiance IA doit être un nombre entre 0 et 1')
      }

      if (aiSuggestions.analysis && typeof aiSuggestions.analysis !== 'object') {
        errors.push('L\'analyse IA doit être un objet')
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors
    })
  }

  next()
}

// Validation pour l'authentification
export const validateLogin = (req: any, res: any, next: any) => {
  const { email, password } = req.body
  const errors: string[] = []

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('L\'email est obligatoire')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('L\'email n\'est pas valide')
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors
    })
  }

  next()
}

// Validation pour la création d'utilisateur
export const validateUser = (req: any, res: any, next: any) => {
  const { email, firstName, lastName, password, role } = req.body
  const errors: string[] = []

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('L\'email est obligatoire')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('L\'email n\'est pas valide')
  }

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    errors.push('Le prénom est obligatoire')
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    errors.push('Le nom est obligatoire')
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères')
  }

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'AI_ANALYST', 'EVALUATOR', 'READER']
  if (role && !validRoles.includes(role)) {
    errors.push(`Le rôle doit être l'un des suivants: ${validRoles.join(', ')}`)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors
    })
  }

  next()
}

// Validation pour les paramètres de pagination
export const validatePagination = (req: any, res: any, next: any) => {
  const { page, limit } = req.query

  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({
      error: 'Le paramètre page doit être un entier positif'
    })
  }

  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({
      error: 'Le paramètre limit doit être un entier entre 1 et 100'
    })
  }

  next()
}

// Validation générique pour les IDs
export const validateId = (paramName: string = 'id') => {
  return (req: any, res: any, next: any) => {
    const id = req.params[paramName]
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        error: `Le paramètre ${paramName} est obligatoire`
      })
    }

    // Validation du format CUID (optionnel, dépend de votre configuration Prisma)
    if (!/^[a-z0-9]{25}$/.test(id)) {
      return res.status(400).json({
        error: `Le paramètre ${paramName} n'est pas valide`
      })
    }

    next()
  }
}

// Middleware de sanitisation des données
export const sanitizeInput = (req: any, res: any, next: any) => {
  // Fonction récursive pour nettoyer les objets
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim()
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key])
      }
      return sanitized
    }
    return obj
  }

  req.body = sanitize(req.body)
  next()
}


