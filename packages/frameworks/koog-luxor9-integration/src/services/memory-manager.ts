/**
 * Memory management service with Redis caching and PostgreSQL vector storage
 */

import Redis from 'ioredis';
import { Client as PgClient } from 'pg';
import { LuxorAgentTask, LuxorAgentResponse, VectorEmbedding } from '../types';
import { Logger } from './logger';

export interface MemoryConfig {
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
}

export class MemoryManager {
  private redis: Redis;
  private pgClient: PgClient;
  private logger: Logger;

  constructor(private config: MemoryConfig) {
    this.logger = new Logger();
    
    // Initialize Redis connection
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      ...(config.redis.password && { password: config.redis.password }),
      maxRetriesPerRequest: 3
    });

    // Initialize PostgreSQL connection
    this.pgClient = new PgClient({
      connectionString: config.postgres.connectionString
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Memory Manager');
    
    try {
      // Test Redis connection
      await this.redis.ping();
      this.logger.info('Redis connection established');

      // Connect to PostgreSQL
      await this.pgClient.connect();
      this.logger.info('PostgreSQL connection established');

      // Initialize database schema
      await this.initializeSchema();
      
    } catch (error) {
      this.logger.error('Failed to initialize Memory Manager', error);
      throw error;
    }
  }

  private async initializeSchema(): Promise<void> {
    // Create tables for task results, conversations, and vector embeddings
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS task_results (
        task_id VARCHAR(255) PRIMARY KEY,
        agent_id VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        input JSONB NOT NULL,
        output JSONB NOT NULL,
        metadata JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        participants JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversation_history (
        id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(255) REFERENCES conversations(conversation_id),
        task_id VARCHAR(255) REFERENCES task_results(task_id),
        sequence_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vector_embeddings (
        id VARCHAR(255) PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(${this.config.postgres.vectorDimensions}),
        metadata JSONB,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_task_results_agent_id ON task_results(agent_id);
      CREATE INDEX IF NOT EXISTS idx_task_results_tenant_id ON task_results(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON conversations(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_vector_embeddings_tenant_id ON vector_embeddings(tenant_id);
    `;

    await this.pgClient.query(createTablesQuery);
    this.logger.info('Database schema initialized');
  }

  async storeTaskResult(taskId: string, response: LuxorAgentResponse): Promise<void> {
    try {
      // Store in Redis for quick access (with TTL)
      const cacheKey = `task_result:${taskId}`;
      await this.redis.setex(cacheKey, 3600, JSON.stringify(response)); // 1 hour TTL

      // Store in PostgreSQL for persistence
      const query = `
        INSERT INTO task_results (task_id, agent_id, tenant_id, input, output, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (task_id) DO UPDATE SET
          output = EXCLUDED.output,
          metadata = EXCLUDED.metadata
      `;

      await this.pgClient.query(query, [
        taskId,
        'unknown', // In real implementation, extract from task
        'default', // In real implementation, extract from task
        {},        // In real implementation, store original task input
        response.result || {},
        response.metadata
      ]);

      this.logger.debug(`Stored task result: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to store task result: ${taskId}`, error);
      throw error;
    }
  }

  async getTaskResult(taskId: string): Promise<LuxorAgentResponse | null> {
    try {
      // Try Redis cache first
      const cacheKey = `task_result:${taskId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        this.logger.debug(`Retrieved task result from cache: ${taskId}`);
        return JSON.parse(cached);
      }

      // Fallback to PostgreSQL
      const query = `
        SELECT output, metadata FROM task_results WHERE task_id = $1
      `;
      
      const result = await this.pgClient.query(query, [taskId]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const response: LuxorAgentResponse = {
          task_id: taskId,
          status: 'completed',
          result: row.output,
          metadata: row.metadata
        };

        // Cache for future requests
        await this.redis.setex(cacheKey, 3600, JSON.stringify(response));
        
        this.logger.debug(`Retrieved task result from database: ${taskId}`);
        return response;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get task result: ${taskId}`, error);
      return null;
    }
  }

  async getMemorySnapshot(snapshotId: string): Promise<any | null> {
    try {
      const cacheKey = `memory_snapshot:${snapshotId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // In a real implementation, this would retrieve from persistent storage
      return null;
    } catch (error) {
      this.logger.error(`Failed to get memory snapshot: ${snapshotId}`, error);
      return null;
    }
  }

  async updateConversationHistory(
    conversationId: string, 
    task: LuxorAgentTask, 
    _response: LuxorAgentResponse
  ): Promise<void> {
    try {
      // Ensure conversation exists
      await this.pgClient.query(`
        INSERT INTO conversations (conversation_id, tenant_id, participants)
        VALUES ($1, $2, $3)
        ON CONFLICT (conversation_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      `, [conversationId, task.tenant_id, JSON.stringify([task.agent_id])]);

      // Get next sequence number
      const seqResult = await this.pgClient.query(`
        SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_seq
        FROM conversation_history
        WHERE conversation_id = $1
      `, [conversationId]);

      const nextSeq = seqResult.rows[0].next_seq;

      // Add to conversation history
      await this.pgClient.query(`
        INSERT INTO conversation_history (conversation_id, task_id, sequence_number)
        VALUES ($1, $2, $3)
      `, [conversationId, task.task_id, nextSeq]);

      this.logger.debug(`Updated conversation history: ${conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to update conversation history: ${conversationId}`, error);
      throw error;
    }
  }

  async storeEmbedding(embedding: VectorEmbedding, tenantId: string): Promise<void> {
    try {
      const query = `
        INSERT INTO vector_embeddings (id, content, embedding, metadata, tenant_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata
      `;

      await this.pgClient.query(query, [
        embedding.id,
        embedding.content,
        `[${embedding.vector.join(',')}]`, // PostgreSQL vector format
        embedding.metadata,
        tenantId
      ]);

      this.logger.debug(`Stored embedding: ${embedding.id}`);
    } catch (error) {
      this.logger.error(`Failed to store embedding: ${embedding.id}`, error);
      throw error;
    }
  }

  async searchSimilarEmbeddings(
    queryVector: number[], 
    tenantId: string, 
    limit: number = 10
  ): Promise<VectorEmbedding[]> {
    try {
      const query = `
        SELECT id, content, embedding, metadata,
               embedding <-> $1::vector as distance
        FROM vector_embeddings
        WHERE tenant_id = $2
        ORDER BY distance
        LIMIT $3
      `;

      const result = await this.pgClient.query(query, [
        `[${queryVector.join(',')}]`,
        tenantId,
        limit
      ]);

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        vector: JSON.parse(row.embedding),
        metadata: row.metadata
      }));
    } catch (error) {
      this.logger.error('Failed to search embeddings', error);
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      await this.pgClient.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Memory Manager health check failed', error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Memory Manager');
    
    try {
      await this.redis.quit();
      await this.pgClient.end();
    } catch (error) {
      this.logger.error('Error during Memory Manager shutdown', error);
    }
  }
}