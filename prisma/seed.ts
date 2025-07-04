import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Nettoyer les données existantes
  await prisma.auditLog.deleteMany()
  await prisma.action.deleteMany()
  await prisma.riskCorrelation.deleteMany()
  await prisma.riskSheet.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  console.log('🧹 Données existantes supprimées')

  // Créer des tenants de test
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'TechCorp Solutions',
      slug: 'techcorp',
      description: 'Entreprise de solutions technologiques',
      sector: 'Technologie',
      size: 'ETI',
      location: 'Paris, France',
      riskLevels: {
        probability: ['Faible', 'Moyen', 'Élevé'],
        vulnerability: ['Très faible', 'Faible', 'Moyen', 'Élevé'],
        impact: ['Négligeable', 'Mineur', 'Modéré', 'Majeur', 'Critique']
      },
      threatTypes: ['Cybersécurité', 'Opérationnel', 'Financier', 'Réglementaire', 'Réputation'],
      reviewFrequency: 90
    }
  })

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'HealthCare Plus',
      slug: 'healthcare-plus',
      description: 'Centre médical spécialisé',
      sector: 'Santé',
      size: 'PME',
      location: 'Lyon, France',
      riskLevels: {
        probability: ['Rare', 'Possible', 'Probable'],
        vulnerability: ['Résistant', 'Faible', 'Moyen', 'Vulnérable'],
        impact: ['Mineur', 'Modéré', 'Sérieux', 'Grave', 'Catastrophique']
      },
      threatTypes: ['Médical', 'Données patients', 'Réglementaire', 'Sécurité', 'Opérationnel'],
      reviewFrequency: 60
    }
  })

  console.log('🏢 Tenants créés')

  // Hacher les mots de passe
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Créer des utilisateurs de test
  const users = await Promise.all([
    // TechCorp Users
    prisma.user.create({
      data: {
        email: 'admin@techcorp.com',
        password: hashedPassword,
        firstName: 'Marie',
        lastName: 'Dubois',
        role: 'ADMIN',
        tenantId: tenant1.id,
        lastLogin: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'analyst@techcorp.com',
        password: hashedPassword,
        firstName: 'Jean',
        lastName: 'Martin',
        role: 'AI_ANALYST',
        tenantId: tenant1.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'evaluator@techcorp.com',
        password: hashedPassword,
        firstName: 'Sophie',
        lastName: 'Laurent',
        role: 'EVALUATOR',
        tenantId: tenant1.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'reader@techcorp.com',
        password: hashedPassword,
        firstName: 'Pierre',
        lastName: 'Durand',
        role: 'READER',
        tenantId: tenant1.id
      }
    }),

    // HealthCare Users
    prisma.user.create({
      data: {
        email: 'admin@healthcare-plus.com',
        password: hashedPassword,
        firstName: 'Dr. Claire',
        lastName: 'Moreau',
        role: 'ADMIN',
        tenantId: tenant2.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'evaluator@healthcare-plus.com',
        password: hashedPassword,
        firstName: 'Marc',
        lastName: 'Rousseau',
        role: 'EVALUATOR',
        tenantId: tenant2.id
      }
    }),

    // Super Admin
    prisma.user.create({
      data: {
        email: 'superadmin@gamr.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        tenantId: tenant1.id // Peut accéder à tous les tenants
      }
    })
  ])

  console.log('👥 Utilisateurs créés')

  // Créer des fiches de risques de test
  const riskSheets = await Promise.all([
    // TechCorp Risks
    prisma.riskSheet.create({
      data: {
        target: 'Serveurs de production',
        scenario: 'Cyberattaque par ransomware sur l\'infrastructure critique',
        probability: 2,
        vulnerability: 3,
        impact: 4,
        riskScore: 66.67,
        priority: 'HIGH',
        category: 'Cybersécurité',
        tags: ['ransomware', 'infrastructure', 'critique'],
        aiSuggestions: {
          recommendations: ['Mise à jour des systèmes', 'Formation du personnel', 'Sauvegarde offline'],
          confidence: 0.85
        },
        reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        tenantId: tenant1.id,
        authorId: users[1].id // Jean Martin (AI_ANALYST)
      }
    }),
    prisma.riskSheet.create({
      data: {
        target: 'Données clients',
        scenario: 'Fuite de données personnelles via une vulnérabilité applicative',
        probability: 2,
        vulnerability: 4,
        impact: 5,
        riskScore: 83.33,
        priority: 'CRITICAL',
        category: 'Protection des données',
        tags: ['rgpd', 'données', 'vulnérabilité'],
        aiSuggestions: {
          recommendations: ['Audit de sécurité', 'Chiffrement renforcé', 'Tests de pénétration'],
          confidence: 0.92
        },
        reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tenantId: tenant1.id,
        authorId: users[2].id // Sophie Laurent (EVALUATOR)
      }
    }),

    // HealthCare Risks
    prisma.riskSheet.create({
      data: {
        target: 'Dossiers médicaux électroniques',
        scenario: 'Accès non autorisé aux données patients',
        probability: 1,
        vulnerability: 2,
        impact: 5,
        riskScore: 41.67,
        priority: 'MEDIUM',
        category: 'Données patients',
        tags: ['hipaa', 'confidentialité', 'accès'],
        aiSuggestions: {
          recommendations: ['Contrôle d\'accès renforcé', 'Audit des logs', 'Formation RGPD'],
          confidence: 0.78
        },
        reviewDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        tenantId: tenant2.id,
        authorId: users[5].id // Marc Rousseau (EVALUATOR)
      }
    })
  ])

  console.log('📋 Fiches de risques créées')

  // Créer des actions correctives
  await Promise.all([
    prisma.action.create({
      data: {
        title: 'Mise à jour des systèmes de sécurité',
        description: 'Déployer les dernières mises à jour de sécurité sur tous les serveurs',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        successProbability: 0.85,
        estimatedCost: 15000,
        estimatedDuration: 14,
        tenantId: tenant1.id,
        riskSheetId: riskSheets[0].id,
        assigneeId: users[1].id
      }
    }),
    prisma.action.create({
      data: {
        title: 'Audit de sécurité des applications',
        description: 'Effectuer un audit complet de sécurité des applications web',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: 'TODO',
        priority: 'CRITICAL',
        successProbability: 0.92,
        estimatedCost: 25000,
        estimatedDuration: 21,
        tenantId: tenant1.id,
        riskSheetId: riskSheets[1].id,
        assigneeId: users[2].id
      }
    })
  ])

  console.log('✅ Actions correctives créées')

  console.log('🎉 Seeding terminé avec succès!')
  console.log('\n📧 Comptes de test créés:')
  console.log('TechCorp Solutions:')
  console.log('  - admin@techcorp.com (ADMIN)')
  console.log('  - analyst@techcorp.com (AI_ANALYST)')
  console.log('  - evaluator@techcorp.com (EVALUATOR)')
  console.log('  - reader@techcorp.com (READER)')
  console.log('\nHealthCare Plus:')
  console.log('  - admin@healthcare-plus.com (ADMIN)')
  console.log('  - evaluator@healthcare-plus.com (EVALUATOR)')
  console.log('\nSuper Admin:')
  console.log('  - superadmin@gamr.com (SUPER_ADMIN)')
  console.log('\n🔑 Mot de passe pour tous: password123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
