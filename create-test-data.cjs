const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating test data...');
    
    // Create a tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
        description: 'Test company for GAMRDIGITALE platform'
      }
    });
    console.log('Tenant created:', tenant.id);
    
    // Create a user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });
    console.log('User created:', user.id);
    
    // Create multiple risk sheets
    const riskSheets = await Promise.all([
      prisma.riskSheet.create({
        data: {
          target: 'Serveurs de production',
          scenario: 'Cyberattaque par ransomware',
          probability: 2,
          vulnerability: 3,
          impact: 4,
          riskScore: 66.67,
          priority: 'HIGH',
          category: 'Cybersécurité',
          tenantId: tenant.id,
          authorId: user.id
        }
      }),
      prisma.riskSheet.create({
        data: {
          target: 'Données clients',
          scenario: 'Fuite de données personnelles',
          probability: 2,
          vulnerability: 4,
          impact: 5,
          riskScore: 83.33,
          priority: 'CRITICAL',
          category: 'Protection des données',
          tenantId: tenant.id,
          authorId: user.id
        }
      }),
      prisma.riskSheet.create({
        data: {
          target: 'Infrastructure réseau',
          scenario: 'Panne du système de communication',
          probability: 1,
          vulnerability: 2,
          impact: 3,
          riskScore: 25.0,
          priority: 'LOW',
          category: 'Infrastructure',
          tenantId: tenant.id,
          authorId: user.id
        }
      })
    ]);
    
    console.log('Risk sheets created:', riskSheets.length);
    riskSheets.forEach((sheet, index) => {
      console.log(`  ${index + 1}. ${sheet.target} (${sheet.id})`);
    });
    
    console.log('Test data created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
