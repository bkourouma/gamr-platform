# Azure Infrastructure Setup Script for GAMR Platform (PowerShell - Simple Version)
# This script creates all necessary Azure resources for the GAMR platform

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
Write-Host "=== Demarrage de la configuration Azure pour GAMR Platform ===" -ForegroundColor Cyan
Write-Host "Configuration:"
Write-Host "   Resource Group: $ResourceGroupName"
Write-Host "   Location: $Location"
Write-Host "   App Service: $AppServiceName"
Write-Host "   Container Registry: $ContainerRegistry"
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
    } else {
        Write-Error "Echec de la creation du groupe de ressources"
        exit 1
    }
}

# Create Container Registry
Write-Step "Creation du registre de conteneurs..."
az acr show --name $ContainerRegistry --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le registre '$ContainerRegistry' existe deja"
} else {
    az acr create --resource-group $ResourceGroupName --name $ContainerRegistry --sku Basic --admin-enabled true --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Registre de conteneurs cree: $ContainerRegistry"
    } else {
        Write-Error "Echec de la creation du registre de conteneurs"
        exit 1
    }
}

# Create Storage Account
Write-Step "Creation du compte de stockage..."
az storage account show --name $StorageAccount --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le compte de stockage '$StorageAccount' existe deja"
} else {
    az storage account create --name $StorageAccount --resource-group $ResourceGroupName --location $Location --sku Standard_LRS --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Compte de stockage cree: $StorageAccount"
    } else {
        Write-Error "Echec de la creation du compte de stockage"
        exit 1
    }
}

# Create App Service Plan
Write-Step "Creation du plan App Service..."
az appservice plan show --name $AppServicePlan --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le plan App Service '$AppServicePlan' existe deja"
} else {
    az appservice plan create --name $AppServicePlan --resource-group $ResourceGroupName --sku B1 --is-linux --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Plan App Service cree: $AppServicePlan"
    } else {
        Write-Error "Echec de la creation du plan App Service"
        exit 1
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
    } else {
        Write-Error "Echec de la creation de l'application web"
        exit 1
    }
}

# Try to create Application Insights (optional)
Write-Step "Tentative de creation d'Application Insights..."
az monitor app-insights component show --app $ApplicationInsights --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Application Insights '$ApplicationInsights' existe deja"
} else {
    # Try to create Application Insights
    az monitor app-insights component create --app $ApplicationInsights --location $Location --resource-group $ResourceGroupName --output table 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application Insights cree: $ApplicationInsights"
    } else {
        Write-Warning "Impossible de creer Application Insights automatiquement"
        Write-Warning "Vous pouvez le creer manuellement dans le portail Azure"
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

# Azure config file
$configContent = @"
# Configuration Azure pour GAMR Platform
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
"@

$configContent | Out-File -FilePath "azure-config.env" -Encoding UTF8
Write-Success "Configuration sauvegardee dans azure-config.env"

# GitHub secrets instructions
$secretsContent = @"
# Instructions pour configurer les secrets GitHub

# 1. Executez ces commandes pour configurer les secrets de base:
gh secret set AZURE_RESOURCE_GROUP --body "$ResourceGroupName"
gh secret set AZURE_REGISTRY_NAME --body "$ContainerRegistry"
gh secret set AZURE_APP_SERVICE_NAME --body "$AppServiceName"

# 2. Creez un service principal Azure:
az ad sp create-for-rbac --name "gamr-platform-github" --role contributor --scopes /subscriptions/$($account.id) --sdk-auth

# 3. Copiez le resultat JSON et ajoutez-le comme secret AZURE_CREDENTIALS:
gh secret set AZURE_CREDENTIALS --body "PASTE_JSON_HERE"

# 4. Ajoutez les secrets JWT:
gh secret set JWT_SECRET_STAGING --body "$(openssl rand -base64 64)"
gh secret set JWT_SECRET_PRODUCTION --body "$(openssl rand -base64 64)"

# 5. Configurez les URLs frontend:
gh secret set FRONTEND_URL_STAGING --body "https://$AppServiceName-staging.azurewebsites.net"
gh secret set FRONTEND_URL_PRODUCTION --body "https://$AppServiceName.azurewebsites.net"
"@

$secretsContent | Out-File -FilePath "github-secrets-instructions.txt" -Encoding UTF8
Write-Success "Instructions GitHub sauvegardees dans github-secrets-instructions.txt"

# Summary
Write-Host ""
Write-Host "=== Configuration Azure terminee avec succes! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ressources creees:"
Write-Host "   - Resource Group: $ResourceGroupName" -ForegroundColor Green
Write-Host "   - Container Registry: $ContainerRegistry" -ForegroundColor Green
Write-Host "   - Storage Account: $StorageAccount" -ForegroundColor Green
Write-Host "   - App Service Plan: $AppServicePlan" -ForegroundColor Green
Write-Host "   - Web App: $AppServiceName" -ForegroundColor Green
if ($ApplicationInsights) {
    Write-Host "   - Application Insights: $ApplicationInsights" -ForegroundColor Green
} else {
    Write-Host "   - Application Insights: A creer manuellement" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "URL de l'application: https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes:"
Write-Host "1. Consultez le fichier 'github-secrets-instructions.txt'"
Write-Host "2. Configurez les secrets GitHub"
Write-Host "3. Poussez votre code vers GitHub pour declencher le deploiement"
Write-Host ""
Write-Host "Votre infrastructure Azure est prete pour le deploiement!" -ForegroundColor Green
