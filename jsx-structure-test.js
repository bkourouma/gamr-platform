// JSX Structure Analysis Test
// This test analyzes the exact JSX structure issue in RiskSheetForm.tsx

const fs = require('fs');
const path = require('path');

console.log('🔍 JSX Structure Analysis Test');
console.log('==============================');

function analyzeJSXStructure() {
  const filePath = path.join(__dirname, 'src/components/RiskSheetForm.tsx');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log('\n📋 Analyzing JSX structure around line 672...\n');
    
    // Analyze lines 665-680
    for (let i = 664; i < 680 && i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      const indentation = line.match(/^(\s*)/)[1].length;
      
      console.log(`Line ${lineNum.toString().padStart(3)}: [${indentation.toString().padStart(2)} spaces] ${line}`);
      
      // Check for JSX issues
      if (lineNum === 672) {
        console.log(`       ^^^^ PROBLEM LINE: JSX comment outside container`);
        
        // Check what container this should be in
        let containerFound = false;
        for (let j = i - 1; j >= 0; j--) {
          const prevLine = lines[j];
          if (prevLine.includes('CardContent')) {
            console.log(`       Should be inside CardContent at line ${j + 1}`);
            containerFound = true;
            break;
          }
        }
        
        if (!containerFound) {
          console.log(`       ERROR: No CardContent container found!`);
        }
      }
    }
    
    // Find CardContent boundaries
    console.log('\n📦 CardContent Boundaries:');
    let cardContentStart = -1;
    let cardContentEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('<CardContent className="space-y-6">')) {
        cardContentStart = i + 1;
        console.log(`   Start: Line ${cardContentStart}`);
      }
      if (line.includes('</CardContent>') && cardContentStart > 0 && cardContentEnd === -1) {
        cardContentEnd = i + 1;
        console.log(`   End: Line ${cardContentEnd}`);
        break;
      }
    }
    
    // Check if line 672 is within CardContent
    if (cardContentStart > 0 && cardContentEnd > 0) {
      const isWithinCardContent = 672 >= cardContentStart && 672 <= cardContentEnd;
      console.log(`\n🎯 Line 672 within CardContent: ${isWithinCardContent ? 'YES' : 'NO'}`);
      
      if (!isWithinCardContent) {
        console.log(`   ❌ PROBLEM: Line 672 is OUTSIDE CardContent (${cardContentStart}-${cardContentEnd})`);
      }
    }
    
    // Analyze indentation patterns
    console.log('\n📏 Indentation Analysis:');
    const probabiliteLineIndex = lines.findIndex(line => line.includes('{/* Probabilité */}'));
    const vulnerabiliteLineIndex = lines.findIndex(line => line.includes('{/* Vulnérabilité */}'));
    const repercussionsLineIndex = lines.findIndex(line => line.includes('{/* Repercussions */}'));
    
    if (probabiliteLineIndex >= 0) {
      const probIndent = lines[probabiliteLineIndex].match(/^(\s*)/)[1].length;
      console.log(`   Probabilité (line ${probabiliteLineIndex + 1}): ${probIndent} spaces`);
    }
    
    if (vulnerabiliteLineIndex >= 0) {
      const vulnIndent = lines[vulnerabiliteLineIndex].match(/^(\s*)/)[1].length;
      console.log(`   Vulnérabilité (line ${vulnerabiliteLineIndex + 1}): ${vulnIndent} spaces`);
    }
    
    if (repercussionsLineIndex >= 0) {
      const repIndent = lines[repercussionsLineIndex].match(/^(\s*)/)[1].length;
      console.log(`   Repercussions (line ${repercussionsLineIndex + 1}): ${repIndent} spaces`);
      
      // Check if indentation matches other sections
      if (probabiliteLineIndex >= 0) {
        const probIndent = lines[probabiliteLineIndex].match(/^(\s*)/)[1].length;
        const indentMatch = repIndent === probIndent;
        console.log(`   Indentation matches Probabilité: ${indentMatch ? 'YES' : 'NO'}`);
        
        if (!indentMatch) {
          console.log(`   ❌ PROBLEM: Repercussions has ${repIndent} spaces, should have ${probIndent} spaces`);
        }
      }
    }
    
    // Generate fix recommendation
    console.log('\n🔧 Fix Recommendation:');
    if (cardContentStart > 0 && cardContentEnd > 0 && probabiliteLineIndex >= 0) {
      const correctIndent = lines[probabiliteLineIndex].match(/^(\s*)/)[1].length;
      console.log(`   1. Move Repercussions section inside CardContent (lines ${cardContentStart}-${cardContentEnd})`);
      console.log(`   2. Use ${correctIndent} spaces indentation to match other sections`);
      console.log(`   3. Ensure proper JSX container hierarchy`);
    }
    
    return {
      cardContentStart,
      cardContentEnd,
      repercussionsLine: repercussionsLineIndex + 1,
      correctIndent: probabiliteLineIndex >= 0 ? lines[probabiliteLineIndex].match(/^(\s*)/)[1].length : 16
    };
    
  } catch (error) {
    console.error('❌ Error analyzing file:', error.message);
    return null;
  }
}

function generateFixedContent() {
  console.log('\n🛠️ Generating Fixed Content...');
  
  const filePath = path.join(__dirname, 'src/components/RiskSheetForm.tsx');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Find the problematic Repercussions section
    let repercussionsStart = -1;
    let repercussionsEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('{/* Repercussions */}')) {
        repercussionsStart = i;
      }
      if (repercussionsStart >= 0 && lines[i].includes('</div>') && 
          i > repercussionsStart + 50) { // Look for the end of the section
        repercussionsEnd = i;
        break;
      }
    }
    
    if (repercussionsStart >= 0 && repercussionsEnd >= 0) {
      console.log(`   Found Repercussions section: lines ${repercussionsStart + 1}-${repercussionsEnd + 1}`);
      
      // Extract the Repercussions section
      const repercussionsSection = lines.slice(repercussionsStart, repercussionsEnd + 1);
      
      // Find where to insert it (before the AI recommendations button)
      let insertPosition = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('{/* Bouton pour appliquer les recommandations IA */}')) {
          insertPosition = i;
          break;
        }
      }
      
      if (insertPosition >= 0) {
        console.log(`   Insert position found: line ${insertPosition + 1}`);
        
        // Create fixed content
        const beforeRepercussions = lines.slice(0, repercussionsStart);
        const afterRepercussions = lines.slice(repercussionsEnd + 1);
        
        // Find the correct indentation (16 spaces to match other sections)
        const correctIndent = '                '; // 16 spaces
        
        // Fix indentation of Repercussions section
        const fixedRepercussionsSection = repercussionsSection.map(line => {
          if (line.trim() === '') return line;
          
          // Remove existing indentation and add correct indentation
          const trimmedLine = line.trimStart();
          if (trimmedLine.startsWith('{/*') || trimmedLine.startsWith('<div>') || 
              trimmedLine.startsWith('<label') || trimmedLine.startsWith('<div className="grid')) {
            return correctIndent + trimmedLine;
          } else if (trimmedLine.startsWith('<button') || trimmedLine.startsWith('key=') ||
                     trimmedLine.startsWith('type=') || trimmedLine.startsWith('onClick=') ||
                     trimmedLine.startsWith('className=')) {
            return correctIndent + '  ' + trimmedLine;
          } else if (trimmedLine.startsWith('<div className="text-center">') ||
                     trimmedLine.startsWith('<div className="text-lg') ||
                     trimmedLine.startsWith('<div className="text-xs">')) {
            return correctIndent + '    ' + trimmedLine;
          } else if (trimmedLine.startsWith('</button>') || trimmedLine.startsWith('</div>')) {
            return correctIndent + '  ' + trimmedLine;
          } else {
            return correctIndent + '  ' + trimmedLine;
          }
        });
        
        // Insert fixed section at correct position
        const beforeInsert = afterRepercussions.slice(0, insertPosition - repercussionsEnd - 1);
        const afterInsert = afterRepercussions.slice(insertPosition - repercussionsEnd - 1);
        
        const fixedLines = [
          ...beforeRepercussions,
          ...beforeInsert,
          '',
          ...fixedRepercussionsSection,
          '',
          ...afterInsert
        ];
        
        const fixedContent = fixedLines.join('\n');
        
        // Write fixed content to a test file
        const testFilePath = path.join(__dirname, 'RiskSheetForm-FIXED.tsx');
        fs.writeFileSync(testFilePath, fixedContent);
        
        console.log(`   ✅ Fixed content written to: RiskSheetForm-FIXED.tsx`);
        console.log(`   📝 Review the fixed file and replace the original if correct`);
        
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error generating fix:', error.message);
    return false;
  }
}

// Run the analysis
const analysis = analyzeJSXStructure();

if (analysis) {
  const fixGenerated = generateFixedContent();
  
  console.log('\n📊 Summary:');
  console.log(`   CardContent: lines ${analysis.cardContentStart}-${analysis.cardContentEnd}`);
  console.log(`   Repercussions: line ${analysis.repercussionsLine}`);
  console.log(`   Correct indent: ${analysis.correctIndent} spaces`);
  console.log(`   Fix generated: ${fixGenerated ? 'YES' : 'NO'}`);
  
  if (fixGenerated) {
    console.log('\n🎯 Next Steps:');
    console.log('   1. Review RiskSheetForm-FIXED.tsx');
    console.log('   2. If correct, replace the original file');
    console.log('   3. Test the application');
  }
}
