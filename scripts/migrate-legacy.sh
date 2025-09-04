#!/bin/bash

# LUXORANOVA9 Legacy Migration Script
# This script helps migrate legacy project directories to the new monorepo structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LEGACY_ROOT="${LEGACY_ROOT:-/path/to/legacy/project}"
MONOREPO_ROOT="${MONOREPO_ROOT:-$(pwd)}"

echo -e "${BLUE}LUXORANOVA9 Legacy Migration Script${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Check if we're in the monorepo root
if [[ ! -f "package.json" ]] || [[ ! -d "packages" ]]; then
    echo -e "${RED}Error: This script must be run from the monorepo root directory${NC}"
    exit 1
fi

# Check if legacy directory exists
if [[ ! -d "$LEGACY_ROOT" ]]; then
    echo -e "${RED}Error: Legacy directory not found: $LEGACY_ROOT${NC}"
    echo -e "${YELLOW}Please set LEGACY_ROOT environment variable or update the script${NC}"
    exit 1
fi

echo -e "${GREEN}Monorepo root: $MONOREPO_ROOT${NC}"
echo -e "${GREEN}Legacy root: $LEGACY_ROOT${NC}"
echo ""

# Migration mapping function
migrate_directory() {
    local legacy_path="$1"
    local new_path="$2"
    local description="$3"
    
    if [[ -d "$LEGACY_ROOT/$legacy_path" ]]; then
        echo -e "${BLUE}Migrating: $legacy_path → $new_path${NC}"
        echo -e "${YELLOW}Description: $description${NC}"
        
        # Create target directory
        mkdir -p "$(dirname "$MONOREPO_ROOT/$new_path")"
        
        # Ask for confirmation
        read -p "Proceed with migration? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            cp -r "$LEGACY_ROOT/$legacy_path" "$MONOREPO_ROOT/$new_path"
            echo -e "${GREEN}✓ Migrated successfully${NC}"
        else
            echo -e "${YELLOW}⚠ Skipped${NC}"
        fi
        echo ""
    else
        echo -e "${YELLOW}⚠ Legacy directory not found: $legacy_path${NC}"
    fi
}

# Display migration plan
echo -e "${BLUE}Migration Plan:${NC}"
echo -e "${BLUE}==============${NC}"
echo ""

# AI & Machine Learning migrations
echo -e "${GREEN}AI & Machine Learning Components:${NC}"
migrate_directory "agents" "packages/ai/agents" "AI agent implementations"
migrate_directory "doraemonai" "packages/ai/doraemon-ai" "Doraemon AI system"
migrate_directory "LUXORANOVA BRAIN" "packages/ai/luxoranova-brain" "Core AI brain system"
migrate_directory "neura-ai-saas-factory" "packages/ai/neura-ai-saas-factory" "AI SaaS factory"
migrate_directory "models" "packages/ai/models" "AI model artifacts"
migrate_directory "PraisonAI-2.2.51" "packages/ai/praison-ai" "PraisonAI integration"
migrate_directory "log_intel" "packages/ai/log-intelligence" "Log analysis AI"
migrate_directory "D A N C A N" "packages/ai/dancan" "DANCAN AI system"
migrate_directory "Fairies" "packages/ai/fairies" "Fairies AI agents"

# SaaS Applications migrations
echo -e "${GREEN}SaaS Applications:${NC}"
migrate_directory "apps" "packages/saas/apps" "SaaS applications"
migrate_directory "backend" "packages/saas/backend" "Backend services"
migrate_directory "Full Web App Stack with Agentic Workflows and Monetization" "packages/saas/agentic-web-stack" "Full stack agentic web app"
migrate_directory "jeecg-boot" "packages/saas/jeecg-boot" "JeecG Boot framework"
migrate_directory "luxora" "packages/saas/luxora" "Luxora SaaS platform"

# Tools migrations
echo -e "${GREEN}Development Tools:${NC}"
migrate_directory "7_Tools_and_Installers" "packages/tools/installers" "Installation tools"
migrate_directory "lux_runner" "packages/tools/lux-runner" "Lux execution runner"
migrate_directory "2_Scripts" "packages/tools/scripts" "Utility scripts"
migrate_directory "EmpireScan-20250613-0729" "packages/tools/empire-scan" "Empire scanning tool"
migrate_directory "searxng" "packages/tools/searxng" "Search engine tool"
migrate_directory "testcontainers-desktop_darwin_universal" "packages/tools/testcontainers" "Test container tools"

# Framework migrations
echo -e "${GREEN}Frameworks:${NC}"
migrate_directory "SystemPromptsGPL" "packages/frameworks/system-prompts" "System prompts framework"
migrate_directory "SystemPromptsGPL_Remixed" "packages/frameworks/system-prompts-remixed" "Enhanced system prompts"
migrate_directory "lib" "packages/frameworks/lib" "Core libraries"
migrate_directory "pkgs" "packages/frameworks/packages" "Framework packages"
migrate_directory "tcl" "packages/frameworks/tcl" "TCL framework components"

# Demo migrations
echo -e "${GREEN}Demo Applications:${NC}"
migrate_directory "flutter" "packages/demos/flutter-demo" "Flutter demo applications"
migrate_directory "UI" "packages/demos/ui-components" "UI component demos"
migrate_directory "site" "packages/demos/site-example" "Website example"
migrate_directory "getting-started-todo-app-main" "packages/demos/todo-app-starter" "Todo app starter demo"
migrate_directory "getting-started-todo-app-main 2" "packages/demos/todo-app-advanced" "Advanced todo app demo"
migrate_directory "hyper_holoscreen" "packages/demos/holoscreen-demo" "Holoscreen demonstration"
migrate_directory "Shinkai Desktop" "packages/demos/shinkai-desktop" "Shinkai desktop demo"
migrate_directory "git-clone-https-huggingface.co-spaces-RAJKHEMANI-luxoranova9" "packages/demos/huggingface-spaces" "HuggingFace Spaces demo"

# Infrastructure migrations
echo -e "${GREEN}Infrastructure:${NC}"
migrate_directory "9_Docker" "packages/infrastructure/docker" "Docker configurations"
migrate_directory "docker-data" "packages/infrastructure/docker-data" "Docker data volumes"
migrate_directory "infra" "packages/infrastructure/core" "Core infrastructure"
migrate_directory "nginx" "packages/infrastructure/nginx" "Nginx configurations"
migrate_directory "my_deploy_scripts" "packages/infrastructure/scripts" "Deployment scripts"
migrate_directory "logs" "packages/infrastructure/logs" "Centralized logging"
migrate_directory "8_Logs_and_Temp" "packages/infrastructure/temp-logs" "Temporary logs"
migrate_directory "migration_logs" "packages/infrastructure/migration" "Migration tracking"
migrate_directory "dir_modifications_deploy" "packages/infrastructure/deployment-mods" "Deployment modifications"

# Notebook migrations
echo -e "${GREEN}Notebooks:${NC}"
migrate_directory "3_Docs_and_Data" "packages/notebooks/docs-and-data" "Documentation and data notebooks"

# Handle special files
echo -e "${GREEN}Special Files:${NC}"
if [[ -f "$LEGACY_ROOT/docker-compose.yml" ]]; then
    echo -e "${BLUE}Migrating: docker-compose.yml → packages/infrastructure/docker-compose/${NC}"
    mkdir -p "packages/infrastructure/docker-compose"
    read -p "Proceed with migration? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        cp "$LEGACY_ROOT/docker-compose.yml" "packages/infrastructure/docker-compose/"
        echo -e "${GREEN}✓ Migrated successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped${NC}"
    fi
fi

if [[ -f "$LEGACY_ROOT/orchestrate_deploy.sh" ]]; then
    echo -e "${BLUE}Migrating: orchestrate_deploy.sh → packages/infrastructure/deployment/${NC}"
    mkdir -p "packages/infrastructure/deployment"
    read -p "Proceed with migration? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        cp "$LEGACY_ROOT/orchestrate_deploy.sh" "packages/infrastructure/deployment/"
        echo -e "${GREEN}✓ Migrated successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Migration completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review migrated packages for completeness"
echo "2. Update package.json files in migrated packages"
echo "3. Install dependencies: npm run bootstrap"
echo "4. Run tests: npm run test"
echo "5. Update documentation as needed"
echo ""
echo -e "${BLUE}See MIGRATION.md for detailed migration guidance${NC}"