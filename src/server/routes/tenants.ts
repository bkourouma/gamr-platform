import express from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireSuperAdminRole } from '../middleware/auth'
import { validatePagination } from '../middleware/validation'

const router = express.Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/tenants - Récupérer tous les tenants (super admin seulement)
router.get('/', requireSuperAdminRole, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sector, isActive } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (sector) {
      where.sector = sector
    }

    if (typeof isActive === 'string') {
      where.isActive = isActive === 'true'
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              riskSheets: true,
              evaluations: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.tenant.count({ where })
    ])

    res.json({
      data: tenants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des tenants:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des tenants' })
  }
})

// GET /api/tenants/:id - Récupérer un tenant spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, role } = req.user!

    // Les non-super admins ne peuvent voir que leur propre tenant
    const targetId = role === 'SUPER_ADMIN' ? id : tenantId

    const tenant = await prisma.tenant.findUnique({
      where: { id: targetId },
      include: {
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true,
            actions: true
          }
        }
      }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant non trouvé' })
    }

    res.json(tenant)
  } catch (error) {
    console.error('Erreur lors de la récupération du tenant:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération du tenant' })
  }
})

// POST /api/tenants - Créer un nouveau tenant (super admin seulement)
router.post('/', requireSuperAdminRole, async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      sector, 
      size, 
      location,
      riskLevels,
      threatTypes,
      reviewFrequency 
    } = req.body

    // Validation des champs obligatoires
    if (!name || !slug) {
      return res.status(400).json({ 
        error: 'Le nom et le slug sont obligatoires' 
      })
    }

    // Vérifier l'unicité du slug
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() }
    })

    if (existingTenant) {
      return res.status(400).json({ 
        error: 'Un tenant avec ce slug existe déjà' 
      })
    }

    const newTenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug: slug.toLowerCase().trim(),
        description: description?.trim(),
        sector,
        size,
        location,
        riskLevels,
        threatTypes,
        reviewFrequency
      },
      include: {
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true
          }
        }
      }
    })

    res.status(201).json(newTenant)
  } catch (error) {
    console.error('Erreur lors de la création du tenant:', error)
    res.status(500).json({ error: 'Erreur lors de la création du tenant' })
  }
})

// PUT /api/tenants/:id - Mettre à jour un tenant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, role } = req.user!
    
    // Les non-super admins ne peuvent modifier que leur propre tenant
    const targetId = role === 'SUPER_ADMIN' ? id : tenantId

    const { 
      name, 
      description, 
      sector, 
      size, 
      location,
      riskLevels,
      threatTypes,
      reviewFrequency,
      isActive 
    } = req.body

    // Vérifier que le tenant existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: targetId }
    })

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant non trouvé' })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}

    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim()
    if (sector) updateData.sector = sector
    if (size) updateData.size = size
    if (location) updateData.location = location
    if (riskLevels) updateData.riskLevels = riskLevels
    if (threatTypes) updateData.threatTypes = threatTypes
    if (reviewFrequency) updateData.reviewFrequency = reviewFrequency
    
    // Seuls les super admins peuvent modifier le statut actif
    if (role === 'SUPER_ADMIN' && typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: targetId },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true
          }
        }
      }
    })

    res.json(updatedTenant)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du tenant:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour du tenant' })
  }
})

// DELETE /api/tenants/:id - Désactiver un tenant (super admin seulement)
router.delete('/:id', requireSuperAdminRole, async (req, res) => {
  try {
    const { id } = req.params

    // Vérifier que le tenant existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    })

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant non trouvé' })
    }

    // Désactiver le tenant au lieu de le supprimer
    await prisma.tenant.update({
      where: { id },
      data: { isActive: false }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la désactivation du tenant:', error)
    res.status(500).json({ error: 'Erreur lors de la désactivation du tenant' })
  }
})

// GET /api/tenants/stats/global - Statistiques globales (super admin seulement)
router.get('/stats/global', requireSuperAdminRole, async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalRiskSheets,
      tenantsBySector
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.riskSheet.count({ where: { isArchived: false } }),
      prisma.tenant.groupBy({
        by: ['sector'],
        where: { isActive: true },
        _count: true
      })
    ])

    res.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalRiskSheets,
      tenantsBySector: tenantsBySector.map(item => ({
        sector: item.sector || 'Non spécifié',
        count: item._count
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques globales:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques globales' })
  }
})

// PATCH /api/tenants/:id/toggle-status - Basculer le statut d'un tenant (super admin seulement)
router.patch('/:id/toggle-status', requireSuperAdminRole, async (req, res) => {
  try {
    const { id } = req.params

    // Récupérer le tenant actuel
    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    })

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant non trouvé' })
    }

    // Basculer le statut
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        isActive: !existingTenant.isActive
      },
      include: {
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true
          }
        }
      }
    })

    res.json(updatedTenant)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du tenant:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut du tenant' })
  }
})

// DELETE /api/tenants/:id - Supprimer un tenant (super admin seulement)
router.delete('/:id', requireSuperAdminRole, async (req, res) => {
  try {
    const { id } = req.params

    // Vérifier que le tenant existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true
          }
        }
      }
    })

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant non trouvé' })
    }

    // Vérifier s'il y a des données associées
    if (existingTenant._count.users > 0 || existingTenant._count.riskSheets > 0 || existingTenant._count.evaluations > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer ce tenant car il contient des données (utilisateurs, fiches de risques ou évaluations)'
      })
    }

    // Supprimer le tenant
    await prisma.tenant.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression du tenant:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression du tenant' })
  }
})

export { router as tenantsRouter }


