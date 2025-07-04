import fetch from 'node-fetch'

async function testEvaluationAPI() {
  const evaluationId = 'cmcfwbjxp009jtfeker5sccc6'
  const baseUrl = 'http://localhost:5174'
  
  console.log(`🔍 Testing API for evaluation: ${evaluationId}`)

  try {
    // Test de l'API d'évaluation
    const response = await fetch(`${baseUrl}/api/evaluations/${evaluationId}`, {
      headers: {
        'Content-Type': 'application/json',
        // Note: En production, il faudrait un token d'authentification
      }
    })

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return
    }

    const data = await response.json()
    
    console.log(`\n📊 API Response Summary:`)
    console.log(`   Title: ${data.title}`)
    console.log(`   Status: ${data.status}`)
    console.log(`   Progress: ${data.progress}%`)
    console.log(`   Score: ${data.totalScore}`)
    console.log(`   Responses count: ${data.responses?.length || 0}`)
    console.log(`   Template groups: ${data.template?.questionGroups?.length || 0}`)

    if (data.responses && data.responses.length > 0) {
      console.log(`\n💬 Sample responses from API:`)
      data.responses.slice(0, 3).forEach((response: any, index: number) => {
        console.log(`   ${index + 1}. Question ID: ${response.questionId}`)
        if (response.booleanValue !== null && response.booleanValue !== undefined) {
          console.log(`      → ${response.booleanValue ? 'Oui' : 'Non'}`)
        } else if (response.textValue) {
          console.log(`      → ${response.textValue.substring(0, 50)}...`)
        } else if (response.numberValue !== null && response.numberValue !== undefined) {
          console.log(`      → ${response.numberValue}`)
        }
        if (response.description) {
          console.log(`      Note: ${response.description.substring(0, 50)}...`)
        }
      })
    }

    if (data.template?.questionGroups) {
      console.log(`\n📋 Template structure from API:`)
      data.template.questionGroups.forEach((group: any, groupIndex: number) => {
        console.log(`   Group ${groupIndex + 1}: ${group.title}`)
        if (group.objectives) {
          group.objectives.forEach((objective: any, objIndex: number) => {
            console.log(`     Obj ${objIndex + 1}: ${objective.title} (${objective.questions?.length || 0} questions)`)
          })
        }
      })
    }

    // Sauvegarder la réponse complète pour debug
    console.log(`\n💾 Full API response saved to debug-api-response.json`)
    const fs = await import('fs')
    fs.writeFileSync('debug-api-response.json', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Error testing API:', error)
  }
}

testEvaluationAPI()
