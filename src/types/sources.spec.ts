/**
 * Tests for source types and validation
 */

import test from 'ava';
import { 
  MunicipalSourceSchema,
  ApiSourceSchema,
  PortalSourceSchema,
  ScrapingSourceSchema,
  SocrataDatasetSchema,
  ApiAuthSchema,
  RateLimitSchema
} from './sources';
import { mockSources } from '../helpers/mock-registry';

test('MunicipalSourceSchema - validates valid API source', t => {
  const validApiSource = {
    id: 'test-api',
    name: 'Test API Source',
    state: 'CA',
    type: 'api',
    api: {
      type: 'socrata',
      baseUrl: 'https://data.example.gov',
      datasets: {
        permits: {
          endpoint: '/resource/abc123.json',
          name: 'Building Permits',
          fields: ['id', 'status', 'date']
        }
      },
      authentication: {
        required: false,
        recommended: true,
        type: 'app_token',
        header: 'X-App-Token'
      },
      rateLimit: {
        withToken: 1000,
        withoutToken: 100,
        period: 'hour'
      }
    },
    priority: 'high',
    enabled: true
  };

  const result = MunicipalSourceSchema.safeParse(validApiSource);
  t.true(result.success, 'Should validate valid API source');
  
  if (result.success) {
    t.is(result.data.id, 'test-api', 'Should preserve ID');
    t.is(result.data.type, 'api', 'Should preserve type');
    t.is(result.data.api?.type, 'socrata', 'Should preserve API type');
  }
});

test('MunicipalSourceSchema - validates valid portal source', t => {
  const validPortalSource = {
    id: 'test-portal',
    name: 'Test Portal Source',
    state: 'NY',
    type: 'portal',
    portal: {
      url: 'https://permits.example.gov',
      system: 'accela',
      loginRequired: true
    },
    priority: 'medium'
  };

  const result = MunicipalSourceSchema.safeParse(validPortalSource);
  t.true(result.success, 'Should validate valid portal source');
  
  if (result.success) {
    t.is(result.data.portal?.system, 'accela', 'Should preserve portal system');
    t.is(result.data.portal?.loginRequired, true, 'Should preserve login requirement');
  }
});

test('MunicipalSourceSchema - validates valid scraping source', t => {
  const validScrapingSource = {
    id: 'test-scraping',
    name: 'Test Scraping Source',
    state: 'FL',
    type: 'scraping',
    scraping: {
      url: 'https://permits.example.gov/search',
      format: 'html',
      selectors: {
        permitNumber: '.permit-id',
        status: '.status'
      },
      hasPdfs: true,
      requiresJS: false
    },
    priority: 'low'
  };

  const result = MunicipalSourceSchema.safeParse(validScrapingSource);
  t.true(result.success, 'Should validate valid scraping source');
  
  if (result.success) {
    t.is(result.data.scraping?.format, 'html', 'Should preserve scraping format');
    t.is(result.data.scraping?.hasPdfs, true, 'Should preserve PDF flag');
  }
});

test('MunicipalSourceSchema - rejects missing required fields', t => {
  const invalidSource = {
    name: 'Missing ID',
    state: 'CA',
    type: 'api',
    priority: 'high'
  };

  const result = MunicipalSourceSchema.safeParse(invalidSource);
  t.false(result.success, 'Should reject source missing ID');
  
  if (!result.success) {
    t.true(result.error.errors.some(e => e.path.includes('id')), 'Should report missing ID');
  }
});

test('MunicipalSourceSchema - rejects invalid state format', t => {
  const invalidStateSource = {
    id: 'test',
    name: 'Test',
    state: 'California', // Should be 2-letter code
    type: 'api',
    priority: 'high'
  };

  const result = MunicipalSourceSchema.safeParse(invalidStateSource);
  t.false(result.success, 'Should reject invalid state format');
});

test('MunicipalSourceSchema - rejects invalid enum values', t => {
  const invalidTypeSource = {
    id: 'test',
    name: 'Test',
    state: 'CA',
    type: 'invalid-type',
    priority: 'high'
  };

  const typeResult = MunicipalSourceSchema.safeParse(invalidTypeSource);
  t.false(typeResult.success, 'Should reject invalid type');

  const invalidPrioritySource = {
    id: 'test',
    name: 'Test',
    state: 'CA',
    type: 'api',
    priority: 'invalid-priority'
  };

  const priorityResult = MunicipalSourceSchema.safeParse(invalidPrioritySource);
  t.false(priorityResult.success, 'Should reject invalid priority');
});

test('ApiSourceSchema - validates Socrata API configuration', t => {
  const validSocrataApi = {
    type: 'socrata',
    baseUrl: 'https://data.example.gov',
    datasets: {
      permits: {
        endpoint: '/resource/abc123.json',
        name: 'Building Permits',
        fields: ['id', 'status']
      }
    },
    authentication: {
      required: false,
      type: 'app_token'
    },
    rateLimit: {
      withToken: 1000,
      period: 'hour'
    }
  };

  const result = ApiSourceSchema.safeParse(validSocrataApi);
  t.true(result.success, 'Should validate Socrata API config');
});

test('ApiSourceSchema - rejects invalid URL', t => {
  const invalidUrlApi = {
    type: 'socrata',
    baseUrl: 'not-a-url'
  };

  const result = ApiSourceSchema.safeParse(invalidUrlApi);
  t.false(result.success, 'Should reject invalid URL');
});

test('SocrataDatasetSchema - validates dataset configuration', t => {
  const validDataset = {
    endpoint: '/resource/abc123.json',
    name: 'Building Permits',
    fields: ['permit_id', 'status', 'filed_date', 'value']
  };

  const result = SocrataDatasetSchema.safeParse(validDataset);
  t.true(result.success, 'Should validate dataset config');
  
  if (result.success) {
    t.is(result.data.fields.length, 4, 'Should preserve fields array');
  }
});

test('SocrataDatasetSchema - rejects invalid dataset configuration', t => {
  const invalidDataset = {
    endpoint: '/resource/abc123.json',
    // Missing name
    fields: ['id']
  };

  const result = SocrataDatasetSchema.safeParse(invalidDataset);
  t.false(result.success, 'Should reject dataset missing name');
});

test('ApiAuthSchema - validates authentication configuration', t => {
  const validAuth = {
    required: true,
    recommended: false,
    type: 'app_token',
    header: 'X-App-Token'
  };

  const result = ApiAuthSchema.safeParse(validAuth);
  t.true(result.success, 'Should validate auth config');
});

test('ApiAuthSchema - validates minimal authentication configuration', t => {
  const minimalAuth = {
    required: false
  };

  const result = ApiAuthSchema.safeParse(minimalAuth);
  t.true(result.success, 'Should validate minimal auth config');
});

test('RateLimitSchema - validates rate limit configuration', t => {
  const validRateLimit = {
    limit: 1000,
    period: 'hour',
    withToken: 5000,
    withoutToken: 100
  };

  const result = RateLimitSchema.safeParse(validRateLimit);
  t.true(result.success, 'Should validate rate limit config');
});

test('RateLimitSchema - validates rate limit with string values', t => {
  const rateLimitWithStrings = {
    limit: 'unknown',
    withoutToken: 'shared'
  };

  const result = RateLimitSchema.safeParse(rateLimitWithStrings);
  t.true(result.success, 'Should validate rate limit with string values');
});

test('PortalSourceSchema - validates portal configuration', t => {
  const validPortal = {
    url: 'https://permits.example.gov',
    system: 'accela',
    loginRequired: true
  };

  const result = PortalSourceSchema.safeParse(validPortal);
  t.true(result.success, 'Should validate portal config');
});

test('PortalSourceSchema - rejects invalid portal system', t => {
  const invalidPortal = {
    url: 'https://permits.example.gov',
    system: 'invalid-system'
  };

  const result = PortalSourceSchema.safeParse(invalidPortal);
  t.false(result.success, 'Should reject invalid portal system');
});

test('ScrapingSourceSchema - validates scraping configuration', t => {
  const validScraping = {
    url: 'https://permits.example.gov',
    format: 'html',
    selectors: {
      id: '#permit-id',
      status: '.status'
    },
    hasPdfs: true,
    requiresJS: false
  };

  const result = ScrapingSourceSchema.safeParse(validScraping);
  t.true(result.success, 'Should validate scraping config');
});

test('ScrapingSourceSchema - validates minimal scraping configuration', t => {
  const minimalScraping = {
    url: 'https://permits.example.gov'
  };

  const result = ScrapingSourceSchema.safeParse(minimalScraping);
  t.true(result.success, 'Should validate minimal scraping config');
});

test('Schema validation with mock registry sources', t => {
  // Validate all mock sources pass schema validation
  mockSources.forEach((source, index) => {
    const result = MunicipalSourceSchema.safeParse(source);
    t.true(result.success, `Mock source ${index} (${source.id}) should pass validation`);
    
    if (!result.success) {
      console.log(`Validation errors for ${source.id}:`, result.error.errors);
    }
  });
});

test('Schema validation edge cases', t => {
  // Test empty strings
  const emptyStringSource = {
    id: '',
    name: '',
    state: '',
    type: 'api',
    priority: 'high'
  };

  const emptyResult = MunicipalSourceSchema.safeParse(emptyStringSource);
  t.false(emptyResult.success, 'Should reject empty strings');

  // Test null values
  const nullSource = {
    id: 'test',
    name: null,
    state: 'CA',
    type: 'api',
    priority: 'high'
  };

  const nullResult = MunicipalSourceSchema.safeParse(nullSource);
  t.false(nullResult.success, 'Should reject null values for required fields');
});

test('Nested schema validation', t => {
  // Test that nested schemas are properly validated
  const sourceWithInvalidNestedConfig = {
    id: 'test',
    name: 'Test',
    state: 'CA',
    type: 'api',
    api: {
      type: 'socrata',
      baseUrl: 'invalid-url', // Invalid URL
      datasets: {
        permits: {
          endpoint: '/test',
          // Missing name field
          fields: []
        }
      }
    },
    priority: 'high'
  };

  const result = MunicipalSourceSchema.safeParse(sourceWithInvalidNestedConfig);
  t.false(result.success, 'Should reject source with invalid nested configuration');
  
  if (!result.success) {
    // Should have errors for both URL and missing dataset name
    const errors = result.error.errors;
    t.true(errors.some(e => e.path.some(p => p === 'baseUrl')), 'Should report invalid URL');
    t.true(errors.some(e => e.path.some(p => p === 'name')), 'Should report missing dataset name');
  }
});

test('Optional fields validation', t => {
  // Test that optional fields can be omitted
  const minimalValidSource = {
    id: 'minimal',
    name: 'Minimal Source',
    state: 'CA',
    type: 'api',
    priority: 'high'
  };

  const result = MunicipalSourceSchema.safeParse(minimalValidSource);
  t.true(result.success, 'Should validate minimal source without optional fields');
});

test('Date field validation', t => {
  // Test date fields if any (like lastChecked)
  const sourceWithDate = {
    id: 'test',
    name: 'Test',
    state: 'CA',
    type: 'api',
    priority: 'high',
    lastChecked: new Date('2024-01-01')
  };

  const result = MunicipalSourceSchema.safeParse(sourceWithDate);
  t.true(result.success, 'Should validate source with date fields');
});

test('Complex API configuration validation', t => {
  // Test complex API configuration with all possible fields
  const complexApiSource = {
    id: 'complex',
    name: 'Complex API Source',
    state: 'CA',
    type: 'api',
    api: {
      type: 'socrata',
      baseUrl: 'https://data.example.gov',
      datasets: {
        permits: {
          endpoint: '/resource/permits.json',
          name: 'Building Permits',
          fields: ['id', 'status', 'date', 'value', 'address']
        },
        planning: {
          endpoint: '/resource/planning.json',
          name: 'Planning Applications',
          fields: ['id', 'type', 'status', 'submitted']
        }
      },
      authentication: {
        required: false,
        recommended: true,
        type: 'app_token',
        header: 'X-App-Token'
      },
      rateLimit: {
        limit: 1000,
        period: 'hour',
        withToken: 5000,
        withoutToken: 100
      }
    },
    urls: {
      portal: 'https://permits.example.gov',
      docs: 'https://docs.example.gov'
    },
    coverage: ['Downtown', 'Financial District'],
    updateFrequency: 'daily',
    priority: 'high',
    enabled: true
  };

  const result = MunicipalSourceSchema.safeParse(complexApiSource);
  t.true(result.success, 'Should validate complex API source configuration');
  
  if (result.success) {
    t.is(Object.keys(result.data.api!.datasets!).length, 2, 'Should preserve multiple datasets');
    t.is(result.data.coverage!.length, 2, 'Should preserve coverage array');
  }
});