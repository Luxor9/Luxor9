# Koog-Luxor9 Integration Framework

Ultra-advanced Koog integration framework for the Luxor9 ecosystem, providing production-grade AI agent orchestration with fault tolerance, scalability, and enterprise security.

## 🏗️ Architecture Overview

```
Luxor9 Dashboard → API Gateway → Orchestrator → Koog Adapter Layer
                                                ↓
                                         Multi-LLM Pool + Persistent Memory
                                                ↓
                                         Observability + Security
```

## 🚀 Features

### Core Capabilities
- **Multi-deployment Support**: Embedded JVM, containerized microservice, or multi-platform (KMP)
- **Dynamic LLM Routing**: Cost-aware, latency-optimized, or quality-focused provider selection
- **Persistent Vector Memory**: Redis caching + PostgreSQL vector storage with semantic search
- **Full Observability**: OpenTelemetry integration, structured logging, and metrics collection
- **Enterprise Security**: mTLS, Vault integration, tenant isolation, input sanitization
- **Auto-failover**: Retry with backoff, fallback LLM selection, partial result streaming

### Supported LLM Providers
- **Ollama**: Local model deployment
- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude-3 Opus, Sonnet, Haiku
- **OpenRouter**: Meta LLaMA, various open models

## 📦 Installation

```bash
# Install the package
npm install @luxoranova9/koog-luxor9-integration

# Install peer dependencies
npm install express helmet cors dotenv winston ioredis pg minio
```

## 🚀 Quick Start

### Embedded JVM Integration

```typescript
import { createEmbeddedAgent } from '@luxoranova9/koog-luxor9-integration';

async function main() {
  // Create embedded agent
  const agentBus = await createEmbeddedAgent();
  
  // Submit a task
  const response = await agentBus.submitTask({
    task_id: 'task-001',
    agent_id: 'luxor-intelligence-v1',
    tenant_id: 'my-tenant',
    priority: 100,
    mode: 'sync',
    input: {
      type: 'text',
      content: 'Summarize the latest AI research trends'
    },
    context: {},
    policy: {
      llm_ranking: ['ollama-local', 'openai-gpt4'],
      max_tokens: 1000,
      timeout_ms: 30000,
      cost_budget: 0.50
    }
  });
  
  console.log(response);
}
```

### Microservice Deployment

```typescript
import { createMicroserviceAgent } from '@luxoranova9/koog-luxor9-integration';

async function main() {
  const { agentBus, server } = await createMicroserviceAgent();
  
  // Server runs on port 8080 with REST API endpoints:
  // POST /tasks - Submit new tasks
  // GET /tasks/:id - Get task status
  // GET /health - Health check
  // GET /metrics - System metrics
}
```

## 🔧 Configuration

Set environment variables or use the ConfigManager:

```bash
# Deployment
DEPLOYMENT_MODE=embedded|microservice|multiplatform
REPLICAS=3

# LLM Providers
OLLAMA_ENDPOINT=http://localhost:11434
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENROUTER_API_KEY=your_openrouter_key
LLM_ROUTING_STRATEGY=hybrid|cost|latency|quality

# Memory Storage
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
DATABASE_URL=postgresql://user:pass@localhost:5432/luxor9_koog
VECTOR_DIMENSIONS=1536

# Observability
OBSERVABILITY_ENABLED=true
JAEGER_ENDPOINT=http://localhost:14268
PROMETHEUS_PORT=9090
LOG_LEVEL=info

# Security
MTLS_ENABLED=true
VAULT_ENDPOINT=http://localhost:8200
INPUT_SANITIZATION=true
TENANT_ISOLATION=true
```

## 🐳 Docker Deployment

### Single Container

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

### Docker Compose

```yaml
version: '3.8'
services:
  koog-agent:
    build: .
    ports:
      - "8080:8080"
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/luxor9_koog
    depends_on:
      - redis
      - postgres
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_DB=luxor9_koog
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📊 Monitoring & Observability

### Health Checks

```bash
# Check agent health
curl http://localhost:8080/health

# Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "system": {
    "activeAgents": 1,
    "activeTasks": 0,
    "uptime": 3600,
    "memory": { "rss": 150000000, "heapUsed": 100000000 }
  }
}
```

### Metrics

```bash
# Get system metrics
curl http://localhost:8080/metrics
```

### Distributed Tracing

The framework includes OpenTelemetry integration for distributed tracing:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('koog-luxor9-integration');
```

## 🔐 Security Features

- **mTLS**: Mutual TLS for service-to-service communication
- **Vault Integration**: Secure secrets management
- **Input Sanitization**: Automatic input validation and sanitization
- **Tenant Isolation**: Multi-tenant data and compute isolation
- **RBAC**: Role-based access control for agent operations

## 🚀 Advanced Usage

### Custom Agent Implementation

```typescript
import { KoogAgent, LuxorAgentTask, LuxorAgentResponse } from '@luxoranova9/koog-luxor9-integration';

class CustomAgent implements KoogAgent {
  id = 'custom-agent-v1';
  name = 'Custom Agent';
  description = 'My custom agent implementation';
  capabilities = ['custom-processing'];

  async processTask(task: LuxorAgentTask): Promise<LuxorAgentResponse> {
    // Your custom processing logic
    return {
      task_id: task.task_id,
      status: 'completed',
      result: { message: 'Custom processing complete' },
      metadata: {
        llm_used: 'custom-llm',
        tokens_consumed: 100,
        execution_time_ms: 500,
        cost: 0.01
      }
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
```

### Vector Embeddings & Semantic Search

```typescript
import { MemoryManager } from '@luxoranova9/koog-luxor9-integration';

const memoryManager = new MemoryManager(config.memory);

// Store embeddings
await memoryManager.storeEmbedding({
  id: 'doc-001',
  vector: [0.1, 0.2, 0.3, ...], // 1536-dimensional vector
  content: 'Document content',
  metadata: { type: 'technical_doc', author: 'user1' }
}, 'tenant-id');

// Search similar content
const similar = await memoryManager.searchSimilarEmbeddings(
  queryVector,
  'tenant-id',
  10
);
```

## 📈 Performance & Scaling

### Horizontal Scaling

For microservice deployment, scale using Kubernetes:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: koog-agent
spec:
  replicas: 5
  selector:
    matchLabels:
      app: koog-agent
  template:
    metadata:
      labels:
        app: koog-agent
    spec:
      containers:
      - name: koog-agent
        image: luxor9/koog-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

### Performance Optimization

- **Connection Pooling**: Redis and PostgreSQL connection pools
- **Caching Strategy**: Multi-layer caching (Redis + in-memory)
- **Load Balancing**: Round-robin LLM provider selection
- **Async Processing**: Non-blocking I/O operations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](../../../LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and feature requests on GitHub
- **Community**: Join our Slack channel for discussions

## 🛣️ Roadmap

- [ ] **v1.1**: Kubernetes Operator for simplified deployment
- [ ] **v1.2**: WebAssembly runtime support
- [ ] **v1.3**: Advanced workflow graph designer
- [ ] **v1.4**: Real-time collaborative agent sessions
- [ ] **v1.5**: Edge computing support for mobile agents

---

**Built with ❤️ by the LUXORANOVA9 team**