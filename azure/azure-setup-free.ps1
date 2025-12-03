# Azure Infrastructure Setup Script for GAMRDIGITALE Platform (FREE/CHEAPEST Tiers)
# This script creates Azure resources using the cheapest possible pricing tiers

param(
    [string]$ResourceGroupName = "gamr-platform-rg",
    [string]$Location = "West Europe",
    [string]$AppServicePlan = "gamr-platform-plan",
    [string]$AppServiceName = "gamr-platform",
    [string]$ContainerRegistry = "gamrplatformregistry",
    [string]$StorageAccount = "gamrplatformstorage",
    [string]$ApplicationInsights = "gamr-platform-insights",
    [string]$Environment = "production"
)

function Write-Step {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Cost {
    param([string]$Message)
    Write-Host "[COST] $Message" -ForegroundColor Magenta
}

# Check if Azure CLI is installed
Write-Step "Verification d'Azure CLI..."
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Success "Azure CLI version $($azVersion.'azure-cli') detectee"
} catch {
    Write-Error "Azure CLI n'est pas installe. Veuillez l'installer depuis https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
}

# Check if logged in to Azure
Write-Step "Verification de la connexion Azure..."
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Success "Connecte a Azure avec le compte: $($account.user.name)"
    Write-Host "Souscription: $($account.name) ($($account.id))"
} catch {
    Write-Error "Non connecte a Azure. Executez 'az login' d'abord."
    exit 1
}

Write-Host ""
Write-Host "=== Configuration Azure ECONOMIQUE pour GAMRDIGITALE Platform ===" -ForegroundColor Cyan
Write-Cost "OPTIMISATION DES COUTS - Utilisation des tiers les moins chers"
Write-Host "Configuration:"
Write-Host "   Resource Group: $ResourceGroupName"
Write-Host "   Location: $Location"
Write-Host "   App Service: $AppServiceName (FREE F1)"
Write-Host "   Container Registry: $ContainerRegistry (Basic - 5$/mois)"
Write-Host "   Storage: $StorageAccount (Standard_LRS - ~1$/mois)"
Write-Host "   Environment: $Environment"
Write-Host ""

# Create Resource Group
Write-Step "Creation du groupe de ressources..."
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "true") {
    Write-Warning "Le groupe de ressources '$ResourceGroupName' existe deja"
} else {
    az group create --name $ResourceGroupName --location $Location --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Groupe de ressources cree: $ResourceGroupName"
        Write-Cost "Cout: GRATUIT"
    } else {
        Write-Error "Echec de la creation du groupe de ressources"
        exit 1
    }
}

# Create Container Registry (Basic tier - cheapest paid option)
Write-Step "Creation du registre de conteneurs (Basic - 5$/mois)..."
az acr show --name $ContainerRegistry --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le registre '$ContainerRegistry' existe deja"
} else {
    az acr create --resource-group $ResourceGroupName --name $ContainerRegistry --sku Basic --admin-enabled true --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Registre de conteneurs cree: $ContainerRegistry"
        Write-Cost "Cout: ~5 USD/mois (Basic tier - le moins cher disponible)"
    } else {
        Write-Error "Echec de la creation du registre de conteneurs"
        exit 1
    }
}

# Create Storage Account (Standard_LRS - cheapest option)
Write-Step "Creation du compte de stockage (Standard_LRS - le moins cher)..."
az storage account show --name $StorageAccount --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le compte de stockage '$StorageAccount' existe deja"
} else {
    az storage account create --name $StorageAccount --resource-group $ResourceGroupName --location $Location --sku Standard_LRS --kind StorageV2 --access-tier Hot --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Compte de stockage cree: $StorageAccount"
        Write-Cost "Cout: ~1-2 USD/mois (selon utilisation, tier le moins cher)"
    } else {
        Write-Error "Echec de la creation du compte de stockage"
        exit 1
    }
}

# Create App Service Plan (FREE F1 tier)
Write-Step "Creation du plan App Service (FREE F1 - GRATUIT!)..."
az appservice plan show --name $AppServicePlan --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le plan App Service '$AppServicePlan' existe deja"
} else {
    # Try F1 (Free) first, fallback to B1 if needed
    Write-Step "Tentative avec le tier GRATUIT F1..."
    az appservice plan create --name $AppServicePlan --resource-group $ResourceGroupName --sku F1 --is-linux --output table 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Plan App Service cree: $AppServicePlan (FREE F1)"
        Write-Cost "Cout: GRATUIT! (F1 Free tier)"
        Write-Warning "Limitations F1: 60 min CPU/jour, 1GB RAM, pas de custom domains"
    } else {
        Write-Warning "F1 non disponible, utilisation de B1 (Basic)..."
        az appservice plan create --name $AppServicePlan --resource-group $ResourceGroupName --sku B1 --is-linux --output table
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Plan App Service cree: $AppServicePlan (B1 Basic)"
            Write-Cost "Cout: ~13 USD/mois (B1 Basic - le moins cher payant)"
        } else {
            Write-Error "Echec de la creation du plan App Service"
            exit 1
        }
    }
}

# Create Web App
Write-Step "Creation de l'application web..."
az webapp show --name $AppServiceName --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "L'application web '$AppServiceName' existe deja"
} else {
    az webapp create --resource-group $ResourceGroupName --plan $AppServicePlan --name $AppServiceName --deployment-container-image-name "nginx:latest" --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application web creee: $AppServiceName"
        Write-Cost "Cout: Inclus dans le plan App Service"
    } else {
        Write-Error "Echec de la creation de l'application web"
        exit 1
    }
}

# Try to create Application Insights (Free tier)
Write-Step "Creation d'Application Insights (Free tier - 5GB/mois gratuit)..."
az monitor app-insights component show --app $ApplicationInsights --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Application Insights '$ApplicationInsights' existe deja"
} else {
    az monitor app-insights component create --app $ApplicationInsights --location $Location --resource-group $ResourceGroupName --kind web --output table 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application Insights cree: $ApplicationInsights"
        Write-Cost "Cout: GRATUIT jusqu'a 5GB/mois de telemetrie"
    } else {
        Write-Warning "Impossible de creer Application Insights automatiquement"
        Write-Warning "Vous pouvez le creer manuellement dans le portail Azure (Free tier disponible)"
        $ApplicationInsights = $null
    }
}

# Get connection strings and keys
Write-Step "Recuperation des informations de connexion..."

# Container Registry credentials
$acrCredentials = az acr credential show --name $ContainerRegistry --output json | ConvertFrom-Json
$acrLoginServer = az acr show --name $ContainerRegistry --resource-group $ResourceGroupName --query "loginServer" --output tsv

# Application Insights connection string (if available)
if ($ApplicationInsights) {
    $aiConnectionString = az monitor app-insights component show --app $ApplicationInsights --resource-group $ResourceGroupName --query "connectionString" --output tsv 2>$null
    if ($LASTEXITCODE -ne 0) {
        $aiConnectionString = ""
        Write-Warning "Impossible de recuperer la chaine de connexion Application Insights"
    }
} else {
    $aiConnectionString = ""
}

# Storage account connection string
$storageConnectionString = az storage account show-connection-string --name $StorageAccount --resource-group $ResourceGroupName --output tsv

# Configure Web App settings
Write-Step "Configuration des parametres de l'application..."
$appSettings = @(
    "NODE_ENV=$Environment",
    "PORT=80",
    "WEBSITES_PORT=80",
    "DOCKER_REGISTRY_SERVER_URL=https://$acrLoginServer",
    "DOCKER_REGISTRY_SERVER_USERNAME=$($acrCredentials.username)",
    "DOCKER_REGISTRY_SERVER_PASSWORD=$($acrCredentials.passwords[0].value)",
    "AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString",
    "FRONTEND_URL=https://$AppServiceName.azurewebsites.net"
)

# Add Application Insights if available
if ($aiConnectionString -and $aiConnectionString -ne "") {
    $appSettings += "APPLICATIONINSIGHTS_CONNECTION_STRING=$aiConnectionString"
}

foreach ($setting in $appSettings) {
    az webapp config appsettings set --resource-group $ResourceGroupName --name $AppServiceName --settings $setting --output none
}

Write-Success "Parametres de l'application configures"

# Create output files
Write-Step "Creation des fichiers de configuration..."

# Cost estimation
$estimatedCost = @"
# ESTIMATION DES COUTS MENSUELS - GAMRDIGITALE Platform

## Ressources et couts:

1. Resource Group: GRATUIT
2. Container Registry (Basic): ~5 USD/mois
3. Storage Account (Standard_LRS): ~1-2 USD/mois (selon utilisation)
4. App Service Plan:
   - F1 (Free): GRATUIT (si disponible)
   - B1 (Basic): ~13 USD/mois (si F1 non disponible)
5. Application Insights: GRATUIT (jusqu'a 5GB/mois)

## COUT TOTAL ESTIME:
- Scenario optimal (F1): ~6-7 USD/mois
- Scenario standard (B1): ~19-20 USD/mois

## Optimisations possibles:
- Utiliser SQLite au lieu d'Azure SQL (inclus)
- Limiter les logs Application Insights
- Optimiser le stockage (supprimer anciens fichiers)
- Utiliser le cache pour reduire les requetes

## Alertes de cout recommandees:
- Configurer une alerte a 10 USD/mois
- Surveiller l'utilisation du stockage
- Monitorer les logs Application Insights

Genere le: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$estimatedCost | Out-File -FilePath "cost-estimation.txt" -Encoding UTF8

# Azure config file
$configContent = @"
# Configuration Azure pour GAMRDIGITALE Platform (OPTIMISEE COUTS)
# Genere le $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

RESOURCE_GROUP=$ResourceGroupName
LOCATION=$Location
APP_SERVICE_NAME=$AppServiceName
CONTAINER_REGISTRY=$ContainerRegistry
STORAGE_ACCOUNT=$StorageAccount
APPLICATION_INSIGHTS=$ApplicationInsights

# URLs et endpoints
APP_URL=https://$AppServiceName.azurewebsites.net
CONTAINER_REGISTRY_URL=$acrLoginServer

# Secrets pour GitHub
AZURE_REGISTRY_NAME=$ContainerRegistry
AZURE_APP_SERVICE_NAME=$AppServiceName
AZURE_RESOURCE_GROUP=$ResourceGroupName

# Connection strings
APPLICATIONINSIGHTS_CONNECTION_STRING=$aiConnectionString
AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString

# Container Registry
ACR_USERNAME=$($acrCredentials.username)
ACR_PASSWORD=$($acrCredentials.passwords[0].value)

# Cost optimization settings
COST_OPTIMIZED=true
TIER_APP_SERVICE=F1_OR_B1
TIER_STORAGE=Standard_LRS
TIER_REGISTRY=Basic
"@

$configContent | Out-File -FilePath "azure-config.env" -Encoding UTF8
Write-Success "Configuration sauvegardee dans azure-config.env"
Write-Success "Estimation des couts sauvegardee dans cost-estimation.txt"

# Summary with cost information
Write-Host ""
Write-Host "=== Configuration Azure ECONOMIQUE terminee! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ressources creees (OPTIMISEES COUTS):"
Write-Host "   - Resource Group: $ResourceGroupName" -ForegroundColor Green
Write-Host "   - Container Registry: $ContainerRegistry (Basic ~5$/mois)" -ForegroundColor Green
Write-Host "   - Storage Account: $StorageAccount (Standard_LRS ~1-2$/mois)" -ForegroundColor Green

# Check which App Service tier was used
$planInfo = az appservice plan show --name $AppServicePlan --resource-group $ResourceGroupName --query "sku.name" --output tsv 2>$null
if ($planInfo -eq "F1") {
    Write-Host "   - App Service Plan: $AppServicePlan (F1 FREE!)" -ForegroundColor Green
    Write-Cost "COUT TOTAL ESTIME: ~6-7 USD/mois"
} else {
    Write-Host "   - App Service Plan: $AppServicePlan (B1 Basic ~13$/mois)" -ForegroundColor Yellow
    Write-Cost "COUT TOTAL ESTIME: ~19-20 USD/mois"
}

if ($ApplicationInsights) {
    Write-Host "   - Application Insights: $ApplicationInsights (Free tier)" -ForegroundColor Green
} else {
    Write-Host "   - Application Insights: A creer manuellement (Free tier)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "URL de l'application: https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""
Write-Cost "OPTIMISATIONS APPLIQUEES:"
Write-Cost "- Tier le moins cher pour chaque service"
Write-Cost "- Free tier utilise quand possible"
Write-Cost "- Configuration optimisee pour reduire les couts"
Write-Host ""
Write-Host "Consultez 'cost-estimation.txt' pour les details des couts" -ForegroundColor Magenta
Write-Host ""
Write-Host "Votre infrastructure Azure est prete pour le deploiement!" -ForegroundColor Green
