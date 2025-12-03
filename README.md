# 🛡️ GAMRDIGITALE - Plateforme Intelligente de Gestion des Risques

Une plateforme moderne et intelligente pour la gestion des risques avec analyse prédictive IA, architecture multi-tenant et interface utilisateur intuitive.

## 📋 Table des Matières

- [🚀 Fonctionnalités](#-fonctionnalités)
- [🛠️ Stack Technologique](#️-stack-technologique)
- [📦 Installation](#-installation)
- [🏗️ Architecture](#️-architecture)
- [📁 Structure du Projet](#-structure-du-projet)
- [🔌 API Endpoints](#-api-endpoints)
- [🗄️ Modèle de Données](#️-modèle-de-données)
- [🧪 Tests](#-tests)
- [🚀 Déploiement](#-déploiement)
- [🔧 Scripts Disponibles](#-scripts-disponibles)
- [🌐 Variables d'Environnement](#-variables-denvironnement)

## 🚀 Fonctionnalités

### ✅ Phase 1 - Fondations (Terminée)
- **Architecture multi-tenant** avec isolation complète des données
- **Interface utilisateur moderne** avec React + Tailwind CSS
- **Base de données SQLite** avec Prisma ORM
- **Système d'authentification JWT** avec rôles granulaires
- **Gestion des fiches GAMRDIGITALE** avec calcul automatique des scores
- **Dashboard interactif** avec métriques et visualisations
- **Système de rôles** (Super Admin, Admin, Analyste IA, Évaluateur, Lecteur)

### ✅ Phase 2 - Évaluations de Sécurité (Terminée)
- **Questionnaires de sécurité** avec 42 objectifs structurés
- **Système de réponses** avec validation et scoring automatique
- **Templates d'évaluation** personnalisables par tenant
- **Génération automatique** de fiches GAMRDIGITALE depuis les évaluations
- **Interface de questionnaire** intuitive avec navigation fluide
- **10 modèles d'évaluation** prédéfinis (sécurité globale, propriété, personnel, etc.)

### ✅ Phase 3A - Actions Correctives (Terminée)
- **Gestion complète des actions correctives** avec workflow
- **Priorisation intelligente** basée sur les scores de risque
- **Assignation et suivi** des responsables avec notifications
- **Tableaux de bord** de suivi des actions et KPIs
- **Notifications automatiques** pour les échéances et retards

### ✅ Phase 3B - Système RAG et Chat IA (Terminée)
- **Chat intelligent** avec accès aux données tenant
- **Système RAG** pour réponses contextuelles
- **Analyse des évaluations** et recommandations IA
- **Interface de chat** intégrée au dashboard

### 🎯 Phases Futures
- Matrices de corrélation avancées
- Analyse prédictive avec IA
- Système de notifications intelligent
- Rapports et exports personnalisés
- Intégration avec systèmes externes

## 🛠️ Stack Technologique

### Frontend
- **React 18** - Framework UI moderne
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **Tailwind CSS 3.4** - Framework CSS utilitaire
- **React Router DOM** - Routage côté client
- **Lucide React** - Icônes modernes
- **Recharts** - Graphiques et visualisations
- **HTML2Canvas & jsPDF** - Export PDF

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Typage statique
- **Prisma ORM** - ORM moderne
- **SQLite** - Base de données embarquée
- **JWT** - Authentification
- **bcryptjs** - Hachage des mots de passe
- **CORS** - Gestion des origines croisées
- **Helmet** - Sécurité HTTP
- **Morgan** - Logging des requêtes
- **Express Rate Limit** - Limitation de débit

### Outils de Développement
- **TSX** - Exécution TypeScript
- **Concurrently** - Exécution parallèle
- **Autoprefixer** - Préfixes CSS automatiques
- **PostCSS** - Transformation CSS

## 📦 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Git

### Installation locale

1. **Cloner le projet**
```bash
git clone <repository-url>
cd gamr-platform
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**
```bash
npx prisma generate
npx prisma db push
npm run db:reset  # Initialise avec des données de test
```

4. **Lancer l'application complète**
```bash
npm run dev:full  # Lance le serveur API et le frontend
```

5. **Accéder à l'application**
- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3002](http://localhost:3002)
- Health check: [http://localhost:3002/health](http://localhost:3002/health)

### Comptes de test
- **Super Admin**: `superadmin@gamr.com` / `password123`
- **Admin**: `admin@techcorp.com` / `password123`
- **Évaluateur**: `evaluator@techcorp.com` / `password123`

## 🏗️ Architecture

### Architecture Multi-Tenant
- **Isolation des données** par tenant
- **Rôles granulaires** par organisation
- **Sécurité renforcée** avec JWT
- **Scalabilité horizontale**

### Patterns Utilisés
- **Repository Pattern** pour l'accès aux données
- **Middleware Pattern** pour l'authentification
- **Observer Pattern** pour les notifications
- **Factory Pattern** pour la création d'entités

## 📁 Structure du Projet

```
gamr-platform/
├── src/
│   ├── components/              # Composants React réutilisables
│   │   ├── ui/                 # Composants UI de base
│   │   ├── Layout.tsx          # Layout principal
│   │   ├── ProtectedRoute.tsx  # Protection des routes
│   │   └── Toast.tsx           # Notifications
│   ├── pages/                  # Pages de l'application
│   │   ├── Dashboard.tsx       # Tableau de bord
│   │   ├── Login.tsx           # Authentification
│   │   ├── RiskSheets.tsx      # Gestion des fiches GAMRDIGITALE
│   │   ├── Evaluations.tsx     # Évaluations de sécurité
│   │   ├── ActionsPage.tsx     # Actions correctives
│   │   ├── ChatPage.tsx        # Chat IA
│   │   └── TenantsManagement.tsx # Gestion des tenants
│   ├── server/                 # Backend Express
│   │   ├── routes/             # Routes API
│   │   ├── middleware/         # Middlewares
│   │   ├── lib/               # Utilitaires serveur
│   │   └── services/          # Services métier
│   ├── lib/                   # Utilitaires frontend
│   │   ├── api.ts             # Client API
│   │   ├── utils.ts           # Fonctions utilitaires
│   │   └── prisma.ts          # Client Prisma
│   ├── contexts/              # Contextes React
│   ├── hooks/                 # Hooks personnalisés
│   └── types/                 # Types TypeScript
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   ├── dev.db                 # Base de données SQLite
│   └── seed*.ts               # Scripts de données de test
├── scripts/                   # Scripts utilitaires
├── docs/                      # Documentation
└── public/                    # Assets statiques
```

## 🔌 API Endpoints

### Authentification (`/api/auth`)
- `POST /login` - Connexion utilisateur
- `POST /logout` - Déconnexion
- `GET /me` - Profil utilisateur
- `PUT /profile` - Mise à jour profil
- `GET /permissions` - Permissions utilisateur

### Fiches de Risques (`/api/risk-sheets`)
- `GET /` - Liste des fiches (pagination, filtres)
- `GET /:id` - Détail d'une fiche
- `POST /` - Créer une fiche
- `PUT /:id` - Modifier une fiche
- `DELETE /:id` - Supprimer une fiche
- `GET /stats` - Statistiques des risques

### Évaluations (`/api/evaluations`)
- `GET /` - Liste des évaluations
- `GET /:id` - Détail d'une évaluation
- `POST /` - Créer une évaluation
- `PUT /:id` - Modifier une évaluation
- `DELETE /:id` - Supprimer une évaluation
- `POST /:id/responses` - Sauvegarder réponses
- `POST /:id/generate-gamrdigitale` - Générer fiche GAMR

### Templates (`/api/templates`)
- `GET /` - Liste des templates
- `GET /:id` - Détail d'un template
- `POST /` - Créer un template (Admin)
- `PUT /:id` - Modifier un template (Admin)
- `DELETE /:id` - Supprimer un template (Admin)

### Actions Correctives (`/api/actions`)
- `GET /` - Liste des actions
- `GET /:id` - Détail d'une action
- `POST /` - Créer une action
- `PUT /:id` - Modifier une action
- `DELETE /:id` - Supprimer une action
- `GET /stats` - Statistiques des actions

### Chat IA (`/api/rag`)
- `POST /query` - Poser une question au chat IA
- `GET /status` - Statut du système RAG
- `POST /index` - Indexer les données

### Gestion des Tenants (`/api/tenants`) - Super Admin uniquement
- `GET /` - Liste des tenants
- `POST /` - Créer un tenant
- `PUT /:id` - Modifier un tenant
- `DELETE /:id` - Supprimer un tenant

### Gestion des Utilisateurs (`/api/users`)
- `GET /` - Liste des utilisateurs du tenant
- `POST /` - Créer un utilisateur (Admin)
- `PUT /:id` - Modifier un utilisateur (Admin)
- `DELETE /:id` - Supprimer un utilisateur (Admin)

### Analytics (`/api/analytics`)
- `GET /dashboard` - Métriques du dashboard
- `GET /risks` - Analyse des risques
- `GET /actions` - Analyse des actions
- `POST /export` - Export des données

### Utilitaires
- `GET /health` - Health check
- `GET /api/test` - Test de l'API

## 🗄️ Modèle de Données

### Entités Principales

#### Tenant (Organisation)
```typescript
{
  id: string
  name: string
  slug: string (unique)
  logo?: string
  description?: string
  sector?: string        // Secteur d'activité
  size?: string         // Taille (TPE, PME, ETI, GE)
  location?: string     // Géolocalisation
  riskLevels?: Json     // Niveaux personnalisés
  threatTypes?: Json    // Types de menaces
  reviewFrequency?: number // Fréquence de révision
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### User (Utilisateur)
```typescript
{
  id: string
  email: string (unique)
  firstName: string
  lastName: string
  password: string      // Hash bcrypt
  role: UserRole       // SUPER_ADMIN, ADMIN, AI_ANALYST, EVALUATOR, READER
  isActive: boolean
  lastLogin?: DateTime
  tenantId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### RiskSheet (Fiche GAMRDIGITALE)
```typescript
{
  id: string
  target: string        // Cible potentielle
  scenario: string      // Scénario de menace
  probability: number   // Probabilité (1-3)
  vulnerability: number // Vulnérabilité (1-4)
  impact: number       // Impact (1-5)
  riskScore: number    // Score calculé (0-100)
  priority: Priority   // LOW, MEDIUM, HIGH, CRITICAL
  category?: string    // Catégorie
  tags?: Json         // Tags automatiques
  aiSuggestions?: Json // Suggestions IA
  version: number
  isArchived: boolean
  reviewDate?: DateTime
  tenantId: string
  authorId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Evaluation (Évaluation de sécurité)
```typescript
{
  id: string
  title: string
  status: EvaluationStatus // DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED
  progress: number         // Pourcentage de completion
  score?: number          // Score global
  entityInfo?: Json       // Informations sur l'entité évaluée
  templateId: string
  tenantId: string
  evaluatorId: string
  createdAt: DateTime
  updatedAt: DateTime
  completedAt?: DateTime
}
```

#### Action (Action corrective)
```typescript
{
  id: string
  title: string
  description: string
  status: ActionStatus     // TODO, IN_PROGRESS, COMPLETED, CANCELLED
  priority: Priority       // LOW, MEDIUM, HIGH, CRITICAL
  dueDate?: DateTime
  completedAt?: DateTime
  successProbability?: number // Probabilité de succès (0-100)
  estimatedCost?: number      // Coût estimé
  estimatedDuration?: number  // Durée estimée (jours)
  riskSheetId: string
  assigneeId?: string
  tenantId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Calcul des Scores GAMRDIGITALE
```typescript
// Score de risque normalisé sur 100
riskScore = (probability × vulnerability × impact) / 60 × 100

// Priorité basée sur le score
if (score >= 75) priority = "CRITICAL"
else if (score >= 50) priority = "HIGH"
else if (score >= 25) priority = "MEDIUM"
else priority = "LOW"
```

## 🧪 Tests

### Tests Implémentés
- **Tests API** - Scripts de test pour tous les endpoints
- **Tests d'intégration** - Vérification des workflows complets
- **Tests de données** - Validation des seeds et migrations

### Scripts de Test
```bash
# Test de l'API complète
node test-api.js

# Test des évaluations
npm run test:evaluations

# Test des actions correctives
npm run test:actions

# Vérification de la base de données
npm run test:db
```

### Tests Manuels
- **Interface utilisateur** - Tests manuels sur toutes les pages
- **Authentification** - Tests des rôles et permissions
- **Workflows** - Tests des processus métier complets

## 🚀 Déploiement

### 🐳 Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Exposer le port
EXPOSE 3002

# Commande de démarrage
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  gamr-app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - gamr-app
    restart: unless-stopped
```

### ☁️ Azure Deployment

#### Azure Container Instances
```bash
# Build et push de l'image
docker build -t gamr-platform .
docker tag gamr-platform myregistry.azurecr.io/gamr-platform:latest
docker push myregistry.azurecr.io/gamr-platform:latest

# Déploiement ACI
az container create \
  --resource-group myResourceGroup \
  --name gamr-platform \
  --image myregistry.azurecr.io/gamr-platform:latest \
  --cpu 2 \
  --memory 4 \
  --ports 3002 \
  --environment-variables NODE_ENV=production
```

#### Azure App Service
```bash
# Déploiement direct
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name gamr-platform \
  --deployment-container-image-name myregistry.azurecr.io/gamr-platform:latest

# Configuration des variables d'environnement
az webapp config appsettings set \
  --resource-group myResourceGroup \
  --name gamr-platform \
  --settings NODE_ENV=production DATABASE_URL="file:./prod.db"
```

### 🐙 GitHub Actions

#### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy GAMRDIGITALE Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.REGISTRY_LOGIN_SERVER }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and push Docker image
        run: |
          docker build -t ${{ secrets.REGISTRY_LOGIN_SERVER }}/gamr-platform:${{ github.sha }} .
          docker push ${{ secrets.REGISTRY_LOGIN_SERVER }}/gamr-platform:${{ github.sha }}

      - name: Deploy to Azure Container Instances
        uses: azure/aci-deploy@v1
        with:
          resource-group: ${{ secrets.RESOURCE_GROUP }}
          dns-name-label: gamr-platform-${{ github.sha }}
          image: ${{ secrets.REGISTRY_LOGIN_SERVER }}/gamr-platform:${{ github.sha }}
          cpu: 2
          memory: 4
          ports: 3002
          environment-variables: NODE_ENV=production
```

## 🔧 Scripts Disponibles

### Scripts de Développement
```bash
npm run dev              # Frontend uniquement (Vite)
npm run server:dev       # Backend uniquement (Express)
npm run dev:full         # Frontend + Backend en parallèle
npm run build            # Build de production
npm run preview          # Aperçu du build
```

### Scripts de Base de Données
```bash
npm run db:seed          # Données de base
npm run db:seed-questionnaire  # Questionnaires de sécurité
npm run db:seed-actions  # Actions correctives
npm run db:seed-models   # Modèles d'évaluation
npm run db:reset         # Reset complet avec toutes les données
```

### Scripts de Test et Vérification
```bash
node test-api.js         # Test de l'API
node scripts/verify-new-actions.ts    # Vérifier les actions
node scripts/check-database-tenants.js # Vérifier les tenants
```

## 🌐 Variables d'Environnement

### Développement (.env.local)
```env
# Base de données
DATABASE_URL="file:./dev.db"

# Serveur
PORT=3002
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3002

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

### Production (.env.production)
```env
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/gamr"

# Serveur
PORT=3002
NODE_ENV=production

# Frontend
VITE_API_URL=https://api.gamr-platform.com

# JWT
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=24h

# Sécurité
CORS_ORIGIN=https://gamr-platform.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🔒 Sécurité

### Mesures Implémentées
- **JWT** avec expiration
- **bcrypt** pour les mots de passe
- **Helmet** pour les headers de sécurité
- **CORS** configuré
- **Rate limiting** sur les API
- **Validation** des entrées utilisateur
- **Isolation** des données par tenant

### Recommandations Production
- Utiliser HTTPS uniquement
- Configurer un WAF (Web Application Firewall)
- Mettre en place la surveillance des intrusions
- Sauvegardes automatiques de la base de données
- Rotation régulière des secrets JWT

## 📊 Monitoring et Logs

### Health Checks
- **Endpoint**: `GET /health`
- **Métriques**: Status, timestamp, services
- **Monitoring**: Azure Application Insights

### Logging
- **Morgan** pour les requêtes HTTP
- **Console** pour les erreurs applicatives
- **Azure Log Analytics** en production

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support, contactez l'équipe de développement.

---

**GAMRDIGITALE Platform** - Gestion intelligente des risques avec IA prédictive 🛡️
