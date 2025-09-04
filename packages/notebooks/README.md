# Jupyter Notebooks & Research

This directory contains Jupyter notebooks and research projects within the LUXORANOVA9 monorepo.

## 📦 Packages

- **colab-snippets**: Google Colab code snippets and utilities
- **jupyter-notebooks**: General purpose Jupyter notebooks

## 🚀 Getting Started

```bash
# Install dependencies for all notebook packages
npm run build --workspace packages/notebooks/*

# Work with a specific notebook package
cd packages/notebooks/colab-snippets
npm install
npm run dev
```

## 📓 Notebook Categories

### Research & Experimentation
- Data analysis notebooks
- Model training experiments
- Research prototypes

### Educational Content
- Tutorial notebooks
- Code examples
- Documentation notebooks

### Utilities & Tools
- Helper functions
- Data processing scripts
- Visualization utilities

## 🔬 Notebook Development Guidelines

1. **Documentation**: Include clear markdown explanations
2. **Reproducibility**: Ensure notebooks can be run from start to finish
3. **Dependencies**: List all required packages and versions
4. **Data Sources**: Document data sources and access requirements
5. **Outputs**: Clean outputs before committing
6. **Structure**: Use consistent cell organization and naming

## 📋 Migration Status

The following legacy notebook components are candidates for migration to this directory:

- `3_Docs_and_Data/` → packages/notebooks/docs-and-data/

See [MIGRATION.md](../../MIGRATION.md) for detailed migration guidance.