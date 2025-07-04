const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Check tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`📊 Tenants found: ${tenants.length}`);
    tenants.forEach(t => console.log(`  - ${t.name} (${t.id})`));
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`👥 Users found: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    
    // Check risk sheets
    const riskSheets = await prisma.riskSheet.findMany();
    console.log(`📋 Risk sheets found: ${riskSheets.length}`);
    riskSheets.forEach(r => console.log(`  - ${r.target} (Score: ${r.riskScore})`));
    
    // Test login
    const bcrypt = require('bcryptjs');
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@test.com' },
      include: { tenant: true }
    });
    
    if (testUser) {
      const isPasswordValid = await bcrypt.compare('password123', testUser.password);
      console.log(`🔐 Test user login: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Tenant: ${testUser.tenant.name}`);
      console.log(`   Active: ${testUser.isActive}`);
      console.log(`   Tenant Active: ${testUser.tenant.isActive}`);
    } else {
      console.log('❌ Test user not found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
