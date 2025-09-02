/**
 * Metrics collection service for observability
 */

import { LuxorAgentTask, LuxorAgentResponse, ObservabilityConfig } from '../types';

export class MetricsCollector {
  private metrics: Map<string, any> = new Map();

  constructor(private config: ObservabilityConfig) {}

  recordTaskExecution(
    task: LuxorAgentTask, 
    response: LuxorAgentResponse, 
    executionTime: number
  ): void {
    if (!this.config.enabled) return;

    const metric = {
      timestamp: new Date().toISOString(),
      task_id: task.task_id,
      agent_id: task.agent_id,
      tenant_id: task.tenant_id,
      llm_used: response.metadata.llm_used,
      tokens_consumed: response.metadata.tokens_consumed,
      execution_time_ms: executionTime,
      cost: response.metadata.cost,
      status: response.status
    };

    this.metrics.set(`task_${task.task_id}`, metric);
    
    // In a real implementation, send to Prometheus/Grafana
    console.log('Metric recorded:', metric);
  }

  getMetrics(): any[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}