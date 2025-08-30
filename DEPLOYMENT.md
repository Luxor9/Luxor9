# LUXORANOVA9 Deployment Guide

This guide covers deployment strategies and procedures for all packages in the LUXORANOVA9 monorepo.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Deployment Architecture](#deployment-architecture)
- [Environment Configuration](#environment-configuration)
- [Package-Specific Deployments](#package-specific-deployments)
- [CI/CD Pipelines](#cicd-pipelines)
- [Platform Configurations](#platform-configurations)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- Docker and Docker Compose
- npm >= 8.0.0
- Access to deployment platforms (Vercel, Netlify, etc.)

### Basic Deployment Commands

```bash
# Deploy all packages to staging
npm run deploy:staging

# Deploy all packages to production  
npm run deploy:production

# Deploy specific package types
npm run deploy:saas
npm run deploy:ai
npm run deploy:tools

# Health check
npm run health-check

# Docker development environment
npm run docker:dev
```

## 🏗️ Deployment Architecture

The LUXORANOVA9 monorepo supports multiple deployment strategies:

### 1. Container-Based Deployment
- **Docker**: Multi-stage builds for different package types
- **Docker Compose**: Local development and staging environments
- **Kubernetes**: Production container orchestration (optional)

### 2. Platform-as-a-Service (PaaS)
- **Vercel**: Next.js SaaS applications
- **Netlify**: Static sites and JAMstack applications
- **Railway/Render**: Full-stack applications

### 3. Package Publishing
- **npm**: CLI tools and libraries
- **GitHub Packages**: Private package distribution

### 4. Serverless Functions
- **Vercel Functions**: API endpoints
- **Netlify Functions**: Serverless logic
- **AWS Lambda**: Enterprise-scale functions

## ⚙️ Environment Configuration

### Environment Files

Copy and customize environment templates:

```bash
# Development
cp .env.template .env.local

# Production (use environment variables)
cp .env.production .env.production.local
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI services | AI packages |
| `NEXTAUTH_SECRET` | NextAuth.js secret | SaaS packages |
| `VERCEL_TOKEN` | Vercel deployment token | Vercel deploys |
| `NETLIFY_AUTH_TOKEN` | Netlify auth token | Netlify deploys |

### Environment-Specific Configs

```bash
# Staging environment
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db-url
LOG_LEVEL=debug

# Production environment  
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
LOG_LEVEL=info
RATE_LIMIT=1000
```

## 📦 Package-Specific Deployments

### SaaS Applications (`packages/saas/`)

SaaS applications are deployed to cloud platforms optimized for web applications:

```bash
# Deploy all SaaS apps
npm run deploy:saas

# Deploy specific SaaS app
./scripts/deployment/deploy.sh saas luxoranova-saas

# Deploy to specific platform
vercel --prod  # From package directory
netlify deploy --prod  # From package directory
```

**Supported Platforms:**
- **Vercel**: Next.js applications with API routes
- **Netlify**: Static sites and serverless functions
- **Docker**: Containerized deployments

### AI Services (`packages/ai/`)

AI services require specialized deployment for ML workloads:

```bash
# Deploy all AI services
npm run deploy:ai

# Deploy specific AI service
./scripts/deployment/deploy.sh ai neura-ai-saas-factory
```

**Deployment Features:**
- **GPU Support**: CUDA-enabled containers for ML inference
- **Model Storage**: Persistent volumes for model files
- **Scaling**: Horizontal scaling for inference load
- **Monitoring**: Performance and accuracy tracking

### Tools & Utilities (`packages/tools/`)

Tools are deployed as CLI applications or services:

```bash
# Deploy all tools
npm run deploy:tools

# Publish CLI tool to npm
cd packages/tools/gk-cli
npm publish
```

**Deployment Options:**
- **npm Registry**: Public CLI tools
- **Docker Hub**: Containerized utilities
- **GitHub Releases**: Binary distributions

### Frameworks (`packages/frameworks/`)

Frameworks are deployed as platform services:

```bash
# Deploy all frameworks
npm run deploy:frameworks

# Deploy specific framework
./scripts/deployment/deploy.sh frameworks luxoranova-engine
```

## 🔄 CI/CD Pipelines

### GitHub Actions Workflows

1. **ci-cd.yml**: Main CI/CD pipeline
   - Lint, test, build on every push
   - Security scanning
   - Docker image building
   - Artifact publishing

2. **deploy-saas.yml**: SaaS application deployment
   - Vercel/Netlify deployments
   - Environment-specific configs
   - Health checks

3. **deploy-ai.yml**: AI service deployment
   - GPU-enabled containers
   - Model deployment
   - Service scaling

### Manual Deployment

```bash
# Trigger manual deployment
gh workflow run deploy-saas.yml \
  -f environment=production \
  -f app=luxoranova-saas

# Check deployment status
gh run list --workflow=deploy-saas.yml
```

### Automated Deployment

Deployments are triggered by:
- **Push to main**: Staging deployment
- **Release tags**: Production deployment
- **Commit messages with `[deploy]`**: Forced deployment

## 🌐 Platform Configurations

### Vercel Configuration

File: `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "packages/saas/*/package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [...],
  "env": {...}
}
```

### Netlify Configuration

File: `netlify.toml`

```toml
[build]
  publish = "packages/saas/*/dist"
  command = "npm run build"

[build.environment]
  NODE_ENV = "production"
```

### Docker Configuration

Multiple Dockerfiles for different use cases:
- `Dockerfile`: Multi-stage builds for all package types
- `docker-compose.yml`: Production environment
- `docker-compose.dev.yml`: Development environment

## 📊 Monitoring & Health Checks

### Automated Health Checks

```bash
# Run all health checks
npm run health-check

# Check specific services
./scripts/deployment/health-check.sh saas
./scripts/deployment/health-check.sh ai
./scripts/deployment/health-check.sh infrastructure
```

### Health Check Endpoints

Each service exposes health check endpoints:

```bash
# SaaS applications
curl http://localhost:3000/health

# AI services  
curl http://localhost:8000/health

# Infrastructure services
curl http://localhost:6379/ping  # Redis
pg_isready -d $DATABASE_URL      # PostgreSQL
```

### Monitoring Stack

- **Application Metrics**: Built-in health endpoints
- **Infrastructure Metrics**: Docker health checks
- **Logging**: Structured logging with correlation IDs
- **Alerting**: Webhook notifications for failures

## 🐛 Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check deployment logs
gh run view [run-id] --log

# Validate configuration
npm run lint
npm run test

# Check Docker build
docker build --no-cache .
```

#### Environment Issues

```bash
# Validate environment variables
./scripts/deployment/health-check.sh

# Check service connectivity
docker-compose logs [service-name]

# Database connection issues
psql $DATABASE_URL -c "SELECT 1;"
redis-cli -u $REDIS_URL ping
```

#### Permission Issues

```bash
# GitHub Actions secrets
gh secret list

# Docker registry authentication
docker login ghcr.io

# Platform authentication
vercel whoami
netlify status
```

### Rollback Procedures

```bash
# Rollback to previous version
vercel rollback --yes
netlify rollback

# Docker rollback
docker-compose down
docker-compose up -d --scale app=0
docker-compose up -d --scale app=1
```

### Debug Mode

```bash
# Enable verbose logging
export DEBUG=*
export LOG_LEVEL=debug

# Debug deployment script
./scripts/deployment/deploy.sh --dry-run --verbose all
```

## 📚 Additional Resources

- [Package Development Guide](./CONTRIBUTING.md)
- [Docker Best Practices](./docs/docker.md)
- [Security Guidelines](./docs/security.md)
- [Performance Optimization](./docs/performance.md)

## 🤝 Contributing

To add new deployment targets or improve existing ones:

1. Update deployment scripts in `scripts/deployment/`
2. Add platform configurations
3. Update CI/CD workflows
4. Test deployment procedures
5. Update this documentation

For questions or issues, please create an issue in the repository.