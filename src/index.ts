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
import { FieldSchema, KnownMunicipalityId, MunicipalityInfo, MunicipalProject, MunicipalSearchParams, MunicipalSearchResponse, MunicipalSource, SearchCapabilities } from './types';

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
   * Search municipal projects
   */
  async search(params: MunicipalSearchParams): Promise<MunicipalSearchResponse> {
    let source: MunicipalSource;

    if (params.municipalityId) {
      // Search specific municipality
      const foundSource = this.registry.getSource(params.municipalityId);
      if (!foundSource) {
        throw new Error(`Municipality not found: ${params.municipalityId}`);
      }
      source = foundSource;
    } else {
      // Default to first available source if no municipality specified
      const sources = this.registry.getImplementationReadySources();
      if (sources.length === 0) {
        throw new Error('No available sources for search');
      }
      source = sources[0];
    }

    const client = this.clientFactory.createClient(source, params);
    return client.search();
  }

  /**
   * Get a project by ID from a specific source
   */
  async getProject(sourceId: string, projectId: string): Promise<MunicipalProject | null> {
    const source = this.registry.getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Create minimal params for getProject - we only need the municipalityId
    const params: MunicipalSearchParams = { municipalityId: sourceId as any };
    const client = this.clientFactory.createClient(source, params);
    return client.getProject(projectId);
  }

  /**
   * Get available municipalities with their datasets (AI Discovery API)
   */
  getAvailableMunicipalities(): MunicipalityInfo[] {
    const sources = this.registry.getAllSources();

    return sources.map(source => ({
      id: source.id as KnownMunicipalityId,
      name: source.name,
      state: source.state,
      datasets: source.api?.datasets
        ? Object.entries(source.api.datasets).map(([id, dataset]) => ({
            id,
            name: dataset.name
          }))
        : []
    }));
  }

  /**
   * Get search capabilities for a municipality
   */
  getSearchCapabilities(municipalityId: KnownMunicipalityId): SearchCapabilities {
    const source = this.registry.getSource(municipalityId);
    if (!source) {
      throw new Error(`Municipality not found: ${municipalityId}`);
    }

    // For now, return capabilities based on what our Socrata client supports
    // This could be enhanced to be source-specific
    const supportedFilters: any[] = ['submitDateFrom', 'submitDateTo', 'statuses', 'addresses', 'keywords'];
    const supportedSorts: any[] = ['submitDate', 'address'];
    const limitations: string[] = [];

    // Check if value field is available for value filters
    if (source.api?.datasets) {
      const primaryDataset = Object.values(source.api.datasets)[0];
      if (primaryDataset?.fieldMappings?.value) {
        supportedFilters.push('minValue', 'maxValue');
        supportedSorts.push('value');
      } else {
        limitations.push('No value field available - minValue/maxValue filters not supported');
      }

      // Check if approval date is available
      if (primaryDataset?.fieldMappings?.approvalDate) {
        supportedFilters.push('approvalDateFrom', 'approvalDateTo');
        supportedSorts.push('approvalDate');
      }
    }

    return {
      supportedFilters,
      supportedSorts,
      limitations: limitations.length > 0 ? limitations : undefined
    };
  }

  /**
   * Get field schema for a dataset
   */
  getDatasetSchema(municipalityId: KnownMunicipalityId, datasetId?: string): FieldSchema[] {
    const source = this.registry.getSource(municipalityId);
    if (!source || !source.api?.datasets) {
      throw new Error(`Municipality or datasets not found: ${municipalityId}`);
    }

    // Get the specified dataset or the first one
    const dataset = datasetId
      ? source.api.datasets[datasetId]
      : Object.values(source.api.datasets)[0];

    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId || 'default'}`);
    }

    // Convert fields to schema format
    const fieldMappings = dataset.fieldMappings || {};
    const searchableLogicalFields = Object.keys(fieldMappings);

    return dataset.fields.map(fieldName => {
      const isSearchable = Object.values(fieldMappings).includes(fieldName);

      // Determine field type based on field name patterns
      let type: any = 'string';
      if (fieldName.includes('date') || fieldName.includes('_date')) {
        type = 'date';
      } else if (fieldName.includes('cost') || fieldName.includes('value') || fieldName.includes('amount')) {
        type = 'number';
      }

      return {
        name: fieldName,
        type,
        searchable: isSearchable,
        description: isSearchable
          ? `Searchable field mapped to: ${searchableLogicalFields.find(logical => fieldMappings[logical] === fieldName)}`
          : undefined
      };
    });
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

  // /**
  //  * Check health of a specific source
  //  */
  // async healthCheck(sourceId: string) {
  //   const source = this.registry.getSource(sourceId);
  //   if (!source) {
  //     throw new Error(`Source not found: ${sourceId}`);
  //   }
  //
  //   const client = this.clientFactory.createClient(source);
  //   const health = await client.healthCheck();
  //
  //   // Update registry with health info
  //   this.registry.updateSourceStatus(sourceId, {
  //     lastChecked: health.lastChecked.toISOString(),
  //     lastError: health.status === 'unhealthy' ? health.error : undefined
  //   });
  //
  //   return health;
  // }

  /**
   * Set universal Socrata authentication token
   */
  setSocrataToken(token: string): void {
    this.clientFactory.setSocrataToken(token);
  }

  /**
   * Register a new source at runtime
   */
  registerSource(source: MunicipalSource): void {
    this.registry.registerSource(source);
  }

  /**
   * Unregister a runtime source
   */
  unregisterSource(id: string): boolean {
    return this.registry.unregisterSource(id);
  }

  /**
   * Check if a source is built-in or runtime-added
   */
  isBuiltInSource(id: string): boolean {
    return this.registry.isBuiltInSource(id);
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
