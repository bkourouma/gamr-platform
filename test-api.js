// Utiliser fetch natif de Node.js 18+

const API_BASE = 'http://localhost:3002/api';

async function testAPI() {
  console.log('🧪 Test des API GAMRDIGITALE...\n');

  // Test 1: Health check
  try {
    const response = await fetch('http://localhost:3002/health');
    const data = await response.json();
    console.log('✅ Health check:', data.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: API Test endpoint
  try {
    const response = await fetch(`${API_BASE}/test`);
    const data = await response.json();
    console.log('✅ API Test:', data.message);
  } catch (error) {
    console.log('❌ API Test failed:', error.message);
  }

  // Test 3: Actions stats (mock)
  try {
    const response = await fetch(`${API_BASE}/actions/stats`);
    const data = await response.json();
    console.log('✅ Actions stats:', `${data.totalActions} actions totales`);
  } catch (error) {
    console.log('❌ Actions stats failed:', error.message);
  }

  // Test 4: Actions list (mock)
  try {
    const response = await fetch(`${API_BASE}/actions`);
    const data = await response.json();
    console.log('✅ Actions list:', `${data.total} actions trouvées`);
  } catch (error) {
    console.log('❌ Actions list failed:', error.message);
  }

  // Test 5: Notifications stats (mock)
  try {
    const response = await fetch(`${API_BASE}/notifications/stats`);
    const data = await response.json();
    console.log('✅ Notifications stats:', `${data.totalNotifications} notifications`);
  } catch (error) {
    console.log('❌ Notifications stats failed:', error.message);
  }

  // Test 6: Notifications list (mock)
  try {
    const response = await fetch(`${API_BASE}/notifications`);
    const data = await response.json();
    console.log('✅ Notifications list:', `${data.total} notifications trouvées`);
  } catch (error) {
    console.log('❌ Notifications list failed:', error.message);
  }

  // Test 7: Risk sheets list (mock)
  try {
    const response = await fetch(`${API_BASE}/risk-sheets`);
    const data = await response.json();
    console.log('✅ Risk sheets list:', `${data.total} fiches de risques trouvées`);
  } catch (error) {
    console.log('❌ Risk sheets list failed:', error.message);
  }

  console.log('\n🎉 Tests terminés !');
}

testAPI().catch(console.error);
