/**
 * @lineai/municipal-intel
 * 
 * Access municipal planning applications, building permits, and construction 
 * activity data from major US cities.
 */

// Types
export * from './types';

// Clients
export * from './clients';

// Registry
export * from './registry';

// Main API class
import { ClientFactory, ClientFactoryConfig } from './clients';
import { sourceRegistry, SourceRegistryManager } from './registry';
import { MunicipalSource, MunicipalProject, MunicipalSearchParams, MunicipalSearchResponse } from './types';

/**
 * Main municipal intelligence API
 */
export class MunicipalIntel {
  private clientFactory: ClientFactory;
  private registry: SourceRegistryManager;

  constructor(config: ClientFactoryConfig = {}) {
    this.clientFactory = new ClientFactory(config);
    this.registry = sourceRegistry;
  }

  /**
   * Search across multiple municipal sources
   */
  async search(params: MunicipalSearchParams & { sources?: string[] }): Promise<MunicipalSearchResponse> {
    const sources = params.sources 
      ? params.sources.map(id => this.registry.getSource(id)).filter(Boolean) as MunicipalSource[]
      : this.registry.getImplementationReadySources();

    if (sources.length === 0) {
      throw new Error('No available sources for search');
    }

    // For now, search the first available source
    // TODO: Implement multi-source aggregation
    const source = sources[0];
    const client = this.clientFactory.createClient(source);
    
    return client.search(params);
  }

  /**
   * Get a project by ID from a specific source
   */
  async getProject(sourceId: string, projectId: string): Promise<MunicipalProject | null> {
    const source = this.registry.getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    const client = this.clientFactory.createClient(source);
    return client.getProject(projectId);
  }

  /**
   * Get available sources
   */
  getSources(filters?: {
    state?: 'ca' | 'ny' | 'fl';
    type?: 'api' | 'portal' | 'scraping';
    priority?: 'high' | 'medium' | 'low';
    enabled?: boolean;
  }): MunicipalSource[] {
    let sources = this.registry.getAllSources();

    if (filters?.state) {
      const filterState = filters.state.toLowerCase();
      sources = sources.filter(s => s.state.toLowerCase() === filterState);
    }
    
    if (filters?.type) {
      sources = sources.filter(s => s.type === filters.type);
    }
    
    if (filters?.priority) {
      sources = sources.filter(s => s.priority === filters.priority);
    }
    
    if (filters?.enabled !== undefined) {
      sources = sources.filter(s => (s.enabled !== false) === filters.enabled);
    }

    return sources;
  }

  /**
   * Check health of a specific source
   */
  async healthCheck(sourceId: string) {
    const source = this.registry.getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    const client = this.clientFactory.createClient(source);
    const health = await client.healthCheck();
    
    // Update registry with health info
    this.registry.updateSourceStatus(sourceId, {
      lastChecked: health.lastChecked,
      lastError: health.status === 'unhealthy' ? health.error : undefined
    });

    return health;
  }

  /**
   * Set universal Socrata authentication token
   */
  setSocrataToken(token: string): void {
    this.clientFactory.setSocrataToken(token);
  }

  /**
   * Get registry information
   */
  getRegistryInfo() {
    return this.registry.getRegistryInfo();
  }
}

/**
 * Create a new MunicipalIntel instance
 */
export function createMunicipalIntel(config?: ClientFactoryConfig): MunicipalIntel {
  return new MunicipalIntel(config);
}

// Default export
export default MunicipalIntel;