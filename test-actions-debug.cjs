#!/usr/bin/env node

/**
 * Debug script for Actions Section
 * Creates a minimal test to identify the exact issue
 */

const fs = require('fs');

console.log('🐛 Actions Section Debug Test');
console.log('==============================');
console.log('🔍 Debugging why "Priorités d\'actions" section is not visible...\n');

const riskFormPath = 'src/components/RiskSheetForm.tsx';
const content = fs.readFileSync(riskFormPath, 'utf8');

// Extract the actions section
const actionsSectionRegex = /\/\* Priorités d'actions \*\/[\s\S]*?<\/Card>/;
const match = content.match(actionsSectionRegex);

if (!match) {
  console.log('❌ Could not extract actions section');
  process.exit(1);
}

const actionsSection = match[0];
console.log('✅ Extracted actions section successfully');
console.log(`📏 Section length: ${actionsSection.length} characters`);

// Check for potential issues
console.log('\n📋 Potential Issues Analysis:');
console.log('------------------------------');

// 1. Check for missing imports
const hasTargetImport = content.includes('Target') && content.includes('from \'lucide-react\'');
const hasPlusImport = content.includes('Plus') && content.includes('from \'lucide-react\'');
const hasActionsApiImport = content.includes('actionsApi') && content.includes('from \'../lib/api\'');

console.log(`1. Target icon import: ${hasTargetImport ? '✅ OK' : '❌ MISSING'}`);
console.log(`2. Plus icon import: ${hasPlusImport ? '✅ OK' : '❌ MISSING'}`);
console.log(`3. Actions API import: ${hasActionsApiImport ? '✅ OK' : '❌ MISSING'}`);

// 2. Check for state variables
const hasActionsState = content.includes('useState<Action[]>([])');
const hasLoadingState = content.includes('isLoadingActions');
const hasShowAddState = content.includes('showAddAction');

console.log(`4. Actions state: ${hasActionsState ? '✅ OK' : '❌ MISSING'}`);
console.log(`5. Loading state: ${hasLoadingState ? '✅ OK' : '❌ MISSING'}`);
console.log(`6. Show add state: ${hasShowAddState ? '✅ OK' : '❌ MISSING'}`);

// 3. Check for functions
const hasLoadActionsFunc = content.includes('const loadActions');
const hasAddActionFunc = content.includes('const handleAddAction');
const hasDeleteActionFunc = content.includes('const handleDeleteAction');

console.log(`7. Load actions function: ${hasLoadActionsFunc ? '✅ OK' : '❌ MISSING'}`);
console.log(`8. Add action function: ${hasAddActionFunc ? '✅ OK' : '❌ MISSING'}`);
console.log(`9. Delete action function: ${hasDeleteActionFunc ? '✅ OK' : '❌ MISSING'}`);

// 4. Check for JSX syntax issues
const hasUnmatchedBraces = (actionsSection.match(/\{/g) || []).length !== (actionsSection.match(/\}/g) || []).length;
const hasUnmatchedParens = (actionsSection.match(/\(/g) || []).length !== (actionsSection.match(/\)/g) || []).length;
const hasUnmatchedTags = actionsSection.includes('<Card') && !actionsSection.includes('</Card>');

console.log(`10. Unmatched braces: ${hasUnmatchedBraces ? '❌ YES' : '✅ NO'}`);
console.log(`11. Unmatched parentheses: ${hasUnmatchedParens ? '❌ YES' : '✅ NO'}`);
console.log(`12. Unmatched tags: ${hasUnmatchedTags ? '❌ YES' : '✅ NO'}`);

// 5. Check positioning in component
const lines = content.split('\n');
let actionsSectionLine = -1;
let returnStatementLine = -1;
let componentEndLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Priorités d\'actions')) {
    actionsSectionLine = i + 1;
  }
  if (lines[i].trim().startsWith('return (')) {
    returnStatementLine = i + 1;
  }
  if (lines[i].trim() === '}' && i > returnStatementLine + 100) {
    componentEndLine = i + 1;
    break;
  }
}

console.log(`13. Actions section line: ${actionsSectionLine}`);
console.log(`14. Return statement line: ${returnStatementLine}`);
console.log(`15. Component end line: ${componentEndLine}`);

const isInsideReturn = actionsSectionLine > returnStatementLine && actionsSectionLine < componentEndLine;
console.log(`16. Section inside return: ${isInsideReturn ? '✅ YES' : '❌ NO'}`);

// 6. Check for conditional rendering that might hide the section
const hasConditionalRendering = actionsSection.includes('&&') || actionsSection.includes('?');
console.log(`17. Conditional rendering: ${hasConditionalRendering ? '⚠️ YES' : '✅ NO'}`);

// 7. Create a minimal test component
console.log('\n📋 Creating Minimal Test Component:');
console.log('------------------------------------');

const minimalTest = `
// Minimal test - add this temporarily to RiskSheetForm.tsx right before the submit buttons:

{/* TEST: Simple Actions Section */}
<div style={{border: '2px solid red', padding: '20px', margin: '20px 0'}}>
  <h3 style={{color: 'red', fontSize: '18px', fontWeight: 'bold'}}>
    🧪 TEST: Priorités d'actions Section
  </h3>
  <p>If you can see this red box, the positioning is correct!</p>
  <button onClick={() => alert('Actions section is working!')}>
    Test Button
  </button>
</div>
`;

console.log(minimalTest);

// 8. Summary and recommendations
console.log('\n📊 Debug Summary:');
console.log('==================');

const issues = [];
if (!hasTargetImport) issues.push('Missing Target icon import');
if (!hasPlusImport) issues.push('Missing Plus icon import');
if (!hasActionsApiImport) issues.push('Missing actionsApi import');
if (!hasActionsState) issues.push('Missing actions state');
if (!hasLoadActionsFunc) issues.push('Missing loadActions function');
if (hasUnmatchedBraces) issues.push('Unmatched braces in JSX');
if (hasUnmatchedParens) issues.push('Unmatched parentheses');
if (hasUnmatchedTags) issues.push('Unmatched JSX tags');
if (!isInsideReturn) issues.push('Section not inside component return');

if (issues.length === 0) {
  console.log('🎉 No obvious issues detected!');
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Make sure development server is running on port 5174');
  console.log('2. Hard refresh browser (Ctrl+F5)');
  console.log('3. Check browser console for JavaScript errors');
  console.log('4. Try the minimal test component above');
  console.log('5. Scroll to the very bottom of the risk form');
  console.log('6. Check if you\'re in edit mode vs create mode');
} else {
  console.log('⚠️ Issues found:');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue}`);
  });
}

console.log('\n✨ Debug Test Complete');
