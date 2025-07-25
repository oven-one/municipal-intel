/**
 * Municipal data clients
 */

export * from './base-client';
export * from './socrata';

import { MunicipalSearchParams } from '../types';
import { BaseMunicipalClient, BaseClientConfig } from './base-client';
import { SocrataClient, SocrataClientConfig } from './socrata';
import { MunicipalSource } from '../types/sources';

/**
 * Client configuration with authentication tokens
 */
export interface ClientFactoryConfig {
  timeout?: number;
  retries?: number;
  debug?: boolean;

  // Universal Socrata token (works across all portals)
  socrataToken?: string;
}

/**
 * Factory to create appropriate client for a municipal source
 */
export class ClientFactory {
  private config: ClientFactoryConfig;

  constructor(config: ClientFactoryConfig = {}) {
    this.config = config;
  }

  /**
   * Create a client for the given municipal source
   */
  createClient(source: MunicipalSource, params: MunicipalSearchParams): BaseMunicipalClient {
    const baseConfig: BaseClientConfig = {
      source,
      timeout: this.config.timeout,
      retries: this.config.retries,
      debug: this.config.debug
    };

    switch (source.type) {
      case 'api':
        return this.createApiClient(baseConfig, params);

      case 'portal':
        // TODO: Implement portal clients
        throw new Error(`Portal clients not yet implemented for ${source.id}`);

      case 'scraping':
        // TODO: Implement scraping clients
        throw new Error(`Scraping clients not yet implemented for ${source.id}`);

      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  }

  /**
   * Create API client based on API type
   */
  private createApiClient(baseConfig: BaseClientConfig, params: MunicipalSearchParams): BaseMunicipalClient {
    if (!baseConfig.source.api) {
      throw new Error(`API configuration missing for ${baseConfig.source.id}`);
    }

    switch (baseConfig.source.api.type) {
      case 'socrata':
        const socrataConfig: SocrataClientConfig = {
          ...baseConfig,
          appToken: this.config.socrataToken
        };
        return new SocrataClient(socrataConfig, params);

      case 'arcgis':
        // TODO: Implement ArcGIS client
        throw new Error(`ArcGIS clients not yet implemented`);

      case 'custom':
        // TODO: Implement custom API clients
        throw new Error(`Custom API clients not yet implemented for ${baseConfig.source.id}`);

      default:
        throw new Error(`Unknown API type: ${baseConfig.source.api.type}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ClientFactoryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set universal Socrata token
   */
  setSocrataToken(token: string): void {
    this.config.socrataToken = token;
  }
}
