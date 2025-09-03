/**
 * Example deployment configurations for Koog-Luxor9 integration
 */

import { Luxor9AgentBus } from '../core/luxor9-agent-bus';
import { LuxorIntelligenceAgent } from '../adapters/luxor-intelligence-agent';
import { ConfigManager } from '../config/config-manager';
import { Logger } from '../services/logger';

/**
 * Example: Embedded JVM Agent Setup
 * Use this when you want Koog tightly integrated into your Luxor9 backend
 */
export async function createEmbeddedAgent(): Promise<Luxor9AgentBus> {
  const config = ConfigManager.getInstance().getConfig();
  const logger = new Logger();

  // Configure for embedded deployment
  config.deployment.mode = 'embedded';
  
  logger.info('Creating embedded Koog agent for Luxor9');

  // Initialize the agent bus
  const agentBus = new Luxor9AgentBus(config);
  await agentBus.initialize();

  // Create and register the intelligence agent
  const intelligenceAgent = new LuxorIntelligenceAgent();
  agentBus.registerAgent(intelligenceAgent);

  logger.info('Embedded agent created successfully');
  return agentBus;
}

/**
 * Example: Microservice Agent Setup
 * Use this when you want Koog as a separate, scalable service
 */
export async function createMicroserviceAgent(): Promise<{
  agentBus: Luxor9AgentBus;
  server: any;
}> {
  const config = ConfigManager.getInstance().getConfig();
  const logger = new Logger();

  // Configure for microservice deployment
  config.deployment.mode = 'microservice';
  
  logger.info('Creating microservice Koog agent for Luxor9');

  // Initialize the agent bus
  const agentBus = new Luxor9AgentBus(config);
  await agentBus.initialize();

  // Create and register agents
  const intelligenceAgent = new LuxorIntelligenceAgent();
  agentBus.registerAgent(intelligenceAgent);

  // Create Express server for microservice API
  const express = require('express');
  const helmet = require('helmet');
  const cors = require('cors');

  const app = express();
  
  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/health', async (_req: any, res: any) => {
    const healthy = await agentBus.healthCheck();
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      system: agentBus.getSystemStatus()
    });
  });

  // Task submission endpoint
  app.post('/tasks', async (req: any, res: any) => {
    try {
      const task = req.body;
      const response = await agentBus.submitTask(task);
      res.json(response);
    } catch (error) {
      logger.error('Task submission failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Task status endpoint
  app.get('/tasks/:taskId', async (req: any, res: any) => {
    try {
      const taskId = req.params.taskId;
      const status = await agentBus.getTaskStatus(taskId);
      res.json(status);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : 'Task not found'
      });
    }
  });

  // Streaming endpoint
  app.get('/tasks/:taskId/stream', async (req: any, res: any) => {
    try {
      const task = req.body;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const update of agentBus.streamTask(task)) {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      }
      
      res.end();
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Streaming failed'
      });
    }
  });

  // Metrics endpoint
  app.get('/metrics', (_req: any, res: any) => {
    const status = agentBus.getSystemStatus();
    res.json(status);
  });

  const server = app.listen(process.env['PORT'] || 8080, () => {
    logger.info(`Koog microservice running on port ${process.env['PORT'] || 8080}`);
  });

  return { agentBus, server };
}

/**
 * Example: Complete workflow demonstration
 */
export async function demonstrateWorkflow(): Promise<void> {
  const logger = new Logger();
  
  logger.info('Starting Koog-Luxor9 workflow demonstration');

  // Create embedded agent
  const agentBus = await createEmbeddedAgent();

  // Example task: Document summarization
  const summaryTask = {
    task_id: 'demo-summary-001',
    agent_id: 'luxor-intelligence-v1',
    tenant_id: 'demo-tenant',
    priority: 100,
    mode: 'sync' as const,
    input: {
      type: 'text' as const,
      content: 'Summarize the following technical document about AI agent architecture...'
    },
    context: {
      conversation_id: 'demo-conversation-001'
    },
    policy: {
      llm_ranking: ['ollama-local', 'openai-gpt4'],
      max_tokens: 1000,
      timeout_ms: 30000,
      cost_budget: 0.50
    }
  };

  const summaryResult = await agentBus.submitTask(summaryTask);
  logger.info('Summary task completed:', summaryResult);

  // Example task: Code analysis
  const codeAnalysisTask = {
    task_id: 'demo-code-analysis-001',
    agent_id: 'luxor-intelligence-v1',
    tenant_id: 'demo-tenant',
    priority: 90,
    mode: 'sync' as const,
    input: {
      type: 'text' as const,
      content: 'Analyze this TypeScript code for potential improvements...'
    },
    context: {
      conversation_id: 'demo-conversation-001'
    },
    policy: {
      llm_ranking: ['openai-gpt4', 'anthropic-claude'],
      max_tokens: 1500,
      timeout_ms: 45000,
      cost_budget: 1.00
    }
  };

  const codeResult = await agentBus.submitTask(codeAnalysisTask);
  logger.info('Code analysis task completed:', codeResult);

  // Clean up
  await agentBus.shutdown();
  logger.info('Workflow demonstration completed');
}