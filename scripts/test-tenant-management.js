const axios = require('axios')

const API_BASE_URL = 'http://localhost:3002/api'

// Fonction pour se connecter et obtenir un token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    })
    return response.data.token
  } catch (error) {
    console.error('Erreur de connexion:', error.response?.data || error.message)
    throw error
  }
}

// Fonction pour tester la création d'un tenant
async function testCreateTenant(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/tenants`, {
      name: 'Test Corporation',
      slug: 'test-corp',
      description: 'Entreprise de test pour la plateforme GAMR',
      sector: 'Technologie',
      size: 'PME',
      location: 'Paris, France'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('Tenant créé avec succès:', response.data)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la création du tenant:', error.response?.data || error.message)
    throw error
  }
}

// Fonction pour tester la récupération des tenants
async function testGetTenants(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/tenants`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('Tenants récupérés:', response.data)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des tenants:', error.response?.data || error.message)
    throw error
  }
}

// Fonction pour tester la mise à jour d'un tenant
async function testUpdateTenant(token, tenantId) {
  try {
    const response = await axios.put(`${API_BASE_URL}/tenants/${tenantId}`, {
      name: 'Test Corporation Updated',
      description: 'Entreprise de test mise à jour',
      sector: 'Finance'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('Tenant mis à jour:', response.data)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la mise à jour du tenant:', error.response?.data || error.message)
    throw error
  }
}

// Fonction pour tester le basculement du statut d'un tenant
async function testToggleTenantStatus(token, tenantId) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tenants/${tenantId}/toggle-status`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('Statut du tenant basculé:', response.data)
    return response.data
  } catch (error) {
    console.error('Erreur lors du basculement du statut:', error.response?.data || error.message)
    throw error
  }
}

// Fonction principale de test
async function runTests() {
  try {
    console.log('=== Test de gestion des tenants ===\n')
    
    // 1. Connexion en tant que superadmin
    console.log('1. Connexion en tant que superadmin...')
    const token = await login('admin@gamr.fr', 'admin123')
    console.log('✅ Connexion réussie\n')
    
    // 2. Récupération des tenants existants
    console.log('2. Récupération des tenants existants...')
    await testGetTenants(token)
    console.log('✅ Récupération réussie\n')
    
    // 3. Création d'un nouveau tenant
    console.log('3. Création d\'un nouveau tenant...')
    const newTenant = await testCreateTenant(token)
    console.log('✅ Création réussie\n')
    
    // 4. Mise à jour du tenant
    console.log('4. Mise à jour du tenant...')
    await testUpdateTenant(token, newTenant.id)
    console.log('✅ Mise à jour réussie\n')
    
    // 5. Basculement du statut
    console.log('5. Basculement du statut du tenant...')
    await testToggleTenantStatus(token, newTenant.id)
    console.log('✅ Basculement réussi\n')
    
    // 6. Récupération finale pour vérifier les changements
    console.log('6. Vérification finale...')
    await testGetTenants(token)
    console.log('✅ Vérification réussie\n')
    
    console.log('🎉 Tous les tests sont passés avec succès!')
    
  } catch (error) {
    console.error('❌ Échec du test:', error.message)
  }
}

// Exécuter les tests
runTests()
