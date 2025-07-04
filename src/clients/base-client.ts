/**
 * Base client interface for municipal data sources
 */

import { MunicipalProject, MunicipalSearchResponse } from '../types/projects';
import { MunicipalSource } from '../types/sources';

/**
 * Base configuration for all clients
 */
export interface BaseClientConfig {
  source: MunicipalSource;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

/**
 * Health check result
 */
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  lastChecked: Date;
}

/**
 * Abstract base class for municipal data clients
 */
export abstract class BaseMunicipalClient {
  protected source: MunicipalSource;
  protected timeout: number;
  protected retries: number;
  protected debug: boolean;

  constructor(config: BaseClientConfig) {
    this.source = config.source;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.debug = config.debug || false;
  }

  /**
   * Get the source configuration
   */
  getSource(): MunicipalSource {
    return this.source;
  }

  /**
   * Search for municipal projects
   */
  abstract search(): Promise<MunicipalSearchResponse>;

  /**
   * Get a specific project by ID
   */
  abstract getProject(id: string): Promise<MunicipalProject | null>;

  /**
   * Get a project by its URL
   */
  abstract getByUrl(url: string): Promise<MunicipalProject | null>;

  /**
   * Check if the data source is healthy
   */
  abstract healthCheck(): Promise<HealthCheck>;

  /**
   * Get available project types for this source
   */
  abstract getAvailableTypes(): Promise<string[]>;

  /**
   * Log debug message if debug mode enabled
   */
  protected log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[${this.source.id}] ${message}`, data || '');
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.retries,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) {
        throw error;
      }

      this.log(`Retrying after error: ${error}. ${retries} attempts remaining.`);
      await this.sleep(delay);
      return this.withRetry(fn, retries - 1, delay * 2);
    }
  }
}

/**
 * Error types for municipal data access
 */
export class MunicipalDataError extends Error {
  constructor(
    message: string,
    public source: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MunicipalDataError';
  }
}

export class AuthenticationError extends MunicipalDataError {
  constructor(source: string, details?: any) {
    super('Authentication failed', source, 401, details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends MunicipalDataError {
  constructor(source: string, resetTime?: Date) {
    super('Rate limit exceeded', source, 429, { resetTime });
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends MunicipalDataError {
  constructor(source: string, details?: any) {
    super('Service is temporarily unavailable', source, 503, details);
    this.name = 'ServiceUnavailableError';
  }
}
