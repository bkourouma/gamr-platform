#!/bin/bash

# GAMR Platform Deployment Script
# This script handles the deployment of GAMR Platform to various environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="gamr-platform"
CONTAINER_NAME="gamr-platform"

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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    cd "$PROJECT_DIR"
    
    if docker build -t "$IMAGE_NAME:latest" .; then
        log_success "Docker image built successfully"
    else
        log_error "Failed to build Docker image"
        exit 1
    fi
}

# Deploy locally with Docker Compose
deploy_local() {
    log_info "Deploying locally with Docker Compose..."
    cd "$PROJECT_DIR"
    
    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Start new containers
    if docker-compose -f docker-compose.prod.yml up -d; then
        log_success "Local deployment completed"
        log_info "Application is running at http://localhost:3002"
        log_info "Health check: http://localhost:3002/health"
    else
        log_error "Local deployment failed"
        exit 1
    fi
}

# Deploy to Azure Container Instances
deploy_azure_aci() {
    log_info "Deploying to Azure Container Instances..."
    
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
    
    # Variables (should be set as environment variables)
    RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"gamr-platform-rg"}
    CONTAINER_NAME=${AZURE_CONTAINER_NAME:-"gamr-platform"}
    REGISTRY_URL=${AZURE_REGISTRY_URL:-""}
    
    if [ -z "$REGISTRY_URL" ]; then
        log_error "AZURE_REGISTRY_URL environment variable is not set"
        exit 1
    fi
    
    # Tag and push image
    log_info "Pushing image to Azure Container Registry..."
    docker tag "$IMAGE_NAME:latest" "$REGISTRY_URL/$IMAGE_NAME:latest"
    docker push "$REGISTRY_URL/$IMAGE_NAME:latest"
    
    # Deploy to ACI
    log_info "Creating Azure Container Instance..."
    az container create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$CONTAINER_NAME" \
        --image "$REGISTRY_URL/$IMAGE_NAME:latest" \
        --cpu 2 \
        --memory 4 \
        --ports 3002 \
        --environment-variables \
            NODE_ENV=production \
            PORT=3002 \
            JWT_SECRET="$JWT_SECRET" \
            FRONTEND_URL="$FRONTEND_URL" \
        --restart-policy Always
    
    log_success "Azure Container Instance deployment completed"
}

# Deploy to Azure App Service
deploy_azure_app_service() {
    log_info "Deploying to Azure App Service..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Variables
    RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"gamr-platform-rg"}
    APP_SERVICE_NAME=${AZURE_APP_SERVICE_NAME:-"gamr-platform"}
    REGISTRY_URL=${AZURE_REGISTRY_URL:-""}
    
    if [ -z "$REGISTRY_URL" ]; then
        log_error "AZURE_REGISTRY_URL environment variable is not set"
        exit 1
    fi
    
    # Tag and push image
    log_info "Pushing image to Azure Container Registry..."
    docker tag "$IMAGE_NAME:latest" "$REGISTRY_URL/$IMAGE_NAME:latest"
    docker push "$REGISTRY_URL/$IMAGE_NAME:latest"
    
    # Deploy to App Service
    log_info "Deploying to Azure App Service..."
    az webapp config container set \
        --name "$APP_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --docker-custom-image-name "$REGISTRY_URL/$IMAGE_NAME:latest"
    
    # Set environment variables
    az webapp config appsettings set \
        --resource-group "$RESOURCE_GROUP" \
        --name "$APP_SERVICE_NAME" \
        --settings \
            NODE_ENV=production \
            PORT=3002 \
            JWT_SECRET="$JWT_SECRET" \
            FRONTEND_URL="$FRONTEND_URL"
    
    log_success "Azure App Service deployment completed"
}

# Health check
health_check() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    log_info "Performing health check on $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/health" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build                 Build Docker image"
    echo "  local                 Deploy locally with Docker Compose"
    echo "  azure-aci            Deploy to Azure Container Instances"
    echo "  azure-app-service    Deploy to Azure App Service"
    echo "  health-check URL     Perform health check on deployed application"
    echo "  help                 Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  AZURE_RESOURCE_GROUP     Azure resource group name"
    echo "  AZURE_REGISTRY_URL       Azure Container Registry URL"
    echo "  AZURE_CONTAINER_NAME     Azure Container Instance name"
    echo "  AZURE_APP_SERVICE_NAME   Azure App Service name"
    echo "  JWT_SECRET              JWT secret for production"
    echo "  FRONTEND_URL            Frontend URL for CORS"
}

# Main script
main() {
    case "${1:-help}" in
        "build")
            check_docker
            build_image
            ;;
        "local")
            check_docker
            build_image
            deploy_local
            sleep 10
            health_check "http://localhost:3002"
            ;;
        "azure-aci")
            check_docker
            build_image
            deploy_azure_aci
            ;;
        "azure-app-service")
            check_docker
            build_image
            deploy_azure_app_service
            ;;
        "health-check")
            if [ -z "$2" ]; then
                log_error "URL is required for health check"
                exit 1
            fi
            health_check "$2"
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function
main "$@"
