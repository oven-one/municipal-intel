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
    const dataset = this.getPrimaryDataset();

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
        whereConditions.push(`${field} >= '${params.submitDateFrom.toISOString()}'`);
      }
    }

    if (params.submitDateTo) {
      const field = this.getDateField('submit');
      if (field) {
        whereConditions.push(`${field} <= '${params.submitDateTo.toISOString()}'`);
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

    // Look for building permits first, then planning applications
    if (datasets.buildingPermits) return 'buildingPermits';
    if (datasets.planningApplications) return 'planningApplications';

    // Use the first available dataset
    const firstDataset = Object.keys(datasets)[0];
    if (firstDataset) return firstDataset;

    throw new MunicipalDataError(`No suitable dataset found for ${this.source.id}`, this.source.id);
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
    const mappings = this.source.api?.fieldMappings;
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
    const mappings = this.source.api?.fieldMappings;
    return mappings?.value || null;
  }
  private getStatusField(): string | null { return this.getFieldMapping('status'); }
  private getAddressField(): string | null { return this.getFieldMapping('address'); }

  /**
   * Normalize raw data to MunicipalProject
   * This would be implemented per source
   */
  private normalizeProject(data: any): MunicipalProject {
    // Get field mappings safely
    const idField = this.getFieldMapping('id');
    const titleField = this.getFieldMapping('title');
    const statusField = this.getFieldMapping('status');
    const submitDateField = this.getFieldMapping('submitDate');
    const approvalDateField = this.getFieldMapping('approvalDate');
    const valueField = this.getFieldMapping('value');
    const applicantField = this.getFieldMapping('applicant');
    const descriptionField = this.getFieldMapping('description');

    return {
      id: `${this.source.id}-${idField ? data[idField] || 'unknown' : 'unknown'}`,
      source: this.source.id,
      type: 'permit',
      title: titleField ? data[titleField] || 'Building Permit' : 'Building Permit',
      address: this.buildAddress(data),
      status: this.mapStatus(statusField ? data[statusField] : null),
      submitDate: this.parseDate(submitDateField ? data[submitDateField] : null),
      approvalDate: approvalDateField && data[approvalDateField] ? this.parseDate(data[approvalDateField]) : undefined,
      value: valueField && data[valueField] ? parseFloat(data[valueField]) : undefined,
      applicant: applicantField ? data[applicantField] : undefined,
      description: descriptionField ? data[descriptionField] : undefined,
      rawData: data,
      lastUpdated: new Date()
    };
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateString: string): Date {
    if (!dateString) return new Date();
    
    // Try parsing as-is (works for ISO format)
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    // Handle MM/DD/YYYY format (NYC)
    const mmddyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Fallback to current date if parsing fails
    console.warn(`Could not parse date: ${dateString}`);
    return new Date();
  }

  /**
   * Build normalized address
   */
  private buildAddress(data: any): string {
    const parts = [
      data.street_number,
      data.street_name,
      data.street_suffix
    ].filter(Boolean);

    return parts.join(' ') || data.address || 'Unknown Address';
  }

  /**
   * Map source status to normalized status
   */
  private mapStatus(status: string): any {
    if (!status) return 'pending';

    const normalized = status.toLowerCase();
    if (normalized.includes('issued') || normalized.includes('approved')) return 'approved';
    if (normalized.includes('pending') || normalized.includes('filed')) return 'pending';
    if (normalized.includes('complete')) return 'completed';
    if (normalized.includes('expired')) return 'expired';
    if (normalized.includes('cancelled')) return 'cancelled';

    return 'under_review';
  }
}
