/**
 * Basic tests for Koog-Luxor9 Integration Framework
 */

import { LuxorIntelligenceAgent } from '../adapters/luxor-intelligence-agent';
import { ConfigManager } from '../config/config-manager';
import { LuxorAgentTask } from '../types';

describe('Koog-Luxor9 Integration', () => {
  describe('ConfigManager', () => {
    it('should load configuration successfully', () => {
      const configManager = ConfigManager.getInstance();
      const config = configManager.getConfig();
      
      expect(config).toBeDefined();
      expect(config.deployment).toBeDefined();
      expect(config.llm).toBeDefined();
      expect(config.memory).toBeDefined();
    });

    it('should validate configuration', () => {
      const configManager = ConfigManager.getInstance();
      const isValid = configManager.validateConfig();
      
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('LuxorIntelligenceAgent', () => {
    let agent: LuxorIntelligenceAgent;

    beforeEach(() => {
      agent = new LuxorIntelligenceAgent();
    });

    it('should have correct agent properties', () => {
      expect(agent.id).toBe('luxor-intelligence-v1');
      expect(agent.name).toBe('Luxor Intelligence Agent');
      expect(agent.capabilities).toContain('text-generation');
    });

    it('should process text input task', async () => {
      const task: LuxorAgentTask = {
        task_id: 'test-001',
        agent_id: agent.id,
        tenant_id: 'test-tenant',
        priority: 100,
        mode: 'sync',
        input: {
          type: 'text',
          content: 'Summarize this test content'
        },
        context: {},
        policy: {
          llm_ranking: ['test-llm'],
          max_tokens: 100,
          timeout_ms: 5000,
          cost_budget: 0.01
        }
      };

      const response = await agent.processTask(task);
      
      expect(response.task_id).toBe(task.task_id);
      expect(response.status).toBe('completed');
      expect(response.result).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it('should handle invalid input gracefully', async () => {
      const task: LuxorAgentTask = {
        task_id: 'test-002',
        agent_id: agent.id,
        tenant_id: 'test-tenant',
        priority: 100,
        mode: 'sync',
        input: {
          type: 'text',
          content: null as any
        },
        context: {},
        policy: {
          llm_ranking: ['test-llm'],
          max_tokens: 100,
          timeout_ms: 5000,
          cost_budget: 0.01
        }
      };

      const response = await agent.processTask(task);
      
      expect(response.task_id).toBe(task.task_id);
      expect(response.status).toBe('failed');
      expect(response.error).toBeDefined();
    });

    it('should pass health check', async () => {
      const healthy = await agent.healthCheck();
      expect(healthy).toBe(true);
    });
  });
});