#!/bin/bash

# Azure Infrastructure Deployment Script using ARM Templates
# This script deploys the GAMRDIGITALE Platform infrastructure using ARM templates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="$SCRIPT_DIR/arm-template.json"

# Default values
RESOURCE_GROUP=""
LOCATION="West Europe"
ENVIRONMENT="prod"
DEPLOYMENT_NAME=""

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage
show_usage() {
    echo "Usage: $0 -g RESOURCE_GROUP -e ENVIRONMENT [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  -g, --resource-group    Azure resource group name"
    echo "  -e, --environment       Environment (dev, staging, prod)"
    echo ""
    echo "Optional:"
    echo "  -l, --location          Azure location (default: West Europe)"
    echo "  -n, --deployment-name   Deployment name (default: auto-generated)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -g gamr-platform-rg -e prod"
    echo "  $0 -g gamr-platform-staging-rg -e staging -l 'East US'"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -l|--location)
                LOCATION="$2"
                shift 2
                ;;
            -n|--deployment-name)
                DEPLOYMENT_NAME="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate required parameters
    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_error "Resource group is required"
        show_usage
        exit 1
    fi

    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Environment must be one of: dev, staging, prod"
        exit 1
    fi

    # Set default deployment name if not provided
    if [[ -z "$DEPLOYMENT_NAME" ]]; then
        DEPLOYMENT_NAME="gamr-platform-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
    fi
}

# Check prerequisites
check_prerequisites() {
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi

    # Check if logged in to Azure
    if ! az account show > /dev/null 2>&1; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi

    # Check if template file exists
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "ARM template file not found: $TEMPLATE_FILE"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Create resource group if it doesn't exist
create_resource_group() {
    log_info "Checking if resource group '$RESOURCE_GROUP' exists..."
    
    if az group show --name "$RESOURCE_GROUP" > /dev/null 2>&1; then
        log_info "Resource group '$RESOURCE_GROUP' already exists"
    else
        log_info "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
        if az group create --name "$RESOURCE_GROUP" --location "$LOCATION" > /dev/null; then
            log_success "Resource group created successfully"
        else
            log_error "Failed to create resource group"
            exit 1
        fi
    fi
}

# Validate ARM template
validate_template() {
    log_info "Validating ARM template..."
    
    local parameters_file="$SCRIPT_DIR/parameters.$ENVIRONMENT.json"
    
    if [[ ! -f "$parameters_file" ]]; then
        log_error "Parameters file not found: $parameters_file"
        exit 1
    fi

    if az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "@$parameters_file" > /dev/null; then
        log_success "ARM template validation passed"
    else
        log_error "ARM template validation failed"
        exit 1
    fi
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    
    local parameters_file="$SCRIPT_DIR/parameters.$ENVIRONMENT.json"
    
    log_info "Deployment details:"
    log_info "  Resource Group: $RESOURCE_GROUP"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Location: $LOCATION"
    log_info "  Deployment Name: $DEPLOYMENT_NAME"
    log_info "  Template: $TEMPLATE_FILE"
    log_info "  Parameters: $parameters_file"
    
    if az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "@$parameters_file" \
        --output table; then
        log_success "Infrastructure deployment completed successfully"
    else
        log_error "Infrastructure deployment failed"
        exit 1
    fi
}

# Get deployment outputs
get_outputs() {
    log_info "Retrieving deployment outputs..."
    
    local outputs=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs" \
        --output json)
    
    if [[ -n "$outputs" && "$outputs" != "null" ]]; then
        echo "$outputs" > "deployment-outputs-$ENVIRONMENT.json"
        log_success "Deployment outputs saved to deployment-outputs-$ENVIRONMENT.json"
        
        # Extract key values
        local registry_url=$(echo "$outputs" | jq -r '.containerRegistryLoginServer.value // empty')
        local app_service_url=$(echo "$outputs" | jq -r '.appServiceUrl.value // empty')
        local app_service_name=$(echo "$outputs" | jq -r '.appServiceName.value // empty')
        
        echo ""
        log_success "Deployment Summary:"
        echo "  🏗️  Resource Group: $RESOURCE_GROUP"
        echo "  🌐 App Service URL: $app_service_url"
        echo "  📦 Container Registry: $registry_url"
        echo "  🎯 App Service Name: $app_service_name"
        echo ""
        
        # Create environment file for CI/CD
        cat > "azure-config-$ENVIRONMENT.env" << EOF
AZURE_RESOURCE_GROUP=$RESOURCE_GROUP
AZURE_REGISTRY_URL=$registry_url
AZURE_APP_SERVICE_NAME=$app_service_name
AZURE_APP_SERVICE_URL=$app_service_url
EOF
        log_success "Azure configuration saved to azure-config-$ENVIRONMENT.env"
    else
        log_warning "No deployment outputs found"
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    log_success "Infrastructure deployment completed! 🎉"
    echo ""
    echo "Next steps:"
    echo "  1. Configure GitHub secrets with the values from azure-config-$ENVIRONMENT.env"
    echo "  2. Push your code to trigger the CI/CD pipeline"
    echo "  3. Configure custom domain and SSL certificate if needed"
    echo "  4. Set up monitoring and alerts"
    echo ""
    echo "Useful commands:"
    echo "  # View resource group"
    echo "  az group show --name $RESOURCE_GROUP"
    echo ""
    echo "  # View deployment details"
    echo "  az deployment group show --resource-group $RESOURCE_GROUP --name $DEPLOYMENT_NAME"
    echo ""
    echo "  # View App Service logs"
    echo "  az webapp log tail --resource-group $RESOURCE_GROUP --name \$(jq -r '.appServiceName.value' deployment-outputs-$ENVIRONMENT.json)"
}

# Main execution
main() {
    log_info "Starting Azure infrastructure deployment for GAMRDIGITALE Platform"
    
    parse_args "$@"
    check_prerequisites
    create_resource_group
    validate_template
    deploy_infrastructure
    get_outputs
    show_next_steps
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
