const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API...');
    
    // Test health
    const healthResponse = await fetch('http://localhost:3002/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test login
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status, errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.user.email);
    
    const token = loginData.token;
    
    // Test risk sheets
    const riskSheetsResponse = await fetch('http://localhost:3002/api/risk-sheets', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!riskSheetsResponse.ok) {
      const errorText = await riskSheetsResponse.text();
      console.log('❌ Risk sheets failed:', riskSheetsResponse.status, errorText);
      return;
    }
    
    const riskSheetsData = await riskSheetsResponse.json();
    console.log(`✅ Risk sheets found: ${riskSheetsData.data.length}`);
    riskSheetsData.data.forEach(sheet => {
      console.log(`  - ${sheet.target} (Score: ${Math.round(sheet.riskScore)}/100)`);
    });
    
    // Test users
    const usersResponse = await fetch('http://localhost:3002/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.log('❌ Users failed:', usersResponse.status, errorText);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log(`✅ Users found: ${usersData.data.length}`);
    usersData.data.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ API test error:', error);
  }
}

testAPI();
