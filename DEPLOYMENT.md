# 🚀 GAMR Platform - Guide de Déploiement

Ce guide détaille les différentes options de déploiement pour la plateforme GAMR.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Déploiement Local](#déploiement-local)
- [Déploiement Azure](#déploiement-azure)
- [Configuration de Production](#configuration-de-production)
- [Monitoring et Maintenance](#monitoring-et-maintenance)
- [Dépannage](#dépannage)

## 🛠️ Prérequis

### Outils Requis
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Azure CLI** 2.40+ (pour déploiement Azure)
- **Git**
- **Node.js** 18+ (pour développement local)

### Comptes et Accès
- Compte Azure avec permissions de création de ressources
- Accès au repository Git
- Certificats SSL (pour production)

## 🏠 Déploiement Local

### Option 1: Docker Compose (Recommandé)

1. **Cloner le projet**
```bash
git clone <repository-url>
cd gamr-platform
```

2. **Configurer l'environnement**
```bash
cp .env.example .env.local
# Éditer .env.local avec vos valeurs
```

3. **Déployer avec Docker Compose**
```bash
# Production locale
docker-compose -f docker-compose.prod.yml up -d

# Développement avec hot reload
docker-compose -f docker-compose.dev.yml up -d
```

4. **Vérifier le déploiement**
```bash
curl http://localhost:3002/health
```

### Option 2: Script de Déploiement

```bash
# Rendre le script exécutable
chmod +x deployment/deploy.sh

# Déployer localement
./deployment/deploy.sh local
```

## ☁️ Déploiement Azure

### Étape 1: Configuration de l'Infrastructure

1. **Se connecter à Azure**
```bash
az login
```

2. **Configurer les variables d'environnement**
```bash
export AZURE_RESOURCE_GROUP="gamr-platform-rg"
export AZURE_LOCATION="West Europe"
export AZURE_REGISTRY_NAME="gamrplatformregistry"
export AZURE_APP_SERVICE_NAME="gamr-platform"
```

3. **Créer l'infrastructure Azure**
```bash
chmod +x deployment/azure-setup.sh
./deployment/azure-setup.sh
```

4. **Charger les credentials**
```bash
source deployment/azure-credentials.env
```

### Étape 2: Déploiement de l'Application

#### Option A: Azure App Service (Recommandé)
```bash
./deployment/deploy.sh azure-app-service
```

#### Option B: Azure Container Instances
```bash
./deployment/deploy.sh azure-aci
```

### Étape 3: Configuration Post-Déploiement

1. **Configurer le domaine personnalisé**
```bash
az webapp config hostname add \
  --webapp-name $AZURE_APP_SERVICE_NAME \
  --resource-group $AZURE_RESOURCE_GROUP \
  --hostname yourdomain.com
```

2. **Configurer SSL**
```bash
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name $AZURE_APP_SERVICE_NAME \
  --resource-group $AZURE_RESOURCE_GROUP
```

## ⚙️ Configuration de Production

### Variables d'Environnement Critiques

```bash
# Sécurité
JWT_SECRET="your-super-secure-jwt-secret"
NODE_ENV="production"

# URLs
FRONTEND_URL="https://yourdomain.com"
CORS_ORIGIN="https://yourdomain.com"

# Base de données
DATABASE_URL="file:/app/data/prod.db"
# ou pour PostgreSQL:
# DATABASE_URL="postgresql://user:pass@host:5432/gamr"
```

### Configuration SSL/TLS

1. **Obtenir un certificat SSL**
   - Let's Encrypt (gratuit)
   - Certificat commercial
   - Azure App Service Certificate

2. **Configurer nginx (si utilisé)**
```bash
# Copier les certificats
cp cert.pem nginx/ssl/
cp key.pem nginx/ssl/

# Redémarrer nginx
docker-compose restart nginx
```

### Optimisations de Performance

1. **Configuration nginx**
   - Compression gzip activée
   - Cache des assets statiques
   - Rate limiting configuré

2. **Configuration Node.js**
   - Variables d'environnement optimisées
   - Clustering (si nécessaire)
   - Memory limits appropriées

## 📊 Monitoring et Maintenance

### Health Checks

```bash
# Vérification locale
curl http://localhost:3002/health

# Vérification production
curl https://yourdomain.com/health
```

### Logs

```bash
# Docker Compose
docker-compose logs -f gamr-app

# Azure App Service
az webapp log tail --name $AZURE_APP_SERVICE_NAME --resource-group $AZURE_RESOURCE_GROUP
```

### Sauvegarde de la Base de Données

```bash
# SQLite
docker exec gamr-platform sqlite3 /app/data/prod.db ".backup /app/data/backup-$(date +%Y%m%d).db"

# Automatisation avec cron
0 2 * * * docker exec gamr-platform sqlite3 /app/data/prod.db ".backup /app/data/backup-$(date +\%Y\%m\%d).db"
```

### Mise à Jour

```bash
# Récupérer les dernières modifications
git pull origin main

# Reconstruire et redéployer
./deployment/deploy.sh local
# ou
./deployment/deploy.sh azure-app-service
```

## 🔧 Dépannage

### Problèmes Courants

#### 1. Erreur de connexion à la base de données
```bash
# Vérifier les permissions
ls -la prisma/
# Recréer la base de données
docker exec -it gamr-platform npm run db:reset
```

#### 2. Erreur de build Docker
```bash
# Nettoyer le cache Docker
docker system prune -a
# Reconstruire sans cache
docker build --no-cache -t gamr-platform .
```

#### 3. Problème de CORS
```bash
# Vérifier les variables d'environnement
docker exec gamr-platform env | grep CORS
# Redémarrer avec la bonne configuration
```

#### 4. Certificat SSL expiré
```bash
# Renouveler le certificat Let's Encrypt
certbot renew
# Redémarrer nginx
docker-compose restart nginx
```

### Commandes de Diagnostic

```bash
# État des conteneurs
docker ps -a

# Logs détaillés
docker logs gamr-platform --tail 100

# Utilisation des ressources
docker stats gamr-platform

# Test de connectivité
docker exec gamr-platform ping google.com
```

### Support et Contact

Pour obtenir de l'aide :
1. Consulter les logs d'application
2. Vérifier la documentation Azure
3. Contacter l'équipe de développement

## 📈 Estimation des Coûts

### Azure App Service (Production)
- **App Service Plan B2** : ~70€/mois
- **Azure Container Registry** : ~5€/mois
- **Application Insights** : ~10€/mois
- **Stockage** : ~5€/mois
- **Total** : ~90€/mois

### Azure Container Instances
- **2 vCPU, 4GB RAM** : ~50€/mois
- **Stockage persistant** : ~10€/mois
- **Réseau** : ~5€/mois
- **Total** : ~65€/mois

### Optimisations de Coût
- Utiliser des instances réservées (-30%)
- Arrêter les environnements de développement la nuit
- Optimiser la taille des images Docker
- Utiliser Azure Cost Management
