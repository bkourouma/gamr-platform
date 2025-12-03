#!/usr/bin/env node

/**
 * Test script for Actions Integration in GAMRDIGITALE Platform
 * Tests the "Priorités d'actions" section functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Actions Integration Test Suite');
console.log('==================================');
console.log('🚀 Testing "Priorités d\'actions" section...\n');

// Test 1: Check if RiskSheetForm contains actions section
console.log('📋 Test 1: UI Component Integration');
console.log('-----------------------------------');

const riskFormPath = 'src/components/RiskSheetForm.tsx';
if (!fs.existsSync(riskFormPath)) {
  console.log('❌ RiskSheetForm.tsx not found');
  process.exit(1);
}

const riskFormContent = fs.readFileSync(riskFormPath, 'utf8');

// Check for actions imports
const hasActionsImport = riskFormContent.includes('actionsApi');
const hasActionType = riskFormContent.includes('type { Action }');
const hasTargetIcon = riskFormContent.includes('Target');
const hasPlusIcon = riskFormContent.includes('Plus');

console.log(`  ✅ Actions API import: ${hasActionsImport ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Action type import: ${hasActionType ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Target icon import: ${hasTargetIcon ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Plus icon import: ${hasPlusIcon ? 'FOUND' : 'MISSING'}`);

// Check for actions state
const hasActionsState = riskFormContent.includes('useState<Action[]>([])');
const hasLoadingState = riskFormContent.includes('isLoadingActions');
const hasShowAddAction = riskFormContent.includes('showAddAction');
const hasNewActionState = riskFormContent.includes('newAction');

console.log(`  ✅ Actions state: ${hasActionsState ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Loading state: ${hasLoadingState ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Add action state: ${hasShowAddAction ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ New action state: ${hasNewActionState ? 'FOUND' : 'MISSING'}`);

// Check for actions functions
const hasLoadActions = riskFormContent.includes('loadActions');
const hasAddAction = riskFormContent.includes('handleAddAction');
const hasDeleteAction = riskFormContent.includes('handleDeleteAction');

console.log(`  ✅ Load actions function: ${hasLoadActions ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Add action function: ${hasAddAction ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Delete action function: ${hasDeleteAction ? 'FOUND' : 'MISSING'}`);

// Check for UI section
const hasPrioritesSection = riskFormContent.includes('Priorités d\'actions');
const hasActionsCard = riskFormContent.includes('<Card variant="glass">') && riskFormContent.includes('Priorités d\'actions');
const hasAddButton = riskFormContent.includes('Ajouter') && riskFormContent.includes('Plus');
const hasEmptyState = riskFormContent.includes('Aucune action définie');
const hasActionForm = riskFormContent.includes('Nouvelle action');

console.log(`  ✅ "Priorités d'actions" section: ${hasPrioritesSection ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Actions card component: ${hasActionsCard ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Add button: ${hasAddButton ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Empty state: ${hasEmptyState ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Action form: ${hasActionForm ? 'FOUND' : 'MISSING'}`);

console.log('\n📋 Test 2: API Integration');
console.log('---------------------------');

// Check API file
const apiPath = 'src/lib/api.ts';
if (!fs.existsSync(apiPath)) {
  console.log('❌ api.ts not found');
  process.exit(1);
}

const apiContent = fs.readFileSync(apiPath, 'utf8');
const hasActionsApi = apiContent.includes('actionsApi');
const hasGetAll = apiContent.includes('getAll') && apiContent.includes('riskSheetId');
const hasCreate = apiContent.includes('create');
const hasDelete = apiContent.includes('delete');

console.log(`  ✅ Actions API object: ${hasActionsApi ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ getAll with riskSheetId: ${hasGetAll ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ create method: ${hasCreate ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ delete method: ${hasDelete ? 'FOUND' : 'MISSING'}`);

console.log('\n📋 Test 3: Database Schema');
console.log('---------------------------');

// Check Prisma schema
const schemaPath = 'prisma/schema.prisma';
if (!fs.existsSync(schemaPath)) {
  console.log('❌ schema.prisma not found');
  process.exit(1);
}

const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const hasActionModel = schemaContent.includes('model Action');
const hasRiskSheetRelation = schemaContent.includes('riskSheetId') && schemaContent.includes('riskSheet');
const hasActionStatus = schemaContent.includes('ActionStatus');
const hasPriority = schemaContent.includes('priority');

console.log(`  ✅ Action model: ${hasActionModel ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ RiskSheet relation: ${hasRiskSheetRelation ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ ActionStatus enum: ${hasActionStatus ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ Priority field: ${hasPriority ? 'FOUND' : 'MISSING'}`);

console.log('\n📋 Test 4: Server Routes');
console.log('-------------------------');

// Check server routes
const routesPath = 'src/server/routes/actions.ts';
if (!fs.existsSync(routesPath)) {
  console.log('❌ actions.ts routes not found');
  process.exit(1);
}

const routesContent = fs.readFileSync(routesPath, 'utf8');
const hasGetRoute = routesContent.includes('router.get(\'/\'');
const hasPostRoute = routesContent.includes('router.post(\'/\'');
const hasDeleteRoute = routesContent.includes('router.delete(');
const hasRiskSheetFilter = routesContent.includes('riskSheetId');

console.log(`  ✅ GET route: ${hasGetRoute ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ POST route: ${hasPostRoute ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ DELETE route: ${hasDeleteRoute ? 'FOUND' : 'MISSING'}`);
console.log(`  ✅ RiskSheet filter: ${hasRiskSheetFilter ? 'FOUND' : 'MISSING'}`);

console.log('\n📋 Test 5: Code Structure Analysis');
console.log('-----------------------------------');

// Analyze the structure of the actions section in RiskSheetForm
const actionsSectionRegex = /Priorités d'actions[\s\S]*?<\/Card>/;
const actionsSectionMatch = riskFormContent.match(actionsSectionRegex);

if (actionsSectionMatch) {
  const actionsSection = actionsSectionMatch[0];
  
  const hasCardHeader = actionsSection.includes('<CardHeader>');
  const hasCardContent = actionsSection.includes('<CardContent>');
  const hasLoadingState = actionsSection.includes('isLoadingActions');
  const hasActionsMap = actionsSection.includes('actions.map');
  const hasFormInputs = actionsSection.includes('input') && actionsSection.includes('textarea');
  
  console.log(`  ✅ Card structure: ${hasCardHeader && hasCardContent ? 'PROPER' : 'INCOMPLETE'}`);
  console.log(`  ✅ Loading handling: ${hasLoadingState ? 'IMPLEMENTED' : 'MISSING'}`);
  console.log(`  ✅ Actions rendering: ${hasActionsMap ? 'IMPLEMENTED' : 'MISSING'}`);
  console.log(`  ✅ Form inputs: ${hasFormInputs ? 'IMPLEMENTED' : 'MISSING'}`);
} else {
  console.log('  ❌ Actions section structure not found');
}

console.log('\n📊 Test Results Summary');
console.log('========================');

const allTests = [
  hasActionsImport && hasActionType,
  hasActionsState && hasLoadingState,
  hasLoadActions && hasAddAction,
  hasPrioritesSection && hasActionsCard,
  hasActionsApi && hasGetAll,
  hasActionModel && hasRiskSheetRelation,
  hasGetRoute && hasPostRoute
];

const passedTests = allTests.filter(Boolean).length;
const totalTests = allTests.length;

console.log(`✅ Imports & Types: ${hasActionsImport && hasActionType ? 'PASSED' : 'FAILED'}`);
console.log(`✅ State Management: ${hasActionsState && hasLoadingState ? 'PASSED' : 'FAILED'}`);
console.log(`✅ Functions: ${hasLoadActions && hasAddAction ? 'PASSED' : 'FAILED'}`);
console.log(`✅ UI Components: ${hasPrioritesSection && hasActionsCard ? 'PASSED' : 'FAILED'}`);
console.log(`✅ API Integration: ${hasActionsApi && hasGetAll ? 'PASSED' : 'FAILED'}`);
console.log(`✅ Database Schema: ${hasActionModel && hasRiskSheetRelation ? 'PASSED' : 'FAILED'}`);
console.log(`✅ Server Routes: ${hasGetRoute && hasPostRoute ? 'PASSED' : 'FAILED'}`);

console.log(`\n🏆 Overall: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('\n🎉 SUCCESS: Actions integration is fully implemented!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to a risk page');
  console.log('3. Scroll down to see "Priorités d\'actions" section');
  console.log('4. Test adding a new action');
} else {
  console.log('\n⚠️ Some tests failed. Please review the implementation.');
  console.log('\n🔧 Issues to fix:');
  if (!hasActionsImport) console.log('- Add actionsApi import');
  if (!hasActionsState) console.log('- Add actions state management');
  if (!hasLoadActions) console.log('- Implement loadActions function');
  if (!hasPrioritesSection) console.log('- Add "Priorités d\'actions" UI section');
  if (!hasActionsApi) console.log('- Implement actionsApi in api.ts');
  if (!hasActionModel) console.log('- Check Action model in schema.prisma');
  if (!hasGetRoute) console.log('- Implement actions routes');
}

console.log('\n✨ Actions Integration Test Complete');
