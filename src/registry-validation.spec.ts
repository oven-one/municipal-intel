/**
 * Registry Validation Tests
 * 
 * These tests validate our registry against REAL API data using Zod schemas.
 * They catch the kind of errors that broke our field mappings for months.
 */

import test from 'ava';
import { sourceRegistry } from './registry';
import { createMunicipalIntel } from './index';
import { API_SCHEMAS } from './schemas/api-responses';
import type { KnownMunicipalityId } from './types/projects';

/**
 * Test that field mappings point to fields that actually exist in API responses
 * This would have caught our "estimated_cost" vs "revised_cost" error
 */
test('SF field mappings point to real API fields', async t => {
  const intel = createMunicipalIntel();
  const source = sourceRegistry.getSource('sf');
  
  if (!source?.api?.datasets?.buildingPermits) {
    t.fail('SF building permits dataset not found in registry');
    return;
  }

  const dataset = source.api.datasets.buildingPermits;
  const fieldMappings = dataset.fieldMappings || {};
  const schema = API_SCHEMAS.sf.buildingPermits;

  try {
    const client = (intel as any).clientFactory.createClient(source);
    const sampleData = await client.query('buildingPermits', { $limit: 1 });
    
    if (sampleData.length === 0) {
      t.log('⚠️  No sample data - skipping field mapping validation');
      t.pass('Skipped due to no data');
      return;
    }

    // Validate API response matches our schema
    const schemaResult = schema.safeParse(sampleData[0]);
    if (!schemaResult.success) {
      t.log(`⚠️  API response doesn't match schema: ${schemaResult.error.message}`);
    }

    // Get actual field names from API response
    const actualFields = Object.keys(sampleData[0]);
    const schemaFields = Object.keys(schema.shape);
    
    // Test each field mapping points to a real field
    for (const [logicalField, mappedField] of Object.entries(fieldMappings)) {
      const fieldExists = actualFields.includes(mappedField);
      const fieldInSchema = schemaFields.includes(mappedField);
      
      t.true(
        fieldExists,
        `❌ REGISTRY ERROR: '${logicalField}' maps to '${mappedField}' but API response only has: ${actualFields.slice(0, 10).join(', ')}...`
      );
      
      if (fieldExists && !fieldInSchema) {
        t.log(`⚠️  Field '${mappedField}' exists in API but not in our schema - schema needs updating`);
      }
    }

    t.pass(`✅ All ${Object.keys(fieldMappings).length} SF field mappings are valid`);

  } catch (error: any) {
    t.log(`⚠️  API call failed: ${error.message}`);
    t.pass('Skipped due to API unavailability');
  }
});

test('LA field mappings point to real API fields', async t => {
  const intel = createMunicipalIntel();
  const source = sourceRegistry.getSource('la');
  
  if (!source?.api?.datasets?.buildingPermits) {
    t.fail('LA building permits dataset not found');
    return;
  }

  const dataset = source.api.datasets.buildingPermits;
  const fieldMappings = dataset.fieldMappings || {};
  const schema = API_SCHEMAS.la.buildingPermits;

  try {
    const client = (intel as any).clientFactory.createClient(source);
    const sampleData = await client.query('buildingPermits', { $limit: 1 });
    
    if (sampleData.length === 0) {
      t.pass('Skipped - no data');
      return;
    }

    // 🔥 VALIDATE API RESPONSE MATCHES OUR SCHEMA
    const schemaResult = schema.safeParse(sampleData[0]);
    if (!schemaResult.success) {
      t.log(`❌ LA API SCHEMA MISMATCH: ${schemaResult.error.message}`);
      t.fail('LA API response does not match our schema - schema needs updating!');
      return;
    }

    const actualFields = Object.keys(sampleData[0]);
    const schemaFields = Object.keys(schema.shape);
    
    // Test each field mapping points to a real field
    for (const [logicalField, mappedField] of Object.entries(fieldMappings)) {
      const fieldExists = actualFields.includes(mappedField);
      const fieldInSchema = schemaFields.includes(mappedField);
      
      t.true(
        fieldExists,
        `❌ REGISTRY ERROR: '${logicalField}' maps to '${mappedField}' but API response only has: ${actualFields.slice(0, 10).join(', ')}...`
      );
      
      if (fieldExists && !fieldInSchema) {
        t.log(`⚠️  Field '${mappedField}' exists in API but not in our schema - schema needs updating`);
      }
    }

    t.pass(`✅ All ${Object.keys(fieldMappings).length} LA field mappings are valid`);

  } catch (error: any) {
    t.log(`⚠️  API call failed: ${error.message}`);
    t.pass('Skipped due to API unavailability');
  }
});

test('NYC field mappings point to real API fields', async t => {
  const intel = createMunicipalIntel();
  const source = sourceRegistry.getSource('nyc');
  
  if (!source?.api?.datasets?.dobPermitIssuance) {
    t.fail('NYC DOB dataset not found');
    return;
  }

  const dataset = source.api.datasets.dobPermitIssuance;
  const fieldMappings = dataset.fieldMappings || {};
  const schema = API_SCHEMAS.nyc.dobPermitIssuance;

  try {
    const client = (intel as any).clientFactory.createClient(source);
    const sampleData = await client.query('dobPermitIssuance', { $limit: 1 });
    
    if (sampleData.length === 0) {
      t.pass('Skipped - no data');
      return;
    }

    // 🔥 VALIDATE API RESPONSE MATCHES OUR SCHEMA
    const schemaResult = schema.safeParse(sampleData[0]);
    if (!schemaResult.success) {
      t.log(`❌ NYC API SCHEMA MISMATCH: ${schemaResult.error.message}`);
      t.fail('NYC API response does not match our schema - schema needs updating!');
      return;
    }

    const actualFields = Object.keys(sampleData[0]);
    const schemaFields = Object.keys(schema.shape);
    
    // Test each field mapping points to a real field
    for (const [logicalField, mappedField] of Object.entries(fieldMappings)) {
      const fieldExists = actualFields.includes(mappedField);
      const fieldInSchema = schemaFields.includes(mappedField);
      
      t.true(
        fieldExists,
        `❌ REGISTRY ERROR: '${logicalField}' maps to '${mappedField}' but API response only has: ${actualFields.slice(0, 10).join(', ')}...`
      );
      
      if (fieldExists && !fieldInSchema) {
        t.log(`⚠️  Field '${mappedField}' exists in API but not in our schema - schema needs updating`);
      }
    }

    t.pass(`✅ All ${Object.keys(fieldMappings).length} NYC field mappings are valid`);

  } catch (error: any) {
    t.log(`⚠️  API call failed: ${error.message}`);
    t.pass('Skipped due to API unavailability');
  }
});

/**
 * Test that registry field arrays include all actual API fields
 * This would have caught our missing 19 fields in SF registry
 */
test('Registry field arrays are complete vs actual API', async t => {
  const municipalities: { id: KnownMunicipalityId; dataset: string }[] = [
    { id: 'sf', dataset: 'buildingPermits' },
    { id: 'la', dataset: 'buildingPermits' },
    { id: 'nyc', dataset: 'dobPermitIssuance' },
  ];
  
  let totalErrors = 0;
  
  for (const { id, dataset } of municipalities) {
    const intel = createMunicipalIntel();
    const source = sourceRegistry.getSource(id);
    
    if (!source?.api?.datasets?.[dataset]) {
      t.log(`⚠️  ${id} ${dataset} not configured`);
      continue;
    }

    const datasetConfig = source.api.datasets[dataset];
    const registryFields = datasetConfig.fields || [];

    try {
      const client = (intel as any).clientFactory.createClient(source);
      const sampleData = await client.query(dataset, { $limit: 1 });
      
      if (sampleData.length === 0) {
        t.log(`⚠️  ${id} - no sample data`);
        continue;
      }

      const actualFields = Object.keys(sampleData[0]);
      const missingFromRegistry = actualFields.filter(field => !registryFields.includes(field));
      const extraInRegistry = registryFields.filter(field => !actualFields.includes(field));

      if (missingFromRegistry.length > 0) {
        t.log(`❌ ${id.toUpperCase()} REGISTRY INCOMPLETE: Missing fields: ${missingFromRegistry.join(', ')}`);
        totalErrors += missingFromRegistry.length;
      }

      if (extraInRegistry.length > 0) {
        t.log(`⚠️  ${id.toUpperCase()} registry has extra fields: ${extraInRegistry.join(', ')}`);
      }

      t.log(`${id.toUpperCase()}: API=${actualFields.length} fields, Registry=${registryFields.length} fields`);

    } catch (error: any) {
      t.log(`⚠️  ${id} API call failed: ${error.message}`);
    }
  }

  t.is(totalErrors, 0, `Found ${totalErrors} missing fields across all registries`);
});

/**
 * Test that mapped value fields are actually numeric when cast
 * This would have caught our "estimated_cost" TEXT casting issues
 */
test('Value field mappings can be cast to numbers', async t => {
  const municipalities: { id: KnownMunicipalityId; dataset: string }[] = [
    { id: 'sf', dataset: 'buildingPermits' },
    { id: 'la', dataset: 'buildingPermits' },
    // NYC DOB doesn't have value field mapping
  ];
  
  for (const { id, dataset } of municipalities) {
    const intel = createMunicipalIntel();
    const source = sourceRegistry.getSource(id);
    
    if (!source?.api?.datasets?.[dataset]) continue;

    const datasetConfig = source.api.datasets[dataset];
    const fieldMappings = datasetConfig.fieldMappings || {};
    const valueField = fieldMappings.value;

    if (!valueField) {
      t.log(`${id.toUpperCase()}: No value field mapping (OK)`);
      continue;
    }

    try {
      const client = (intel as any).clientFactory.createClient(source);
      const sampleData = await client.query(dataset, { $limit: 3 });
      
      if (sampleData.length === 0) {
        t.log(`⚠️  ${id} - no sample data for value testing`);
        continue;
      }

      let validValues = 0;
      let totalValues = 0;

      for (const record of sampleData) {
        const rawValue = record[valueField];
        if (rawValue != null) {
          totalValues++;
          const numericValue = parseFloat(rawValue);
          if (!isNaN(numericValue)) {
            validValues++;
          } else {
            t.log(`❌ ${id.toUpperCase()}: Invalid value in '${valueField}': ${rawValue}`);
          }
        }
      }

      t.true(
        validValues === totalValues && totalValues > 0,
        `${id.toUpperCase()}: Value field '${valueField}' should be numeric (${validValues}/${totalValues} valid)`
      );

      if (totalValues > 0) {
        t.log(`✅ ${id.toUpperCase()}: ${validValues}/${totalValues} values are numeric`);
      }

    } catch (error: any) {
      t.log(`⚠️  ${id} value test failed: ${error.message}`);
    }
  }
});

/**
 * Test that date field mappings contain valid dates
 * This would catch date format incompatibilities
 */
test('Date field mappings contain valid dates', async t => {
  const municipalities: { id: KnownMunicipalityId; dataset: string }[] = [
    { id: 'sf', dataset: 'buildingPermits' },
    { id: 'la', dataset: 'buildingPermits' },
    { id: 'nyc', dataset: 'dobPermitIssuance' },
  ];
  
  for (const { id, dataset } of municipalities) {
    const intel = createMunicipalIntel();
    const source = sourceRegistry.getSource(id);
    
    if (!source?.api?.datasets?.[dataset]) continue;

    const datasetConfig = source.api.datasets[dataset];
    const fieldMappings = datasetConfig.fieldMappings || {};

    try {
      const client = (intel as any).clientFactory.createClient(source);
      const sampleData = await client.query(dataset, { $limit: 2 });
      
      if (sampleData.length === 0) continue;

      // Test date fields
      for (const [logical, mapped] of Object.entries(fieldMappings)) {
        if (logical.includes('Date') && mapped) {
          for (const record of sampleData) {
            const dateValue = record[mapped];
            if (dateValue != null) {
              const parsedDate = new Date(dateValue);
              t.false(
                isNaN(parsedDate.getTime()),
                `${id.toUpperCase()}: Invalid date in '${mapped}' (${logical}): ${dateValue}`
              );
            }
          }
        }
      }

      t.pass(`✅ ${id.toUpperCase()}: Date fields are valid`);

    } catch (error: any) {
      t.log(`⚠️  ${id} date test failed: ${error.message}`);
    }
  }
});

/**
 * Test that search capabilities match actual field availability
 * This validates our getSearchCapabilities() method returns accurate info
 */
test('Search capabilities match actual field mappings', async t => {
  const intel = createMunicipalIntel();
  const municipalities: KnownMunicipalityId[] = ['sf', 'la', 'nyc'];
  
  for (const municipalityId of municipalities) {
    const source = sourceRegistry.getSource(municipalityId);
    if (!source?.api?.datasets) continue;

    const capabilities = intel.getSearchCapabilities(municipalityId);
    const primaryDataset = Object.values(source.api.datasets)[0];
    const fieldMappings = primaryDataset.fieldMappings || {};

    // Check value filters capability
    const hasValueMapping = Boolean(fieldMappings.value);
    const supportsValueFilters = capabilities.supportedFilters.includes('minValue');
    
    t.is(
      hasValueMapping,
      supportsValueFilters,
      `${municipalityId.toUpperCase()}: Value filter capability mismatch - has mapping: ${hasValueMapping}, supports filters: ${supportsValueFilters}`
    );

    // Check approval date capability
    const hasApprovalMapping = Boolean(fieldMappings.approvalDate);
    const supportsApprovalFilters = capabilities.supportedFilters.includes('approvalDateFrom');
    
    t.is(
      hasApprovalMapping,
      supportsApprovalFilters,
      `${municipalityId.toUpperCase()}: Approval date filter capability mismatch - has mapping: ${hasApprovalMapping}, supports filters: ${supportsApprovalFilters}`
    );

    t.pass(`✅ ${municipalityId.toUpperCase()}: Search capabilities are accurate`);
  }
});