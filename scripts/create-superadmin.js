import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    // Vérifier si un superadmin existe déjà
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })

    if (existingSuperAdmin) {
      console.log('Un superadmin existe déjà:', existingSuperAdmin.email)
      return
    }

    // Créer un tenant par défaut pour le superadmin
    const defaultTenant = await prisma.tenant.upsert({
      where: { slug: 'gamr-admin' },
      update: {},
      create: {
        name: 'GAMRDIGITALE Administration',
        slug: 'gamr-admin',
        description: 'Tenant administratif pour la gestion de la plateforme GAMRDIGITALE',
        sector: 'Technologie',
        size: 'ETI',
        location: 'France',
        isActive: true
      }
    })

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Créer le superadmin
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@gamr.fr',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        tenantId: defaultTenant.id,
        isActive: true
      },
      include: {
        tenant: true
      }
    })

    console.log('Superadmin créé avec succès:')
    console.log('Email:', superAdmin.email)
    console.log('Mot de passe: admin123')
    console.log('Rôle:', superAdmin.role)
    console.log('Tenant:', superAdmin.tenant.name)

  } catch (error) {
    console.error('Erreur lors de la création du superadmin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()
