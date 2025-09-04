# AI & Machine Learning Packages

This directory contains AI and machine learning related packages within the LUXORANOVA9 monorepo.

## 📦 Packages

- **neura-ai-saas-factory**: AI SaaS factory and platform
- **agentic-luxor9**: Agentic AI system for Luxor9
- **agentic-9**: Enhanced agentic AI capabilities
- **luxoranova-brain**: Core AI brain and intelligence system
- **gemini-cli**: Command-line interface for Gemini AI
- **gemini-fullstack-langgraph-quickstart**: Full-stack Gemini with LangGraph
- **jupyter-ai**: Jupyter integration for AI workflows
- **nemo**: NVIDIA NeMo toolkit integration
- **ollama**: Ollama AI model runner
- **openai-cookbook**: OpenAI API examples and utilities
- **vllm**: vLLM integration for fast inference
- **autotrain-advanced**: Advanced auto-training capabilities
- **jailbreak-llms**: LLM security and jailbreak testing

## 🚀 Getting Started

```bash
# Install dependencies for all AI packages
npm run build --workspace packages/ai/*

# Work with a specific AI package
cd packages/ai/neura-ai-saas-factory
npm install
npm run dev
```

## 🧠 AI Development Guidelines

1. **Model Management**: Use consistent model loading and saving patterns
2. **Configuration**: Use environment variables for API keys and endpoints
3. **Error Handling**: Implement robust error handling for AI API calls
4. **Testing**: Include both unit tests and integration tests with mock responses
5. **Documentation**: Document model architectures and training procedures
6. **Security**: Never commit API keys or sensitive model data

## 📋 Migration Status

The following legacy AI components are candidates for migration to this directory:

- `agents/` → packages/ai/agents/
- `doraemonai/` → packages/ai/doraemon-ai/
- `LUXORANOVA BRAIN/` → packages/ai/luxoranova-brain/
- `models/` → packages/ai/models/
- `PraisonAI-2.2.51/` → packages/ai/praison-ai/
- `log_intel/` → packages/ai/log-intelligence/
- `D A N C A N/` → packages/ai/dancan/
- `Fairies/` → packages/ai/fairies/

See [MIGRATION.md](../../MIGRATION.md) for detailed migration guidance.