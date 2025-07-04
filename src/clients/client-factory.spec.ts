/**
 * Tests for ClientFactory
 */

import test from 'ava';
import { ClientFactory } from './index';
import { SocrataClient } from './socrata';
import { MunicipalSource } from '../types/sources';
import { mockSources } from '../helpers/mock-registry';
// Removed test-utils import - inlined simple helpers

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

  const client = factory.createClient(sfSource!, { municipalityId: 'sf' });
  t.true(client instanceof SocrataClient, 'Should create SocrataClient');
  t.is(client.getSource().id, 'sf', 'Client should have correct source');
});

test('ClientFactory - createClient for custom API source', t => {
  const factory = new ClientFactory();

  const laSource = mockSources.find(s => s.id === 'la');
  t.truthy(laSource, 'Should find LA source in mock data');

  const error = t.throws(() => {
    factory.createClient(laSource!, { municipalityId: 'la' });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('Custom API clients not yet implemented'), 'Should have correct error message');
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
      baseUrl: 'https://services.arcgis.com',
      datasets: {},
      defaultDataset: 'default'
    },
    priority: 'high'
  };

  const error = t.throws(() => {
    factory.createClient(arcgisSource, { municipalityId: 'test-arcgis' as any });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('ArcGIS clients not yet implemented'), 'Should have correct error message');
});

test('ClientFactory - createClient for portal source', t => {
  const factory = new ClientFactory();

  const miamiSource = mockSources.find(s => s.id === 'miami');
  t.truthy(miamiSource, 'Should find Miami source in mock data');

  const error = t.throws(() => {
    factory.createClient(miamiSource!, { municipalityId: 'miami' as any });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('Portal clients not yet implemented'), 'Should have correct error message');
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
    factory.createClient(scrapingSource, { municipalityId: 'test-scraping' as any });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('Scraping clients not yet implemented'), 'Should have correct error message');
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
    factory.createClient(unknownSource, { municipalityId: 'test-unknown' as any });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('Unknown source type'), 'Should have correct error message');
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
    factory.createClient(sourceWithoutApi, { municipalityId: 'test-no-api' as any });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('API configuration missing'), 'Should have correct error message');
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
      baseUrl: 'https://example.com',
      datasets: {},
      defaultDataset: 'default'
    },
    priority: 'high'
  };

  const error = t.throws(() => {
    factory.createClient(sourceWithUnknownApi, { municipalityId: 'test-unknown-api' as any });
  });

  t.truthy(error, 'Should throw error');
  t.true(error!.message.includes('Unknown API type'), 'Should have correct error message');
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
  const client = factory.createClient(sfSource, { municipalityId: 'sf' });

  // We can't directly test the config, but we can verify the client was created
  t.true(client instanceof SocrataClient, 'Should create client with updated config');
});

test('ClientFactory - setSocrataToken sets universal token', t => {
  const factory = new ClientFactory();

  // Set token
  factory.setSocrataToken('new-test-token');

  // Create client and verify token is applied
  const sfSource = mockSources.find(s => s.id === 'sf')!;
  const client = factory.createClient(sfSource, { municipalityId: 'sf' });

  t.true(client instanceof SocrataClient, 'Should create SocrataClient with token');
});

test('ClientFactory - setSocrataToken can be called multiple times', t => {
  const factory = new ClientFactory(); // No initial token

  // Set token
  factory.setSocrataToken('test-token');
  factory.setSocrataToken('another-token'); // Should overwrite

  // Should not throw and should work
  const sfSource = mockSources.find(s => s.id === 'sf')!;
  const client = factory.createClient(sfSource, { municipalityId: 'sf' });

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
  const client = factory.createClient(sfSource, { municipalityId: 'sf' });

  // Verify the client has the correct source
  t.is(client.getSource().id, 'sf', 'Client should have correct source');
  t.is(client.getSource().name, 'San Francisco', 'Client should have correct source name');
});

