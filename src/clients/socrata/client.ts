/**
 * Socrata API client for municipal data
 * Used by San Francisco, NYC, Oakland, Sacramento
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { MunicipalProject, MunicipalSearchParams, MunicipalSearchResponse } from '../../types/projects';
import { SocrataDataset } from '../../types/sources';
import { BaseClientConfig, BaseMunicipalClient, HealthCheck, MunicipalDataError, RateLimitError } from '../base-client';

/**
 * Socrata-specific configuration
 */
export interface SocrataClientConfig extends BaseClientConfig {
  appToken?: string;      // X-App-Token for better rate limits
  userAgent?: string;     // Custom User-Agent
}

/**
 * SoQL query parameters
 */
export interface SoQLQuery {
  $select?: string;       // Fields to select
  $where?: string;        // Filter conditions
  $order?: string;        // Sort order
  $limit?: number;        // Number of results
  $offset?: number;       // Skip results
  $q?: string;           // Full-text search
}

/**
 * Socrata API client
 */
export class SocrataClient extends BaseMunicipalClient {
  private readonly api: AxiosInstance;
  private readonly appToken?: string;
  private readonly resetTime: number = Date.now() + 60000; // 1 minute from now
  private readonly datasetConfig: SocrataDataset; // Current dataset configuration
  private readonly params: MunicipalSearchParams;

  constructor(config: SocrataClientConfig, params: MunicipalSearchParams) {
    super(config);

    if (!this.source.api || this.source.api.type !== 'socrata') {
      throw new Error('SocrataClient requires a source with api.type = "socrata"');
    }

    this.appToken = config.appToken;
    this.params = params;
    // const apiSource = this.source.api as ApiSource;
    this.datasetConfig = this.source.api.datasets[params.datasetId || this.source.api.defaultDataset];


    // Create axios instance
    this.api = axios.create({
      baseURL: this.source.api.baseUrl,
      timeout: this.timeout,
      headers: {
        'User-Agent': config.userAgent || 'municipal-intel/0.1.0',
        ...(this.appToken && { 'X-App-Token': this.appToken })
      }
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          const resetTime = this.resetTime;
          throw new RateLimitError(this.source.id, new Date(resetTime));
        }
        throw new MunicipalDataError(
          error.message,
          this.source.id,
          error.response?.status,
          error.response?.data
        );
      }
    );
  }

  /**
   * Execute a SoQL query against a dataset
   */
  private async query(sq: SoQLQuery = {}): Promise<any[]> {
    const response: AxiosResponse = await this.api.get(this.datasetConfig.endpoint, {
      params: this.cleanParams(sq)
    });

    this.log(`Retrieved ${response.data.length} records`);
    return response.data;
  }

  /**
   * Search for municipal projects
   */
  async search(): Promise<MunicipalSearchResponse> {
    const adjustments: string[] = [];
    const soqlQuery = this.buildSoQLQuery(adjustments);
    const data = await this.query(soqlQuery);
    const projects = data.map(item => this.normalizeProject(item));

    // Get total count if needed
    let total = projects.length;
    if (this.params.limit && projects.length === this.params.limit) {
      const countQuery = { ...soqlQuery, $select: 'count(*) as total', $limit: 1, $order: undefined };
      const countResult = await this.query(countQuery);
      total = parseInt(countResult[0]?.total || '0');
    }

    return {
      projects,
      total,
      page: Math.floor((this.params.offset || 0) / (this.params.limit || 100)) + 1,
      pageSize: this.params.limit || 100,
      hasMore: total > (this.params.offset || 0) + projects.length,
      adjustments
    };
  }

  /**
   * Get a project by its URL
   */
  async getByUrl(url: string): Promise<MunicipalProject | null> {
    try {
      // Extract the ID from the URL
      const id = this.extractIdFromUrl(url);
      if (!id) {
        return null;
      }
      
      return this.getProject(id);
    } catch (error) {
      console.warn(`Error getting project by URL ${url}: ${error}`);
      return null;
    }
  }

  /**
   * Extract project ID from a municipal-intel URL
   */
  private extractIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Expected format: /projects/{sourceId}/{datasetId}/{projectId}
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length >= 5 && pathParts[1] === 'projects') {
        return pathParts[4]; // Return the project ID part
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProject(id: string): Promise<MunicipalProject | null> {
    const idField = this.getIdField();

    if (!idField) {
      throw new MunicipalDataError(
        `Missing field mapping for 'id' in source ${this.source.id}. Please add to fieldMappings in registry.`,
        this.source.id
      );
    }

    const query: SoQLQuery = {
      $where: `${idField} = '${id.replace(`${this.source.id}-`, '')}'`,
      $limit: 1
    };

    const data = await this.query(query);
    return data.length > 0 ? this.normalizeProject(data[0]) : null;
  }

  /**
   * Get available project types
   */
  async getAvailableTypes(): Promise<string[]> {
    const typeField = this.getTypeField();

    if (!typeField) return [];

    const query: SoQLQuery = {
      $select: `distinct ${typeField}`,
      $limit: 1000
    };

    const data = await this.query(query);
    return data.map(item => item[typeField]).filter(Boolean);
  }

  /**
   * Check if the data source is healthy
   */
  async healthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simple health check - try to fetch one record
      const query: SoQLQuery = { $limit: 1 };
      await this.query(query);
      
      const latency = Date.now() - startTime;
      return {
        status: 'healthy',
        latency,
        lastChecked: new Date()
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      return {
        status: 'unhealthy',
        latency,
        error: error.message,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Build SoQL query from search parameters
   */
  private buildSoQLQuery(adjustments: string[] = []): SoQLQuery {
    const params = this.params;
    const query: SoQLQuery = {
      $limit: params.limit || 100,
      $offset: this.params.offset || 0,
      $order: this.buildOrderClause(params)
    };

    const whereConditions: string[] = [];

    // Date filters
    if (params.submitDateFrom) {
      const field = this.getDateField('submit');
      if (field) {
        this.validateDateParameter(params.submitDateFrom, 'submitDateFrom');
        // Socrata doesn't like Z timezone indicator, remove it
        const dateString = params.submitDateFrom.toISOString().replace('Z', '');
        whereConditions.push(`${field} >= '${dateString}'`);
      }
    }

    if (params.submitDateTo) {
      const field = this.getDateField('submit');
      if (field) {
        this.validateDateParameter(params.submitDateTo, 'submitDateTo');
        // Socrata doesn't like Z timezone indicator, remove it
        const dateString = params.submitDateTo.toISOString().replace('Z', '');
        whereConditions.push(`${field} <= '${dateString}'`);
      }
    }

    // Value filters
    if (params.minValue) {
      const field = this.getValueField();
      if (field) {
        // All Socrata sources store numeric values as text strings, requires casting
        whereConditions.push(`${field}::number >= ${params.minValue}`);
      } else {
        // No value field available - skip filter and record adjustment
        adjustments.push(`${this.source.id.toUpperCase()}: Skipped minValue filter - no value field available in dataset`);
      }
    }

    // Status filters
    if (params.statuses && params.statuses.length > 0) {
      const field = this.getStatusField();
      if (field) {
        const statusList = params.statuses.map(s => `'${s}'`).join(',');
        whereConditions.push(`${field} in (${statusList})`);
      }
    }

    // Address filters
    if (params.addresses && params.addresses.length > 0) {
      const field = this.getAddressField();
      if (field) {
        const addressConditions = params.addresses.map(addr =>
          `upper(${field}) like upper('%${addr}%')`
        );
        whereConditions.push(`(${addressConditions.join(' OR ')})`);
      }
    }

    // Keywords
    if (params.keywords && params.keywords.length > 0) {
      const searchText = params.keywords.join(' ');
      query.$q = searchText;
    }

    if (whereConditions.length > 0) {
      query.$where = whereConditions.join(' AND ');
    }

    return query;
  }

  /**
   * Clean query parameters (remove undefined values)
   */
  private cleanParams(sq: SoQLQuery): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(sq)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderClause(params: MunicipalSearchParams): string {
    const sortBy = params.sortBy || 'submitDate';
    const order = params.sortOrder || 'desc';

    const field = this.getFieldMapping(sortBy);
    if (!field) {
      // If field mapping not available, try to use a default field or skip ordering
      return `:created_at ${order}`; // Most Socrata datasets have this system field
    }
    return `${field} ${order}`;
  }

  /**
   * Get field mapping for this source (returns null if missing)
   */
  private getFieldMapping(logicalField: string): string | null {
    const mappings = this.datasetConfig?.fieldMappings;
    return mappings?.[logicalField] || null;
  }

  // Placeholder methods - would be implemented per source
  private getIdField(): string | null { return this.getFieldMapping('id'); }
  private getTypeField(): string | null { return this.getFieldMapping('title'); }
  private getDateField(type: 'submit' | 'approval'): string | null {
    return type === 'submit'
      ? this.getFieldMapping('submitDate')
      : this.getFieldMapping('approvalDate');
  }
  private getValueField(): string | null {
    return this.getFieldMapping('value');
  }
  private getStatusField(): string | null { return this.getFieldMapping('status'); }
  private getAddressField(): string | null { return this.getFieldMapping('address'); }

  /**
   * Normalize raw data to MunicipalProject using dataset-specific description
   */
  private normalizeProject(data: any): MunicipalProject {
    // Get ID field for unique identifier
    const idField = this.getFieldMapping('id');
    const id = idField ? data[idField] || 'unknown' : 'unknown';

    // Use dataset-specific description method
    let description = 'Municipal Project';
    if (this.datasetConfig?.getDescription) {
      try {
        description = this.datasetConfig.getDescription(data);
      } catch (error) {
        console.warn(`Error generating description for ${this.source.id}: ${error}`);
        description = `${this.source.name} Record`;
      }
    }

    return {
      id: `${this.source.id}-${id}`,
      source: this.source.id,
      description,
      url: this.generateProjectUrl(id),
      rawData: data,
      lastUpdated: new Date()
    };
  }

  /**
   * Generate a project URL for accessing full details
   */
  private generateProjectUrl(id: string): string {
    const datasetId = this.params.datasetId || this.source.api?.defaultDataset || 'default';
    return `https://municipal-intel.lineai.com/projects/${this.source.id}/${datasetId}/${id}`;
  }

  /**
   * Validate that date parameter is a proper Date object
   */
  private validateDateParameter(dateParam: any, paramName: string): void {
    if (!(dateParam instanceof Date)) {
      const actualType = Array.isArray(dateParam) ? 'array' : typeof dateParam;
      throw new MunicipalDataError(
        `Invalid ${paramName}: expected Date object, got ${actualType}. Use: new Date('2024-01-01') or new Date()`,
        this.source.id
      );
    }

    if (isNaN(dateParam.getTime())) {
      throw new MunicipalDataError(
        `Invalid ${paramName}: Date object contains invalid date. Check your date values.`,
        this.source.id
      );
    }
  }

}
