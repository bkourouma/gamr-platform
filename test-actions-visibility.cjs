#!/usr/bin/env node

/**
 * Test script to check Actions Section Visibility
 * Analyzes the exact position and structure of the "Priorités d'actions" section
 */

const fs = require('fs');

console.log('🔍 Actions Section Visibility Test');
console.log('===================================');
console.log('🎯 Analyzing "Priorités d\'actions" section positioning...\n');

const riskFormPath = 'src/components/RiskSheetForm.tsx';
const content = fs.readFileSync(riskFormPath, 'utf8');
const lines = content.split('\n');

console.log('📋 Searching for "Priorités d\'actions" section...');

// Find the actions section
let actionsSectionStart = -1;
let actionsSectionEnd = -1;
let cardDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('Priorités d\'actions')) {
    actionsSectionStart = i;
    console.log(`✅ Found "Priorités d'actions" at line ${i + 1}`);
    break;
  }
}

if (actionsSectionStart === -1) {
  console.log('❌ "Priorités d\'actions" section not found!');
  process.exit(1);
}

// Find the end of the actions section (matching Card closing tag)
for (let i = actionsSectionStart; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('<Card')) {
    cardDepth++;
  }
  if (line.includes('</Card>')) {
    cardDepth--;
    if (cardDepth === 0) {
      actionsSectionEnd = i;
      break;
    }
  }
}

console.log(`📍 Actions section spans lines ${actionsSectionStart + 1} to ${actionsSectionEnd + 1}`);

// Analyze the context around the actions section
console.log('\n📋 Context Analysis:');
console.log('---------------------');

// Check what comes before
const beforeLines = lines.slice(Math.max(0, actionsSectionStart - 10), actionsSectionStart);
console.log('🔼 10 lines before actions section:');
beforeLines.forEach((line, idx) => {
  const lineNum = actionsSectionStart - beforeLines.length + idx + 1;
  console.log(`   ${lineNum.toString().padStart(4)}: ${line.trim()}`);
});

// Check what comes after
const afterLines = lines.slice(actionsSectionEnd + 1, Math.min(lines.length, actionsSectionEnd + 11));
console.log('\n🔽 10 lines after actions section:');
afterLines.forEach((line, idx) => {
  const lineNum = actionsSectionEnd + 2 + idx;
  console.log(`   ${lineNum.toString().padStart(4)}: ${line.trim()}`);
});

// Check the structure of the actions section
console.log('\n📋 Actions Section Structure:');
console.log('------------------------------');

const actionsSection = lines.slice(actionsSectionStart, actionsSectionEnd + 1);
let indentLevel = 0;

actionsSection.slice(0, 20).forEach((line, idx) => {
  const lineNum = actionsSectionStart + idx + 1;
  const trimmed = line.trim();
  
  if (trimmed.includes('</')) {
    indentLevel = Math.max(0, indentLevel - 1);
  }
  
  const indent = '  '.repeat(indentLevel);
  console.log(`   ${lineNum.toString().padStart(4)}: ${indent}${trimmed}`);
  
  if (trimmed.includes('<') && !trimmed.includes('</') && !trimmed.includes('/>')) {
    indentLevel++;
  }
});

if (actionsSection.length > 20) {
  console.log(`   ... (${actionsSection.length - 20} more lines)`);
}

// Check if the section is properly positioned in the component structure
console.log('\n📋 Component Structure Analysis:');
console.log('--------------------------------');

// Find the main return statement
let returnStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('return (')) {
    returnStart = i;
    break;
  }
}

if (returnStart !== -1) {
  console.log(`✅ Main return statement found at line ${returnStart + 1}`);
  
  // Check if actions section is inside the return
  if (actionsSectionStart > returnStart) {
    console.log('✅ Actions section is inside the component return');
  } else {
    console.log('❌ Actions section is OUTSIDE the component return!');
  }
} else {
  console.log('❌ Main return statement not found');
}

// Check for conditional rendering
const actionsSectionContent = actionsSection.join('\n');
const hasConditionalRendering = actionsSectionContent.includes('&&') || actionsSectionContent.includes('?');

console.log(`📋 Conditional rendering: ${hasConditionalRendering ? 'YES' : 'NO'}`);

// Check for proper JSX structure
const hasOpeningCard = actionsSectionContent.includes('<Card');
const hasClosingCard = actionsSectionContent.includes('</Card>');
const hasCardHeader = actionsSectionContent.includes('<CardHeader>');
const hasCardContent = actionsSectionContent.includes('<CardContent>');

console.log(`📋 JSX Structure:`);
console.log(`   Opening Card: ${hasOpeningCard ? 'YES' : 'NO'}`);
console.log(`   Closing Card: ${hasClosingCard ? 'YES' : 'NO'}`);
console.log(`   Card Header: ${hasCardHeader ? 'YES' : 'NO'}`);
console.log(`   Card Content: ${hasCardContent ? 'YES' : 'NO'}`);

// Check for any syntax issues
const hasBrokenJSX = actionsSectionContent.includes('}{') || 
                    actionsSectionContent.includes('}}') ||
                    actionsSectionContent.includes('{{');

console.log(`📋 Potential JSX issues: ${hasBrokenJSX ? 'DETECTED' : 'NONE'}`);

// Summary
console.log('\n📊 Visibility Analysis Summary:');
console.log('===============================');

const isProperlyPositioned = actionsSectionStart > returnStart;
const hasProperStructure = hasOpeningCard && hasClosingCard && hasCardHeader && hasCardContent;
const hasNoSyntaxIssues = !hasBrokenJSX;

console.log(`✅ Properly positioned: ${isProperlyPositioned ? 'YES' : 'NO'}`);
console.log(`✅ Proper JSX structure: ${hasProperStructure ? 'YES' : 'NO'}`);
console.log(`✅ No syntax issues: ${hasNoSyntaxIssues ? 'YES' : 'NO'}`);

if (isProperlyPositioned && hasProperStructure && hasNoSyntaxIssues) {
  console.log('\n🎉 Actions section should be VISIBLE in the UI!');
  console.log('\n🔧 If you still don\'t see it, try:');
  console.log('1. Hard refresh the browser (Ctrl+F5)');
  console.log('2. Clear browser cache');
  console.log('3. Check browser console for errors');
  console.log('4. Scroll down to the bottom of the risk form');
  console.log('5. Make sure you\'re on the correct URL (port 5174)');
} else {
  console.log('\n⚠️ Issues detected that may prevent visibility:');
  if (!isProperlyPositioned) console.log('- Section is not properly positioned in component');
  if (!hasProperStructure) console.log('- JSX structure is incomplete');
  if (!hasNoSyntaxIssues) console.log('- Syntax issues detected');
}

console.log('\n✨ Visibility Test Complete');
