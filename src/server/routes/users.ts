import express from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdminRole } from '../middleware/auth'
import { validateUser, validatePagination } from '../middleware/validation'
import { NotificationService } from '../services/notificationService'

const router = express.Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/users - Récupérer tous les utilisateurs du tenant
router.get('/', validatePagination, async (req, res) => {
  try {
    const { tenantId, role } = req.user!
    const { page = 1, limit = 10, search, role: filterRole } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {}

    // Les super admins peuvent voir tous les utilisateurs
    if (role !== 'SUPER_ADMIN') {
      where.tenantId = tenantId
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (filterRole) {
      where.role = filterRole
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.user.count({ where })
    ])

    res.json({
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' })
  }
})

// GET /api/users/:id - Récupérer un utilisateur spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, role } = req.user!

    const where: any = { id }

    // Les non-super admins ne peuvent voir que les utilisateurs de leur tenant
    if (role !== 'SUPER_ADMIN') {
      where.tenantId = tenantId
    }

    const user = await prisma.user.findFirst({
      where,
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

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    res.json(user)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' })
  }
})

// POST /api/users - Créer un nouvel utilisateur (admin seulement)
router.post('/', requireAdminRole, validateUser, async (req, res) => {
  try {
    const { email, firstName, lastName, password, role = 'READER' } = req.body
    const { tenantId, role: userRole } = req.user!

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Déterminer le tenant pour le nouvel utilisateur
    let targetTenantId = tenantId
    
    // Les super admins peuvent créer des utilisateurs pour d'autres tenants
    if (userRole === 'SUPER_ADMIN' && req.body.tenantId) {
      targetTenantId = req.body.tenantId
    }

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: hashedPassword,
        role,
        tenantId: targetTenantId
      },
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

    res.status(201).json(newUser)
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' })
  }
})

// PUT /api/users/:id - Mettre à jour un utilisateur (admin seulement)
router.put('/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, role, isActive } = req.body
    const { tenantId, role: userRole } = req.user!

    const where: any = { id }

    // Les non-super admins ne peuvent modifier que les utilisateurs de leur tenant
    if (userRole !== 'SUPER_ADMIN') {
      where.tenantId = tenantId
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findFirst({ where })

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}

    if (firstName) updateData.firstName = firstName.trim()
    if (lastName) updateData.lastName = lastName.trim()
    if (role) updateData.role = role
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    res.json(updatedUser)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' })
  }
})

// DELETE /api/users/:id - Désactiver un utilisateur (admin seulement)
router.delete('/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, role: userRole, id: currentUserId } = req.user!

    // Empêcher l'auto-suppression
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous désactiver vous-même' })
    }

    const where: any = { id }

    // Les non-super admins ne peuvent désactiver que les utilisateurs de leur tenant
    if (userRole !== 'SUPER_ADMIN') {
      where.tenantId = tenantId
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findFirst({ where })

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Désactiver l'utilisateur au lieu de le supprimer
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    // Créer une notification pour la désactivation
    try {
      await NotificationService.create({
        title: '🗑️ Utilisateur Supprimé',
        message: `L'utilisateur ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email}) a été définitivement désactivé.`,
        type: 'SYSTEM',
        tenantId: existingUser.tenantId
      })
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError)
      // Ne pas faire échouer la requête si la notification échoue
    }

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur lors de la désactivation de l\'utilisateur' })
  }
})

// GET /api/users/stats/dashboard - Statistiques des utilisateurs
router.get('/stats/dashboard', requireAdminRole, async (req, res) => {
  try {
    const { tenantId, role } = req.user!

    const where: any = {}
    if (role !== 'SUPER_ADMIN') {
      where.tenantId = tenantId
    }

    const [
      totalUsers,
      activeUsers,
      recentUsers,
      usersByRole
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, isActive: true } }),
      prisma.user.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true
      })
    ])

    res.json({
      totalUsers,
      activeUsers,
      recentUsers,
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateurs:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques utilisateurs' })
  }
})

// PATCH /api/users/:id/toggle-status - Basculer le statut d'un utilisateur (admin seulement)
router.patch('/:id/toggle-status', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, role } = req.user!

    // Vérifier que l'utilisateur existe et appartient au bon tenant
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Les non-super admins ne peuvent modifier que les utilisateurs de leur tenant
    if (role !== 'SUPER_ADMIN' && existingUser.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Permissions insuffisantes' })
    }

    // Empêcher un utilisateur de se désactiver lui-même
    if (existingUser.id === req.user!.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre statut' })
    }

    // Basculer le statut
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: !existingUser.isActive
      },
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

    // Créer une notification pour le changement de statut
    try {
      const statusText = updatedUser.isActive ? 'activé' : 'désactivé'
      await NotificationService.create({
        title: '👤 Statut Utilisateur Modifié',
        message: `L'utilisateur ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email}) a été ${statusText}.`,
        type: 'SYSTEM',
        tenantId: updatedUser.tenantId
      })
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError)
      // Ne pas faire échouer la requête si la notification échoue
    }

    res.json(updatedUser)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut de l\'utilisateur' })
  }
})

// PATCH /api/users/:id/password - Changer le mot de passe d'un utilisateur (admin seulement)
router.patch('/:id/password', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params
    const { password } = req.body
    const { tenantId, role } = req.user!

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }

    // Vérifier que l'utilisateur existe et appartient au bon tenant
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Les non-super admins ne peuvent modifier que les utilisateurs de leur tenant
    if (role !== 'SUPER_ADMIN' && existingUser.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Permissions insuffisantes' })
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' })
  }
})

// DELETE /api/users/:id - Supprimer un utilisateur (admin seulement)
router.delete('/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, role } = req.user!

    // Vérifier que l'utilisateur existe et appartient au bon tenant
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Les non-super admins ne peuvent supprimer que les utilisateurs de leur tenant
    if (role !== 'SUPER_ADMIN' && existingUser.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Permissions insuffisantes' })
    }

    // Empêcher un utilisateur de se supprimer lui-même
    if (existingUser.id === req.user!.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' })
  }
})

export { router as usersRouter }


