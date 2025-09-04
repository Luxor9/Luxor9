# LUXORANOVA9 Monorepo 🚀

Welcome to the LUXORANOVA9 unified monorepo - a comprehensive collection of AI, SaaS, development tools, and frameworks all organized in a single, manageable workspace.

## 🏗️ Repository Structure

This monorepo is organized into several package categories:

### 📁 Package Categories

```
packages/
├── ai/                     # AI & Machine Learning Tools
│   ├── neura-ai-saas-factory/
│   ├── agentic-luxor9/
│   ├── agentic-9/
│   ├── luxoranova-brain/
│   ├── gemini-cli/
│   ├── gemini-fullstack-langgraph-quickstart/
│   ├── jupyter-ai/
│   ├── nemo/
│   ├── ollama/
│   ├── openai-cookbook/
│   ├── vllm/
│   ├── autotrain-advanced/
│   └── jailbreak-llms/
├── saas/                   # SaaS Applications & Platforms
│   ├── luxoranova-saas/
│   ├── luxoranova/
│   ├── luxor999/
│   ├── nextjs-boilerplate/
│   ├── ragbot-starter/
│   ├── codeweb-chat/
│   └── mongodb-mcp-server/
├── tools/                  # Development & Productivity Tools
│   ├── moneyprinter-turbo/
│   ├── lux/
│   ├── v0-luxor9/
│   ├── studio/
│   ├── devtools/
│   ├── gk-cli/
│   ├── modern-drop-upload/
│   ├── vscode-live-server/
│   ├── aws-toolkit-vscode/
│   ├── smartest-chip/
│   └── adk-python/
├── frameworks/             # Frameworks & Platforms
│   ├── luxoranova-infinity-os/
│   ├── luxoranova-engine/
│   ├── n8n/
│   ├── hub-docs/
│   ├── freedomain/
│   └── ai-sdk-starter-deepinfra/
├── notebooks/              # Jupyter Notebooks & Research
│   ├── colab-snippets/
│   └── jupyter-notebooks/
├── demos/                  # Demo Applications & Examples
│   ├── demo-repository/
│   ├── streamlit-example/
│   ├── project-luxor9/
│   └── git-clone-https-huggingface-co-spaces-rajkhemani-luxoranova9/
└── infrastructure/         # Infrastructure & DevOps
    ├── logs/
    ├── docs/
    ├── suna/
    └── notebook/
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/LUXORANOVA9/Luxor9.git
cd Luxor9

# Install dependencies and bootstrap all packages
npm run bootstrap

# Or manually:
npm install
npm run build
```

### Development Commands

```bash
# Build all packages
npm run build

# Run tests across all packages
npm run test

# Lint all packages
npm run lint

# Start development servers for all packages
npm run dev

# Clean build artifacts
npm run clean
```

## 🛠️ Monorepo Management

This monorepo uses several tools for efficient management:

- **Workspaces**: npm workspaces for dependency management
- **Turbo**: Build system and task orchestration
- **Lerna**: Package versioning and publishing
- **ESLint**: Code linting across all packages
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality assurance

### Working with Individual Packages

```bash
# Install dependencies for a specific package
npm install --workspace packages/ai/neura-ai-saas-factory

# Run scripts for a specific package
npm run build --workspace packages/saas/luxoranova-saas

# Add dependencies to a specific package
npm install react --workspace packages/saas/nextjs-boilerplate
```

## 📦 Package Guidelines

### Creating New Packages

1. Create a new directory under the appropriate category in `packages/`
2. Initialize with `npm init` or copy from an existing package
3. Ensure the package follows the monorepo conventions
4. Update the root `package.json` workspace configuration if needed

### Package Structure Convention

```
packages/category/package-name/
├── package.json          # Package configuration
├── README.md            # Package-specific documentation
├── src/                 # Source code
├── tests/               # Test files
├── docs/                # Package documentation
└── dist/                # Build output (gitignored)
```

## 🔧 Development Workflow

1. **Clone & Setup**: Clone the repo and run `npm run bootstrap`
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Work on your feature in the appropriate package(s)
4. **Test**: Run `npm run test` to ensure all tests pass
5. **Lint**: Run `npm run lint` to check code quality
6. **Commit**: Use conventional commit messages
7. **Push & PR**: Push your branch and create a pull request

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed information about:
- Code standards and conventions
- Testing requirements
- Pull request process
- Issue reporting guidelines

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🌟 Features

- **Unified Dependency Management**: Shared dependencies across all packages
- **Consistent Tooling**: Standardized linting, formatting, and build processes
- **Efficient Builds**: Turborepo for fast, cached builds
- **Type Safety**: TypeScript support across the monorepo
- **Auto-generated Documentation**: Consistent documentation structure
- **CI/CD Ready**: GitHub Actions integration for automated testing and deployment

## 📊 Package Status

| Category | Packages | Status | Migration Ready |
|----------|----------|---------|----------------|
| AI | 13 | 🏗️ Setting up | ✅ Ready |
| SaaS | 7 | 🏗️ Setting up | ✅ Ready |
| Tools | 11 | 🏗️ Setting up | ✅ Ready |
| Frameworks | 6 | 🏗️ Setting up | ✅ Ready |
| Notebooks | 2 | ✅ Migrated | ✅ Ready |
| Demos | 4 | 🏗️ Setting up | ✅ Ready |
| Infrastructure | 4 | 🏗️ Setting up | ✅ Ready |

## 🚀 What's Next?

1. **Migrate existing repositories** to their respective package directories (see [MIGRATION.md](./MIGRATION.md))
2. Set up shared configuration and utilities
3. Implement consistent testing frameworks
4. Add CI/CD pipelines for each package category
5. Create comprehensive documentation for each package
6. Establish deployment pipelines

### 📋 Legacy Migration

A comprehensive migration plan is available for transitioning legacy project directories to the new monorepo structure:

- **[MIGRATION.md](./MIGRATION.md)**: Complete migration mapping and guidance
- **[scripts/migrate-legacy.sh](./scripts/migrate-legacy.sh)**: Automated migration script
- Package-specific README files contain migration status for their domains