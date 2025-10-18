// Test de l'analyse IA pour les fiches de risques
const { generateAIAnalysis } = require('./src/lib/risk-ai-analysis.ts')

// Données de test
const mockRiskData = {
  target: "Accès non autorisé aux installations minières",
  scenario: "Intrusion d'individus malveillants dans le périmètre de la mine en raison de défaillances dans le système de contrôle d'accès et de surveillance du périmètre",
  category: "Sécurité Physique"
}

const mockEvaluations = [
  {
    id: "eval-1",
    title: "Évaluation sécurité - Mine d'or TechCorp",
    responses: [
      {
        questionText: "Le site dispose-t-il d'un système de contrôle d'accès fonctionnel avec badges RFID ?",
        booleanValue: false
      },
      {
        questionText: "Les accès sont-ils enregistrés et tracés dans un journal électronique ?",
        booleanValue: false
      },
      {
        questionText: "Y a-t-il une clôture périmétrique complète autour du site ?",
        booleanValue: false
      },
      {
        questionText: "La clôture périmétrique est-elle en bon état et régulièrement inspectée ?",
        booleanValue: false
      },
      {
        questionText: "Le site dispose-t-il d'un système de surveillance vidéo opérationnel ?",
        booleanValue: true
      },
      {
        questionText: "Les caméras couvrent-elles tous les points critiques et d'accès ?",
        booleanValue: true
      },
      {
        questionText: "L'éclairage de sécurité est-il adéquat pour la surveillance nocturne ?",
        booleanValue: true
      },
      {
        questionText: "Le personnel a-t-il reçu une formation complète en sécurité ?",
        booleanValue: false
      },
      {
        questionText: "Y a-t-il des sessions de sensibilisation régulières aux risques ?",
        booleanValue: false
      },
      {
        questionText: "Y a-t-il eu des incidents de sécurité ou tentatives d'intrusion récents ?",
        booleanValue: true
      },
      {
        questionText: "Des procédures de sécurité écrites sont-elles documentées et à jour ?",
        booleanValue: true
      },
      {
        questionText: "Existe-t-il un plan de réponse aux incidents de sécurité ?",
        booleanValue: true
      },
      {
        questionText: "Les systèmes électriques critiques sont-ils sécurisés ?",
        booleanValue: false
      },
      {
        questionText: "Y a-t-il des systèmes de sauvegarde électrique opérationnels ?",
        booleanValue: true
      }
    ]
  }
]

async function testAIAnalysis() {
  console.log('🧪 Test de l\'analyse IA pour les fiches de risques')
  console.log('=' .repeat(60))
  
  try {
    const analysis = await generateAIAnalysis(mockRiskData, mockEvaluations)
    
    console.log('📊 Résultats de l\'analyse IA:')
    console.log('')
    
    console.log('🎯 Cible:', mockRiskData.target)
    console.log('📝 Scénario:', mockRiskData.scenario)
    console.log('')
    
    console.log('📈 PROBABILITÉ:', analysis.probability.score + '/3')
    console.log('   Explication:', analysis.probability.explanation)
    if (analysis.probability.positivePoints.length > 0) {
      console.log('   ✅ Points positifs:')
      analysis.probability.positivePoints.forEach(point => console.log('      •', point))
    }
    if (analysis.probability.negativePoints.length > 0) {
      console.log('   ❌ Points négatifs:')
      analysis.probability.negativePoints.forEach(point => console.log('      •', point))
    }
    console.log('   🎯 Confiance:', Math.round(analysis.probability.confidence * 100) + '%')
    console.log('')
    
    console.log('🛡️ VULNÉRABILITÉ:', analysis.vulnerability.score + '/4')
    console.log('   Explication:', analysis.vulnerability.explanation)
    if (analysis.vulnerability.positivePoints.length > 0) {
      console.log('   ✅ Points positifs:')
      analysis.vulnerability.positivePoints.forEach(point => console.log('      •', point))
    }
    if (analysis.vulnerability.negativePoints.length > 0) {
      console.log('   ❌ Points négatifs:')
      analysis.vulnerability.negativePoints.forEach(point => console.log('      •', point))
    }
    console.log('   🎯 Confiance:', Math.round(analysis.vulnerability.confidence * 100) + '%')
    console.log('')
    
    console.log('💥 REPERCUSSIONS:', analysis.impact.score + '/5')
    console.log('   Explication:', analysis.impact.explanation)
    if (analysis.impact.positivePoints.length > 0) {
      console.log('   ✅ Points positifs:')
      analysis.impact.positivePoints.forEach(point => console.log('      •', point))
    }
    if (analysis.impact.negativePoints.length > 0) {
      console.log('   ❌ Points négatifs:')
      analysis.impact.negativePoints.forEach(point => console.log('      •', point))
    }
    console.log('   🎯 Confiance:', Math.round(analysis.impact.confidence * 100) + '%')
    console.log('')
    
    console.log('🔍 ÉVALUATION GLOBALE:')
    console.log(analysis.overallAssessment)
    console.log('')
    
    console.log('📋 Basé sur les évaluations:')
    analysis.basedOnEvaluations.forEach(eval => console.log('   •', eval))
    console.log('')

    console.log('📝 RECOMMANDATIONS QUESTIONNAIRES:')
    if (analysis.questionnaireRecommendations && analysis.questionnaireRecommendations.length > 0) {
      analysis.questionnaireRecommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec.category}`)
        console.log(`      Raison: ${rec.reason}`)
        console.log('      Questions suggérées:')
        rec.suggestedQuestions.slice(0, 3).forEach(q => console.log(`         • ${q}`))
        if (rec.suggestedQuestions.length > 3) {
          console.log(`         ... et ${rec.suggestedQuestions.length - 3} autres questions`)
        }
        console.log('')
      })
    } else {
      console.log('   Aucune recommandation de questionnaire nécessaire')
    }

    console.log('✅ Test terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testAIAnalysis()
