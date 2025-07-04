/**
 * Core types for municipal projects (permits, planning applications, etc.)
 */

import { z } from 'zod';

/**
 * Known municipality IDs - strongly typed for built-in municipalities
 */
export type KnownMunicipalityId = 'sf' | 'nyc' | 'la';

/**
 * Valid search filter parameters
 */
export type ValidSearchFilter = 
  | 'minValue' 
  | 'maxValue' 
  | 'submitDateFrom' 
  | 'submitDateTo' 
  | 'approvalDateFrom' 
  | 'approvalDateTo' 
  | 'statuses' 
  | 'addresses' 
  | 'zipCodes' 
  | 'keywords';

/**
 * Valid sort field options
 */
export type ValidSortField = 'submitDate' | 'approvalDate' | 'value' | 'address';

/**
 * Valid field data types
 */
export type ValidFieldType = 'string' | 'number' | 'date';

/**
 * Type of municipal project
 */
export type ProjectType = 'permit' | 'planning' | 'construction' | 'renovation' | 'demolition';

/**
 * Status of a municipal project
 */
export type ProjectStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'issued'
  | 'active'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'on_hold';

/**
 * Document associated with a project
 */
export interface ProjectDocument {
  name: string;
  url: string;
  type?: string;
  size?: number;
  uploadDate?: Date;
}

/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Simplified municipal project interface optimized for AI consumption
 */
export interface MunicipalProject {
  // Required fields
  id: string;              // Unique identifier (prefixed with source)
  source: string;          // Municipality code (e.g., 'sf', 'nyc', 'la')
  description: string;     // Rich natural language description with full context
  url: string;             // Direct URL to access this project's full details
  
  // Source data
  rawData: any;           // Complete original data from source API
  lastUpdated: Date;      // When we last fetched this record
}

/**
 * Search parameters for municipal projects
 */
export interface MunicipalSearchParams {
  // Location filters
  municipalityId?: KnownMunicipalityId; // Municipality ID ('sf', 'nyc', 'la')
  datasetId?: string;      // Specific dataset to search (optional, uses default if not specified)
  addresses?: string[];    // Specific addresses
  zipCodes?: string[];     // ZIP codes
  
  // Project filters
  types?: ProjectType[];   // Project types
  statuses?: ProjectStatus[];  // Current statuses
  keywords?: string[];     // Keywords to search
  
  // Date filters
  submitDateFrom?: Date;   // Submitted after
  submitDateTo?: Date;     // Submitted before
  approvalDateFrom?: Date; // Approved after
  approvalDateTo?: Date;   // Approved before
  
  // Value filters
  minValue?: number;       // Minimum project value
  maxValue?: number;       // Maximum project value
  
  // Pagination
  limit?: number;          // Results per page
  offset?: number;         // Skip results
  
  // Sorting
  sortBy?: 'submitDate' | 'approvalDate' | 'value' | 'address';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Municipality information for discovery
 */
export interface MunicipalityInfo {
  id: KnownMunicipalityId;
  name: string;
  state: string;
  datasets: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Search capabilities for a municipality
 */
export interface SearchCapabilities {
  supportedFilters: ValidSearchFilter[];
  supportedSorts: ValidSortField[];
  limitations?: string[];
}

/**
 * Field schema information
 */
export interface FieldSchema {
  name: string;
  type: ValidFieldType;
  searchable: boolean;
  description?: string;
}

/**
 * Response from municipal search
 */
export interface MunicipalSearchResponse {
  projects: MunicipalProject[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  adjustments: string[];  // Messages about query modifications made during search
}

/**
 * Zod schemas for validation
 */
export const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

export const ProjectDocumentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string().optional(),
  size: z.number().optional(),
  uploadDate: z.date().optional()
});

export const MunicipalProjectSchema = z.object({
  // Required
  id: z.string(),
  source: z.string(),
  description: z.string(),
  
  // Source data
  rawData: z.any(),
  lastUpdated: z.date()
});