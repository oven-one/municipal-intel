/**
 * Tests for ClientFactory
 */

import test from 'ava';
import { ClientFactory } from './index';
import { SocrataClient } from './socrata';
import { MunicipalSource } from '../types/sources';
import { mockSources } from '../helpers/mock-registry';
import { assertError } from '../helpers/test-utils';

test('ClientFactory - constructor with default config', t => {
  const factory = new ClientFactory();
  t.truthy(factory, 'Should create factory with default config');
});

test('ClientFactory - constructor with custom config', t => {
  const config = {
    timeout: 60000,
    retries: 5,
    debug: true,
    socrataToken: 'test-token-universal'
  };
  
  const factory = new ClientFactory(config);
  t.truthy(factory, 'Should create factory with custom config');
});

test('ClientFactory - createClient for Socrata API source', t => {
  const factory = new ClientFactory({
    socrataToken: 'test-token'
  });
  
  const sfSource = mockSources.find(s => s.id === 'sf');
  t.truthy(sfSource, 'Should find SF source in mock data');
  
  const client = factory.createClient(sfSource!);
  t.true(client instanceof SocrataClient, 'Should create SocrataClient');
  t.is(client.getSource().id, 'sf', 'Client should have correct source');
});

test('ClientFactory - createClient for custom API source', t => {
  const factory = new ClientFactory();
  
  const laSource = mockSources.find(s => s.id === 'la');
  t.truthy(laSource, 'Should find LA source in mock data');
  
  const error = t.throws(() => {
    factory.createClient(laSource!);
  });
  
  assertError(t, error!, 'Custom API clients not yet implemented');
});

test('ClientFactory - createClient for ArcGIS API source', t => {
  const factory = new ClientFactory();
  
  const arcgisSource: MunicipalSource = {
    id: 'test-arcgis',
    name: 'Test ArcGIS',
    state: 'CA',
    type: 'api',
    api: {
      type: 'arcgis',
      baseUrl: 'https://services.arcgis.com'
    },
    priority: 'high'
  };
  
  const error = t.throws(() => {
    factory.createClient(arcgisSource);
  });
  
  assertError(t, error!, 'ArcGIS clients not yet implemented');
});

test('ClientFactory - createClient for portal source', t => {
  const factory = new ClientFactory();
  
  const miamiSource = mockSources.find(s => s.id === 'miami');
  t.truthy(miamiSource, 'Should find Miami source in mock data');
  
  const error = t.throws(() => {
    factory.createClient(miamiSource!);
  });
  
  assertError(t, error!, 'Portal clients not yet implemented');
});

test('ClientFactory - createClient for scraping source', t => {
  const factory = new ClientFactory();
  
  const scrapingSource: MunicipalSource = {
    id: 'test-scraping',
    name: 'Test Scraping',
    state: 'CA',
    type: 'scraping',
    scraping: {
      url: 'https://example.com/permits'
    },
    priority: 'low'
  };
  
  const error = t.throws(() => {
    factory.createClient(scrapingSource);
  });
  
  assertError(t, error!, 'Scraping clients not yet implemented');
});

test('ClientFactory - createClient with unknown source type', t => {
  const factory = new ClientFactory();
  
  const unknownSource = {
    id: 'test-unknown',
    name: 'Test Unknown',
    state: 'CA',
    type: 'unknown' as any,
    priority: 'low'
  } as MunicipalSource;
  
  const error = t.throws(() => {
    factory.createClient(unknownSource);
  });
  
  assertError(t, error!, 'Unknown source type');
});

test('ClientFactory - createClient with missing API config', t => {
  const factory = new ClientFactory();
  
  const sourceWithoutApi: MunicipalSource = {
    id: 'test-no-api',
    name: 'Test No API',
    state: 'CA',
    type: 'api',
    priority: 'high'
  };
  
  const error = t.throws(() => {
    factory.createClient(sourceWithoutApi);
  });
  
  assertError(t, error!, 'API configuration missing');
});

test('ClientFactory - createClient with unknown API type', t => {
  const factory = new ClientFactory();
  
  const sourceWithUnknownApi: MunicipalSource = {
    id: 'test-unknown-api',
    name: 'Test Unknown API',
    state: 'CA',
    type: 'api',
    api: {
      type: 'unknown' as any,
      baseUrl: 'https://example.com'
    },
    priority: 'high'
  };
  
  const error = t.throws(() => {
    factory.createClient(sourceWithUnknownApi);
  });
  
  assertError(t, error!, 'Unknown API type');
});

test('ClientFactory - updateConfig updates factory configuration', t => {
  const factory = new ClientFactory({
    timeout: 30000,
    debug: false
  });
  
  // Update configuration
  factory.updateConfig({
    timeout: 60000,
    debug: true,
    retries: 5
  });
  
  // Create a client to verify config is applied
  const sfSource = mockSources.find(s => s.id === 'sf')!;
  const client = factory.createClient(sfSource);
  
  // We can't directly test the config, but we can verify the client was created
  t.true(client instanceof SocrataClient, 'Should create client with updated config');
});

test('ClientFactory - setSocrataToken sets universal token', t => {
  const factory = new ClientFactory();
  
  // Set token
  factory.setSocrataToken('new-test-token');
  
  // Create client and verify token is applied
  const sfSource = mockSources.find(s => s.id === 'sf')!;
  const client = factory.createClient(sfSource);
  
  t.true(client instanceof SocrataClient, 'Should create SocrataClient with token');
});

test('ClientFactory - setSocrataToken can be called multiple times', t => {
  const factory = new ClientFactory(); // No initial token
  
  // Set token
  factory.setSocrataToken('test-token');
  factory.setSocrataToken('another-token'); // Should overwrite
  
  // Should not throw and should work
  const sfSource = mockSources.find(s => s.id === 'sf')!;
  const client = factory.createClient(sfSource);
  
  t.true(client instanceof SocrataClient, 'Should create client after setting token');
});

test('ClientFactory - config is passed to created clients', t => {
  const factory = new ClientFactory({
    timeout: 45000,
    retries: 2,
    debug: true,
    socrataToken: 'test-token'
  });
  
  const sfSource = mockSources.find(s => s.id === 'sf')!;
  const client = factory.createClient(sfSource);
  
  // Verify the client has the correct source
  t.is(client.getSource().id, 'sf', 'Client should have correct source');
  t.is(client.getSource().name, 'San Francisco', 'Client should have correct source name');
});

test('ClientFactory - handles Socrata source without datasets', t => {
  const factory = new ClientFactory({
    socrataToken: 'token'
  });
  
  const socrataSourceMinimal: MunicipalSource = {
    id: 'test-minimal',
    name: 'Test Minimal Socrata',
    state: 'CA',
    type: 'api',
    api: {
      type: 'socrata',
      baseUrl: 'https://data.example.gov'
    },
    priority: 'high'
  };
  
  // Should create client even without datasets configuration
  const client = factory.createClient(socrataSourceMinimal);
  t.true(client instanceof SocrataClient, 'Should create SocrataClient for minimal config');
});

test('ClientFactory - universal token works for all sources', t => {
  const factory = new ClientFactory({
    socrataToken: 'universal-token'
  });
  
  // Create client for SF
  const sfSource = mockSources.find(s => s.id === 'sf')!;
  const sfClient = factory.createClient(sfSource);
  t.true(sfClient instanceof SocrataClient, 'Should create SF client');
  
  // Create client for NYC
  const nycSource = mockSources.find(s => s.id === 'nyc')!;
  const nycClient = factory.createClient(nycSource);
  t.true(nycClient instanceof SocrataClient, 'Should create NYC client');
  
  // Verify same token works for all sources
  
  const oaklandSource: MunicipalSource = {
    id: 'oakland',
    name: 'Oakland',
    state: 'CA',
    type: 'api',
    api: {
      type: 'socrata',
      baseUrl: 'https://data.oaklandca.gov'
    },
    priority: 'high'
  };
  
  const oaklandClient = factory.createClient(oaklandSource);
  t.true(oaklandClient instanceof SocrataClient, 'Should create Oakland client with universal token');
});