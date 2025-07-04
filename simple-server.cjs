const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const PORT = 3002;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production-2024';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'null'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, isActive: true }
        }
      }
    });

    if (!user || !user.isActive || !user.tenant.isActive) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: user.tenant
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Get risk sheets
app.get('/api/risk-sheets', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { limit = 100 } = req.query;

    const riskSheets = await prisma.riskSheet.findMany({
      where: {
        tenantId,
        isArchived: false
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.json({
      data: riskSheets,
      pagination: {
        page: 1,
        limit: Number(limit),
        total: riskSheets.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Risk sheets error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fiches de risque' });
  }
});

// Get users
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { limit = 100 } = req.query;

    const users = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      },
      take: Number(limit)
    });

    res.json({
      data: users,
      pagination: {
        page: 1,
        limit: Number(limit),
        total: users.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server started on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log('Server is ready to accept connections');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});
