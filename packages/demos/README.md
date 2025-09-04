# Demo Applications & Examples

This directory contains demo applications and example projects within the LUXORANOVA9 monorepo.

## 📦 Packages

- **demo-repository**: Main demo repository
- **streamlit-example**: Streamlit application examples
- **project-luxor9**: Project Luxor9 demo implementation
- **git-clone-https-huggingface-co-spaces-rajkhemani-luxoranova9**: HuggingFace Spaces integration demo

## 🚀 Getting Started

```bash
# Build all demo packages
npm run build --workspace packages/demos/*

# Work with a specific demo
cd packages/demos/streamlit-example
npm install
npm run dev
```

## 🎯 Demo Development Guidelines

1. **Self-contained**: Each demo should be complete and runnable
2. **Documentation**: Include clear setup and usage instructions
3. **Dependencies**: Minimize external dependencies
4. **Examples**: Provide comprehensive examples of features
5. **Testing**: Include basic functionality tests
6. **Performance**: Optimize for quick startup and demonstration

## 📋 Migration Status

The following legacy demo projects are candidates for migration to this directory:

- `flutter/` → packages/demos/flutter-demo/
- `UI/` → packages/demos/ui-components/
- `site/` → packages/demos/site-example/
- `getting-started-todo-app-main/` → packages/demos/todo-app-starter/
- `getting-started-todo-app-main 2/` → packages/demos/todo-app-advanced/
- `hyper_holoscreen/` → packages/demos/holoscreen-demo/
- `Shinkai Desktop/` → packages/demos/shinkai-desktop/