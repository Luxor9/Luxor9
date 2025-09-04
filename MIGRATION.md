# Legacy Project Migration Guide

This document provides a comprehensive mapping of legacy LUXORANOVA9 project directories to the new monorepo structure.

## 🗂️ Legacy Directory Structure

The following directories were identified from the legacy `D:\ANACONDA\Project_Luxor9\` project:

## 📊 Migration Mapping

### AI & Machine Learning (`packages/ai/`)

| Legacy Directory | New Location | Description |
|------------------|--------------|-------------|
| `agents/` | `packages/ai/agents/` | AI agent implementations |
| `doraemonai/` | `packages/ai/doraemon-ai/` | Doraemon AI system |
| `LUXORANOVA BRAIN/` | `packages/ai/luxoranova-brain/` | Core AI brain system |
| `neura-ai-saas-factory/` | `packages/ai/neura-ai-saas-factory/` | AI SaaS factory |
| `models/` | `packages/ai/models/` | AI model artifacts |
| `PraisonAI-2.2.51/` | `packages/ai/praison-ai/` | PraisonAI integration |
| `log_intel/` | `packages/ai/log-intelligence/` | Log analysis AI |
| `D A N C A N/` | `packages/ai/dancan/` | DANCAN AI system |
| `Fairies/` | `packages/ai/fairies/` | Fairies AI agents |

### SaaS Applications (`packages/saas/`)

| Legacy Directory | New Location | Description |
|------------------|--------------|-------------|
| `apps/` | `packages/saas/apps/` | SaaS applications |
| `backend/` | `packages/saas/backend/` | Backend services |
| `Full Web App Stack with Agentic Workflows and Monetization/` | `packages/saas/agentic-web-stack/` | Full stack agentic web app |
| `jeecg-boot/` | `packages/saas/jeecg-boot/` | JeecG Boot framework |
| `luxora/` | `packages/saas/luxora/` | Luxora SaaS platform |

### Tools (`packages/tools/`)

| Legacy Directory | New Location | Description |
|------------------|--------------|-------------|
| `7_Tools_and_Installers/` | `packages/tools/installers/` | Installation tools |
| `lux_runner/` | `packages/tools/lux-runner/` | Lux execution runner |
| `2_Scripts/` | `packages/tools/scripts/` | Utility scripts |
| `EmpireScan-20250613-0729/` | `packages/tools/empire-scan/` | Empire scanning tool |
| `searxng/` | `packages/tools/searxng/` | Search engine tool |
| `testcontainers-desktop_darwin_universal/` | `packages/tools/testcontainers/` | Test container tools |

### Frameworks (`packages/frameworks/`)

| Legacy Directory | New Location | Description |
|------------------|--------------|-------------|
| `SystemPromptsGPL/` | `packages/frameworks/system-prompts/` | System prompts framework |
| `SystemPromptsGPL_Remixed/` | `packages/frameworks/system-prompts-remixed/` | Enhanced system prompts |
| `lib/` | `packages/frameworks/lib/` | Core libraries |
| `pkgs/` | `packages/frameworks/packages/` | Framework packages |
| `tcl/` | `packages/frameworks/tcl/` | TCL framework components |

### Demos (`packages/demos/`)

| Legacy Directory | New Location | Description |
|------------------|--------------|-------------|
| `flutter/` | `packages/demos/flutter-demo/` | Flutter demo applications |
| `UI/` | `packages/demos/ui-components/` | UI component demos |
| `site/` | `packages/demos/site-example/` | Website example |
| `getting-started-todo-app-main/` | `packages/demos/todo-app-starter/` | Todo app starter demo |
| `getting-started-todo-app-main 2/` | `packages/demos/todo-app-advanced/` | Advanced todo app demo |
| `hyper_holoscreen/` | `packages/demos/holoscreen-demo/` | Holoscreen demonstration |
| `Shinkai Desktop/` | `packages/demos/shinkai-desktop/` | Shinkai desktop demo |
| `git-clone-https-huggingface.co-spaces-RAJKHEMANI-luxoranova9/` | `packages/demos/huggingface-spaces/` | HuggingFace Spaces demo |

### Infrastructure (`packages/infrastructure/`)

| Legacy Directory | New Location | Description |
|------------------|--------------|-------------|
| `9_Docker/` | `packages/infrastructure/docker/` | Docker configurations |
| `docker-data/` | `packages/infrastructure/docker-data/` | Docker data volumes |
| `docker-compose.yml` | `packages/infrastructure/docker-compose/` | Docker compose configs |
| `infra/` | `packages/infrastructure/core/` | Core infrastructure |
| `nginx/` | `packages/infrastructure/nginx/` | Nginx configurations |
| `orchestrate_deploy.sh` | `packages/infrastructure/deployment/` | Deployment orchestration |
| `my_deploy_scripts/` | `packages/infrastructure/scripts/` | Deployment scripts |
| `logs/` | `packages/infrastructure/logs/` | Centralized logging |
| `8_Logs_and_Temp/` | `packages/infrastructure/temp-logs/` | Temporary logs |
| `migration_logs/` | `packages/infrastructure/migration/` | Migration tracking |
| `dir_modifications_deploy/` | `packages/infrastructure/deployment-mods/` | Deployment modifications |

### Notebooks (`packages/notebooks/`)

| Legacy Directory | New Location | Description |
|------------------|--------------|-------------|
| `3_Docs_and_Data/` | `packages/notebooks/docs-and-data/` | Documentation and data notebooks |

## 🗄️ Archive & Legacy Directories

The following directories should be archived or handled specially:

| Legacy Directory | Recommendation | Notes |
|------------------|----------------|-------|
| `6_Archives_and_Backups/` | Archive | Historical backups, keep for reference |
| `backups/` | Archive | Project backups |
| `chatgpt_audit_logs/` | Archive | ChatGPT interaction logs |
| `1_SourceCode/` | Migrate selectively | Review and migrate relevant source code |
| `4_Assets_and_Media/` | Archive/Assets repo | Media assets, consider separate repository |
| `5_Config/` | Merge into packages | Distribute configs to relevant packages |
| `ANACONDA3/` | Archive | Anaconda installation files |
| `merge-tmp/` | Delete | Temporary merge files |
| `scoped_dir6864_1139034922/` | Delete | Temporary directory |
| `New folder/` | Delete | Empty or temporary folder |
| `__pycache__/` | Delete | Python cache files |

## 🚀 Migration Process

### Phase 1: Preparation
1. Review each legacy directory content
2. Identify dependencies between components
3. Create migration checklist
4. Backup legacy structure

### Phase 2: Core Migration
1. Start with frameworks and tools (least dependencies)
2. Migrate AI components
3. Migrate SaaS applications
4. Migrate infrastructure components

### Phase 3: Integration
1. Update cross-package dependencies
2. Configure build and test systems
3. Update documentation
4. Test complete system

### Phase 4: Cleanup
1. Archive legacy directories
2. Update deployment scripts
3. Update CI/CD pipelines
4. Final validation

## 📋 Migration Checklist

- [ ] Create package directory structure
- [ ] Migrate framework components
- [ ] Migrate tool components  
- [ ] Migrate AI components
- [ ] Migrate SaaS components
- [ ] Migrate infrastructure components
- [ ] Migrate demo applications
- [ ] Update documentation
- [ ] Update build configurations
- [ ] Test integrated system
- [ ] Archive legacy directories

## 📞 Support

For migration assistance or questions, refer to:
- [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Package-specific README files for detailed instructions
- GitHub Issues for migration-related questions