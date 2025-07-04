/**
 * Types for municipal data source configuration
 */

import { z } from 'zod';
import type {
  SFBuildingPermit,
  LACurrentBuildingPermit,
  LABuildingPermit,
  NYCDOBPermit,
  NYCDOBNowBuild
} from '../schemas/api-responses';

/**
 * Type of data access method
 */
export type SourceType = 'api' | 'portal' | 'scraping';

/**
 * API types we support
 */
export type ApiType = 'socrata' | 'arcgis' | 'custom';

/**
 * Portal system types
 */
export type PortalSystem = 'accela' | 'custom' | 'eBUILD' | 'ePermits' | 'MyJax';

/**
 * Implementation priority
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Union type for all supported dataset record types
 */
export type SocrataRecord =
  | SFBuildingPermit
  | LACurrentBuildingPermit
  | LABuildingPermit
  | NYCDOBPermit
  | NYCDOBNowBuild;

/**
 * Socrata dataset configuration with typed record support
 */
export interface SocrataDataset<T extends SocrataRecord = SocrataRecord> {
  endpoint: string;      // e.g., "/resource/i98e-djp9.json"
  name: string;          // Human-readable name
  fields: string[];      // Available fields
  fieldMappings?: Record<string, string>; // Mapping from logical fields to dataset fields
  getFullAddress: (data: T) => string; // Build complete address from strongly-typed data
  getDescription: (data: T) => string; // Build rich natural language description with full context
}

/**
 * API authentication configuration
 */
export interface ApiAuth {
  required: boolean;
  recommended?: boolean;
  type?: 'app_token' | 'api_key' | 'oauth';
  header?: string;       // Header name for token
}

/**
 * Rate limit configuration
 */
export interface RateLimit {
  limit?: number | 'unknown' | 'shared';
  period?: 'second' | 'minute' | 'hour' | 'day';
  withToken?: number;
  withoutToken?: number | 'shared';
}

/**
 * API source configuration
 */
export interface ApiSource {
  type: ApiType;
  baseUrl: string;
  datasets: Record<string, SocrataDataset<any>>;
  defaultDataset: string;  // Which dataset to use by default
  endpoints?: Record<string, string>;  // For custom APIs
  authentication?: ApiAuth;
  rateLimit?: RateLimit;
}

/**
 * Portal source configuration
 */
export interface PortalSource {
  url: string;
  system: PortalSystem;
  loginRequired?: boolean;
}

/**
 * Web scraping configuration
 */
export interface ScrapingSource {
  url: string;
  format?: 'html' | 'pdf';
  selectors?: Record<string, string>;
  hasPdfs?: boolean;
  requiresJS?: boolean;
}

/**
 * Municipality data source
 */
export interface MunicipalSource {
  id: string;            // Unique identifier
  name: string;          // Display name
  state: string;         // State code (CA, NY, FL)
  type: SourceType;      // How to access data

  // Type-specific config
  api?: ApiSource;
  portal?: PortalSource;
  scraping?: ScrapingSource;

  // Additional info
  urls?: Record<string, string>;  // Related URLs
  coverage?: string[];            // Areas covered
  updateFrequency?: string;       // How often updated
  priority: Priority;             // Implementation priority

  // Runtime info
  enabled?: boolean;              // Is this source active?
  lastChecked?: string;           // Last health check (ISO string)
  lastError?: string;            // Last error message
}

/**
 * Source registry
 */
export interface SourceRegistry {
  version: string;
  lastUpdated: string;
  sources: {
    ca: StateSources;
    ny: StateSources;
    fl: StateSources;
    [key: string]: StateSources;
  };
  commonFields: {
    required: string[];
    optional: string[];
    typeEnum: string[];
  };
  implementationPriorities: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

/**
 * State-level source grouping
 */
export interface StateSources {
  name: string;
  municipalities: MunicipalSource[];
}

/**
 * Zod schemas for validation
 */
export const ApiAuthSchema = z.object({
  required: z.boolean(),
  recommended: z.boolean().optional(),
  type: z.enum(['app_token', 'api_key', 'oauth']).optional(),
  header: z.string().optional()
});

export const RateLimitSchema = z.object({
  limit: z.union([z.number(), z.literal('unknown'), z.literal('shared')]).optional(),
  period: z.enum(['second', 'minute', 'hour', 'day']).optional(),
  withToken: z.number().optional(),
  withoutToken: z.union([z.number(), z.literal('shared')]).optional()
});

export const SocrataDatasetSchema = z.object({
  endpoint: z.string(),
  name: z.string(),
  fields: z.array(z.string()),
  fieldMappings: z.record(z.string()).optional(),
  getFullAddress: z.function().returns(z.string()),
  getDescription: z.function().returns(z.string())
});

export const ApiSourceSchema = z.object({
  type: z.enum(['socrata', 'arcgis', 'custom']),
  baseUrl: z.string().url(),
  datasets: z.record(SocrataDatasetSchema).optional(),
  endpoints: z.record(z.string()).optional(),
  authentication: ApiAuthSchema.optional(),
  rateLimit: RateLimitSchema.optional()
});

export const PortalSourceSchema = z.object({
  url: z.string().url(),
  system: z.enum(['accela', 'custom', 'eBUILD', 'ePermits', 'MyJax']),
  loginRequired: z.boolean().optional()
});

export const ScrapingSourceSchema = z.object({
  url: z.string().url(),
  format: z.enum(['html', 'pdf']).optional(),
  selectors: z.record(z.string()).optional(),
  hasPdfs: z.boolean().optional(),
  requiresJS: z.boolean().optional()
});

export const MunicipalSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string().length(2),
  type: z.enum(['api', 'portal', 'scraping']),

  api: ApiSourceSchema.optional(),
  portal: PortalSourceSchema.optional(),
  scraping: ScrapingSourceSchema.optional(),

  urls: z.record(z.string()).optional(),
  coverage: z.array(z.string()).optional(),
  updateFrequency: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),

  enabled: z.boolean().optional(),
  lastChecked: z.string().optional(),
  lastError: z.string().optional()
});
