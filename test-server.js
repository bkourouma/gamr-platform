import http from 'http';

// Test de connexion au serveur API
const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('✅ Serveur API accessible');
  });
});

req.on('error', (e) => {
  console.error(`❌ Erreur de connexion: ${e.message}`);
  console.log('Le serveur API n\'est pas démarré sur le port 3002');
});

req.end();
