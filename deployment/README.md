# 🚀 Guide de Déploiement - GAMR Platform

Ce guide détaille le processus de déploiement complet de la plateforme GAMR en production.

## 📋 Prérequis

### Outils Requis
- **Docker** (v20.10+)
- **Azure CLI** (v2.40+)
- **Node.js** (v18+)
- **Git** et **GitHub CLI**

### Comptes et Services
- ✅ Compte Azure avec souscription active
- ✅ Repository GitHub configuré
- ✅ Domaine personnalisé (optionnel)

## 🏗️ Architecture de Déploiement

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub        │    │   Azure          │    │   Monitoring    │
│   - Actions     │───▶│   - App Service  │───▶│   - App Insights│
│   - Secrets     │    │   - Container    │    │   - Logs        │
│   - Workflows   │    │   - Database     │    │   - Alerts      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Configuration Initiale

### 1. Configuration Azure

```bash
# Connexion à Azure
az login

# Créer les ressources Azure
cd azure
chmod +x azure-setup.sh
./azure-setup.sh
```

### 2. Configuration GitHub

```bash
# Configurer les secrets GitHub
gh auth login

# Ajouter les secrets requis (voir .github/SECRETS.md)
gh secret set AZURE_CREDENTIALS --body "$(cat azure-credentials.json)"
gh secret set JWT_SECRET_PRODUCTION --body "$(openssl rand -base64 64)"
```

### 3. Variables d'Environnement

Créer `.env.production` :
```env
NODE_ENV=production
PORT=3002
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-domain.com
DATABASE_URL=file:./data/gamr.db
APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
```

## 🐳 Déploiement Docker

### Build Local
```bash
# Build de l'image
docker build -t gamr-platform .

# Test local
docker-compose -f docker-compose.prod.yml up
```

### Déploiement Azure Container Registry
```bash
# Tag et push vers ACR
docker tag gamr-platform gamrregistry.azurecr.io/gamr-platform:latest
docker push gamrregistry.azurecr.io/gamr-platform:latest
```

## 🚀 Déploiement Automatisé

### Via GitHub Actions
```bash
# Déclencher le déploiement
git push origin main

# Déploiement manuel
gh workflow run deploy.yml --ref main
```

### Via Script de Déploiement
```bash
# Déploiement local vers Azure
./deployment/deploy.sh azure-app-service

# Déploiement vers Azure Container Instances
./deployment/deploy.sh azure-aci
```

## 🧪 Tests et Validation

### Tests de Déploiement

```bash
# Tests de validation du déploiement
node tests/deployment-validation.js https://your-app.azurewebsites.net

# Tests de charge
node tests/load-test.js https://your-app.azurewebsites.net 10 60

# Tests avec verbose
node tests/deployment-validation.js https://your-app.azurewebsites.net --verbose
```

### Scripts de Test Disponibles

#### 1. Validation de Déploiement (`tests/deployment-validation.js`)
- ✅ Health checks et connectivité
- 🔐 Tests d'authentification et sécurité
- 🛡️ Validation des headers de sécurité
- 🚦 Tests de rate limiting
- 🌐 Configuration CORS
- 📊 Tests de performance de base
- 🗄️ Connectivité base de données

#### 2. Tests de Charge (`tests/load-test.js`)
- 🔥 Tests de montée en charge
- 📈 Métriques de performance en temps réel
- 📊 Statistiques détaillées (P50, P95, P99)
- ⚡ Simulation d'utilisateurs concurrents
- 📋 Analyse des codes de statut HTTP

### Monitoring et Observabilité

#### Application Insights
```javascript
// Configuration automatique dans monitoring/application-insights.js
const { applicationInsights } = require('./monitoring/application-insights');

// Initialisation
applicationInsights.initialize();

// Tracking personnalisé
applicationInsights.trackEvent('UserLogin', { userId, tenantId });
applicationInsights.trackMetric('ResponseTime', duration);
```

#### Métriques Disponibles
- 📊 **Performance** : Temps de réponse, throughput
- 🔐 **Sécurité** : Tentatives d'authentification, violations
- 👥 **Utilisateurs** : Sessions actives, actions utilisateur
- 🗄️ **Base de données** : Requêtes, temps d'exécution
- 💾 **Cache** : Hit rate, utilisation mémoire

#### Health Checks
```bash
# Vérification de l'état de l'application
curl https://your-app.azurewebsites.net/health

# Métriques de performance
curl https://your-app.azurewebsites.net/metrics
```

## 🛡️ Sécurité en Production

### Headers de Sécurité (Helmet.js)
- 🛡️ **CSP** : Content Security Policy
- 🔒 **HSTS** : HTTP Strict Transport Security
- 🚫 **X-Frame-Options** : Protection contre clickjacking
- 🔐 **X-XSS-Protection** : Protection XSS
- 📋 **X-Content-Type-Options** : Protection MIME sniffing

### Rate Limiting
- 🚦 **API Global** : 100 requêtes/15min par IP
- 🔐 **Authentification** : 5 tentatives/15min
- ⚡ **Slow Down** : Délai progressif après 50 requêtes

### Validation des Données
- ✅ **Sanitisation** : Nettoyage automatique des entrées
- 🔍 **Validation** : Schémas stricts avec express-validator
- 🛡️ **Protection** : Détection de patterns d'attaque

## ⚡ Performance et Optimisation

### Cache Multi-Niveaux
```javascript
// Cache en mémoire avec TTL
const cache = require('./performance/optimization');

// Cache automatique des réponses API
app.use('/api', cache.cacheMiddleware(300)); // 5 minutes

// Cache personnalisé
cache.set('key', data, 600); // 10 minutes
const cachedData = cache.get('key');
```

### Compression et Optimisation
- 🗜️ **Gzip** : Compression automatique des réponses
- 📦 **Minification** : Assets optimisés en production
- 🚀 **CDN Ready** : Headers de cache appropriés
- 📊 **Monitoring** : Métriques de performance temps réel

## 📝 Logs et Debugging

### Niveaux de Logs
```bash
# Production (erreurs uniquement)
NODE_ENV=production npm start

# Development (tous les logs)
NODE_ENV=development npm run dev

# Debug complet
DEBUG=* npm start
```

### Centralisation des Logs
- 📝 **Application Insights** : Logs centralisés Azure
- 🔍 **Structured Logging** : Format JSON pour analyse
- 🚨 **Alertes** : Notifications automatiques sur erreurs critiques

## 🔄 Maintenance et Mises à Jour

### Déploiement Blue-Green
```bash
# Créer un slot de staging
az webapp deployment slot create --name gamr-platform --resource-group gamr-rg --slot staging

# Déployer vers staging
gh workflow run deploy.yml --ref main -f environment=staging

# Swap vers production après validation
az webapp deployment slot swap --name gamr-platform --resource-group gamr-rg --slot staging
```

### Rollback
```bash
# Rollback automatique via GitHub
gh workflow run deploy.yml --ref previous-commit-hash

# Rollback manuel Azure
az webapp deployment slot swap --name gamr-platform --resource-group gamr-rg --slot staging
```

## 🚨 Troubleshooting

### Problèmes Courants

#### 1. Échec de Déploiement
```bash
# Vérifier les logs Azure
az webapp log tail --name gamr-platform --resource-group gamr-rg

# Vérifier les secrets GitHub
gh secret list
```

#### 2. Performance Dégradée
```bash
# Analyser les métriques
node tests/load-test.js https://your-app.azurewebsites.net 5 30

# Vérifier le cache
curl https://your-app.azurewebsites.net/metrics
```

#### 3. Erreurs de Base de Données
```bash
# Vérifier la connectivité
curl https://your-app.azurewebsites.net/health

# Logs détaillés
az webapp log download --name gamr-platform --resource-group gamr-rg
```

## 📞 Support et Ressources

### Documentation
- 📚 [Azure App Service](https://docs.microsoft.com/azure/app-service/)
- 🐳 [Docker Documentation](https://docs.docker.com/)
- 🔄 [GitHub Actions](https://docs.github.com/actions)

### Monitoring
- 📊 [Application Insights Dashboard](https://portal.azure.com)
- 🔍 [GitHub Actions Logs](https://github.com/your-repo/actions)
- 📈 [Performance Metrics](https://your-app.azurewebsites.net/metrics)

---

## ✅ Checklist de Déploiement

- [ ] Azure CLI configuré et connecté
- [ ] Secrets GitHub configurés
- [ ] Variables d'environnement définies
- [ ] Tests de validation passés
- [ ] Monitoring configuré
- [ ] Sauvegardes planifiées
- [ ] Documentation mise à jour
- [ ] Équipe formée sur les procédures

🎉 **Félicitations !** Votre plateforme GAMR est maintenant déployée en production !
