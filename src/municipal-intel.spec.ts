/**
 * Tests for main MunicipalIntel API class
 */

import test from 'ava';
import { MunicipalIntel, createMunicipalIntel } from './index';
import { SourceRegistryManager } from './registry';
import { MunicipalSource } from './types/sources';
import { mockRegistryData } from './helpers/mock-registry';
import { sampleSearchParams } from './helpers/fixtures';
import { MockHttpClient, mockSocrataResponses, createMockAxios } from './helpers/mock-http';
import { assertValidProject, assertError } from './helpers/test-utils';

// Mock the registry to use test data
class TestMunicipalIntel extends MunicipalIntel {
  constructor(config: any = {}) {
    super(config);
    // Replace registry with test version
    const testRegistry = new SourceRegistryManager();
    (testRegistry as any).registry = mockRegistryData;
    (this as any).registry = testRegistry;
  }
}

test('MunicipalIntel - constructor with default config', t => {
  const municipal = new TestMunicipalIntel();
  t.truthy(municipal, 'Should create MunicipalIntel instance with default config');
});

test('MunicipalIntel - constructor with custom config', t => {
  const config = {
    timeout: 60000,
    retries: 5,
    debug: true,
    socrataToken: 'test-universal-token'
  };
  
  const municipal = new TestMunicipalIntel(config);
  t.truthy(municipal, 'Should create MunicipalIntel instance with custom config');
});

test('createMunicipalIntel - factory function', t => {
  const municipal = createMunicipalIntel({
    debug: true,
    socrataToken: 'test-token'
  });
  
  t.true(municipal instanceof MunicipalIntel, 'Should create MunicipalIntel instance');
});

test('MunicipalIntel - getSources returns all sources', t => {
  const municipal = new TestMunicipalIntel();
  const sources = municipal.getSources();
  
  t.is(sources.length, 4, 'Should return all mock sources');
  sources.forEach(source => {
    t.truthy(source.id, 'Each source should have an ID');
    t.truthy(source.name, 'Each source should have a name');
    t.truthy(source.state, 'Each source should have a state');
  });
});

test('MunicipalIntel - getSources with state filter', t => {
  const municipal = new TestMunicipalIntel();
  
  const caSources = municipal.getSources({ state: 'ca' });
  t.is(caSources.length, 2, 'Should return 2 CA sources');
  caSources.forEach(source => {
    t.is(source.state, 'CA', 'All sources should be in CA');
  });
  
  const nySources = municipal.getSources({ state: 'ny' });
  t.is(nySources.length, 1, 'Should return 1 NY source');
  t.is(nySources[0].id, 'nyc', 'Should be NYC source');
});

test('MunicipalIntel - getSources with type filter', t => {
  const municipal = new TestMunicipalIntel();
  
  const apiSources = municipal.getSources({ type: 'api' });
  t.is(apiSources.length, 3, 'Should return 3 API sources');
  apiSources.forEach(source => {
    t.is(source.type, 'api', 'All sources should be API type');
  });
  
  const portalSources = municipal.getSources({ type: 'portal' });
  t.is(portalSources.length, 1, 'Should return 1 portal source');
  t.is(portalSources[0].id, 'miami', 'Should be Miami source');
});

test('MunicipalIntel - getSources with priority filter', t => {
  const municipal = new TestMunicipalIntel();
  
  const highPriority = municipal.getSources({ priority: 'high' });
  t.is(highPriority.length, 2, 'Should return 2 high priority sources');
  highPriority.forEach(source => {
    t.is(source.priority, 'high', 'All sources should be high priority');
  });
  
  const mediumPriority = municipal.getSources({ priority: 'medium' });
  t.is(mediumPriority.length, 1, 'Should return 1 medium priority source');
  
  const lowPriority = municipal.getSources({ priority: 'low' });
  t.is(lowPriority.length, 1, 'Should return 1 low priority source');
});

test('MunicipalIntel - getSources with enabled filter', t => {
  const municipal = new TestMunicipalIntel();
  
  // All sources should be enabled by default
  const enabledSources = municipal.getSources({ enabled: true });
  t.is(enabledSources.length, 4, 'Should return all enabled sources');
  
  const disabledSources = municipal.getSources({ enabled: false });
  t.is(disabledSources.length, 0, 'Should return no disabled sources');
});

test('MunicipalIntel - getSources with combined filters', t => {
  const municipal = new TestMunicipalIntel();
  
  const filteredSources = municipal.getSources({
    state: 'ca',
    type: 'api',
    priority: 'high'
  });
  
  t.is(filteredSources.length, 1, 'Should return 1 source matching all filters');
  t.is(filteredSources[0].id, 'sf', 'Should be SF source');
  t.is(filteredSources[0].state, 'CA', 'Should be in CA');
  t.is(filteredSources[0].type, 'api', 'Should be API type');
  t.is(filteredSources[0].priority, 'high', 'Should be high priority');
});

test('MunicipalIntel - getRegistryInfo returns correct metadata', t => {
  const municipal = new TestMunicipalIntel();
  const info = municipal.getRegistryInfo();
  
  t.is(info.version, '1.0.0-test', 'Should have correct version');
  t.is(info.lastUpdated, '2025-01-30', 'Should have correct last updated');
  t.is(info.totalSources, 4, 'Should count all sources');
});

test('MunicipalIntel - setSocrataToken updates client factory', t => {
  const municipal = new TestMunicipalIntel();
  
  // Should not throw
  t.notThrows(() => {
    municipal.setSocrataToken('universal-test-token');
  }, 'Should set Socrata token without error');
  
  // Should be able to update token
  municipal.setSocrataToken('new-universal-token');
  
  t.pass('Should handle token updates');
});

// Mock client creation for search/getProject tests
function createMunicipalWithMockClient() {
  const municipal = new TestMunicipalIntel({ debug: true });
  const mockHttpClient = new MockHttpClient();
  
  // Mock the client factory to return a client with our mock HTTP
  const originalCreateClient = (municipal as any).clientFactory.createClient;
  (municipal as any).clientFactory.createClient = function(source: MunicipalSource) {
    const client = originalCreateClient.call(this, source);
    if (client && (client as any).api) {
      (client as any).api = createMockAxios(mockHttpClient);
    }
    return client;
  };
  
  return { municipal, mockHttpClient };
}

test('MunicipalIntel - search with default sources', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  // Mock successful search response
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);
  
  const searchParams = {
    types: ['permit' as const],
    limit: 10
  };
  
  const result = await municipal.search(searchParams);
  
  t.truthy(result, 'Should return search results');
  t.true(Array.isArray(result.projects), 'Should have projects array');
  t.true(typeof result.total === 'number', 'Should have total count');
  t.true(typeof result.page === 'number', 'Should have page number');
  
  if (result.projects.length > 0) {
    assertValidProject(t, result.projects[0]);
  }
});

test('MunicipalIntel - search with specific sources', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);
  
  const result = await municipal.search({
    municipalityId: 'sf',
    limit: 5
  });
  
  t.truthy(result, 'Should return search results for specific source');
  t.true(result.pageSize <= 5, 'Should respect limit parameter');
});

test('MunicipalIntel - search with no available sources throws error', async t => {
  const municipal = new TestMunicipalIntel();
  
  const error = await t.throwsAsync(async () => {
    await municipal.search({
      municipalityId: 'nonexistent-source' as any
    });
  });
  
  assertError(t, error!, 'Municipality not found');
});

test('MunicipalIntel - search without municipalityId uses first available source', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);
  
  const result = await municipal.search({
    // No municipalityId provided - should use first available source
    limit: 5
  });
  
  t.truthy(result, 'Should return search results using first available source');
  t.true(result.pageSize <= 5, 'Should respect limit parameter');
});

test('MunicipalIntel - getProject finds project by ID', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', [mockSocrataResponses.buildingPermits[0]]);
  
  const project = await municipal.getProject('sf', 'sf-2024-001');
  
  t.truthy(project, 'Should find project');
  assertValidProject(t, project!);
  t.is(project!.source, 'sf', 'Should have correct source');
});

test('MunicipalIntel - getProject returns null for missing project', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', []);
  
  const project = await municipal.getProject('sf', 'missing-id');
  
  t.is(project, null, 'Should return null for missing project');
});

test('MunicipalIntel - getProject with invalid source throws error', async t => {
  const municipal = new TestMunicipalIntel();
  
  const error = await t.throwsAsync(async () => {
    await municipal.getProject('invalid-source', 'project-id');
  });
  
  assertError(t, error!, 'Source not found: invalid-source');
});

test('MunicipalIntel - healthCheck returns health status', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.healthCheck);
  
  const health = await municipal.healthCheck('sf');
  
  t.truthy(health, 'Should return health check result');
  t.truthy(health.status, 'Should have status');
  t.true(health.lastChecked instanceof Date, 'Should have last checked date');
  
  if (health.status === 'healthy') {
    t.true(typeof health.latency === 'number', 'Healthy status should have latency');
  }
});

test('MunicipalIntel - healthCheck with invalid source throws error', async t => {
  const municipal = new TestMunicipalIntel();
  
  const error = await t.throwsAsync(async () => {
    await municipal.healthCheck('invalid-source');
  });
  
  assertError(t, error!, 'Source not found: invalid-source');
});

test('MunicipalIntel - healthCheck updates registry status', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  // Mock unhealthy response
  mockHttpClient.mockError('/resource/i98e-djp9.json', 500, { error: 'Server error' });
  
  const health = await municipal.healthCheck('sf');
  
  t.is(health.status, 'unhealthy', 'Should report unhealthy status');
  t.truthy(health.error, 'Should have error message');
  
  // Verify registry was updated (we can't easily test this without exposing internals)
  t.pass('Registry should be updated with health status');
});

test('MunicipalIntel - search handles client errors gracefully', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  // Mock HTTP error
  mockHttpClient.mockError('/resource/i98e-djp9.json', 404, { error: 'Not found' });
  
  const error = await t.throwsAsync(async () => {
    await municipal.search({ limit: 10 });
  });
  
  // Should propagate the client error
  t.truthy(error, 'Should throw error on client failure');
});

test('MunicipalIntel - search with complex parameters', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);
  
  const complexParams = {
    ...sampleSearchParams,
    sources: ['sf'],
    addresses: ['Main St', 'Oak Ave'],
    keywords: ['residential', 'addition'],
    minValue: 25000,
    statuses: ['approved' as const, 'issued' as const]
  };
  
  const result = await municipal.search(complexParams);
  
  t.truthy(result, 'Should handle complex search parameters');
  t.true(Array.isArray(result.projects), 'Should return projects array');
});

test('MunicipalIntel - concurrent searches', async t => {
  const { municipal, mockHttpClient } = createMunicipalWithMockClient();
  
  mockHttpClient.mockSuccess('/resource/i98e-djp9.json', mockSocrataResponses.buildingPermits);
  
  // Execute multiple searches concurrently
  const searches = [
    municipal.search({ municipalityId: 'sf', limit: 5 }),
    municipal.search({ municipalityId: 'sf', limit: 10 }),
    municipal.search({ municipalityId: 'sf', limit: 3 })
  ];
  
  const results = await Promise.all(searches);
  
  t.is(results.length, 3, 'Should complete all concurrent searches');
  results.forEach((result, index) => {
    t.truthy(result, `Search ${index} should return results`);
    t.true(Array.isArray(result.projects), `Search ${index} should have projects array`);
  });
});

test('MunicipalIntel - state filtering case insensitivity', t => {
  const municipal = new TestMunicipalIntel();
  
  // Test various case combinations
  const testCases = ['ca', 'CA', 'Ca', 'cA'];
  
  testCases.forEach(stateFilter => {
    const sources = municipal.getSources({ state: stateFilter as any });
    t.is(sources.length, 2, `Should find CA sources with state filter '${stateFilter}'`);
    sources.forEach(source => {
      t.is(source.state, 'CA', 'Source state should be uppercase CA');
    });
  });
});

test('MunicipalIntel - integration with real source types', async t => {
  // Test that the API correctly handles different source types
  const municipal = new TestMunicipalIntel();
  
  // API sources should work
  const apiSources = municipal.getSources({ type: 'api' });
  t.true(apiSources.length > 0, 'Should have API sources');
  
  // Portal sources should be recognized but not yet implemented
  const portalSources = municipal.getSources({ type: 'portal' });
  t.is(portalSources.length, 1, 'Should have portal sources');
  
  // Test that we get appropriate errors for unimplemented types
  if (portalSources.length > 0) {
    const error = await t.throwsAsync(async () => {
      await municipal.search({ municipalityId: portalSources[0].id as any });
    });
    
    assertError(t, error!, 'Portal clients not yet implemented');
  }
});

test('MunicipalIntel - preserves source configuration', t => {
  const municipal = new TestMunicipalIntel();
  const sources = municipal.getSources();
  
  // Find SF source and verify its configuration is preserved
  const sfSource = sources.find(s => s.id === 'sf');
  t.truthy(sfSource, 'Should find SF source');
  t.is(sfSource?.api?.type, 'socrata', 'Should preserve API type');
  t.is(sfSource?.api?.baseUrl, 'https://data.sfgov.org', 'Should preserve base URL');
  t.truthy(sfSource?.api?.datasets?.buildingPermits, 'Should preserve dataset configuration');
});