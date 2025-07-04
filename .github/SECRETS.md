# 🔐 GitHub Secrets Configuration

Ce document détaille la configuration des secrets GitHub nécessaires pour les workflows CI/CD de la plateforme GAMR.

## 📋 Secrets Requis

### 🔑 Azure Authentication

#### `AZURE_CREDENTIALS`
Credentials pour l'authentification Azure (format JSON)

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id"
}
```

**Comment obtenir ces valeurs :**
```bash
# Créer un service principal
az ad sp create-for-rbac --name "gamr-platform-github" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth
```

### 🏗️ Infrastructure Secrets

#### `AZURE_RESOURCE_GROUP`
Nom du groupe de ressources Azure
- **Exemple :** `gamr-platform-rg`

#### `AZURE_REGISTRY_NAME`
Nom du registre de conteneurs Azure (sans .azurecr.io)
- **Exemple :** `gamrplatformregistry`

#### `AZURE_APP_SERVICE_NAME`
Nom de l'App Service Azure
- **Exemple :** `gamr-platform`

### 🔒 Application Secrets

#### `JWT_SECRET_STAGING`
Clé secrète JWT pour l'environnement de staging
- **Génération :** `openssl rand -base64 64`
- **Longueur minimale :** 32 caractères

#### `JWT_SECRET_PRODUCTION`
Clé secrète JWT pour l'environnement de production
- **Génération :** `openssl rand -base64 64`
- **Longueur minimale :** 32 caractères
- **⚠️ IMPORTANT :** Différente de staging

#### `FRONTEND_URL_STAGING`
URL du frontend pour l'environnement de staging
- **Exemple :** `https://gamr-platform-staging.azurewebsites.net`

#### `FRONTEND_URL_PRODUCTION`
URL du frontend pour l'environnement de production
- **Exemple :** `https://gamr-platform.azurewebsites.net`

### 🛡️ Security Scanning (Optionnel)

#### `SNYK_TOKEN`
Token pour les scans de sécurité Snyk
- **Obtention :** [Snyk Dashboard](https://app.snyk.io/account)

## 🔧 Configuration des Secrets

### Via l'Interface GitHub

1. Aller dans **Settings** > **Secrets and variables** > **Actions**
2. Cliquer sur **New repository secret**
3. Ajouter chaque secret avec son nom et sa valeur

### Via GitHub CLI

```bash
# Authentification
gh auth login

# Ajouter les secrets
gh secret set AZURE_CREDENTIALS --body "$(cat azure-credentials.json)"
gh secret set AZURE_RESOURCE_GROUP --body "gamr-platform-rg"
gh secret set AZURE_REGISTRY_NAME --body "gamrplatformregistry"
gh secret set AZURE_APP_SERVICE_NAME --body "gamr-platform"
gh secret set JWT_SECRET_STAGING --body "$(openssl rand -base64 64)"
gh secret set JWT_SECRET_PRODUCTION --body "$(openssl rand -base64 64)"
gh secret set FRONTEND_URL_STAGING --body "https://gamr-platform-staging.azurewebsites.net"
gh secret set FRONTEND_URL_PRODUCTION --body "https://gamr-platform.azurewebsites.net"
```

## 🌍 Environments

### Configuration des Environnements

1. Aller dans **Settings** > **Environments**
2. Créer les environnements suivants :

#### `staging`
- **Protection rules :** Aucune (déploiement automatique)
- **Secrets spécifiques :** Aucun (utilise les secrets du repository)

#### `production`
- **Protection rules :** 
  - Required reviewers (au moins 1)
  - Wait timer (optionnel, 5 minutes)
- **Secrets spécifiques :** Aucun (utilise les secrets du repository)

## 🔍 Vérification des Secrets

### Script de Vérification

```bash
#!/bin/bash
# verify-secrets.sh

echo "🔍 Vérification des secrets GitHub..."

REQUIRED_SECRETS=(
    "AZURE_CREDENTIALS"
    "AZURE_RESOURCE_GROUP"
    "AZURE_REGISTRY_NAME"
    "AZURE_APP_SERVICE_NAME"
    "JWT_SECRET_STAGING"
    "JWT_SECRET_PRODUCTION"
    "FRONTEND_URL_STAGING"
    "FRONTEND_URL_PRODUCTION"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if gh secret list | grep -q "$secret"; then
        echo "✅ $secret"
    else
        echo "❌ $secret (manquant)"
    fi
done
```

### Test des Credentials Azure

```bash
# Test de connexion Azure
az login --service-principal \
  --username "$CLIENT_ID" \
  --password "$CLIENT_SECRET" \
  --tenant "$TENANT_ID"

# Vérification des permissions
az group list --output table
```

## 🚨 Sécurité

### Bonnes Pratiques

1. **Rotation des Secrets**
   - JWT secrets : tous les 90 jours
   - Azure credentials : tous les 180 jours

2. **Principe du Moindre Privilège**
   - Service principal avec permissions minimales
   - Accès limité aux ressources nécessaires

3. **Monitoring**
   - Surveiller l'utilisation des secrets
   - Alertes en cas d'échec d'authentification

### Secrets à NE PAS Stocker

❌ **Ne jamais stocker dans le code :**
- Mots de passe
- Clés API
- Chaînes de connexion
- Certificats privés

✅ **Utiliser à la place :**
- GitHub Secrets
- Azure Key Vault
- Variables d'environnement

## 🔄 Mise à Jour des Secrets

### Rotation Automatique (Recommandé)

```yaml
# .github/workflows/rotate-secrets.yml
name: 🔄 Rotate Secrets
on:
  schedule:
    - cron: '0 2 1 */3 *'  # Tous les 3 mois
  workflow_dispatch:

jobs:
  rotate-jwt-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Generate new JWT secrets
        run: |
          NEW_STAGING_SECRET=$(openssl rand -base64 64)
          NEW_PROD_SECRET=$(openssl rand -base64 64)
          
          gh secret set JWT_SECRET_STAGING --body "$NEW_STAGING_SECRET"
          gh secret set JWT_SECRET_PRODUCTION --body "$NEW_PROD_SECRET"
```

### Rotation Manuelle

```bash
# Générer de nouveaux secrets JWT
NEW_STAGING_SECRET=$(openssl rand -base64 64)
NEW_PROD_SECRET=$(openssl rand -base64 64)

# Mettre à jour les secrets
gh secret set JWT_SECRET_STAGING --body "$NEW_STAGING_SECRET"
gh secret set JWT_SECRET_PRODUCTION --body "$NEW_PROD_SECRET"

# Redéployer les applications
gh workflow run deploy.yml --ref main
```

## 📞 Support

En cas de problème avec les secrets :

1. **Vérifier les logs des workflows**
2. **Tester les credentials localement**
3. **Consulter la documentation Azure**
4. **Contacter l'équipe DevOps**

## 📚 Ressources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Azure Service Principal](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)
- [Azure CLI Authentication](https://docs.microsoft.com/en-us/cli/azure/authenticate-azure-cli)
