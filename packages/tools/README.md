# Development & Productivity Tools

This directory contains development tools and productivity applications within the LUXORANOVA9 monorepo.

## 📦 Packages

- **moneyprinter-turbo**: Automated content generation tool
- **lux**: Core Lux development utilities
- **v0-luxor9**: v0 integration for Luxor9
- **studio**: Development studio and IDE extensions
- **devtools**: Browser developer tools extensions
- **gk-cli**: CLI tool for development workflows
- **modern-drop-upload**: Modern file upload components
- **vscode-live-server**: VS Code live server extension
- **aws-toolkit-vscode**: AWS toolkit for VS Code
- **smartest-chip**: Smart chip components and utilities
- **adk-python**: Python ADK for development

## 🛠️ Tool Categories

### CLI Tools
- gk-cli
- lux

### VS Code Extensions
- vscode-live-server
- aws-toolkit-vscode

### Web Components
- modern-drop-upload
- smartest-chip

### Development Utilities
- devtools
- studio
- adk-python

## 🚀 Getting Started

```bash
# Install all tools
npm run build --workspace packages/tools/*

# Install a specific tool globally
npm install -g packages/tools/gk-cli
```

## 🔧 Tool Development Guidelines

1. **CLI Design**: Follow standard CLI conventions and patterns
2. **Documentation**: Provide clear usage examples and help text
3. **Configuration**: Support configuration files and environment variables
4. **Testing**: Include comprehensive CLI testing
5. **Distribution**: Consider npm global installation for CLI tools
6. **Compatibility**: Ensure cross-platform compatibility

## 📋 Migration Status

The following legacy tool components are candidates for migration to this directory:

- `7_Tools_and_Installers/` → packages/tools/installers/
- `lux_runner/` → packages/tools/lux-runner/
- `2_Scripts/` → packages/tools/scripts/
- `EmpireScan-20250613-0729/` → packages/tools/empire-scan/
- `searxng/` → packages/tools/searxng/
- `testcontainers-desktop_darwin_universal/` → packages/tools/testcontainers/

See [MIGRATION.md](../../MIGRATION.md) for detailed migration guidance.