/**
 * Luxor9 Agent Bus - Core orchestration system for Koog agents
 */

import { EventEmitter } from 'events';
import { 
  LuxorAgentTask, 
  LuxorAgentResponse, 
  LuxorAgentBus, 
  KoogAgent,
  KoogIntegrationConfig
} from '../types';
import { Logger } from '../services/logger';
import { MetricsCollector } from '../services/metrics';
import { LLMRouter } from '../services/llm-router';
import { MemoryManager } from '../services/memory-manager';

export class Luxor9AgentBus extends EventEmitter implements LuxorAgentBus {
  private agents: Map<string, KoogAgent> = new Map();
  private activeTasks: Map<string, Promise<LuxorAgentResponse>> = new Map();
  private logger: Logger;
  private metrics: MetricsCollector;
  private llmRouter: LLMRouter;
  private memoryManager: MemoryManager;

  constructor(private config: KoogIntegrationConfig) {
    super();
    this.logger = new Logger(config.observability.logLevel);
    this.metrics = new MetricsCollector(config.observability);
    this.llmRouter = new LLMRouter(config.llm);
    this.memoryManager = new MemoryManager(config.memory);
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Luxor9 Agent Bus');
    
    await this.memoryManager.initialize();
    await this.llmRouter.initialize();
    
    this.logger.info('Luxor9 Agent Bus initialized successfully');
  }

  registerAgent(agent: KoogAgent): void {
    this.agents.set(agent.id, agent);
    this.logger.info(`Registered agent: ${agent.id} - ${agent.name}`);
    this.emit('agentRegistered', agent);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.logger.info(`Unregistered agent: ${agentId}`);
    this.emit('agentUnregistered', agentId);
  }

  async submitTask(task: LuxorAgentTask): Promise<LuxorAgentResponse> {
    const startTime = Date.now();
    this.logger.info(`Submitting task: ${task.task_id} to agent: ${task.agent_id}`);
    
    try {
      // Validate task
      this.validateTask(task);
      
      // Get agent
      const agent = this.agents.get(task.agent_id);
      if (!agent) {
        throw new Error(`Agent not found: ${task.agent_id}`);
      }

      // Load context from memory if available
      if (task.context.memory_snapshots) {
        await this.loadTaskContext(task);
      }

      // Route LLM based on policy
      await this.llmRouter.selectOptimalLLM(task.policy);

      // Execute task
      const taskPromise = this.executeTaskWithTimeout(agent, task);
      this.activeTasks.set(task.task_id, taskPromise);

      const response = await taskPromise;
      
      // Store results in memory
      await this.storeTaskResult(task, response);
      
      // Collect metrics
      const executionTime = Date.now() - startTime;
      this.metrics.recordTaskExecution(task, response, executionTime);
      
      this.logger.info(`Task completed: ${task.task_id}`);
      this.emit('taskCompleted', task, response);
      
      return response;

    } catch (error) {
      const errorResponse: LuxorAgentResponse = {
        task_id: task.task_id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          llm_used: 'none',
          tokens_consumed: 0,
          execution_time_ms: Date.now() - startTime,
          cost: 0
        }
      };

      this.logger.error(`Task failed: ${task.task_id}`, error);
      this.emit('taskFailed', task, errorResponse);
      
      return errorResponse;
    } finally {
      this.activeTasks.delete(task.task_id);
    }
  }

  async getTaskStatus(taskId: string): Promise<LuxorAgentResponse> {
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      return {
        task_id: taskId,
        status: 'streaming',
        metadata: {
          llm_used: 'unknown',
          tokens_consumed: 0,
          execution_time_ms: 0,
          cost: 0
        }
      };
    }

    // Check memory for completed tasks
    const storedResult = await this.memoryManager.getTaskResult(taskId);
    if (storedResult) {
      return storedResult;
    }

    throw new Error(`Task not found: ${taskId}`);
  }

  async cancelTask(taskId: string): Promise<void> {
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      this.activeTasks.delete(taskId);
      this.logger.info(`Task cancelled: ${taskId}`);
      this.emit('taskCancelled', taskId);
    }
  }

  async *streamTask(task: LuxorAgentTask): AsyncIterable<LuxorAgentResponse> {
    // Implementation for streaming task execution
    // This would be used for long-running tasks with partial results
    const agent = this.agents.get(task.agent_id);
    if (!agent) {
      throw new Error(`Agent not found: ${task.agent_id}`);
    }

    // For now, yield the final result
    // In a real implementation, this would stream partial results
    const response = await this.submitTask(task);
    yield response;
  }

  private validateTask(task: LuxorAgentTask): void {
    if (!task.task_id || !task.agent_id) {
      throw new Error('Task must have task_id and agent_id');
    }
    if (!task.input || !task.input.content) {
      throw new Error('Task must have valid input content');
    }
    if (!task.policy || !task.policy.llm_ranking || task.policy.llm_ranking.length === 0) {
      throw new Error('Task must have valid LLM policy');
    }
  }

  private async executeTaskWithTimeout(
    agent: KoogAgent, 
    task: LuxorAgentTask
  ): Promise<LuxorAgentResponse> {
    const timeoutMs = task.policy.timeout_ms || 30000;
    
    return Promise.race([
      agent.processTask(task),
      new Promise<LuxorAgentResponse>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Task timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  private async loadTaskContext(task: LuxorAgentTask): Promise<void> {
    // Load context from memory snapshots
    if (task.context.memory_snapshots) {
      for (const snapshotId of task.context.memory_snapshots) {
        const snapshot = await this.memoryManager.getMemorySnapshot(snapshotId);
        if (snapshot) {
          // Merge snapshot data into task context
          task.context = { ...task.context, ...snapshot };
        }
      }
    }
  }

  private async storeTaskResult(
    task: LuxorAgentTask, 
    response: LuxorAgentResponse
  ): Promise<void> {
    await this.memoryManager.storeTaskResult(task.task_id, response);
    
    // Store conversation context if applicable
    if (task.context.conversation_id) {
      await this.memoryManager.updateConversationHistory(
        task.context.conversation_id,
        task,
        response
      );
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Luxor9 Agent Bus');
    
    // Cancel all active tasks
    for (const [taskId] of this.activeTasks) {
      await this.cancelTask(taskId);
    }

    await this.memoryManager.shutdown();
    await this.llmRouter.shutdown();
    
    this.logger.info('Luxor9 Agent Bus shutdown complete');
  }

  // Health check for monitoring
  async healthCheck(): Promise<boolean> {
    try {
      const memoryHealth = await this.memoryManager.healthCheck();
      const llmHealth = await this.llmRouter.healthCheck();
      
      return memoryHealth && llmHealth;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }

  // Get system status for monitoring
  getSystemStatus() {
    return {
      activeAgents: this.agents.size,
      activeTasks: this.activeTasks.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      config: {
        deployment: this.config.deployment,
        observability: this.config.observability.enabled
      }
    };
  }
}