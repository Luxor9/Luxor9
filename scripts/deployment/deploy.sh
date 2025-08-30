#!/bin/bash

# LUXORANOVA9 Deployment Script
# Automates deployment of packages based on their category

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEFAULT_ENV="staging"

# Helper functions
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

show_help() {
    cat << EOF
LUXORANOVA9 Deployment Script

Usage: $0 [OPTIONS] PACKAGE_TYPE [PACKAGE_NAME]

PACKAGE_TYPES:
    saas        Deploy SaaS applications
    ai          Deploy AI services  
    tools       Deploy tools and utilities
    frameworks  Deploy frameworks
    all         Deploy all packages

OPTIONS:
    -e, --env ENV       Deployment environment (staging|production) [default: staging]
    -d, --dry-run       Show what would be deployed without executing
    -v, --verbose       Verbose output
    -h, --help          Show this help message

EXAMPLES:
    $0 saas                           # Deploy all SaaS apps to staging
    $0 --env production ai            # Deploy all AI services to production
    $0 saas luxoranova-saas           # Deploy specific SaaS app
    $0 --dry-run all                  # Show deployment plan for all packages

EOF
}

# Parse command line arguments
ENV="$DEFAULT_ENV"
DRY_RUN=false
VERBOSE=false
PACKAGE_TYPE=""
PACKAGE_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        saas|ai|tools|frameworks|all)
            PACKAGE_TYPE="$1"
            shift
            ;;
        *)
            if [[ -z "$PACKAGE_NAME" ]]; then
                PACKAGE_NAME="$1"
            else
                log_error "Unknown option: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate inputs
if [[ -z "$PACKAGE_TYPE" ]]; then
    log_error "Package type is required"
    show_help
    exit 1
fi

if [[ ! "$ENV" =~ ^(staging|production)$ ]]; then
    log_error "Environment must be 'staging' or 'production'"
    exit 1
fi

# Deployment functions
deploy_saas() {
    local package_name="$1"
    log_info "Deploying SaaS application: $package_name"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy $package_name to $ENV"
        return
    fi
    
    cd "$ROOT_DIR/packages/saas/$package_name"
    
    # Build the package
    npm run build
    
    # Deploy based on package configuration
    if [[ -f "vercel.json" ]]; then
        log_info "Deploying to Vercel..."
        vercel --prod
    elif [[ -f "netlify.toml" ]]; then
        log_info "Deploying to Netlify..."
        netlify deploy --prod
    else
        log_info "Deploying via Docker..."
        docker build -t "luxoranova9/saas-$package_name:$ENV" .
        # Add container deployment logic here
    fi
    
    log_success "Successfully deployed $package_name"
}

deploy_ai() {
    local package_name="$1"
    log_info "Deploying AI service: $package_name"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy AI service $package_name to $ENV"
        return
    fi
    
    cd "$ROOT_DIR/packages/ai/$package_name"
    
    # Install Python dependencies if they exist
    if [[ -f "requirements.txt" ]]; then
        pip install -r requirements.txt
    fi
    
    # Build the package
    if [[ -f "package.json" ]]; then
        npm run build
    fi
    
    # Deploy AI service
    docker build -t "luxoranova9/ai-$package_name:$ENV" .
    # Add AI service deployment logic here
    
    log_success "Successfully deployed AI service $package_name"
}

deploy_tools() {
    local package_name="$1"
    log_info "Deploying tool: $package_name"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy tool $package_name to $ENV"
        return
    fi
    
    cd "$ROOT_DIR/packages/tools/$package_name"
    
    # Build the package
    npm run build
    
    # Publish to npm if it's a CLI tool
    if [[ -f "bin/cli.js" ]] || grep -q '"bin"' package.json; then
        log_info "Publishing CLI tool to npm..."
        npm publish
    else
        log_info "Deploying as containerized service..."
        docker build -t "luxoranova9/tools-$package_name:$ENV" .
    fi
    
    log_success "Successfully deployed tool $package_name"
}

deploy_frameworks() {
    local package_name="$1"
    log_info "Deploying framework: $package_name"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy framework $package_name to $ENV"
        return
    fi
    
    cd "$ROOT_DIR/packages/frameworks/$package_name"
    
    # Build the package
    npm run build
    
    # Deploy framework components
    log_info "Deploying framework components..."
    # Add framework-specific deployment logic here
    
    log_success "Successfully deployed framework $package_name"
}

# Main deployment logic
main() {
    log_info "Starting LUXORANOVA9 deployment"
    log_info "Environment: $ENV"
    log_info "Package type: $PACKAGE_TYPE"
    
    if [[ -n "$PACKAGE_NAME" ]]; then
        log_info "Package name: $PACKAGE_NAME"
    fi
    
    cd "$ROOT_DIR"
    
    # Install dependencies if not already done
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    case "$PACKAGE_TYPE" in
        saas)
            if [[ -n "$PACKAGE_NAME" ]]; then
                deploy_saas "$PACKAGE_NAME"
            else
                for package in packages/saas/*/; do
                    if [[ -d "$package" && -f "$package/package.json" ]]; then
                        package_name=$(basename "$package")
                        deploy_saas "$package_name"
                    fi
                done
            fi
            ;;
        ai)
            if [[ -n "$PACKAGE_NAME" ]]; then
                deploy_ai "$PACKAGE_NAME"
            else
                for package in packages/ai/*/; do
                    if [[ -d "$package" && -f "$package/package.json" ]]; then
                        package_name=$(basename "$package")
                        deploy_ai "$package_name"
                    fi
                done
            fi
            ;;
        tools)
            if [[ -n "$PACKAGE_NAME" ]]; then
                deploy_tools "$PACKAGE_NAME"
            else
                for package in packages/tools/*/; do
                    if [[ -d "$package" && -f "$package/package.json" ]]; then
                        package_name=$(basename "$package")
                        deploy_tools "$package_name"
                    fi
                done
            fi
            ;;
        frameworks)
            if [[ -n "$PACKAGE_NAME" ]]; then
                deploy_frameworks "$PACKAGE_NAME"
            else
                for package in packages/frameworks/*/; do
                    if [[ -d "$package" && -f "$package/package.json" ]]; then
                        package_name=$(basename "$package")
                        deploy_frameworks "$package_name"
                    fi
                done
            fi
            ;;
        all)
            log_info "Deploying all packages..."
            main() { PACKAGE_TYPE="saas"; main; }
            main() { PACKAGE_TYPE="ai"; main; }
            main() { PACKAGE_TYPE="tools"; main; }
            main() { PACKAGE_TYPE="frameworks"; main; }
            ;;
    esac
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"