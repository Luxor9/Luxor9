/**
 * Dynamic LLM routing service with cost-aware execution
 */

import { LLMProvider } from '../types';
import { Logger } from './logger';

export interface LLMPolicy {
  llm_ranking: string[];
  max_tokens: number;
  timeout_ms: number;
  cost_budget: number;
}

export class LLMRouter {
  private providers: Map<string, LLMProvider> = new Map();
  private logger: Logger;
  private currentProvider: string | null = null;

  constructor(private config: { providers: LLMProvider[]; routingStrategy: string }) {
    this.logger = new Logger();
    
    // Initialize providers
    config.providers.forEach(provider => {
      this.providers.set(provider.name, provider);
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing LLM Router');
    
    // Health check all providers
    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await this.checkProviderHealth(provider);
        provider.available = isHealthy;
        this.logger.info(`Provider ${name} health: ${isHealthy ? 'OK' : 'FAILED'}`);
      } catch (error) {
        provider.available = false;
        this.logger.warn(`Provider ${name} unavailable:`, error);
      }
    }
  }

  async selectOptimalLLM(policy: LLMPolicy): Promise<string> {
    const availableProviders = policy.llm_ranking
      .map(name => this.providers.get(name))
      .filter((provider): provider is LLMProvider => provider?.available === true);

    if (availableProviders.length === 0) {
      throw new Error('No available LLM providers');
    }

    let selectedProvider: LLMProvider;

    switch (this.config.routingStrategy) {
      case 'cost':
        selectedProvider = this.selectByCost(availableProviders, policy.cost_budget);
        break;
      case 'latency':
        selectedProvider = this.selectByLatency(availableProviders);
        break;
      case 'quality':
        selectedProvider = this.selectByQuality(availableProviders);
        break;
      case 'hybrid':
        selectedProvider = this.selectByHybrid(availableProviders, policy);
        break;
      default:
        if (availableProviders.length === 0) {
          throw new Error('No valid LLM provider available');
        }
        selectedProvider = availableProviders[0];
    }

    this.currentProvider = selectedProvider.name;
    this.logger.info(`Selected LLM provider: ${selectedProvider.name}`);
    
    return selectedProvider.name;
  }

  private selectByCost(providers: LLMProvider[], budget: number): LLMProvider {
    if (providers.length === 0) {
      throw new Error('No providers available');
    }
    
    const validProvider = providers
      .filter(p => p.costPerToken <= budget)
      .sort((a, b) => a.costPerToken - b.costPerToken)[0];
    
    return validProvider || providers[0];
  }

  private selectByLatency(providers: LLMProvider[]): LLMProvider {
    if (providers.length === 0) {
      throw new Error('No providers available');
    }
    const sorted = providers.sort((a, b) => a.latencyMs - b.latencyMs);
    return sorted[0];
  }

  private selectByQuality(providers: LLMProvider[]): LLMProvider {
    if (providers.length === 0) {
      throw new Error('No providers available');
    }
    // For this example, assume quality is inversely related to cost
    // In reality, this would use more sophisticated quality metrics
    const sorted = providers.sort((a, b) => b.costPerToken - a.costPerToken);
    return sorted[0];
  }

  private selectByHybrid(providers: LLMProvider[], policy: LLMPolicy): LLMProvider {
    if (providers.length === 0) {
      throw new Error('No providers available');
    }
    // Hybrid scoring: balance cost, latency, and quality
    const scored = providers.map(provider => {
      const costScore = 1 / (provider.costPerToken + 0.001); // Lower cost = higher score
      const latencyScore = 1 / (provider.latencyMs + 1); // Lower latency = higher score
      const budgetFits = provider.costPerToken <= policy.cost_budget ? 1 : 0.1;
      
      const totalScore = costScore * 0.4 + latencyScore * 0.4 + budgetFits * 0.2;
      
      return { provider, score: totalScore };
    });

    const bestMatch = scored.sort((a, b) => b.score - a.score)[0];
    return bestMatch.provider;
  }

  private async checkProviderHealth(provider: LLMProvider): Promise<boolean> {
    try {
      // In a real implementation, this would make an actual health check API call
      // For now, simulate based on provider configuration
      return provider.endpoint !== undefined && provider.apiKey !== undefined;
    } catch (error) {
      return false;
    }
  }

  getCurrentProvider(): string | null {
    return this.currentProvider;
  }

  getProviderStats(): Array<{ name: string; available: boolean; cost: number; latency: number }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      available: provider.available,
      cost: provider.costPerToken,
      latency: provider.latencyMs
    }));
  }

  async healthCheck(): Promise<boolean> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.available);
    
    return availableProviders.length > 0;
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down LLM Router');
    this.currentProvider = null;
  }
}