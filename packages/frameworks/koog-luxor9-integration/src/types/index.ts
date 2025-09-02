/**
 * Core types and interfaces for Koog-Luxor9 integration
 */

export interface LuxorAgentTask {
  task_id: string;
  agent_id: string;
  tenant_id: string;
  priority: number;
  mode: 'sync' | 'async' | 'stream';
  input: {
    type: 'text' | 'multi-modal';
    content: any;
  };
  context: {
    conversation_id?: string;
    memory_snapshots?: string[];
  };
  policy: {
    llm_ranking: string[];
    max_tokens: number;
    timeout_ms: number;
    cost_budget: number;
  };
}

export interface LuxorAgentResponse {
  task_id: string;
  status: 'completed' | 'failed' | 'partial' | 'streaming';
  result?: any;
  error?: string;
  metadata: {
    llm_used: string;
    tokens_consumed: number;
    execution_time_ms: number;
    cost: number;
  };
}

export interface LLMProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  models: string[];
  costPerToken: number;
  latencyMs: number;
  available: boolean;
}

export interface MemoryStore {
  store(key: string, value: any, ttl?: number): Promise<void>;
  retrieve(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  search(query: string, limit?: number): Promise<any[]>;
}

export interface VectorEmbedding {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  content: string;
}

export interface ObservabilityConfig {
  enabled: boolean;
  jaegerEndpoint?: string;
  prometheusPort?: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface SecurityConfig {
  vaultEndpoint?: string;
  mTLS: boolean;
  inputSanitization: boolean;
  tenantIsolation: boolean;
}

export interface KoogIntegrationConfig {
  deployment: {
    mode: 'embedded' | 'microservice' | 'multiplatform';
    containerImage?: string;
    replicas?: number;
  };
  llm: {
    providers: LLMProvider[];
    routingStrategy: 'cost' | 'latency' | 'quality' | 'hybrid';
  };
  memory: {
    redis: {
      host: string;
      port: number;
      password?: string;
    };
    postgres: {
      connectionString: string;
      vectorDimensions: number;
    };
    minio?: {
      endpoint: string;
      accessKey: string;
      secretKey: string;
    };
  };
  observability: ObservabilityConfig;
  security: SecurityConfig;
}

export interface LuxorAgentBus {
  submitTask(task: LuxorAgentTask): Promise<LuxorAgentResponse>;
  getTaskStatus(taskId: string): Promise<LuxorAgentResponse>;
  cancelTask(taskId: string): Promise<void>;
  streamTask(task: LuxorAgentTask): AsyncIterable<LuxorAgentResponse>;
}

export interface KoogAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  processTask(task: LuxorAgentTask): Promise<LuxorAgentResponse>;
  healthCheck(): Promise<boolean>;
}