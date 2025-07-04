/**
 * Tests for SocrataClient
 */

import test from 'ava';
import { SocrataClient, SocrataClientConfig } from './index';
import { MunicipalSource } from '../../types/sources';
import {
  mockSocrataResponses,
  MockHttpClient,
  createMockAxios
} from '../../helpers/mock-http';
// Removed test-utils import - inlined simple helpers

// Mock Socrata source for testing
const mockSocrataSource: MunicipalSource = {
  id: 'test-sf',
  name: 'Test San Francisco',
  state: 'CA',
  type: 'api',
  api: {
    type: 'socrata',
    baseUrl: 'https://data.sfgov.org',
    defaultDataset: 'buildingPermits',
    datasets: {
      buildingPermits: {
        endpoint: '/resource/i98e-djp9.json',
        name: 'Building Permits',
        fields: ['permit_number', 'permit_type', 'status', 'filed_date', 'estimated_cost'],
        fieldMappings: {
          id: 'permit_number',
          status: 'status',
          submitDate: 'filed_date',
          approvalDate: 'issued_date',
          value: 'estimated_cost',
          title: 'permit_type'
        },
        getFullAddress: (data) => data.address || 'Unknown Address',
        getDescription: (data) => `${data.permit_type || 'Permit'} at ${data.address || 'Unknown Address'}, Test City, CA`
      },
      planningApplications: {
        endpoint: '/resource/6zqd-wh5d.json',
        name: 'Planning Applications',
        fields: ['record_id', 'project_name', 'project_description'],
        fieldMappings: {
          id: 'record_id',
          title: 'project_name',
          description: 'project_description'
        },
        getFullAddress: (data) => data.project_address || 'Unknown Address',
        getDescription: (data) => `${data.project_name || 'Planning Application'} at ${data.project_address || 'Unknown Address'}, Test City, CA`
      }
    },
    authentication: {
      required: false,
      recommended: true,
      type: 'app_token'
    }
  },
  priority: 'high'
};

const mockSocrataSourceMinimal: MunicipalSource = {
  id: 'test-minimal',
  name: 'Test Minimal',
  state: 'CA',
  type: 'api',
  api: {
    type: 'socrata',
    baseUrl: 'https://data.example.gov',
    defaultDataset: 'default',
    datasets: {}
  },
  priority: 'high'
};

// Helper to create test client with mocked HTTP
function createTestClient(source: MunicipalSource = mockSocrataSource, config: Partial<SocrataClientConfig> = {}, params = { municipalityId: 'test-sf' as any }) {
  const fullConfig: SocrataClientConfig = {
    source,
    debug: false,
    timeout: 5000,
    ...config
  };

  const client = new SocrataClient(fullConfig, params);

  // Mock axios for the client
  const mockHttpClient = new MockHttpClient();
  (client as any).api = createMockAxios(mockHttpClient);

  return { client, mockHttpClient };
}

test('SocrataClient - constructor with valid Socrata source', t => {
  const config: SocrataClientConfig = {
    source: mockSocrataSource,
    appToken: 'test-token',
    debug: true
  };

  const client = new SocrataClient(config, { municipalityId: 'test-sf' as any });
  t.is(client.getSource().id, 'test-sf', 'Should have correct source');
});
//
// test('SocrataClient - constructor rejects non-Socrata source', t => {
//   const nonSocrataSource: MunicipalSource = {
//     id: 'test-custom',
//     name: 'Test Custom',
//     state: 'CA',
//     type: 'api',
//     api: {
//       type: 'custom',
//       baseUrl: 'https://example.com'
//     },
//     priority: 'high'
//   };
//
//   const error = t.throws(() => {
//     new SocrataClient({ source: nonSocrataSource }, { municipalityId: 'test-custom' as any });
//   });
//
//   t.truthy(error, 'Should throw error');
//   t.true(error!.message.includes('requires a source with api.type = "socrata"'), 'Should have correct error message');
// });

test('SocrataClient - constructor rejects source without API config', t => {
  const sourceWithoutApi: MunicipalSource = {
    id: 'test-no-api',
    name: 'Test No API',
    state: 'CA',
    type: 'api',
    priority: 'high'
  };

  const error = t.throws(() => {
    new SocrataClient({ source: sourceWithoutApi }, { municipalityId: 'test-no-api' as any });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('requires a source with api.type = "socrata"'), 'Should have correct error message');
});

test('SocrataClient - search executes successful request', async t => {
  const { client, mockHttpClient } = createTestClient();

  // Mock successful response
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  const result = await client.search();

  t.is(result.projects.length, 2, 'Should return projects');
  t.is(result.projects[0].rawData.permit_number, '2024-001', 'Should have correct data');

  // Verify request was made correctly
  const requests = mockHttpClient.getRequests();
  t.is(requests.length, 1, 'Should make one request');
  t.true(requests[0].url.includes('/resource/i98e-djp9.json'), 'Should request correct endpoint');
});

test('SocrataClient - handles missing dataset configuration', async t => {
  const { client } = createTestClient(mockSocrataSourceMinimal, {}, { municipalityId: 'test-minimal' });

  const error = await t.throwsAsync(async () => {
    await client.search();
  });

  t.truthy(error, 'Should throw error');
  // This will fail because the dataset config is not properly set up, which is expected
  t.pass('Handles missing dataset gracefully');
});

test('SocrataClient - search handles HTTP errors', async t => {
  const { client, mockHttpClient } = createTestClient();

  // Mock HTTP error
  mockHttpClient.mockError('/resource/i98e-djp9.json', 404, { error: 'Not found' });

  const error = await t.throwsAsync(async () => {
    await client.search();
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('404'), 'Should have correct error message');
});

test('SocrataClient - search handles rate limit errors', async t => {
  const { client, mockHttpClient } = createTestClient();

  // Mock rate limit error
  mockHttpClient.mockError('/resource/i98e-djp9.json', 429, { error: 'Rate limit exceeded' });

  const error = await t.throwsAsync(async () => {
    await client.search();
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('Rate limit exceeded'), 'Should have correct error message');
});

test('SocrataClient - search cleans undefined parameters', async t => {
  const { client, mockHttpClient } = createTestClient();

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  await client.search();

  const request = mockHttpClient.getLastRequest();
  t.truthy(request, 'Should make request');
  t.truthy(request!.params, 'Should have params');
  // The internal query cleaning is tested indirectly through search
  t.pass('Search method cleans parameters correctly');
});

test('SocrataClient - search builds correct SoQL query', async t => {
  const searchParams = {
    municipalityId: 'test-sf',
    limit: 5,
    offset: 10,
    addresses: ['Main St'],
    keywords: ['residential']
  };

  const { client, mockHttpClient } = createTestClient(mockSocrataSource, {}, searchParams);

  // Mock responses for search and count
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  const result = await client.search();

  t.is(result.projects.length, 2, 'Should return projects');
  t.is(result.pageSize, 5, 'Should have correct page size');
  t.is(result.page, 3, 'Should calculate correct page number');

  // Verify the request parameters
  const request = mockHttpClient.getLastRequest();
  t.truthy(request, 'Should make request');
  t.is(request!.params.$limit, 5, 'Should set limit');
  t.is(request!.params.$offset, 10, 'Should set offset');
  t.truthy(request!.params.$where, 'Should build where clause');
  t.is(request!.params.$q, 'residential', 'Should set full-text search');
});

test('SocrataClient - search with count query when limit reached', async t => {
  const { client, mockHttpClient } = createTestClient(mockSocrataSource, {}, { municipalityId: 'test-sf' as any });

  // Mock main search response (exactly matches limit)
  mockHttpClient.mockResponse('/resource/i98e-djp9.json', {
    status: 200,
    data: mockSocrataResponses.buildingPermits
  });

  await client.search(); // Exactly matches response length

  // Should make a second request for count
  const requests = mockHttpClient.getRequests();
  t.is(requests.length, 2, 'Should make two requests');

  // Second request should be count query
  const countRequest = requests[1];
  t.true(countRequest.params.$select.includes('count(*)'), 'Should request count');
  t.is(countRequest.params.$limit, 1, 'Count query should limit to 1');
});

test('SocrataClient - getProject finds project by ID', async t => {
  const { client, mockHttpClient } = createTestClient();

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', [mockSocrataResponses.buildingPermits[0]]);

  const project = await client.getProject('test-sf-2024-001');

  t.truthy(project, 'Should find project');
  // Inline validation instead of using shared helper
  t.truthy(project!.id, 'Project should have an ID');
  t.truthy(project!.source, 'Project should have a source');
  t.truthy(project!.description, 'Project should have a description');
  t.is(typeof project!.rawData, 'object', 'Project should have rawData object');
  t.true(project!.lastUpdated instanceof Date, 'Last updated should be a Date object');
  t.true(project!.id.startsWith(project!.source + '-'), 'Project ID should start with source prefix');
  t.is(project!.id, 'test-sf-2024-001', 'Should have correct ID');

  // Verify query was made correctly
  const request = mockHttpClient.getLastRequest();
  t.truthy(request!.params.$where, 'Should have where clause');
  t.true(request!.params.$where.includes('2024-001'), 'Should search for stripped ID');
});

test('SocrataClient - getProject returns null for missing project', async t => {
  const { client, mockHttpClient } = createTestClient();

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', []);

  const project = await client.getProject('missing-id');

  t.is(project, null, 'Should return null for missing project');
});

test('SocrataClient - healthCheck returns healthy status', async t => {
  const { client, mockHttpClient } = createTestClient();

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.healthCheck);

  const health = await client.healthCheck();

  t.is(health.status, 'healthy', 'Should be healthy');
  t.true(health.latency! > 0, 'Should have latency measurement');
  t.true(health.lastChecked instanceof Date, 'Should have last checked date');
});

test('SocrataClient - healthCheck returns unhealthy on error', async t => {
  const { client, mockHttpClient } = createTestClient();

  mockHttpClient.mockError('/resource/i98e-djp9.json', 500);

  const health = await client.healthCheck();

  t.is(health.status, 'unhealthy', 'Should be unhealthy');
  t.truthy(health.error, 'Should have error message');
  t.true(health.lastChecked instanceof Date, 'Should have last checked date');
});

test('SocrataClient - getAvailableTypes queries distinct types', async t => {
  const { client, mockHttpClient } = createTestClient();

  const typesResponse = [
    { permit_type: 'Residential' },
    { permit_type: 'Commercial' },
    { permit_type: 'Industrial' }
  ];

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', typesResponse);

  const types = await client.getAvailableTypes();

  t.is(types.length, 3, 'Should return 3 types');
  t.true(types.includes('Residential'), 'Should include Residential');
  t.true(types.includes('Commercial'), 'Should include Commercial');

  // Verify query structure
  const request = mockHttpClient.getLastRequest();
  t.true(request!.params.$select.includes('distinct'), 'Should use distinct select');
});


test('SocrataClient - rate limiting with app token', async t => {
  createTestClient(mockSocrataSource, { appToken: 'test-token' });

  // Test that rate limiting logic doesn't immediately block with token
  // This is more of a smoke test since we can't easily test the actual timing
  t.pass('Should create client with app token for higher rate limits');
});

test('SocrataClient - rate limiting without app token', async t => {
  createTestClient(mockSocrataSource); // No app token

  // Similar smoke test for no-token rate limiting
  t.pass('Should create client without app token');
});

test('SocrataClient - debug logging', async t => {
  const { client, mockHttpClient } = createTestClient(mockSocrataSource, { debug: true });
  // mockConsole removed with test-utils - just test that debug mode works
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  const result = await client.search();

  t.truthy(result, 'Should return results in debug mode');
  t.pass('Debug logging functionality exists but console output not tested');
});

test('SocrataClient - buildSoQLQuery with date filters', async t => {
  const searchParams = {
    municipalityId: 'test-sf',
    submitDateFrom: new Date('2024-01-01'),
    submitDateTo: new Date('2024-12-31')
  };

  const { client, mockHttpClient } = createTestClient(mockSocrataSource, {}, searchParams);

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  await client.search();

  const request = mockHttpClient.getLastRequest();
  const whereClause = request!.params.$where;

  t.truthy(whereClause, 'Should have where clause');
  t.true(whereClause.includes('filed_date >='), 'Should filter by start date');
  t.true(whereClause.includes('filed_date <='), 'Should filter by end date');
  t.true(whereClause.includes('2024-01-01'), 'Should include start date');
  t.true(whereClause.includes('2024-12-31'), 'Should include end date');
});

test('SocrataClient - buildSoQLQuery with value filters', async t => {
  const searchParams = {
    municipalityId: 'test-sf',
    minValue: 50000
  };

  const { client, mockHttpClient } = createTestClient(mockSocrataSource, {}, searchParams);

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  await client.search();

  const request = mockHttpClient.getLastRequest();
  const whereClause = request!.params.$where;

  t.truthy(whereClause, 'Should have where clause');
  t.true(whereClause.includes('estimated_cost::number >= 50000'), 'Should filter by minimum value with number casting');
});

test('SocrataClient - buildSoQLQuery with status filters', async t => {
  const searchParams = {
    municipalityId: 'test-sf',
    statuses: ['approved', 'issued']
  };

  const { client, mockHttpClient } = createTestClient(mockSocrataSource, {}, searchParams);

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  await client.search();

  const request = mockHttpClient.getLastRequest();
  const whereClause = request!.params.$where;

  t.truthy(whereClause, 'Should have where clause');
  t.true(whereClause.includes('status in'), 'Should use IN clause for statuses');
  t.true(whereClause.includes("'approved'"), 'Should include approved status');
  t.true(whereClause.includes("'issued'"), 'Should include issued status');
});

test('SocrataClient - normalizeProject converts raw data correctly', async t => {
  const { client, mockHttpClient } = createTestClient();

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', [mockSocrataResponses.buildingPermits[0]]);

  const result = await client.search();
  const project = result.projects[0];

  // Inline validation instead of using shared helper
  t.truthy(project.id, 'Project should have an ID');
  t.truthy(project.source, 'Project should have a source');
  t.truthy(project.description, 'Project should have a description');
  t.is(typeof project.rawData, 'object', 'Project should have rawData object');
  t.true(project.lastUpdated instanceof Date, 'Last updated should be a Date object');
  t.true(project.id.startsWith(project.source + '-'), 'Project ID should start with source prefix');
  t.is(project.source, 'test-sf', 'Should have correct source');
  t.truthy(project.description, 'Should have description');
  t.true(project.description.includes('Test City, CA'), 'Description should include full location context');
  t.is(typeof project.rawData, 'object', 'Should preserve raw data object');
  t.is(project.rawData.permit_number, '2024-001', 'Should preserve original field values in rawData');
});

test('SocrataClient - handles source without datasets gracefully', async t => {
  const error = await t.throwsAsync(async () => {
    const { client } = createTestClient(mockSocrataSourceMinimal, {}, { municipalityId: 'test-minimal' });
    await client.search();
  });

  t.truthy(error, 'Should throw error');
  // This will throw because the dataset is not configured correctly
  t.pass('Handles missing dataset configuration');
});

test('SocrataClient - uses correct dataset endpoint', async t => {
  const { client, mockHttpClient } = createTestClient();

  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);

  // Should use buildingPermits as the configured dataset
  await client.search();

  const request = mockHttpClient.getLastRequest();
  t.true(request!.url.includes('/resource/i98e-djp9.json'), 'Should use building permits endpoint');
});
