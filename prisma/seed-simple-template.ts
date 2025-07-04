import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSimpleTemplate() {
  console.log('🌱 Seeding simple evaluation template...')

  try {
    // Récupérer le tenant TechCorp pour l'exemple
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'techcorp' }
    })

    if (!tenant) {
      console.error('❌ Tenant TechCorp not found. Please run the main seed first.')
      return
    }

    // Vérifier si le template existe déjà
    const existingTemplate = await prisma.evaluationTemplate.findFirst({
      where: {
        name: 'Évaluation Simple Test',
        tenantId: tenant.id
      }
    })

    if (existingTemplate) {
      console.log('✅ Simple template already exists, skipping...')
      return
    }

    // Créer un template d'évaluation simple pour tester
    const template = await prisma.evaluationTemplate.create({
      data: {
        name: 'Évaluation Simple Test',
        description: 'Template simple pour tester le système d\'évaluations',
        version: '1.0',
        tenantId: tenant.id,
        isActive: true,
        questionGroups: {
          create: [
            {
              title: 'Sécurité Physique',
              description: 'Questions sur la sécurité physique du site',
              orderIndex: 0,
              objectives: {
                create: [
                  {
                    title: 'Contrôle d\'accès',
                    description: 'Évaluation des systèmes de contrôle d\'accès',
                    orderIndex: 0,
                    weight: 1.0,
                    questions: {
                      create: [
                        {
                          text: 'Le site dispose-t-il d\'un système de contrôle d\'accès ?',
                          type: 'YES_NO',
                          orderIndex: 0,
                          isRequired: true,
                          weight: 1.0
                        },
                        {
                          text: 'Décrivez le système de contrôle d\'accès en place',
                          type: 'TEXT',
                          orderIndex: 1,
                          isRequired: false,
                          weight: 0.5,
                          placeholder: 'Décrivez les mesures de contrôle d\'accès...'
                        }
                      ]
                    }
                  },
                  {
                    title: 'Surveillance',
                    description: 'Évaluation des systèmes de surveillance',
                    orderIndex: 1,
                    weight: 1.0,
                    questions: {
                      create: [
                        {
                          text: 'Le site dispose-t-il de caméras de surveillance ?',
                          type: 'YES_NO',
                          orderIndex: 0,
                          isRequired: true,
                          weight: 1.0
                        },
                        {
                          text: 'Nombre de caméras installées',
                          type: 'NUMBER',
                          orderIndex: 1,
                          isRequired: false,
                          weight: 0.3,
                          placeholder: 'Nombre de caméras'
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              title: 'Sécurité Informatique',
              description: 'Questions sur la cybersécurité',
              orderIndex: 1,
              objectives: {
                create: [
                  {
                    title: 'Protection des données',
                    description: 'Évaluation de la protection des données',
                    orderIndex: 0,
                    weight: 1.0,
                    questions: {
                      create: [
                        {
                          text: 'Les données sensibles sont-elles chiffrées ?',
                          type: 'YES_NO',
                          orderIndex: 0,
                          isRequired: true,
                          weight: 1.0
                        },
                        {
                          text: 'Fréquence des sauvegardes (Quotidienne/Hebdomadaire/Mensuelle/Aucune)',
                          type: 'TEXT',
                          orderIndex: 1,
                          isRequired: true,
                          weight: 0.8,
                          placeholder: 'Indiquez la fréquence des sauvegardes'
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    })

    console.log(`✅ Created simple template: ${template.name}`)

    // Compter les éléments créés
    const stats = await prisma.evaluationTemplate.findUnique({
      where: { id: template.id },
      include: {
        _count: {
          select: {
            questionGroups: true
          }
        },
        questionGroups: {
          include: {
            _count: {
              select: {
                objectives: true
              }
            },
            objectives: {
              include: {
                _count: {
                  select: {
                    questions: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (stats) {
      const totalObjectives = stats.questionGroups.reduce((sum, group) => sum + group._count.objectives, 0)
      const totalQuestions = stats.questionGroups.reduce((sum, group) => 
        sum + group.objectives.reduce((objSum, obj) => objSum + obj._count.questions, 0), 0
      )

      console.log(`📊 Template statistics:`)
      console.log(`   - Groups: ${stats._count.questionGroups}`)
      console.log(`   - Objectives: ${totalObjectives}`)
      console.log(`   - Questions: ${totalQuestions}`)
    }

    // Créer également le template pour les autres tenants
    const otherTenants = await prisma.tenant.findMany({
      where: {
        slug: { not: 'techcorp' },
        isActive: true
      }
    })

    for (const otherTenant of otherTenants) {
      const existingForTenant = await prisma.evaluationTemplate.findFirst({
        where: {
          name: 'Évaluation Simple Test',
          tenantId: otherTenant.id
        }
      })

      if (!existingForTenant) {
        await prisma.evaluationTemplate.create({
          data: {
            name: 'Évaluation Simple Test',
            description: 'Template simple pour tester le système d\'évaluations',
            version: '1.0',
            tenantId: otherTenant.id,
            isActive: true,
            questionGroups: {
              create: [
                {
                  title: 'Sécurité Physique',
                  description: 'Questions sur la sécurité physique du site',
                  orderIndex: 0,
                  objectives: {
                    create: [
                      {
                        title: 'Contrôle d\'accès',
                        description: 'Évaluation des systèmes de contrôle d\'accès',
                        orderIndex: 0,
                        weight: 1.0,
                        questions: {
                          create: [
                            {
                              text: 'Le site dispose-t-il d\'un système de contrôle d\'accès ?',
                              type: 'YES_NO',
                              orderIndex: 0,
                              isRequired: true,
                              weight: 1.0
                            },
                            {
                              text: 'Décrivez le système de contrôle d\'accès en place',
                              type: 'TEXT',
                              orderIndex: 1,
                              isRequired: false,
                              weight: 0.5,
                              placeholder: 'Décrivez les mesures de contrôle d\'accès...'
                            }
                          ]
                        }
                      },
                      {
                        title: 'Surveillance',
                        description: 'Évaluation des systèmes de surveillance',
                        orderIndex: 1,
                        weight: 1.0,
                        questions: {
                          create: [
                            {
                              text: 'Le site dispose-t-il de caméras de surveillance ?',
                              type: 'YES_NO',
                              orderIndex: 0,
                              isRequired: true,
                              weight: 1.0
                            },
                            {
                              text: 'Nombre de caméras installées',
                              type: 'NUMBER',
                              orderIndex: 1,
                              isRequired: false,
                              weight: 0.3,
                              placeholder: 'Nombre de caméras'
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  title: 'Sécurité Informatique',
                  description: 'Questions sur la cybersécurité',
                  orderIndex: 1,
                  objectives: {
                    create: [
                      {
                        title: 'Protection des données',
                        description: 'Évaluation de la protection des données',
                        orderIndex: 0,
                        weight: 1.0,
                        questions: {
                          create: [
                            {
                              text: 'Les données sensibles sont-elles chiffrées ?',
                              type: 'YES_NO',
                              orderIndex: 0,
                              isRequired: true,
                              weight: 1.0
                            },
                            {
                              text: 'Fréquence des sauvegardes (Quotidienne/Hebdomadaire/Mensuelle/Aucune)',
                              type: 'TEXT',
                              orderIndex: 1,
                              isRequired: true,
                              weight: 0.8,
                              placeholder: 'Indiquez la fréquence des sauvegardes'
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        })
        console.log(`✅ Created template for tenant: ${otherTenant.name}`)
      }
    }

    console.log('🎉 Simple template seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding simple template:', error)
    throw error
  }
}

async function main() {
  try {
    await seedSimpleTemplate()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le seeding
main()
