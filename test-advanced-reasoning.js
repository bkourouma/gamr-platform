// Test du moteur de raisonnement avancé pour l'analyse des risques GAMRDIGITALE
const { generateEnhancedAIAnalysis } = require('./src/lib/enhanced-risk-ai-analysis.ts')

// Données de test avec évaluations complètes et variées
const mockRiskData = {
  target: "Accès non autorisé aux installations minières",
  scenario: "Intrusion par défaillance du système de contrôle d'accès et surveillance périmétrique",
  category: "Sécurité Physique"
}

const mockEvaluationsAdvanced = [
  {
    id: "eval-mine-1",
    title: "Évaluation sécurité - Mine d'or TechCorp Site A",
    status: "COMPLETED",
    totalScore: 65,
    riskLevel: "MEDIUM",
    completedAt: "2024-01-15T10:00:00Z",
    entityInfo: {
      sector: "Mines et extraction",
      companySize: "ETI",
      location: "Johannesburg"
    },
    template: {
      name: "GAMRDIGITALE - Évaluation Sécurité Complète",
      description: "Questionnaire complet 42 objectifs"
    },
    responses: [
      {
        questionId: "q1-access-1",
        questionText: "Le site dispose-t-il d'un système de contrôle d'accès électronique avec badges RFID ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 3,
        sectionId: "access_control"
      },
      {
        questionId: "q1-access-2", 
        questionText: "Les accès sont-ils enregistrés et tracés dans un journal électronique ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 3,
        sectionId: "access_control"
      },
      {
        questionId: "q1-perimeter-1",
        questionText: "Y a-t-il une clôture périmétrique complète autour du site minier ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 2,
        sectionId: "perimeter"
      },
      {
        questionId: "q1-surveillance-1",
        questionText: "Le site dispose-t-il d'un système de surveillance vidéo opérationnel 24h/24 ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "surveillance"
      },
      {
        questionId: "q1-surveillance-2",
        questionText: "Les caméras couvrent-elles tous les points critiques et d'accès ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "surveillance"
      },
      {
        questionId: "q1-lighting-1",
        questionText: "L'éclairage de sécurité est-il adéquat pour la surveillance nocturne ?",
        booleanValue: true,
        facilityScore: 2,
        constraintScore: 1,
        sectionId: "lighting"
      },
      {
        questionId: "q1-training-1",
        questionText: "Le personnel a-t-il reçu une formation complète en sécurité minière ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 2,
        sectionId: "training"
      },
      {
        questionId: "q1-procedures-1",
        questionText: "Des procédures de sécurité écrites sont-elles documentées et régulièrement mises à jour ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "procedures"
      },
      {
        questionId: "q1-incidents-1",
        questionText: "Y a-t-il eu des incidents de sécurité ou tentatives d'intrusion au cours des 12 derniers mois ?",
        booleanValue: true,
        facilityScore: 1,
        constraintScore: 3,
        sectionId: "incidents"
      },
      {
        questionId: "q1-infrastructure-1",
        questionText: "Les systèmes électriques critiques sont-ils sécurisés et redondants ?",
        booleanValue: true,
        facilityScore: 2,
        constraintScore: 1,
        sectionId: "infrastructure"
      }
    ]
  },
  {
    id: "eval-mine-2",
    title: "Évaluation sécurité - Mine d'or TechCorp Site B",
    status: "COMPLETED",
    totalScore: 45,
    riskLevel: "HIGH",
    completedAt: "2024-02-10T14:30:00Z",
    entityInfo: {
      sector: "Mines et extraction",
      companySize: "ETI",
      location: "Pretoria"
    },
    template: {
      name: "GAMRDIGITALE - Évaluation Sécurité Complète",
      description: "Questionnaire complet 42 objectifs"
    },
    responses: [
      {
        questionId: "q2-access-1",
        questionText: "Le site dispose-t-il d'un système de contrôle d'accès électronique avec badges RFID ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 3,
        sectionId: "access_control"
      },
      {
        questionId: "q2-perimeter-1",
        questionText: "Y a-t-il une clôture périmétrique complète autour du site minier ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 3,
        sectionId: "perimeter"
      },
      {
        questionId: "q2-surveillance-1",
        questionText: "Le site dispose-t-il d'un système de surveillance vidéo opérationnel 24h/24 ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 3,
        sectionId: "surveillance"
      },
      {
        questionId: "q2-training-1",
        questionText: "Le personnel a-t-il reçu une formation complète en sécurité minière ?",
        booleanValue: false,
        facilityScore: 1,
        constraintScore: 2,
        sectionId: "training"
      },
      {
        questionId: "q2-incidents-1",
        questionText: "Y a-t-il eu des incidents de sécurité ou tentatives d'intrusion au cours des 12 derniers mois ?",
        booleanValue: true,
        facilityScore: 1,
        constraintScore: 3,
        sectionId: "incidents"
      }
    ]
  },
  {
    id: "eval-mine-3",
    title: "Évaluation sécurité - Mine d'or TechCorp Site C",
    status: "COMPLETED",
    totalScore: 85,
    riskLevel: "LOW",
    completedAt: "2024-03-05T09:15:00Z",
    entityInfo: {
      sector: "Mines et extraction",
      companySize: "ETI",
      location: "Cape Town"
    },
    template: {
      name: "GAMRDIGITALE - Évaluation Sécurité Complète",
      description: "Questionnaire complet 42 objectifs"
    },
    responses: [
      {
        questionId: "q3-access-1",
        questionText: "Le site dispose-t-il d'un système de contrôle d'accès électronique avec badges RFID ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "access_control"
      },
      {
        questionId: "q3-perimeter-1",
        questionText: "Y a-t-il une clôture périmétrique complète autour du site minier ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "perimeter"
      },
      {
        questionId: "q3-surveillance-1",
        questionText: "Le site dispose-t-il d'un système de surveillance vidéo opérationnel 24h/24 ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "surveillance"
      },
      {
        questionId: "q3-training-1",
        questionText: "Le personnel a-t-il reçu une formation complète en sécurité minière ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "training"
      },
      {
        questionId: "q3-procedures-1",
        questionText: "Des procédures de sécurité écrites sont-elles documentées et régulièrement mises à jour ?",
        booleanValue: true,
        facilityScore: 3,
        constraintScore: 1,
        sectionId: "procedures"
      }
    ]
  }
]

async function testAdvancedReasoning() {
  console.log('🧠 Test du moteur de raisonnement avancé GAMRDIGITALE')
  console.log('=' .repeat(80))
  
  try {
    console.log('🎯 Cible:', mockRiskData.target)
    console.log('📝 Scénario:', mockRiskData.scenario)
    console.log('📊 Évaluations analysées:', mockEvaluationsAdvanced.length)
    console.log('')
    
    const startTime = Date.now()
    const analysis = await generateEnhancedAIAnalysis(mockRiskData, mockEvaluationsAdvanced)
    const analysisTime = Date.now() - startTime
    
    console.log(`⏱️  Temps d'analyse: ${analysisTime}ms`)
    console.log(`🎯 Qualité du raisonnement: ${analysis.reasoningQuality}`)
    console.log(`🔍 Niveau de confiance global: ${Math.round((analysis.confidenceLevel || 0) * 100)}%`)
    console.log('')
    
    // Affichage des résultats détaillés
    console.log('📈 PROBABILITÉ:', analysis.probability.score + '/3')
    console.log('   Confiance:', Math.round(analysis.probability.confidence * 100) + '%')
    console.log('   Explication:', analysis.probability.explanation)
    if (analysis.probability.reasoning) {
      console.log('   Raisonnement:', analysis.probability.reasoning)
    }
    console.log('   ✅ Points positifs:')
    analysis.probability.positivePoints.forEach(point => console.log('      •', point))
    console.log('   ❌ Points négatifs:')
    analysis.probability.negativePoints.forEach(point => console.log('      •', point))
    console.log('')
    
    console.log('🛡️ VULNÉRABILITÉ:', analysis.vulnerability.score + '/4')
    console.log('   Confiance:', Math.round(analysis.vulnerability.confidence * 100) + '%')
    console.log('   Explication:', analysis.vulnerability.explanation)
    console.log('   ✅ Points positifs:')
    analysis.vulnerability.positivePoints.slice(0, 3).forEach(point => console.log('      •', point))
    console.log('   ❌ Points négatifs:')
    analysis.vulnerability.negativePoints.slice(0, 3).forEach(point => console.log('      •', point))
    console.log('')
    
    console.log('💥 REPERCUSSIONS:', analysis.impact.score + '/5')
    console.log('   Confiance:', Math.round(analysis.impact.confidence * 100) + '%')
    console.log('   Explication:', analysis.impact.explanation)
    console.log('')
    
    // Insights contextuels
    if (analysis.contextualInsights && analysis.contextualInsights.length > 0) {
      console.log('🔍 INSIGHTS CONTEXTUELS:')
      analysis.contextualInsights.slice(0, 3).forEach((insight, idx) => {
        console.log(`   ${idx + 1}. ${insight.title} (${insight.significance})`)
        console.log(`      ${insight.description}`)
        if (insight.evidence && insight.evidence.length > 0) {
          console.log(`      Preuves: ${insight.evidence.slice(0, 2).join(', ')}`)
        }
        console.log('')
      })
    }
    
    // Patterns cross-évaluations
    if (analysis.crossEvaluationPatterns && analysis.crossEvaluationPatterns.length > 0) {
      console.log('🔗 PATTERNS CROSS-ÉVALUATIONS:')
      analysis.crossEvaluationPatterns.slice(0, 2).forEach((pattern, idx) => {
        console.log(`   ${idx + 1}. ${pattern.pattern}`)
        console.log(`      Force: ${Math.round(pattern.strength * 100)}%`)
        console.log(`      Implication: ${pattern.implication}`)
        console.log('')
      })
    }
    
    // Recommandations de questionnaires
    if (analysis.questionnaireRecommendations && analysis.questionnaireRecommendations.length > 0) {
      console.log('📝 RECOMMANDATIONS QUESTIONNAIRES:')
      analysis.questionnaireRecommendations.slice(0, 2).forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec.category} (${rec.priority || 'medium'})`)
        console.log(`      Raison: ${rec.reason}`)
        console.log('      Questions suggérées:')
        rec.suggestedQuestions.slice(0, 2).forEach(q => console.log(`         • ${q}`))
        if (rec.expectedInsight) {
          console.log(`      Insight attendu: ${rec.expectedInsight}`)
        }
        console.log('')
      })
    }
    
    console.log('🔍 ÉVALUATION GLOBALE:')
    console.log(analysis.overallAssessment)
    console.log('')
    
    console.log('✅ Test du moteur de raisonnement avancé terminé avec succès!')
    console.log('')
    console.log('🎯 AVANTAGES DU MOTEUR AVANCÉ:')
    console.log('   ✓ Analyse contextuelle multi-évaluations')
    console.log('   ✓ Détection de patterns et anomalies')
    console.log('   ✓ Raisonnement basé sur des preuves')
    console.log('   ✓ Insights contextuels intelligents')
    console.log('   ✓ Recommandations de questionnaires ciblées')
    console.log('   ✓ Évaluation de la qualité du raisonnement')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.log('')
    console.log('🔄 Le système de fallback devrait prendre le relais...')
  }
}

// Exécuter le test
testAdvancedReasoning()
