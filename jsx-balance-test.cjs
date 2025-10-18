// JSX Balance Test - Check for unbalanced JSX tags
const fs = require('fs');
const path = require('path');

console.log('🔍 JSX Balance Test');
console.log('===================');

function checkJSXBalance() {
  const filePath = path.join(__dirname, 'src/components/RiskSheetForm.tsx');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log('\n📋 Checking JSX balance around line 672...\n');
    
    // Track JSX elements and their balance
    let jsxStack = [];
    let inJSXComment = false;
    
    // Check lines 450-680 for JSX balance
    for (let i = 449; i < 680 && i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for JSX comments
      if (line.includes('{/*')) {
        inJSXComment = true;
        console.log(`Line ${lineNum}: JSX Comment Start - ${line}`);
        continue;
      }
      if (line.includes('*/}')) {
        inJSXComment = false;
        console.log(`Line ${lineNum}: JSX Comment End - ${line}`);
        continue;
      }
      if (inJSXComment) continue;
      
      // Check for opening tags
      const openTags = line.match(/<(\w+)(?:\s|>)/g);
      if (openTags) {
        openTags.forEach(tag => {
          const tagName = tag.match(/<(\w+)/)[1];
          if (!line.includes(`</${tagName}>`)) { // Not self-closing
            jsxStack.push({ tag: tagName, line: lineNum });
            console.log(`Line ${lineNum}: Open <${tagName}> - Stack depth: ${jsxStack.length}`);
          }
        });
      }
      
      // Check for closing tags
      const closeTags = line.match(/<\/(\w+)>/g);
      if (closeTags) {
        closeTags.forEach(tag => {
          const tagName = tag.match(/<\/(\w+)>/)[1];
          const lastOpen = jsxStack.pop();
          if (lastOpen && lastOpen.tag === tagName) {
            console.log(`Line ${lineNum}: Close </${tagName}> - Stack depth: ${jsxStack.length}`);
          } else {
            console.log(`Line ${lineNum}: ❌ UNBALANCED Close </${tagName}> - Expected ${lastOpen ? lastOpen.tag : 'none'}`);
          }
        });
      }
      
      // Special check for line 672
      if (lineNum === 672) {
        console.log(`\n🎯 Line 672 Analysis:`);
        console.log(`   Content: ${line}`);
        console.log(`   JSX Stack depth: ${jsxStack.length}`);
        console.log(`   Open tags: ${jsxStack.map(item => `<${item.tag}> (line ${item.line})`).join(', ')}`);
        
        if (jsxStack.length === 0) {
          console.log(`   ❌ PROBLEM: No open JSX container for comment!`);
        } else {
          console.log(`   ✅ JSX container available: ${jsxStack[jsxStack.length - 1].tag}`);
        }
      }
    }
    
    console.log(`\n📊 Final JSX Stack: ${jsxStack.length} open tags`);
    if (jsxStack.length > 0) {
      console.log('   Unclosed tags:');
      jsxStack.forEach(item => {
        console.log(`   - <${item.tag}> opened at line ${item.line}`);
      });
    }
    
    return jsxStack.length === 0;
    
  } catch (error) {
    console.error('❌ Error checking JSX balance:', error.message);
    return false;
  }
}

function fixJSXStructure() {
  console.log('\n🛠️ Attempting JSX Structure Fix...');
  
  const filePath = path.join(__dirname, 'src/components/RiskSheetForm.tsx');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Find the problematic area and fix it
    let fixedLines = [...lines];
    
    // The issue is likely that the Repercussions section needs to be wrapped
    // in a React Fragment or proper container
    
    // Find line 672 (Repercussions comment)
    const repercussionsIndex = lines.findIndex(line => line.includes('{/* Repercussions */}'));
    
    if (repercussionsIndex >= 0) {
      console.log(`   Found Repercussions at line ${repercussionsIndex + 1}`);
      
      // Check if it's properly contained within CardContent
      // The fix is to ensure it has the same structure as other sections
      
      // Replace the problematic line with a properly formatted one
      const correctIndent = '                '; // 16 spaces to match other sections
      fixedLines[repercussionsIndex] = correctIndent + '{/* Repercussions */}';
      
      console.log(`   ✅ Fixed indentation for Repercussions comment`);
      
      // Write the fixed content
      const fixedContent = fixedLines.join('\n');
      const testFilePath = path.join(__dirname, 'RiskSheetForm-JSX-FIXED.tsx');
      fs.writeFileSync(testFilePath, fixedContent);
      
      console.log(`   📝 Fixed content written to: RiskSheetForm-JSX-FIXED.tsx`);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error fixing JSX structure:', error.message);
    return false;
  }
}

// Run the tests
const isBalanced = checkJSXBalance();
console.log(`\n🎯 JSX Balance Result: ${isBalanced ? 'BALANCED' : 'UNBALANCED'}`);

if (!isBalanced) {
  const fixed = fixJSXStructure();
  console.log(`\n🔧 Fix Applied: ${fixed ? 'YES' : 'NO'}`);
}
