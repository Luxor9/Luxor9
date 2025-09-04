# Infrastructure & DevOps

This directory contains infrastructure and DevOps related packages within the LUXORANOVA9 monorepo.

## 📦 Packages

- **logs**: Centralized logging infrastructure
- **docs**: Documentation infrastructure
- **suna**: Suna deployment system
- **notebook**: Notebook infrastructure

## 🚀 Getting Started

```bash
# Build all infrastructure packages
npm run build --workspace packages/infrastructure/*

# Work with a specific infrastructure package
cd packages/infrastructure/logs
npm install
npm run dev
```

## 🏗️ Infrastructure Categories

### Container & Orchestration
- Docker configurations
- Kubernetes manifests
- Container orchestration

### Monitoring & Logging
- Centralized logging
- Metrics collection
- Health monitoring

### Deployment & CI/CD
- Deployment scripts
- CI/CD pipelines
- Infrastructure as Code

### Configuration Management
- Environment configurations
- Secret management
- Service configuration

## 🔧 Infrastructure Guidelines

1. **Containerization**: Use Docker for consistent environments
2. **Orchestration**: Kubernetes for production deployments
3. **Monitoring**: Comprehensive logging and metrics
4. **Security**: Secure by default configurations
5. **Scalability**: Design for horizontal scaling
6. **Documentation**: Document all infrastructure components

## 📋 Migration Status

The following legacy infrastructure components are candidates for migration:

- `9_Docker/` → packages/infrastructure/docker/
- `docker-data/` → packages/infrastructure/docker-data/
- `docker-compose.yml` → packages/infrastructure/docker-compose/
- `infra/` → packages/infrastructure/core/
- `nginx/` → packages/infrastructure/nginx/
- `orchestrate_deploy.sh` → packages/infrastructure/deployment/
- `my_deploy_scripts/` → packages/infrastructure/scripts/
- `logs/` → packages/infrastructure/logs/
- `8_Logs_and_Temp/` → packages/infrastructure/temp-logs/
- `migration_logs/` → packages/infrastructure/migration/
- `dir_modifications_deploy/` → packages/infrastructure/deployment-mods/