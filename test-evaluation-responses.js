// Test script to verify that evaluations are loaded with responses
// This script tests the fix for the AI analysis issue

import { evaluationsApi } from './src/lib/api.js'

async function testEvaluationLoading() {
  console.log('🧪 Testing evaluation loading with responses...')
  
  try {
    // Test the original getAll method (should not have responses)
    console.log('\n1. Testing getAll() method:')
    const allEvaluations = await evaluationsApi.getAll({ limit: 5 })
    console.log(`   Found ${allEvaluations.data.length} evaluations`)
    
    if (allEvaluations.data.length > 0) {
      const firstEval = allEvaluations.data[0]
      console.log(`   First evaluation: ${firstEval.title}`)
      console.log(`   Has responses: ${firstEval.responses ? 'YES' : 'NO'}`)
      console.log(`   Response count: ${firstEval.responses?.length || 0}`)
    }
    
    // Test the getById method (should have responses)
    if (allEvaluations.data.length > 0) {
      console.log('\n2. Testing getById() method:')
      const evaluationId = allEvaluations.data[0].id
      const detailedEvaluation = await evaluationsApi.getById(evaluationId)
      
      console.log(`   Evaluation: ${detailedEvaluation.title}`)
      console.log(`   Has responses: ${detailedEvaluation.responses ? 'YES' : 'NO'}`)
      console.log(`   Response count: ${detailedEvaluation.responses?.length || 0}`)
      
      if (detailedEvaluation.responses && detailedEvaluation.responses.length > 0) {
        console.log('\n   Sample responses:')
        detailedEvaluation.responses.slice(0, 3).forEach((response, index) => {
          console.log(`   ${index + 1}. Question: ${response.question?.text || response.questionText || 'N/A'}`)
          console.log(`      Boolean: ${response.booleanValue}`)
          console.log(`      Text: ${response.textValue || 'N/A'}`)
          console.log(`      Facility Score: ${response.facilityScore || 'N/A'}`)
          console.log(`      Constraint Score: ${response.constraintScore || 'N/A'}`)
        })
      }
    }
    
    // Test the enhanced loading approach (like in RiskSheetForm)
    console.log('\n3. Testing enhanced loading approach:')
    const evaluationsWithResponses = await Promise.all(
      allEvaluations.data.slice(0, 2).map(async (evaluation) => {
        try {
          const fullEvaluation = await evaluationsApi.getById(evaluation.id)
          return fullEvaluation
        } catch (error) {
          console.error(`   Error loading evaluation ${evaluation.id}:`, error.message)
          return evaluation
        }
      })
    )
    
    console.log(`   Loaded ${evaluationsWithResponses.length} evaluations with details`)
    
    const totalResponses = evaluationsWithResponses.reduce((total, eval) => {
      return total + (eval.responses?.length || 0)
    }, 0)
    
    console.log(`   Total responses across all evaluations: ${totalResponses}`)
    
    if (totalResponses > 0) {
      console.log('   ✅ SUCCESS: Evaluations loaded with responses!')
      console.log('   This should fix the AI analysis issue.')
    } else {
      console.log('   ⚠️  WARNING: No responses found in evaluations.')
      console.log('   AI analysis may still fall back to basic analysis.')
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error)
  }
}

// Run the test
testEvaluationLoading()
