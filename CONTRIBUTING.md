# Contributing to LUXORANOVA9 Monorepo

Thank you for your interest in contributing to the LUXORANOVA9 monorepo! This document provides guidelines and information for contributors.

## 🏗️ Monorepo Structure

This repository follows a monorepo architecture with packages organized by category. Each package should be self-contained but can depend on other packages within the monorepo.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Basic understanding of monorepo concepts

### Setting Up Your Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/LUXORANOVA9/Luxor9.git
   cd Luxor9
   ```

2. **Install Dependencies**
   ```bash
   npm run bootstrap
   ```

3. **Verify Setup**
   ```bash
   npm run lint
   npm run test
   ```

## 📋 Development Guidelines

### Code Standards

1. **TypeScript First**: Prefer TypeScript for new packages
2. **Consistent Formatting**: Use Prettier for code formatting
3. **ESLint Compliance**: Follow the established ESLint rules
4. **Testing Required**: Include tests for new features
5. **Documentation**: Update README files for significant changes

### Package Organization

```
packages/
├── ai/           # AI & ML tools and frameworks
├── saas/         # SaaS applications and platforms
├── tools/        # Development and productivity tools
├── frameworks/   # Frameworks and platforms
├── notebooks/    # Jupyter notebooks and research
├── demos/        # Example applications and demos
└── infrastructure/ # DevOps and infrastructure tools
```

### Naming Conventions

- **Packages**: Use kebab-case (e.g., `my-awesome-package`)
- **Files**: Use kebab-case for files (e.g., `user-service.ts`)
- **Variables**: Use camelCase (e.g., `userService`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Types/Interfaces**: Use PascalCase (e.g., `UserService`)

## 🔧 Development Workflow

### Creating a New Package

1. **Choose the Right Category**
   - Determine which category your package belongs to
   - Create the directory under `packages/[category]/[package-name]`

2. **Initialize the Package**
   ```bash
   cd packages/[category]/[package-name]
   npm init -y
   ```

3. **Follow Package Structure**
   ```
   package-name/
   ├── package.json
   ├── README.md
   ├── tsconfig.json
   ├── src/
   │   └── index.ts
   ├── tests/
   │   └── index.test.ts
   └── docs/
       └── api.md
   ```

4. **Update Workspace Configuration**
   - Ensure the package is included in the root `package.json` workspaces

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the coding standards
   - Add or update tests as needed
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit Your Changes**
   Use conventional commit messages:
   ```bash
   git commit -m "feat(package-name): add new feature"
   git commit -m "fix(package-name): resolve issue with X"
   git commit -m "docs(package-name): update README"
   ```

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Format: `type(scope): description`

Examples:
- `feat(ai/neura-ai): add new model training pipeline`
- `fix(saas/luxoranova): resolve authentication bug`
- `docs(tools/cli): update usage examples`

## 🧪 Testing

### Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test package interactions
3. **E2E Tests**: Test complete workflows (where applicable)

### Running Tests

```bash
# Run all tests
npm run test

# Run tests for a specific package
npm run test --workspace packages/ai/neura-ai

# Run tests in watch mode
npm run test:watch --workspace packages/saas/luxoranova
```

### Writing Tests

- Place tests in the `tests/` directory
- Use descriptive test names
- Follow the existing test patterns in the monorepo
- Aim for good test coverage

## 📝 Documentation

### README Requirements

Each package should have a comprehensive README including:

1. **Description**: What the package does
2. **Installation**: How to install and set up
3. **Usage**: Basic usage examples
4. **API**: API documentation (if applicable)
5. **Contributing**: Package-specific contribution guidelines

### Code Documentation

- Use JSDoc comments for functions and classes
- Document complex logic with inline comments
- Keep documentation up-to-date with code changes

## 🔄 Pull Request Process

1. **Prepare Your PR**
   - Ensure all tests pass
   - Update relevant documentation
   - Rebase your branch on the latest main

2. **Create Pull Request**
   - Use a descriptive title
   - Fill out the PR template
   - Link related issues

3. **Code Review**
   - Address reviewer feedback
   - Maintain a professional and collaborative tone
   - Be open to suggestions and improvements

4. **Merge**
   - PRs require approval from maintainers
   - Squash commits when merging (if requested)

## 🐛 Issue Reporting

### Bug Reports

Include the following information:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: Package version, Node.js version, OS
6. **Screenshots**: If applicable

### Feature Requests

Include the following information:

1. **Description**: Clear description of the proposed feature
2. **Use Case**: Why this feature would be useful
3. **Proposed Solution**: How you think it should work
4. **Alternatives**: Alternative solutions you've considered

## 🔒 Security

If you discover a security vulnerability, please:

1. **Do NOT** create a public issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## 📊 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. Create a release branch
2. Update version numbers
3. Update CHANGELOG.md
4. Create release PR
5. Merge and tag release

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and considerate
- Use inclusive language
- Focus on constructive feedback
- Help create a positive community

## 📞 Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check package READMEs and docs
- **Community**: Join our community channels (if available)

## 🙏 Recognition

Contributors will be recognized in:

- The project's contributors list
- Release notes for significant contributions
- Package-specific acknowledgments

Thank you for contributing to LUXORANOVA9! 🚀