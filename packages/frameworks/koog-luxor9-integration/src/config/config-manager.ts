/**
 * Configuration management for Koog-Luxor9 integration
 */

import { KoogIntegrationConfig } from '../types';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: KoogIntegrationConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfiguration(): KoogIntegrationConfig {
    return {
      deployment: {
        mode: (process.env['DEPLOYMENT_MODE'] as any) || 'embedded',
        containerImage: process.env['CONTAINER_IMAGE'] || 'luxor9/koog-agent:latest',
        replicas: parseInt(process.env['REPLICAS'] || '1')
      },
      llm: {
        providers: [
          {
            name: 'ollama-local',
            endpoint: process.env['OLLAMA_ENDPOINT'] || 'http://localhost:11434',
            apiKey: process.env['OLLAMA_API_KEY'] || '',
            models: ['llama2', 'codellama', 'mistral'],
            costPerToken: 0.0001,
            latencyMs: 500,
            available: true
          },
          {
            name: 'openai-gpt4',
            endpoint: process.env['OPENAI_ENDPOINT'] || 'https://api.openai.com/v1',
            apiKey: process.env['OPENAI_API_KEY'] || '',
            models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            costPerToken: 0.03,
            latencyMs: 1000,
            available: !!process.env['OPENAI_API_KEY']
          },
          {
            name: 'anthropic-claude',
            endpoint: process.env['ANTHROPIC_ENDPOINT'] || 'https://api.anthropic.com',
            apiKey: process.env['ANTHROPIC_API_KEY'] || '',
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            costPerToken: 0.015,
            latencyMs: 800,
            available: !!process.env['ANTHROPIC_API_KEY']
          },
          {
            name: 'openrouter',
            endpoint: process.env['OPENROUTER_ENDPOINT'] || 'https://openrouter.ai/api/v1',
            apiKey: process.env['OPENROUTER_API_KEY'] || '',
            models: ['meta-llama/llama-2-70b-chat', 'anthropic/claude-instant-v1'],
            costPerToken: 0.005,
            latencyMs: 1200,
            available: !!process.env['OPENROUTER_API_KEY']
          }
        ],
        routingStrategy: (process.env['LLM_ROUTING_STRATEGY'] as any) || 'hybrid'
      },
      memory: {
        redis: {
          host: process.env['REDIS_HOST'] || 'localhost',
          port: parseInt(process.env['REDIS_PORT'] || '6379'),
          ...(process.env['REDIS_PASSWORD'] && { password: process.env['REDIS_PASSWORD'] })
        },
        postgres: {
          connectionString: process.env['DATABASE_URL'] || 
            'postgresql://postgres:password@localhost:5432/luxor9_koog',
          vectorDimensions: parseInt(process.env['VECTOR_DIMENSIONS'] || '1536')
        },
        ...(process.env['MINIO_ENDPOINT'] && {
          minio: {
            endpoint: process.env['MINIO_ENDPOINT'],
            accessKey: process.env['MINIO_ACCESS_KEY'] || '',
            secretKey: process.env['MINIO_SECRET_KEY'] || ''
          }
        })
      },
      observability: {
        enabled: process.env['OBSERVABILITY_ENABLED'] === 'true',
        ...(process.env['JAEGER_ENDPOINT'] && { jaegerEndpoint: process.env['JAEGER_ENDPOINT'] }),
        ...(process.env['PROMETHEUS_PORT'] && { prometheusPort: parseInt(process.env['PROMETHEUS_PORT']) }),
        logLevel: (process.env['LOG_LEVEL'] as any) || 'info'
      },
      security: {
        ...(process.env['VAULT_ENDPOINT'] && { vaultEndpoint: process.env['VAULT_ENDPOINT'] }),
        mTLS: process.env['MTLS_ENABLED'] === 'true',
        inputSanitization: process.env['INPUT_SANITIZATION'] !== 'false',
        tenantIsolation: process.env['TENANT_ISOLATION'] !== 'false'
      }
    };
  }

  getConfig(): KoogIntegrationConfig {
    return this.config;
  }

  updateConfig(updates: Partial<KoogIntegrationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  validateConfig(): boolean {
    const errors: string[] = [];

    // Validate deployment config
    if (!['embedded', 'microservice', 'multiplatform'].includes(this.config.deployment.mode)) {
      errors.push('Invalid deployment mode');
    }

    // Validate LLM providers
    if (this.config.llm.providers.length === 0) {
      errors.push('At least one LLM provider must be configured');
    }

    // Validate memory config
    if (!this.config.memory.redis.host) {
      errors.push('Redis host must be configured');
    }

    if (!this.config.memory.postgres.connectionString) {
      errors.push('PostgreSQL connection string must be configured');
    }

    if (errors.length > 0) {
      console.error('Configuration validation errors:', errors);
      return false;
    }

    return true;
  }

  // Environment-specific configurations
  isDevelopment(): boolean {
    return process.env['NODE_ENV'] === 'development';
  }

  isProduction(): boolean {
    return process.env['NODE_ENV'] === 'production';
  }

  isTesting(): boolean {
    return process.env['NODE_ENV'] === 'test';
  }
}