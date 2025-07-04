const { PrismaClient } = require('@prisma/client');

async function checkEvaluations() {
  const prisma = new PrismaClient();
  try {
    console.log('Checking evaluation system...');
    
    const templates = await prisma.evaluationTemplate.findMany({
      include: {
        questionGroups: {
          include: {
            objectives: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });
    console.log('📋 Templates found:', templates.length);
    templates.forEach(t => {
      console.log(`  - ${t.name} (v${t.version})`);
      console.log(`    Groups: ${t.questionGroups.length}`);
      const totalObjectives = t.questionGroups.reduce((sum, g) => sum + g.objectives.length, 0);
      const totalQuestions = t.questionGroups.reduce((sum, g) => 
        sum + g.objectives.reduce((objSum, o) => objSum + o.questions.length, 0), 0);
      console.log(`    Objectives: ${totalObjectives}, Questions: ${totalQuestions}`);
    });
    
    const evaluations = await prisma.evaluation.findMany({
      include: {
        template: true,
        evaluator: true
      }
    });
    console.log('🔍 Evaluations found:', evaluations.length);
    evaluations.forEach(e => {
      console.log(`  - ${e.title} (${e.status})`);
      console.log(`    Template: ${e.template.name}`);
      console.log(`    Evaluator: ${e.evaluator.firstName} ${e.evaluator.lastName}`);
    });
    
    const responses = await prisma.response.findMany();
    console.log('💬 Responses found:', responses.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvaluations();
