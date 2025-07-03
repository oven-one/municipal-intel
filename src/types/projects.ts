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
 * Standardized municipal project interface
 */
export interface MunicipalProject {
  // Required fields
  id: string;              // Unique identifier (prefixed with source)
  source: string;          // Municipality code (e.g., 'sf', 'nyc')
  type: ProjectType;       // Type of project
  title: string;           // Project name or description
  address: string;         // Normalized address
  status: ProjectStatus;   // Current status
  submitDate: Date;        // Application/filing date

  // Optional fields
  approvalDate?: Date;     // When approved/issued
  expirationDate?: Date;   // When permit expires
  completionDate?: Date;   // When project completed
  
  value?: number;          // Estimated cost/value
  squareFootage?: number;  // Size of project
  units?: number;          // Number of units (for residential)
  
  applicant?: string;      // Applicant name
  applicantCompany?: string;
  contractor?: string;     // Contractor name
  contractorCompany?: string;
  architect?: string;      // Architect/engineer
  
  description?: string;    // Detailed description
  scope?: string;          // Scope of work
  
  documents?: ProjectDocument[];  // Related documents
  url?: string;           // Link to details page
  
  coordinates?: Coordinates;      // Geolocation
  parcel?: string;        // Parcel/lot number
  block?: string;         // Block number
  lot?: string;           // Lot number
  
  // Source-specific fields
  rawData?: any;          // Original data from source
  lastUpdated?: Date;     // When we last fetched this
}

/**
 * Search parameters for municipal projects
 */
export interface MunicipalSearchParams {
  // Location filters
  municipalityId?: KnownMunicipalityId; // Municipality ID ('sf', 'nyc', 'la')
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
  type: z.enum(['permit', 'planning', 'construction', 'renovation', 'demolition']),
  title: z.string(),
  address: z.string(),
  status: z.enum(['pending', 'under_review', 'approved', 'issued', 'active', 'completed', 'expired', 'cancelled', 'on_hold']),
  submitDate: z.date(),
  
  // Optional
  approvalDate: z.date().optional(),
  expirationDate: z.date().optional(),
  completionDate: z.date().optional(),
  
  value: z.number().optional(),
  squareFootage: z.number().optional(),
  units: z.number().optional(),
  
  applicant: z.string().optional(),
  applicantCompany: z.string().optional(),
  contractor: z.string().optional(),
  contractorCompany: z.string().optional(),
  architect: z.string().optional(),
  
  description: z.string().optional(),
  scope: z.string().optional(),
  
  documents: z.array(ProjectDocumentSchema).optional(),
  url: z.string().url().optional(),
  
  coordinates: CoordinatesSchema.optional(),
  parcel: z.string().optional(),
  block: z.string().optional(),
  lot: z.string().optional(),
  
  rawData: z.any().optional(),
  lastUpdated: z.date().optional()
});