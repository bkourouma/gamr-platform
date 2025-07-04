import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Récupérer le premier tenant disponible
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true }
    })

    if (!tenant) {
      console.error('Aucun tenant actif trouvé. Créez d\'abord un tenant.')
      return
    }

    // Vérifier si un admin existe déjà pour ce tenant
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        tenantId: tenant.id
      }
    })

    if (existingAdmin) {
      console.log('Un admin existe déjà pour ce tenant:', existingAdmin.email)
      return
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        email: `admin@${tenant.slug}.com`,
        firstName: 'Admin',
        lastName: tenant.name,
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        tenant: true
      }
    })

    console.log('Admin créé avec succès:')
    console.log('Email:', admin.email)
    console.log('Mot de passe: admin123')
    console.log('Rôle:', admin.role)
    console.log('Tenant:', admin.tenant.name)

    // Créer aussi quelques utilisateurs de test
    const testUsers = [
      {
        email: `evaluator@${tenant.slug}.com`,
        firstName: 'Eva',
        lastName: 'Luateur',
        role: 'EVALUATOR'
      },
      {
        email: `analyst@${tenant.slug}.com`,
        firstName: 'Ana',
        lastName: 'Lyste',
        role: 'AI_ANALYST'
      },
      {
        email: `reader@${tenant.slug}.com`,
        firstName: 'Lee',
        lastName: 'Cteur',
        role: 'READER'
      }
    ]

    console.log('\nCréation d\'utilisateurs de test...')
    
    for (const userData of testUsers) {
      const testPassword = await bcrypt.hash('test123', 12)
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: testPassword,
          tenantId: tenant.id,
          isActive: true
        }
      })
      
      console.log(`✅ ${user.role}: ${user.email} (mot de passe: test123)`)
    }

  } catch (error) {
    console.error('Erreur lors de la création de l\'admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
