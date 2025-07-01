/**
 * Municipal source registry management
 */

import { SourceRegistry, MunicipalSource } from './types/sources';
import { builtInRegistry } from './data/municipal-registry';

/**
 * Source registry manager
 */
export class SourceRegistryManager {
  private registry: SourceRegistry;
  private runtimeSources: Map<string, MunicipalSource> = new Map();

  constructor() {
    this.registry = builtInRegistry;
  }

  /**
   * Get all sources (built-in + runtime)
   */
  getAllSources(): MunicipalSource[] {
    const allSources: MunicipalSource[] = [];
    
    // Add built-in sources
    for (const state of ['ca', 'ny', 'fl'] as const) {
      const sources = this.registry.sources[state].municipalities.map(source => ({
        ...source,
        state: state.toUpperCase()
      }));
      allSources.push(...sources);
    }
    
    // Add runtime sources
    allSources.push(...Array.from(this.runtimeSources.values()));
    
    return allSources;
  }

  /**
   * Get sources by state
   */
  getSourcesByState(state: 'ca' | 'ny' | 'fl'): MunicipalSource[] {
    return this.registry.sources[state]?.municipalities.map(source => ({
      ...source,
      state: state.toUpperCase()
    })) || [];
  }

  /**
   * Get source by ID
   */
  getSource(id: string): MunicipalSource | undefined {
    return this.getAllSources().find(source => source.id === id);
  }

  /**
   * Get sources by priority
   */
  getSourcesByPriority(priority: 'high' | 'medium' | 'low'): MunicipalSource[] {
    return this.getAllSources().filter(source => source.priority === priority);
  }

  /**
   * Get sources by type
   */
  getSourcesByType(type: 'api' | 'portal' | 'scraping'): MunicipalSource[] {
    return this.getAllSources().filter(source => source.type === type);
  }

  /**
   * Get API sources (easiest to implement)
   */
  getApiSources(): MunicipalSource[] {
    return this.getSourcesByType('api');
  }

  /**
   * Get Socrata sources specifically
   */
  getSocrataSources(): MunicipalSource[] {
    return this.getApiSources().filter(source => source.api?.type === 'socrata');
  }

  /**
   * Get enabled sources only
   */
  getEnabledSources(): MunicipalSource[] {
    return this.getAllSources().filter(source => source.enabled !== false);
  }

  /**
   * Get sources for implementation (high priority, API-based)
   */
  getImplementationReadySources(): MunicipalSource[] {
    return this.getAllSources().filter(source => 
      source.priority === 'high' && 
      source.type === 'api' &&
      source.enabled !== false
    );
  }

  /**
   * Update source status
   */
  updateSourceStatus(id: string, updates: Partial<Pick<MunicipalSource, 'enabled' | 'lastChecked' | 'lastError'>>): void {
    const source = this.getSource(id);
    if (source) {
      Object.assign(source, updates);
    }
  }

  /**
   * Get registry metadata
   */
  getRegistryInfo(): { version: string; lastUpdated: string; totalSources: number } {
    return {
      version: this.registry.version,
      lastUpdated: this.registry.lastUpdated,
      totalSources: this.getAllSources().length
    };
  }

  /**
   * Search sources by name or ID
   */
  searchSources(query: string): MunicipalSource[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSources().filter(source => 
      source.id.toLowerCase().includes(lowerQuery) ||
      source.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get sources that cover a specific city/area
   */
  getSourcesForLocation(city: string, state?: string): MunicipalSource[] {
    const lowerCity = city.toLowerCase();
    
    return this.getAllSources().filter(source => {
      // Check if source name matches city
      if (source.name.toLowerCase().includes(lowerCity)) {
        return true;
      }
      
      // Check coverage area if specified
      if (source.coverage) {
        return source.coverage.some(area => 
          area.toLowerCase().includes(lowerCity)
        );
      }
      
      // Check state if provided
      if (state && source.state.toLowerCase() !== state.toLowerCase()) {
        return false;
      }
      
      return false;
    });
  }

  /**
   * Register a new source at runtime
   */
  registerSource(source: MunicipalSource): void {
    // Validate source has required fields
    if (!source.id || !source.name || !source.state || !source.type || !source.priority) {
      throw new Error('Source must have id, name, state, type, and priority');
    }

    // Check for duplicate IDs
    if (this.getSource(source.id)) {
      throw new Error(`Source with ID '${source.id}' already exists`);
    }

    // Add to runtime sources
    this.runtimeSources.set(source.id, {
      ...source,
      enabled: source.enabled !== false // Default to enabled
    });
  }

  /**
   * Unregister a runtime source
   */
  unregisterSource(id: string): boolean {
    return this.runtimeSources.delete(id);
  }

  /**
   * Check if a source is built-in or runtime-added
   */
  isBuiltInSource(id: string): boolean {
    // Check if source exists in built-in registry
    for (const state of ['ca', 'ny', 'fl'] as const) {
      const found = this.registry.sources[state].municipalities.find(source => source.id === id);
      if (found) return true;
    }
    return false;
  }

  /**
   * Get only built-in sources
   */
  getBuiltInSources(): MunicipalSource[] {
    const allSources: MunicipalSource[] = [];
    
    for (const state of ['ca', 'ny', 'fl'] as const) {
      const sources = this.registry.sources[state].municipalities.map(source => ({
        ...source,
        state: state.toUpperCase()
      }));
      allSources.push(...sources);
    }
    
    return allSources;
  }

  /**
   * Get only runtime sources
   */
  getRuntimeSources(): MunicipalSource[] {
    return Array.from(this.runtimeSources.values());
  }
}

// Default registry instance
export const sourceRegistry = new SourceRegistryManager();