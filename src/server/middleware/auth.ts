import express from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

// Extension du type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        firstName: string
        lastName: string
        role: string
        tenantId: string
        tenant: {
          id: string
          name: string
          slug: string
        }
      }
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' })
    }

    const token = authHeader.substring(7) // Enlever "Bearer "
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      // Récupérer l'utilisateur depuis la base de données
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif' })
      }

      // Ajouter l'utilisateur à la requête
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant
      }

      next()
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token invalide' })
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}

// Middleware pour vérifier les rôles
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Permissions insuffisantes',
        required: roles,
        current: req.user.role
      })
    }

    next()
  }
}

// Middleware pour vérifier si l'utilisateur peut modifier/supprimer
export const requireEvaluatorRole = requireRole(['SUPER_ADMIN', 'ADMIN', 'AI_ANALYST', 'EVALUATOR'])

// Middleware pour vérifier si l'utilisateur est admin
export const requireAdminRole = requireRole(['SUPER_ADMIN', 'ADMIN'])

// Middleware pour vérifier si l'utilisateur est super admin
export const requireSuperAdminRole = requireRole(['SUPER_ADMIN'])

// Utilitaire pour générer un token JWT
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

// Utilitaire pour vérifier un token sans middleware
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Token invalide')
  }
}
// Alias pour compatibilité avec les routes existantes
export const authenticateToken = authMiddleware

