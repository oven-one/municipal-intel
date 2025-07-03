/**
 * Mock registry data for testing
 */

import { SourceRegistry, MunicipalSource } from '../types/sources';

export const mockRegistryData: SourceRegistry = {
  version: '1.0.0-test',
  lastUpdated: '2025-01-30',
  sources: {
    ca: {
      name: 'California',
      municipalities: [
        {
          id: 'sf',
          name: 'San Francisco',
          state: 'CA',
          type: 'api',
          api: {
            type: 'socrata',
            baseUrl: 'https://data.sfgov.org',
            datasets: {
              buildingPermits: {
                endpoint: '/resource/i98e-djp9.json',
                name: 'Building Permits',
                fields: ['permit_number', 'permit_type', 'status', 'filed_date'],
                getFullAddress: (data) => data.address || 'Unknown Address',
                getDescription: (data) => `${data.permit_type || 'Permit'} at ${data.address || 'Unknown Address'}, San Francisco, CA`
              }
            },
            authentication: {
              required: false,
              recommended: true,
              type: 'app_token',
              header: 'X-App-Token'
            }
          },
          priority: 'high'
        },
        {
          id: 'la',
          name: 'Los Angeles',
          state: 'CA',
          type: 'api',
          api: {
            type: 'custom',
            baseUrl: 'https://data.lacity.org'
          },
          priority: 'medium'
        }
      ]
    },
    ny: {
      name: 'New York',
      municipalities: [
        {
          id: 'nyc',
          name: 'New York City',
          state: 'NY',
          type: 'api',
          api: {
            type: 'socrata',
            baseUrl: 'https://data.cityofnewyork.us',
            datasets: {
              buildingPermits: {
                endpoint: '/resource/ipu4-2q9a.json',
                name: 'DOB Job Application Filings',
                fields: ['job_', 'job_type', 'job_status', 'pre_filing_date'],
                getFullAddress: (data) => data.address || 'Unknown Address',
                getDescription: (data) => `${data.job_type || 'DOB Permit'} at ${data.address || 'Unknown Address'}, New York, NY`
              }
            }
          },
          priority: 'high'
        }
      ]
    },
    fl: {
      name: 'Florida',
      municipalities: [
        {
          id: 'miami',
          name: 'Miami',
          state: 'FL',
          type: 'portal',
          portal: {
            url: 'https://www.miamigov.com/permitting',
            system: 'accela'
          },
          priority: 'low'
        }
      ]
    }
  },
  commonFields: {
    required: ['id', 'address', 'status', 'submitDate'],
    optional: ['value', 'applicant', 'description'],
    typeEnum: ['permit', 'planning', 'construction']
  },
  implementationPriorities: {
    high: ['sf', 'nyc'],
    medium: ['la'],
    low: ['miami']
  }
};

export const mockSources: MunicipalSource[] = [
  {
    id: 'sf',
    name: 'San Francisco',
    state: 'CA',
    type: 'api',
    api: {
      type: 'socrata',
      baseUrl: 'https://data.sfgov.org',
      datasets: {
        buildingPermits: {
          endpoint: '/resource/i98e-djp9.json',
          name: 'Building Permits',
          fields: ['permit_number', 'permit_type', 'status', 'filed_date'],
          getFullAddress: (data) => data.address || 'Unknown Address',
          getDescription: (data) => `${data.permit_type || 'Permit'} at ${data.address || 'Unknown Address'}, San Francisco, CA`
        }
      }
    },
    priority: 'high'
  },
  {
    id: 'nyc',
    name: 'New York City',
    state: 'NY',
    type: 'api',
    api: {
      type: 'socrata',
      baseUrl: 'https://data.cityofnewyork.us'
    },
    priority: 'high'
  },
  {
    id: 'la',
    name: 'Los Angeles',
    state: 'CA',
    type: 'api',
    api: {
      type: 'custom',
      baseUrl: 'https://data.lacity.org'
    },
    priority: 'medium'
  },
  {
    id: 'miami',
    name: 'Miami',
    state: 'FL',
    type: 'portal',
    portal: {
      url: 'https://www.miamigov.com/permitting',
      system: 'accela'
    },
    priority: 'low'
  }
];