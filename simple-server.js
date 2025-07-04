import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

// Routes de test
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API fonctionne !', 
    timestamp: new Date().toISOString() 
  });
});

// Route pour les actions (mock)
app.get('/api/actions/stats', (req, res) => {
  res.json({
    totalActions: 9,
    todoActions: 3,
    inProgressActions: 2,
    completedActions: 3,
    overdueActions: 1
  });
});

app.get('/api/actions', (req, res) => {
  res.json({
    data: [],
    total: 0,
    page: 1,
    limit: 10
  });
});

// Route pour les notifications (mock)
app.get('/api/notifications', (req, res) => {
  res.json({
    data: [],
    total: 0,
    page: 1,
    limit: 10
  });
});

app.get('/api/notifications/stats', (req, res) => {
  res.json({
    totalNotifications: 0,
    unreadNotifications: 0,
    notificationsByType: []
  });
});

// Route pour les fiches de risques (mock)
app.get('/api/risk-sheets', (req, res) => {
  res.json({
    data: [],
    total: 0,
    page: 1,
    limit: 10
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
