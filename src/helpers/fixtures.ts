/**
 * Test fixtures and sample data
 */

import { MunicipalProject, MunicipalSearchParams, MunicipalSearchResponse } from '../../src/types/projects';

export const sampleProjects: MunicipalProject[] = [
  {
    id: 'sf-2024-001',
    source: 'sf',
    description: 'Residential Addition: Addition to single family home at 123 Main St, San Francisco, CA (Issued) $50,000 filed 1/15/2024',
    url: 'https://municipal-intel.lineai.com/projects/sf/buildingPermits/2024-001',
    rawData: {
      permit_number: '2024-001',
      permit_type: 'Residential Addition',
      status: 'Issued',
      filed_date: '2024-01-15T00:00:00.000',
      issued_date: '2024-02-01T00:00:00.000',
      estimated_cost: '50000',
      street_number: '123',
      street_name: 'Main St',
      description: 'Addition to single family home',
      applicant_name: 'John Doe'
    },
    lastUpdated: new Date('2024-01-30')
  },
  {
    id: 'sf-2024-002',
    source: 'sf',
    description: 'Commercial Renovation: Office space renovation at 456 Commercial Ave, San Francisco, CA (Under Review) $250,000 filed 1/20/2024',
    url: 'https://municipal-intel.lineai.com/projects/sf/buildingPermits/2024-002',
    rawData: {
      permit_number: '2024-002',
      permit_type: 'Commercial Renovation',
      status: 'Under Review',
      filed_date: '2024-01-20T00:00:00.000',
      estimated_cost: '250000',
      street_number: '456',
      street_name: 'Commercial Ave',
      description: 'Office space renovation',
      applicant_name: 'ABC Corp'
    },
    lastUpdated: new Date('2024-01-30')
  },
  {
    id: 'nyc-2024-001',
    source: 'nyc',
    description: 'New Construction: New apartment building at 789 Broadway, Manhattan, New York, NY (Pending) $1,000,000 filed 1/25/2024',
    url: 'https://municipal-intel.lineai.com/projects/nyc/dobPermitIssuance/2024-001',
    rawData: {
      permit_number: '2024-001',
      job_type: 'New Construction',
      permit_status: 'Pending',
      filing_date: '2024-01-25T00:00:00.000',
      estimated_job_costs: '1000000',
      house__: '789',
      street_name: 'Broadway',
      borough: 'Manhattan',
      job_description: 'New apartment building',
      applicant: 'XYZ Development'
    },
    lastUpdated: new Date('2024-01-30')
  }
];

export const sampleSearchParams: MunicipalSearchParams = {
  types: ['permit'],
  statuses: ['approved', 'under_review'],
  submitDateFrom: new Date('2024-01-01'),
  submitDateTo: new Date('2024-12-31'),
  minValue: 1000,
  limit: 10,
  offset: 0,
  sortBy: 'submitDate',
  sortOrder: 'desc'
};

export const sampleSearchResponse: MunicipalSearchResponse = {
  projects: sampleProjects.slice(0, 2),
  total: 2,
  page: 1,
  pageSize: 10,
  hasMore: false,
  adjustments: []
};

export const invalidProjectData = {
  // Missing required fields
  missingId: {
    source: 'sf',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date()
  },
  
  // Invalid enum values
  invalidType: {
    id: 'test-1',
    source: 'sf',
    type: 'invalid-type',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date()
  },
  
  // Invalid status
  invalidStatus: {
    id: 'test-1',
    source: 'sf',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'invalid-status',
    submitDate: new Date()
  }
};

export const rawSocrataData = {
  buildingPermit: {
    permit_number: '2024-001',
    permit_type: 'Residential Addition',
    status: 'Issued',
    filed_date: '2024-01-15T00:00:00.000',
    issued_date: '2024-02-01T00:00:00.000',
    estimated_cost: '50000',
    street_number: '123',
    street_name: 'Main St',
    street_suffix: 'St',
    description: 'Addition to single family home',
    applicant_name: 'John Doe'
  },
  
  planningApplication: {
    record_id: 'PA-2024-001',
    project_name: 'Downtown Development',
    project_address: '100 Market St',
    project_description: 'Mixed-use development project',
    case_number: 'CASE-2024-001',
    filed_date: '2024-01-10T00:00:00.000'
  }
};