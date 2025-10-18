// Test script for Enhanced AI Risk Analysis System
// This script validates the enhanced AI analysis with evidence-based scoring

import { 
  generateAnalysisWithCitations, 
  generateStructuredPrompts,
  simulateAIAnalysisWithPrompts 
} from './src/lib/enhanced-risk-ai-analysis.js'
import { EvidenceCitationTracker } from './src/lib/evidence-citation-tracker.js'
import { StructuredPromptBuilder } from './src/lib/structured-prompt-builder.js'

// Mock evaluation data for testing
const mockEvaluations = [
  {
    id: 'eval-001',
    title: 'Évaluation Sécurité Site Minier Alpha',
    status: 'COMPLETED',
    totalScore: 65,
    riskLevel: 'MEDIUM',
    entityInfo: {
      sector: 'mining',
      companySize: 'large',
      location: 'Côte d\'Ivoire'
    },
    template: {
      name: 'Évaluation Sécurité Complète'
    },
    responses: [
      {
        id: 'resp-001',
        questionId: 'q-maintenance',
        questionText: 'Existe-t-il un service de maintenance préventive?',
        booleanValue: false,
        description: 'Aucun service de maintenance organisé',
        answeredAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'resp-002',
        questionId: 'q-formation',
        questionText: 'Quel pourcentage du personnel est formé aux procédures de sécurité?',
        textValue: '93% du personnel formé',
        description: 'Formation annuelle obligatoire',
        answeredAt: '2024-01-15T10:05:00Z'
      },
      {
        id: 'resp-003',
        questionId: 'q-surveillance',
        questionText: 'Y a-t-il une surveillance nocturne du périmètre?',
        booleanValue: false,
        description: 'Pas de surveillance entre 22h et 6h',
        answeredAt: '2024-01-15T10:10:00Z'
      },
      {
        id: 'resp-004',
        questionId: 'q-cloture',
        questionText: 'Le périmètre est-il entièrement clôturé?',
        booleanValue: true,
        description: 'Clôture sur 80% du périmètre',
        answeredAt: '2024-01-15T10:15:00Z'
      },
      {
        id: 'resp-005',
        questionId: 'q-communication',
        questionText: 'Existe-t-il un système de communication d\'urgence?',
        booleanValue: false,
        description: 'Pas de système dédié',
        answeredAt: '2024-01-15T10:20:00Z'
      }
    ],
    completedAt: '2024-01-15T11:00:00Z'
  },
  {
    id: 'eval-002',
    title: 'Audit Infrastructure Site Alpha',
    status: 'COMPLETED',
    totalScore: 45,
    riskLevel: 'HIGH',
    entityInfo: {
      sector: 'mining',
      companySize: 'large'
    },
    template: {
      name: 'Audit Infrastructure'
    },
    responses: [
      {
        id: 'resp-006',
        questionId: 'q-infrastructure',
        questionText: 'État général de l\'infrastructure électrique',
        facilityScore: 2,
        constraintScore: 4,
        description: 'Infrastructure vieillissante',
        answeredAt: '2024-01-20T14:00:00Z'
      },
      {
        id: 'resp-007',
        questionId: 'q-redondance',
        questionText: 'Systèmes de redondance en place?',
        booleanValue: true,
        description: 'Générateurs de secours disponibles',
        answeredAt: '2024-01-20T14:05:00Z'
      }
    ],
    completedAt: '2024-01-20T15:00:00Z'
  }
]

const mockRiskData = {
  target: 'Système de surveillance périmétrique nocturne',
  scenario: 'Défaillance du système de surveillance permettant une intrusion non détectée',
  category: 'Sécurité physique'
}

// Test functions
async function testEnhancedDataExtraction() {
  console.log('\n=== Test 1: Enhanced Data Extraction ===')
  
  try {
    const { EnhancedDataExtractionEngine } = await import('./src/lib/enhanced-risk-ai-analysis.js')
    const dataExtractor = new EnhancedDataExtractionEngine()
    
    const insights = dataExtractor.extractEvaluationInsights(mockEvaluations)
    
    console.log('✅ Data extraction successful')
    console.log(`📊 Total responses: ${insights.totalResponses}`)
    console.log(`📋 Total evaluations: ${insights.totalEvaluations}`)
    console.log(`🎯 Average score: ${insights.averageScore.toFixed(1)}`)
    console.log(`🏢 Sector context: ${insights.sectorContext}`)
    console.log(`📈 Company maturity: ${insights.companyMaturity}`)
    console.log(`🔍 Evidence quality: ${insights.evidenceQuality.toFixed(1)}%`)
    console.log(`📝 Extracted metrics: ${insights.extractedMetrics.length}`)
    console.log(`🔗 Patterns identified: ${insights.patterns.length}`)
    console.log(`⚠️  Critical weaknesses: ${insights.criticalWeaknesses.length}`)
    console.log(`✨ Strength areas: ${insights.strengthAreas.length}`)
    
    // Validate domain scores
    console.log('\n📊 Domain Scores:')
    Object.entries(insights.domainScores).forEach(([domain, score]) => {
      console.log(`  - ${domain}: ${score.toFixed(1)}%`)
    })
    
    return insights
  } catch (error) {
    console.error('❌ Data extraction failed:', error.message)
    return null
  }
}

async function testEvidenceCitationTracker() {
  console.log('\n=== Test 2: Evidence Citation Tracker ===')
  
  try {
    const evidenceTracker = new EvidenceCitationTracker()
    evidenceTracker.addEvidenceFromEvaluations(mockEvaluations)
    
    // Test evidence finding
    const probabilityEvidence = evidenceTracker.findRelevantEvidence('probability', 5)
    const vulnerabilityEvidence = evidenceTracker.findRelevantEvidence('vulnerability', 5)
    const impactEvidence = evidenceTracker.findRelevantEvidence('impact', 5)
    
    console.log('✅ Evidence tracking successful')
    console.log(`🎯 Probability evidence: ${probabilityEvidence.length} items`)
    console.log(`🛡️  Vulnerability evidence: ${vulnerabilityEvidence.length} items`)
    console.log(`💥 Impact evidence: ${impactEvidence.length} items`)
    
    // Test citation creation
    probabilityEvidence.forEach(evidence => {
      evidenceTracker.createCitation(evidence.id, 'probability', 'negative')
    })
    
    const citations = evidenceTracker.getFormattedCitations('probability')
    console.log(`📝 Generated citations: ${citations.negative.length}`)
    
    // Test validation
    const validation = evidenceTracker.validateCitations()
    console.log(`✅ Citation validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`)
    if (validation.issues.length > 0) {
      console.log(`⚠️  Issues found: ${validation.issues.length}`)
    }
    
    // Test summary
    const summary = evidenceTracker.getEvidenceSummary()
    console.log(`📊 Evidence summary: ${summary.totalEvidence} total items`)
    console.log(`🎯 Average confidence: ${(summary.averageConfidence * 100).toFixed(1)}%`)
    console.log(`📈 Average relevance: ${(summary.averageRelevance * 100).toFixed(1)}%`)
    
    return evidenceTracker
  } catch (error) {
    console.error('❌ Evidence citation tracking failed:', error.message)
    return null
  }
}

async function testStructuredPromptBuilder() {
  console.log('\n=== Test 3: Structured Prompt Builder ===')
  
  try {
    const promptBuilder = new StructuredPromptBuilder()
    const insights = await testEnhancedDataExtraction()
    
    if (!insights) {
      throw new Error('No insights available for prompt building')
    }
    
    const promptContext = {
      target: mockRiskData.target,
      scenario: mockRiskData.scenario,
      category: mockRiskData.category,
      evaluationInsights: insights,
      analysisType: 'probability'
    }
    
    // Test all prompt types
    const probabilityPrompt = promptBuilder.buildProbabilityPrompt(promptContext)
    const vulnerabilityPrompt = promptBuilder.buildVulnerabilityPrompt({
      ...promptContext,
      analysisType: 'vulnerability'
    })
    const impactPrompt = promptBuilder.buildImpactPrompt({
      ...promptContext,
      analysisType: 'impact'
    })
    
    console.log('✅ Prompt generation successful')
    console.log(`📝 Probability prompt length: ${probabilityPrompt.userPrompt.length} chars`)
    console.log(`🛡️  Vulnerability prompt length: ${vulnerabilityPrompt.userPrompt.length} chars`)
    console.log(`💥 Impact prompt length: ${impactPrompt.userPrompt.length} chars`)
    
    // Validate prompt structure
    const hasSystemPrompt = probabilityPrompt.systemPrompt.length > 0
    const hasUserPrompt = probabilityPrompt.userPrompt.length > 0
    const hasOutputFormat = probabilityPrompt.outputFormat.length > 0
    const hasExamples = probabilityPrompt.examples.length > 0
    
    console.log(`🔧 System prompt: ${hasSystemPrompt ? '✅' : '❌'}`)
    console.log(`👤 User prompt: ${hasUserPrompt ? '✅' : '❌'}`)
    console.log(`📋 Output format: ${hasOutputFormat ? '✅' : '❌'}`)
    console.log(`📚 Examples: ${hasExamples ? '✅' : '❌'}`)
    
    return { probabilityPrompt, vulnerabilityPrompt, impactPrompt }
  } catch (error) {
    console.error('❌ Structured prompt building failed:', error.message)
    return null
  }
}

async function testCompleteAnalysisWorkflow() {
  console.log('\n=== Test 4: Complete Analysis Workflow ===')
  
  try {
    console.log('🚀 Starting complete analysis workflow...')
    
    // Test the complete analysis with citations
    const analysis = await generateAnalysisWithCitations(mockRiskData, mockEvaluations)
    
    console.log('✅ Complete analysis successful')
    console.log(`🎯 Probability score: ${analysis.probability.score}/3 (${(analysis.probability.confidence * 100).toFixed(1)}% confidence)`)
    console.log(`🛡️  Vulnerability score: ${analysis.vulnerability.score}/4 (${(analysis.vulnerability.confidence * 100).toFixed(1)}% confidence)`)
    console.log(`💥 Impact score: ${analysis.impact.score}/5 (${(analysis.impact.confidence * 100).toFixed(1)}% confidence)`)
    console.log(`🏆 Reasoning quality: ${analysis.reasoningQuality}`)
    
    // Validate evidence points
    const hasPositivePoints = analysis.probability.positivePoints.length > 0 || 
                             analysis.vulnerability.positivePoints.length > 0 || 
                             analysis.impact.positivePoints.length > 0
    
    const hasNegativePoints = analysis.probability.negativePoints.length > 0 || 
                             analysis.vulnerability.negativePoints.length > 0 || 
                             analysis.impact.negativePoints.length > 0
    
    console.log(`✨ Positive evidence: ${hasPositivePoints ? '✅' : '❌'}`)
    console.log(`⚠️  Negative evidence: ${hasNegativePoints ? '✅' : '❌'}`)
    
    // Check for citations in evidence points
    const hasCitations = analysis.probability.positivePoints.some(point => point.includes('Source:')) ||
                        analysis.probability.negativePoints.some(point => point.includes('Source:'))
    
    console.log(`📝 Evidence citations: ${hasCitations ? '✅' : '❌'}`)
    
    // Validate overall assessment
    const hasOverallAssessment = analysis.overallAssessment && analysis.overallAssessment.length > 100
    console.log(`📊 Overall assessment: ${hasOverallAssessment ? '✅' : '❌'}`)
    
    // Validate questionnaire recommendations
    const hasRecommendations = analysis.questionnaireRecommendations && analysis.questionnaireRecommendations.length > 0
    console.log(`💡 Questionnaire recommendations: ${hasRecommendations ? '✅' : '❌'}`)
    
    // Display sample evidence
    console.log('\n📋 Sample Evidence Points:')
    if (analysis.probability.negativePoints.length > 0) {
      console.log(`  Probability (negative): ${analysis.probability.negativePoints[0]}`)
    }
    if (analysis.vulnerability.positivePoints.length > 0) {
      console.log(`  Vulnerability (positive): ${analysis.vulnerability.positivePoints[0]}`)
    }
    
    return analysis
  } catch (error) {
    console.error('❌ Complete analysis workflow failed:', error.message)
    console.error(error.stack)
    return null
  }
}

// Performance test
async function testPerformance() {
  console.log('\n=== Test 5: Performance Test ===')
  
  try {
    const startTime = Date.now()
    
    await generateAnalysisWithCitations(mockRiskData, mockEvaluations)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️  Analysis completed in ${duration}ms`)
    console.log(`🚀 Performance: ${duration < 5000 ? '✅ GOOD' : duration < 10000 ? '⚠️  ACCEPTABLE' : '❌ SLOW'}`)
    
    return duration
  } catch (error) {
    console.error('❌ Performance test failed:', error.message)
    return null
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Enhanced AI Risk Analysis System - Test Suite')
  console.log('================================================')
  
  const results = {
    dataExtraction: false,
    evidenceTracking: false,
    promptBuilding: false,
    completeWorkflow: false,
    performance: false
  }
  
  try {
    // Run all tests
    const insights = await testEnhancedDataExtraction()
    results.dataExtraction = insights !== null
    
    const evidenceTracker = await testEvidenceCitationTracker()
    results.evidenceTracking = evidenceTracker !== null
    
    const prompts = await testStructuredPromptBuilder()
    results.promptBuilding = prompts !== null
    
    const analysis = await testCompleteAnalysisWorkflow()
    results.completeWorkflow = analysis !== null
    
    const performance = await testPerformance()
    results.performance = performance !== null && performance < 10000
    
    // Summary
    console.log('\n📊 Test Results Summary')
    console.log('========================')
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`)
    })
    
    const passedTests = Object.values(results).filter(Boolean).length
    const totalTests = Object.keys(results).length
    
    console.log(`\n🏆 Overall: ${passedTests}/${totalTests} tests passed`)
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Enhanced AI analysis system is ready.')
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.')
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
}

export { runAllTests, testCompleteAnalysisWorkflow, mockEvaluations, mockRiskData }
