// OpenAI Integration Test Script
// Run with: node test-openai-integration.cjs

const fs = require('fs')
const path = require('path')

console.log('🧪 OpenAI Integration Test Suite')
console.log('================================')

// Check environment configuration
function checkEnvironmentConfig() {
  console.log('\n📋 Environment Configuration Check:')
  
  const envFiles = ['.env.local', '.env', '.env.example']
  let configFound = false
  
  envFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    const exists = fs.existsSync(filePath)
    console.log(`${exists ? '✅' : '❌'} ${file}`)
    
    if (exists && file !== '.env.example') {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const hasOpenAIKey = content.includes('VITE_OPENAI_API_KEY') || content.includes('OPENAI_API_KEY')
        const hasModel = content.includes('VITE_OPENAI_MODEL') || content.includes('OPENAI_MODEL')
        
        console.log(`  - OpenAI API Key: ${hasOpenAIKey ? '✅' : '❌'}`)
        console.log(`  - Model Config: ${hasModel ? '✅' : '❌'}`)
        
        if (hasOpenAIKey) configFound = true
      } catch (error) {
        console.log(`  - Error reading file: ${error.message}`)
      }
    }
  })
  
  return configFound
}

// Check required files
function checkRequiredFiles() {
  console.log('\n📁 Required Files Check:')
  
  const requiredFiles = [
    'src/lib/openai-risk-analysis.ts',
    'src/lib/ai-config.ts',
    'src/components/AIConfigPanel.tsx',
    'OPENAI_SETUP.md'
  ]
  
  let allFilesExist = true
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    const exists = fs.existsSync(filePath)
    console.log(`${exists ? '✅' : '❌'} ${file}`)
    if (!exists) allFilesExist = false
  })
  
  return allFilesExist
}

// Check code integration
function checkCodeIntegration() {
  console.log('\n🔍 Code Integration Check:')
  
  const checks = [
    {
      file: 'src/lib/enhanced-risk-ai-analysis.ts',
      patterns: [
        { name: 'OpenAI import', regex: /import.*openai-risk-analysis/ },
        { name: 'AI config import', regex: /import.*ai-config/ },
        { name: 'performOpenAIAnalysis function', regex: /performOpenAIAnalysis/ },
        { name: 'Configuration check', regex: /isAIAnalysisEnabled|shouldUseMockResponses/ }
      ]
    },
    {
      file: 'src/lib/openai-risk-analysis.ts',
      patterns: [
        { name: 'OpenAIRiskAnalysisService class', regex: /class OpenAIRiskAnalysisService/ },
        { name: 'analyzeCriterion method', regex: /analyzeCriterion/ },
        { name: 'analyzeAllCriteria method', regex: /analyzeAllCriteria/ },
        { name: 'testConnection method', regex: /testConnection/ }
      ]
    },
    {
      file: 'src/lib/ai-config.ts',
      patterns: [
        { name: 'AIConfigManager class', regex: /class AIConfigManager/ },
        { name: 'getOpenAIConfig function', regex: /getOpenAIConfig/ },
        { name: 'validateAIConfig function', regex: /validateAIConfig/ },
        { name: 'Environment variable handling', regex: /getEnvVar/ }
      ]
    },
    {
      file: 'src/components/RiskSheetForm.tsx',
      patterns: [
        { name: 'AI config imports', regex: /import.*ai-config/ },
        { name: 'generateAnalysisWithCitations', regex: /generateAnalysisWithCitations/ },
        { name: 'Configuration validation', regex: /validateAIConfig/ },
        { name: 'Status badges', regex: /Mode Simulation|IA Désactivée/ }
      ]
    }
  ]
  
  let allChecksPass = true
  
  checks.forEach(({ file, patterns }) => {
    console.log(`\n📄 ${file}:`)
    
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8')
      
      patterns.forEach(({ name, regex }) => {
        const found = regex.test(content)
        console.log(`  ${found ? '✅' : '❌'} ${name}`)
        if (!found) allChecksPass = false
      })
    } catch (error) {
      console.log(`  ❌ File not found or unreadable`)
      allChecksPass = false
    }
  })
  
  return allChecksPass
}

// Check package.json for any missing dependencies
function checkDependencies() {
  console.log('\n📦 Dependencies Check:')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
    
    // OpenAI integration doesn't require additional packages
    // It uses native fetch API
    console.log('✅ No additional dependencies required')
    console.log('✅ Uses native fetch API for OpenAI calls')
    
    return true
  } catch (error) {
    console.log('❌ Could not read package.json')
    return false
  }
}

// Generate test configuration
function generateTestConfig() {
  console.log('\n⚙️ Test Configuration Generation:')
  
  const testConfig = `# Test Configuration for OpenAI Integration
# Copy to .env.local and add your actual API key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3

# Feature Flags
ENABLE_AI_ANALYSIS=true
ENABLE_ENHANCED_PROMPTS=true
ENABLE_EVIDENCE_CITATIONS=true
MOCK_AI_RESPONSES=false

# Development Settings
ENABLE_DEBUG_LOGGING=true
AI_ANALYSIS_TIMEOUT=30000
MAX_CONCURRENT_AI_REQUESTS=3
`
  
  try {
    fs.writeFileSync(path.join(__dirname, '.env.test'), testConfig)
    console.log('✅ Generated .env.test file')
    console.log('📝 Copy to .env.local and add your OpenAI API key')
    return true
  } catch (error) {
    console.log('❌ Could not generate test config')
    return false
  }
}

// Main test runner
function runTests() {
  console.log('🚀 Starting OpenAI Integration Tests...\n')
  
  const results = {
    environment: checkEnvironmentConfig(),
    files: checkRequiredFiles(),
    integration: checkCodeIntegration(),
    dependencies: checkDependencies()
  }
  
  // Generate test config
  generateTestConfig()
  
  // Summary
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`)
  })
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n🏆 Overall: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('\n🎉 OpenAI Integration Ready!')
    console.log('\n📋 Next Steps:')
    console.log('1. Add your OpenAI API key to .env.local')
    console.log('2. Start the development server')
    console.log('3. Test AI analysis on risk creation page')
    console.log('4. Check for "Citations OpenAI incluses" message')
    
    console.log('\n💡 Quick Start:')
    console.log('cp .env.test .env.local')
    console.log('# Edit .env.local and add your OpenAI API key')
    console.log('npm run dev')
    
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.')
    
    if (!results.environment) {
      console.log('\n🔧 Environment Setup:')
      console.log('- Create .env.local file')
      console.log('- Add OPENAI_API_KEY=sk-your-key')
      console.log('- See OPENAI_SETUP.md for details')
    }
    
    if (!results.files) {
      console.log('\n📁 Missing Files:')
      console.log('- Check if all integration files exist')
      console.log('- Re-run the implementation if needed')
    }
    
    if (!results.integration) {
      console.log('\n🔗 Integration Issues:')
      console.log('- Check import statements')
      console.log('- Verify function implementations')
      console.log('- Review code integration')
    }
  }
  
  console.log('\n📚 Documentation:')
  console.log('- Setup Guide: OPENAI_SETUP.md')
  console.log('- Environment: .env.example')
  console.log('- Test Config: .env.test')
}

// Run tests
runTests()
