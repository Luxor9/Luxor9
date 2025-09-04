# Frameworks & Platforms

This directory contains frameworks and platform packages within the LUXORANOVA9 monorepo.

## 📦 Packages

- **luxoranova-infinity-os**: LuxoraNova Infinity Operating System
- **luxoranova-engine**: Core LuxoraNova Engine
- **n8n**: Workflow automation platform
- **hub-docs**: Documentation hub framework
- **freedomain**: Free domain management platform
- **ai-sdk-starter-deepinfra**: AI SDK starter with DeepInfra

## 🏗️ Framework Types

### Operating Systems
- luxoranova-infinity-os

### Engines & Runtimes
- luxoranova-engine

### Workflow Platforms
- n8n

### Documentation Platforms
- hub-docs

### Domain Management
- freedomain

### AI Frameworks
- ai-sdk-starter-deepinfra

## 🚀 Getting Started

```bash
# Build all frameworks
npm run build --workspace packages/frameworks/*

# Work with a specific framework
cd packages/frameworks/luxoranova-engine
npm install
npm run dev
```

## 🏗️ Framework Development Guidelines

1. **Modularity**: Design frameworks to be modular and extensible
2. **Documentation**: Provide comprehensive API documentation
3. **Examples**: Include usage examples and tutorials
4. **Testing**: Implement thorough testing suites
5. **Versioning**: Follow semantic versioning principles
6. **Compatibility**: Maintain backward compatibility when possible

## 📋 Migration Status

The following legacy framework components are candidates for migration to this directory:

- `SystemPromptsGPL/` → packages/frameworks/system-prompts/
- `SystemPromptsGPL_Remixed/` → packages/frameworks/system-prompts-remixed/
- `lib/` → packages/frameworks/lib/
- `pkgs/` → packages/frameworks/packages/
- `tcl/` → packages/frameworks/tcl/

See [MIGRATION.md](../../MIGRATION.md) for detailed migration guidance.