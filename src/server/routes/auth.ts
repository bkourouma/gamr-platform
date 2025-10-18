import express from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { generateToken, authMiddleware } from '../middleware/auth'
import { validateLogin } from '../middleware/validation'

const router = express.Router()

// POST /api/auth/login - Connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Email ou mot de passe incorrect' 
      })
    }

    if (!user.tenant.isActive) {
      return res.status(401).json({ 
        error: 'Votre organisation est désactivée' 
      })
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Email ou mot de passe incorrect' 
      })
    }

    // Mettre à jour la date de dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Générer le token JWT
    const token = generateToken(user.id)

    // Retourner les données utilisateur (sans le mot de passe)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      lastLogin: new Date(),
      tenant: user.tenant
    }

    res.json({
      success: true,
      user: userData,
      token
    })
  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    res.status(500).json({ error: 'Erreur lors de la connexion' })
  }
})

// POST /api/auth/logout - Déconnexion
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Dans une implémentation complète, on pourrait blacklister le token
    // Pour l'instant, on se contente de confirmer la déconnexion
    res.json({ success: true, message: 'Déconnexion réussie' })
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    res.status(500).json({ error: 'Erreur lors de la déconnexion' })
  }
})

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            sector: true,
            size: true,
            location: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    res.json(user)
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' })
  }
})

// PUT /api/auth/profile - Mettre à jour le profil utilisateur
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName } = req.body
    const userId = req.user!.id

    // Validation des données
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Le prénom et le nom sont obligatoires' 
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLogin: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' })
  }
})

// PUT /api/auth/password - Changer le mot de passe
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user!.id

    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Le mot de passe actuel et le nouveau mot de passe sont obligatoires' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      })
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Le mot de passe actuel est incorrect' 
      })
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' })
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' })
  }
})

// GET /api/auth/permissions - Récupérer les permissions de l'utilisateur
router.get('/permissions', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user!

    // Définir les permissions par rôle
    const permissions: Record<string, string[]> = {
      SUPER_ADMIN: [
        'read:all',
        'write:all',
        'delete:all',
        'manage:tenants',
        'manage:users',
        'manage:system'
      ],
      ADMIN: [
        'read:tenant',
        'write:tenant',
        'delete:tenant',
        'manage:users',
        'manage:settings'
      ],
      AI_ANALYST: [
        'read:tenant',
        'write:risks',
        'write:evaluations',
        'manage:ai_models',
        'analyze:data'
      ],
      EVALUATOR: [
        'read:tenant',
        'write:risks',
        'write:evaluations',
        'read:reports'
      ],
      READER: [
        'read:tenant',
        'read:reports'
      ]
    }

    res.json({
      role,
      permissions: permissions[role] || []
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions' })
  }
})

export { router as authRouter }


