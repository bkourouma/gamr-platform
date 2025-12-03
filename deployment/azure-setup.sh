#!/bin/bash

# Azure Infrastructure Setup Script for GAMRDIGITALE Platform
# This script creates the necessary Azure resources for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"gamr-platform-rg"}
LOCATION=${AZURE_LOCATION:-"West Europe"}
REGISTRY_NAME=${AZURE_REGISTRY_NAME:-"gamrplatformregistry"}
APP_SERVICE_PLAN=${AZURE_APP_SERVICE_PLAN:-"gamr-platform-plan"}
APP_SERVICE_NAME=${AZURE_APP_SERVICE_NAME:-"gamr-platform"}
STORAGE_ACCOUNT=${AZURE_STORAGE_ACCOUNT:-"gamrplatformstorage"}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Azure CLI
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! az account show > /dev/null 2>&1; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    log_success "Azure CLI is ready"
}

# Create Resource Group
create_resource_group() {
    log_info "Creating resource group: $RESOURCE_GROUP"
    
    if az group create --name "$RESOURCE_GROUP" --location "$LOCATION" > /dev/null; then
        log_success "Resource group created successfully"
    else
        log_error "Failed to create resource group"
        exit 1
    fi
}

# Create Azure Container Registry
create_container_registry() {
    log_info "Creating Azure Container Registry: $REGISTRY_NAME"
    
    if az acr create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$REGISTRY_NAME" \
        --sku Basic \
        --admin-enabled true > /dev/null; then
        log_success "Container Registry created successfully"
        
        # Get registry credentials
        REGISTRY_URL=$(az acr show --name "$REGISTRY_NAME" --resource-group "$RESOURCE_GROUP" --query "loginServer" --output tsv)
        REGISTRY_USERNAME=$(az acr credential show --name "$REGISTRY_NAME" --resource-group "$RESOURCE_GROUP" --query "username" --output tsv)
        REGISTRY_PASSWORD=$(az acr credential show --name "$REGISTRY_NAME" --resource-group "$RESOURCE_GROUP" --query "passwords[0].value" --output tsv)
        
        log_info "Registry URL: $REGISTRY_URL"
        log_info "Registry Username: $REGISTRY_USERNAME"
        log_info "Registry Password: [HIDDEN]"
        
        # Save credentials to file
        cat > azure-credentials.env << EOF
AZURE_REGISTRY_URL=$REGISTRY_URL
AZURE_REGISTRY_USERNAME=$REGISTRY_USERNAME
AZURE_REGISTRY_PASSWORD=$REGISTRY_PASSWORD
EOF
        log_success "Credentials saved to azure-credentials.env"
    else
        log_error "Failed to create Container Registry"
        exit 1
    fi
}

# Create App Service Plan
create_app_service_plan() {
    log_info "Creating App Service Plan: $APP_SERVICE_PLAN"
    
    if az appservice plan create \
        --name "$APP_SERVICE_PLAN" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku B2 \
        --is-linux > /dev/null; then
        log_success "App Service Plan created successfully"
    else
        log_error "Failed to create App Service Plan"
        exit 1
    fi
}

# Create App Service
create_app_service() {
    log_info "Creating App Service: $APP_SERVICE_NAME"
    
    if az webapp create \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$APP_SERVICE_PLAN" \
        --name "$APP_SERVICE_NAME" \
        --deployment-container-image-name "nginx:latest" > /dev/null; then
        log_success "App Service created successfully"
        
        # Configure container settings
        az webapp config container set \
            --name "$APP_SERVICE_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --docker-registry-server-url "https://$REGISTRY_URL" \
            --docker-registry-server-user "$REGISTRY_USERNAME" \
            --docker-registry-server-password "$REGISTRY_PASSWORD"
        
        # Configure app settings
        az webapp config appsettings set \
            --resource-group "$RESOURCE_GROUP" \
            --name "$APP_SERVICE_NAME" \
            --settings \
                WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
                WEBSITES_PORT=3002 \
                NODE_ENV=production
        
        APP_URL=$(az webapp show --name "$APP_SERVICE_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostName" --output tsv)
        log_success "App Service URL: https://$APP_URL"
    else
        log_error "Failed to create App Service"
        exit 1
    fi
}

# Create Storage Account for file shares
create_storage_account() {
    log_info "Creating Storage Account: $STORAGE_ACCOUNT"
    
    if az storage account create \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard_LRS > /dev/null; then
        log_success "Storage Account created successfully"
        
        # Create file share for database persistence
        STORAGE_KEY=$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$STORAGE_ACCOUNT" --query "[0].value" --output tsv)
        
        az storage share create \
            --name "gamr-data" \
            --account-name "$STORAGE_ACCOUNT" \
            --account-key "$STORAGE_KEY" > /dev/null
        
        log_success "File share 'gamr-data' created for database persistence"
    else
        log_error "Failed to create Storage Account"
        exit 1
    fi
}

# Setup Application Insights
create_application_insights() {
    log_info "Creating Application Insights for monitoring"
    
    # Install Application Insights extension if not already installed
    az extension add --name application-insights 2>/dev/null || true
    
    if az monitor app-insights component create \
        --app "gamr-platform-insights" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" > /dev/null; then
        
        INSIGHTS_KEY=$(az monitor app-insights component show \
            --app "gamr-platform-insights" \
            --resource-group "$RESOURCE_GROUP" \
            --query "instrumentationKey" \
            --output tsv)
        
        log_success "Application Insights created"
        log_info "Instrumentation Key: $INSIGHTS_KEY"
        
        # Add to credentials file
        echo "APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=$INSIGHTS_KEY" >> azure-credentials.env
    else
        log_warning "Failed to create Application Insights (optional)"
    fi
}

# Show summary
show_summary() {
    log_success "Azure infrastructure setup completed!"
    echo ""
    echo "Created resources:"
    echo "  - Resource Group: $RESOURCE_GROUP"
    echo "  - Container Registry: $REGISTRY_NAME"
    echo "  - App Service Plan: $APP_SERVICE_PLAN"
    echo "  - App Service: $APP_SERVICE_NAME"
    echo "  - Storage Account: $STORAGE_ACCOUNT"
    echo ""
    echo "Next steps:"
    echo "  1. Source the credentials: source azure-credentials.env"
    echo "  2. Deploy the application: ./deploy.sh azure-app-service"
    echo "  3. Configure custom domain and SSL if needed"
    echo ""
    echo "Estimated monthly cost: €70-120 (depending on usage)"
}

# Main execution
main() {
    log_info "Starting Azure infrastructure setup for GAMRDIGITALE Platform"
    
    check_azure_cli
    create_resource_group
    create_container_registry
    create_app_service_plan
    create_app_service
    create_storage_account
    create_application_insights
    show_summary
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
