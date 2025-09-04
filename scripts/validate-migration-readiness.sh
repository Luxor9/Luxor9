#!/bin/bash

# LUXORANOVA9 Migration Readiness Validator
# This script validates that the monorepo structure is ready for migration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}LUXORANOVA9 Migration Readiness Validator${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if we're in the monorepo root
if [[ ! -f "package.json" ]] || [[ ! -d "packages" ]]; then
    echo -e "${RED}❌ Error: This script must be run from the monorepo root directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ In monorepo root directory${NC}"

# Required directories
required_dirs=(
    "packages/ai"
    "packages/saas" 
    "packages/tools"
    "packages/frameworks"
    "packages/notebooks"
    "packages/demos"
    "packages/infrastructure"
)

echo ""
echo -e "${BLUE}Checking package directory structure:${NC}"

all_dirs_exist=true
for dir in "${required_dirs[@]}"; do
    if [[ -d "$dir" ]]; then
        echo -e "${GREEN}✓ $dir${NC}"
    else
        echo -e "${RED}❌ $dir (missing)${NC}"
        all_dirs_exist=false
    fi
done

# Check for README files
echo ""
echo -e "${BLUE}Checking documentation:${NC}"

all_docs_exist=true
for dir in "${required_dirs[@]}"; do
    if [[ -f "$dir/README.md" ]]; then
        echo -e "${GREEN}✓ $dir/README.md${NC}"
    else
        echo -e "${RED}❌ $dir/README.md (missing)${NC}"
        all_docs_exist=false
    fi
done

# Check for migration documentation
migration_docs=(
    "MIGRATION.md"
    "scripts/migrate-legacy.sh"
)

echo ""
echo -e "${BLUE}Checking migration documentation:${NC}"

migration_docs_exist=true
for doc in "${migration_docs[@]}"; do
    if [[ -f "$doc" ]]; then
        echo -e "${GREEN}✓ $doc${NC}"
    else
        echo -e "${RED}❌ $doc (missing)${NC}"
        migration_docs_exist=false
    fi
done

# Check package.json workspaces configuration
echo ""
echo -e "${BLUE}Checking workspace configuration:${NC}"

workspaces_configured=true
expected_workspaces=(
    "packages/ai/*"
    "packages/saas/*"
    "packages/tools/*"
    "packages/frameworks/*"
    "packages/infrastructure/*"
    "packages/notebooks/*"
    "packages/demos/*"
)

for workspace in "${expected_workspaces[@]}"; do
    if grep -q "$workspace" package.json; then
        echo -e "${GREEN}✓ $workspace${NC}"
    else
        echo -e "${RED}❌ $workspace (not configured in package.json)${NC}"
        workspaces_configured=false
    fi
done

# Check if migration script is executable
echo ""
echo -e "${BLUE}Checking migration script:${NC}"

script_executable=true
if [[ -x "scripts/migrate-legacy.sh" ]]; then
    echo -e "${GREEN}✓ Migration script is executable${NC}"
else
    echo -e "${RED}❌ Migration script is not executable${NC}"
    script_executable=false
fi

# Overall validation result
echo ""
echo -e "${BLUE}Validation Summary:${NC}"
echo -e "${BLUE}==================${NC}"

if [[ "$all_dirs_exist" == true ]] && [[ "$all_docs_exist" == true ]] && [[ "$migration_docs_exist" == true ]] && [[ "$workspaces_configured" == true ]] && [[ "$script_executable" == true ]]; then
    echo -e "${GREEN}🎉 Migration readiness: PASSED${NC}"
    echo -e "${GREEN}The monorepo is ready for legacy project migration!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Set LEGACY_ROOT environment variable to your legacy project path"
    echo "2. Run: ./scripts/migrate-legacy.sh"
    echo "3. Follow the migration guidance in MIGRATION.md"
    exit 0
else
    echo -e "${RED}❌ Migration readiness: FAILED${NC}"
    echo -e "${RED}Please fix the issues above before proceeding with migration.${NC}"
    exit 1
fi