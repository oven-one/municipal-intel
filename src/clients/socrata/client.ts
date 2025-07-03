/**
 * Socrata API client for municipal data
 * Used by San Francisco, NYC, Oakland, Sacramento
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BaseMunicipalClient, BaseClientConfig, HealthCheck, MunicipalDataError, RateLimitError } from '../base-client';
import { MunicipalProject, MunicipalSearchParams, MunicipalSearchResponse } from '../../types/projects';
import { ApiSource } from '../../types/sources';

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
  private api: AxiosInstance;
  private appToken?: string;
  private requestCount: number = 0;
  private resetTime: number = Date.now() + 3600000; // 1 hour from now

  constructor(config: SocrataClientConfig) {
    super(config);

    if (!this.source.api || this.source.api.type !== 'socrata') {
      throw new Error('SocrataClient requires a source with api.type = "socrata"');
    }

    this.appToken = config.appToken;

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
        this.requestCount++;
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
  async query(dataset: string, params: SoQLQuery = {}): Promise<any[]> {
    // Check rate limits
    await this.checkRateLimit();

    const apiSource = this.source.api as ApiSource;
    const datasetConfig = apiSource.datasets?.[dataset];

    if (!datasetConfig) {
      throw new MunicipalDataError(
        `Dataset "${dataset}" not configured for source ${this.source.id}`,
        this.source.id
      );
    }

    this.log(`Querying dataset: ${dataset}`, params);

    const response: AxiosResponse = await this.api.get(datasetConfig.endpoint, {
      params: this.cleanParams(params)
    });

    this.log(`Retrieved ${response.data.length} records`);
    return response.data;
  }

  /**
   * Search for municipal projects
   */
  async search(params: MunicipalSearchParams): Promise<MunicipalSearchResponse> {
    const adjustments: string[] = [];
    const soqlQuery = this.buildSoQLQuery(params, adjustments);
    
    // Use specified dataset or fall back to default
    let dataset: string;
    if (params.datasetId) {
      const apiSource = this.source.api as ApiSource;
      if (!apiSource.datasets?.[params.datasetId]) {
        throw new MunicipalDataError(
          `Dataset '${params.datasetId}' not found for ${this.source.id}. Available: ${Object.keys(apiSource.datasets || {}).join(', ')}`,
          this.source.id
        );
      }
      dataset = params.datasetId;
    } else {
      dataset = this.getPrimaryDataset();
    }

    const data = await this.query(dataset, soqlQuery);
    const projects = data.map(item => this.normalizeProject(item));

    // Get total count if needed
    let total = projects.length;
    if (params.limit && projects.length === params.limit) {
      const countQuery = { ...soqlQuery, $select: 'count(*) as total', $limit: 1, $order: undefined };
      const countResult = await this.query(dataset, countQuery);
      total = parseInt(countResult[0]?.total || '0');
    }

    return {
      projects,
      total,
      page: Math.floor((params.offset || 0) / (params.limit || 100)) + 1,
      pageSize: params.limit || 100,
      hasMore: total > (params.offset || 0) + projects.length,
      adjustments
    };
  }

  /**
   * Get a specific project by ID
   */
  async getProject(id: string): Promise<MunicipalProject | null> {
    const dataset = this.getPrimaryDataset();
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

    const data = await this.query(dataset, query);
    return data.length > 0 ? this.normalizeProject(data[0]) : null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const dataset = this.getPrimaryDataset();
      await this.query(dataset, { $limit: 1 });

      return {
        status: 'healthy',
        latency: Date.now() - startTime,
        lastChecked: new Date()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Get available project types
   */
  async getAvailableTypes(): Promise<string[]> {
    const dataset = this.getPrimaryDataset();
    const typeField = this.getTypeField();

    if (!typeField) return [];

    const query: SoQLQuery = {
      $select: `distinct ${typeField}`,
      $limit: 1000
    };

    const data = await this.query(dataset, query);
    return data.map(item => item[typeField]).filter(Boolean);
  }

  /**
   * Build SoQL query from search parameters
   */
  private buildSoQLQuery(params: MunicipalSearchParams, adjustments: string[] = []): SoQLQuery {
    const query: SoQLQuery = {
      $limit: params.limit || 100,
      $offset: params.offset || 0,
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
   * Check rate limits and wait if necessary
   */
  private async checkRateLimit(): Promise<void> {
    // Reset counter every hour
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 3600000;
    }

    // Check if we're approaching the limit
    const limit = this.appToken ? 900 : 100; // Leave buffer
    if (this.requestCount >= limit) {
      const waitTime = this.resetTime - Date.now();
      this.log(`Rate limit reached. Waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.resetTime = Date.now() + 3600000;
    }
  }

  /**
   * Clean query parameters (remove undefined values)
   */
  private cleanParams(params: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Get the primary dataset for this source
   */
  private getPrimaryDataset(): string {
    const apiSource = this.source.api as ApiSource;
    const datasets = apiSource.datasets;

    if (!datasets) {
      throw new MunicipalDataError(`No datasets configured for ${this.source.id}`, this.source.id);
    }

    if (!apiSource.defaultDataset) {
      throw new MunicipalDataError(
        `No defaultDataset specified for ${this.source.id}. Please add defaultDataset to the API configuration.`,
        this.source.id
      );
    }

    if (!datasets[apiSource.defaultDataset]) {
      throw new MunicipalDataError(
        `Default dataset '${apiSource.defaultDataset}' not found in datasets for ${this.source.id}. Available: ${Object.keys(datasets).join(', ')}`,
        this.source.id
      );
    }

    return apiSource.defaultDataset;
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
    const dataset = this.getPrimaryDataset();
    const apiSource = this.source.api as ApiSource;
    const datasetConfig = apiSource.datasets?.[dataset];
    const mappings = datasetConfig?.fieldMappings;
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
    const dataset = this.getPrimaryDataset();
    const apiSource = this.source.api as ApiSource;
    const datasetConfig = apiSource.datasets?.[dataset];
    
    // Get ID field for unique identifier
    const idField = this.getFieldMapping('id');
    const id = idField ? data[idField] || 'unknown' : 'unknown';
    
    // Use dataset-specific description method
    let description = 'Municipal Project';
    if (datasetConfig?.getDescription) {
      try {
        description = datasetConfig.getDescription(data);
      } catch (error) {
        console.warn(`Error generating description for ${this.source.id}: ${error}`);
        description = `${this.source.name} Record`;
      }
    }

    return {
      id: `${this.source.id}-${id}`,
      source: this.source.id,
      description,
      rawData: data,
      lastUpdated: new Date()
    };
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
