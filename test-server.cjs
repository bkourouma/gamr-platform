const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static(__dirname));

// Serve the test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-login.html'));
});

app.listen(PORT, () => {
  console.log(`🧪 Test server started on http://localhost:${PORT}`);
  console.log(`📄 Test page: http://localhost:${PORT}/test-login.html`);
});
