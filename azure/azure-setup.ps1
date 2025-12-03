# Azure Infrastructure Setup Script for GAMRDIGITALE Platform (PowerShell)
# This script creates all necessary Azure resources for the GAMRDIGITALE platform

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

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

# Check if Azure CLI is installed
Write-Step "Vérification d'Azure CLI..."
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Success "Azure CLI version $($azVersion.'azure-cli') détectée"
} catch {
    Write-Error "Azure CLI n'est pas installé. Veuillez l'installer depuis https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
}

# Check if logged in to Azure
Write-Step "Vérification de la connexion Azure..."
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Success "Connecté à Azure avec le compte: $($account.user.name)"
    Write-Host "Souscription: $($account.name) ($($account.id))"
} catch {
    Write-Error "Non connecté à Azure. Exécutez 'az login' d'abord."
    exit 1
}

Write-ColorOutput "`n🚀 Démarrage de la configuration Azure pour GAMRDIGITALE Platform" $Blue
Write-Host "📋 Configuration:"
Write-Host "   Resource Group: $ResourceGroupName"
Write-Host "   Location: $Location"
Write-Host "   App Service: $AppServiceName"
Write-Host "   Container Registry: $ContainerRegistry"
Write-Host "   Environment: $Environment"
Write-Host ""

# Create Resource Group
Write-Step "Création du groupe de ressources..."
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "true") {
    Write-Warning "Le groupe de ressources '$ResourceGroupName' existe déjà"
} else {
    az group create --name $ResourceGroupName --location $Location --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Groupe de ressources créé: $ResourceGroupName"
    } else {
        Write-Error "Échec de la création du groupe de ressources"
        exit 1
    }
}

# Create Container Registry
Write-Step "Création du registre de conteneurs..."
$acrExists = az acr show --name $ContainerRegistry --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le registre '$ContainerRegistry' existe déjà"
} else {
    az acr create --resource-group $ResourceGroupName --name $ContainerRegistry --sku Basic --admin-enabled true --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Registre de conteneurs créé: $ContainerRegistry"
    } else {
        Write-Error "Échec de la création du registre de conteneurs"
        exit 1
    }
}

# Create Storage Account
Write-Step "Création du compte de stockage..."
$storageExists = az storage account show --name $StorageAccount --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le compte de stockage '$StorageAccount' existe déjà"
} else {
    az storage account create --name $StorageAccount --resource-group $ResourceGroupName --location $Location --sku Standard_LRS --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Compte de stockage créé: $StorageAccount"
    } else {
        Write-Error "Échec de la création du compte de stockage"
        exit 1
    }
}

# Create Application Insights
Write-Step "Création d'Application Insights..."
$aiExists = az monitor app-insights component show --app $ApplicationInsights --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Application Insights '$ApplicationInsights' existe déjà"
} else {
    # Try to install/update the application-insights extension first
    Write-Step "Installation de l'extension Application Insights..."
    try {
        az extension add --name application-insights --upgrade --output none 2>$null
        Write-Success "Extension Application Insights installée"
    } catch {
        Write-Warning "Impossible d'installer l'extension automatiquement"
    }

    # Try creating Application Insights
    az monitor app-insights component create --app $ApplicationInsights --location $Location --resource-group $ResourceGroupName --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application Insights créé: $ApplicationInsights"
    } else {
        Write-Warning "Échec de la création d'Application Insights - continuons sans monitoring pour l'instant"
        Write-Host "Vous pouvez créer Application Insights manuellement dans le portail Azure plus tard."
        $ApplicationInsights = $null
    }
}

# Create App Service Plan
Write-Step "Création du plan App Service..."
$planExists = az appservice plan show --name $AppServicePlan --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "Le plan App Service '$AppServicePlan' existe déjà"
} else {
    az appservice plan create --name $AppServicePlan --resource-group $ResourceGroupName --sku B1 --is-linux --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Plan App Service créé: $AppServicePlan"
    } else {
        Write-Error "Échec de la création du plan App Service"
        exit 1
    }
}

# Create Web App
Write-Step "Création de l'application web..."
$appExists = az webapp show --name $AppServiceName --resource-group $ResourceGroupName --output none 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Warning "L'application web '$AppServiceName' existe déjà"
} else {
    az webapp create --resource-group $ResourceGroupName --plan $AppServicePlan --name $AppServiceName --deployment-container-image-name "nginx:latest" --output table
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application web créée: $AppServiceName"
    } else {
        Write-Error "Échec de la création de l'application web"
        exit 1
    }
}

# Get connection strings and keys
Write-Step "Récupération des informations de connexion..."

# Container Registry credentials
$acrCredentials = az acr credential show --name $ContainerRegistry --output json | ConvertFrom-Json
$acrLoginServer = az acr show --name $ContainerRegistry --resource-group $ResourceGroupName --query "loginServer" --output tsv

# Application Insights connection string
if ($ApplicationInsights) {
    $aiConnectionString = az monitor app-insights component show --app $ApplicationInsights --resource-group $ResourceGroupName --query "connectionString" --output tsv
} else {
    $aiConnectionString = ""
    Write-Warning "Application Insights non configuré - monitoring désactivé"
}

# Storage account connection string
$storageConnectionString = az storage account show-connection-string --name $StorageAccount --resource-group $ResourceGroupName --output tsv

# Configure Web App settings
Write-Step "Configuration des paramètres de l'application..."
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

# Add Application Insights connection string if available
if ($aiConnectionString -and $aiConnectionString -ne "") {
    $appSettings += "APPLICATIONINSIGHTS_CONNECTION_STRING=$aiConnectionString"
}

foreach ($setting in $appSettings) {
    az webapp config appsettings set --resource-group $ResourceGroupName --name $AppServiceName --settings $setting --output none
}

Write-Success "Paramètres de l'application configurés"

# Create output file with connection information
Write-Step "Création du fichier de configuration..."
$configFile = @"
# Configuration Azure pour GAMRDIGITALE Platform
# Généré le $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

RESOURCE_GROUP=$ResourceGroupName
LOCATION=$Location
APP_SERVICE_NAME=$AppServiceName
CONTAINER_REGISTRY=$ContainerRegistry
STORAGE_ACCOUNT=$StorageAccount
APPLICATION_INSIGHTS=$ApplicationInsights

# URLs et endpoints
APP_URL=https://$AppServiceName.azurewebsites.net
CONTAINER_REGISTRY_URL=$acrLoginServer

# Secrets (à configurer dans GitHub)
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

$configFile | Out-File -FilePath "azure-config.env" -Encoding UTF8
Write-Success "Configuration sauvegardée dans azure-config.env"

# Create GitHub secrets file
Write-Step "Création du fichier de secrets GitHub..."
$secretsFile = @"
# Secrets à configurer dans GitHub
# Exécutez ces commandes pour configurer les secrets:

gh secret set AZURE_RESOURCE_GROUP --body "$ResourceGroupName"
gh secret set AZURE_REGISTRY_NAME --body "$ContainerRegistry"
gh secret set AZURE_APP_SERVICE_NAME --body "$AppServiceName"

# Note: AZURE_CREDENTIALS doit être configuré manuellement avec les credentials du service principal
"@

$secretsFile | Out-File -FilePath "github-secrets.txt" -Encoding UTF8
Write-Success "Instructions pour les secrets GitHub sauvegardées dans github-secrets.txt"

# Summary
Write-ColorOutput "`n🎉 Configuration Azure terminée avec succès!" $Green
Write-Host ""
Write-Host "📋 Ressources créées:"
Write-Host "   ✅ Resource Group: $ResourceGroupName"
Write-Host "   ✅ Container Registry: $ContainerRegistry"
Write-Host "   ✅ Storage Account: $StorageAccount"
Write-Host "   ✅ Application Insights: $ApplicationInsights"
Write-Host "   ✅ App Service Plan: $AppServicePlan"
Write-Host "   ✅ Web App: $AppServiceName"
Write-Host ""
Write-Host "🌐 URL de l'application: https://$AppServiceName.azurewebsites.net"
Write-Host ""
Write-Host "📝 Prochaines étapes:"
Write-Host "   1. Configurez les secrets GitHub (voir github-secrets.txt)"
Write-Host "   2. Créez un service principal Azure pour GitHub Actions:"
Write-Host "      az ad sp create-for-rbac --name 'gamr-platform-github' --role contributor --scopes /subscriptions/$(az account show --query id --output tsv) --sdk-auth"
Write-Host "   3. Ajoutez le résultat comme secret AZURE_CREDENTIALS dans GitHub"
Write-Host "   4. Poussez votre code vers GitHub pour déclencher le déploiement"
Write-Host ""
Write-ColorOutput "🚀 Votre infrastructure Azure est prête pour le déploiement!" $Green
