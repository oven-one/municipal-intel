#!/usr/bin/env node

/**
 * Comprehensive Functional Test Suite
 * Tests all exposed MunicipalIntel API methods with multiple variations
 */

const { createMunicipalIntel } = require('./build/main');
require('dotenv').config({ path: '.env.local' });

async function runFunctionalTests() {
  console.log('🧪 MUNICIPAL INTEL FUNCTIONAL TESTS\n');
  console.log('='.repeat(50));
  
  const municipal = createMunicipalIntel({ debug: false });
  
  // Set token if available
  if (process.env.SOCRATA_TOKEN) {
    municipal.setSocrataToken(process.env.SOCRATA_TOKEN);
    console.log('✅ Socrata token configured');
  } else {
    console.log('⚠️  No Socrata token - rate limits will apply');
  }
  
  console.log('');

  // Test 1: getAvailableMunicipalities
  console.log('🏛️  TEST 1: getAvailableMunicipalities()');
  console.log('-'.repeat(40));
  
  try {
    const municipalities = municipal.getAvailableMunicipalities();
    console.log(`✅ Found ${municipalities.length} municipalities:`);
    municipalities.forEach(m => {
      console.log(`   ${m.name}, ${m.state} (${m.id}) - ${m.datasets.length} datasets`);
    });
  } catch (error) {
    console.log(`❌ getAvailableMunicipalities failed: ${error.message}`);
  }
  
  console.log('');

  // Test 2: getSearchCapabilities (3 variations)
  console.log('🔍 TEST 2: getSearchCapabilities()');
  console.log('-'.repeat(40));
  
  const municipalities = ['sf', 'la', 'nyc'];
  
  for (const municipalityId of municipalities) {
    try {
      const capabilities = municipal.getSearchCapabilities(municipalityId);
      console.log(`✅ ${municipalityId.toUpperCase()} capabilities:`);
      console.log(`   Supported filters: ${capabilities.supportedFilters.join(', ')}`);
      console.log(`   Supported sorts: ${capabilities.supportedSorts.join(', ')}`);
      if (capabilities.limitations) {
        console.log(`   Limitations: ${capabilities.limitations.join('; ')}`);
      }
    } catch (error) {
      console.log(`❌ getSearchCapabilities(${municipalityId}) failed: ${error.message}`);
    }
  }
  
  console.log('');

  // Test 3: getDatasetSchema (3 variations)
  console.log('📊 TEST 3: getDatasetSchema()');
  console.log('-'.repeat(40));
  
  const schemaTests = [
    { id: 'sf', dataset: 'buildingPermits' },
    { id: 'la', dataset: 'buildingPermits' },
    { id: 'nyc', dataset: 'dobPermitIssuance' }
  ];
  
  for (const test of schemaTests) {
    try {
      const schema = municipal.getDatasetSchema(test.id, test.dataset);
      console.log(`✅ ${test.id.toUpperCase()} ${test.dataset} schema: ${schema.length} fields`);
      console.log(`   Sample fields: ${schema.slice(0, 5).map(f => f.name).join(', ')}...`);
    } catch (error) {
      console.log(`❌ getDatasetSchema(${test.id}, ${test.dataset}) failed: ${error.message}`);
    }
  }
  
  console.log('');

  // Test 4: search() with basic queries (3 variations)
  console.log('🔎 TEST 4: search() - Basic Queries');
  console.log('-'.repeat(40));
  
  const basicSearches = [
    { municipalityId: 'sf', limit: 2, description: 'SF basic search' },
    { municipalityId: 'la', limit: 2, description: 'LA basic search' },
    { municipalityId: 'nyc', limit: 2, description: 'NYC basic search' }
  ];
  
  for (const search of basicSearches) {
    try {
      const results = await municipal.search(search);
      console.log(`✅ ${search.description}: ${results.projects.length} projects, ${results.total} total`);
      if (results.adjustments.length > 0) {
        console.log(`   Adjustments: ${results.adjustments.join('; ')}`);
      }
      if (results.projects.length > 0) {
        const project = results.projects[0];
        console.log(`   Sample: ${project.title || project.description || 'No title'} at ${project.address}`);
      }
    } catch (error) {
      console.log(`❌ ${search.description} failed: ${error.message}`);
    }
  }
  
  console.log('');

  // Test 5: search() with date filters (3 variations)
  console.log('📅 TEST 5: search() - Date Filtering');
  console.log('-'.repeat(40));
  
  const dateSearches = [
    { 
      municipalityId: 'sf', 
      submitDateFrom: new Date('2024-01-01'), 
      submitDateTo: new Date('2024-12-31'),
      limit: 2,
      description: 'SF 2024 permits'
    },
    { 
      municipalityId: 'la', 
      submitDateFrom: new Date('2024-06-01'), 
      submitDateTo: new Date('2024-12-31'),
      limit: 2,
      description: 'LA recent permits'
    },
    { 
      municipalityId: 'nyc', 
      submitDateFrom: new Date('2024-01-01'), 
      submitDateTo: new Date('2024-06-30'),
      limit: 2,
      description: 'NYC early 2024'
    }
  ];
  
  for (const search of dateSearches) {
    try {
      const results = await municipal.search(search);
      console.log(`✅ ${search.description}: ${results.projects.length} projects`);
      if (results.adjustments.length > 0) {
        console.log(`   Adjustments: ${results.adjustments.join('; ')}`);
      }
    } catch (error) {
      console.log(`❌ ${search.description} failed: ${error.message}`);
    }
  }
  
  console.log('');

  // Test 6: search() with value filters (3 variations)
  console.log('💰 TEST 6: search() - Value Filtering');
  console.log('-'.repeat(40));
  
  const valueSearches = [
    { 
      municipalityId: 'sf', 
      minValue: 100000,
      limit: 2,
      description: 'SF high-value permits (≥$100k)'
    },
    { 
      municipalityId: 'la', 
      minValue: 50000,
      maxValue: 500000,
      limit: 2,
      description: 'LA mid-range permits ($50k-$500k)'
    },
    { 
      municipalityId: 'nyc', 
      minValue: 100000,
      limit: 2,
      description: 'NYC high-value permits (should report limitation)'
    }
  ];
  
  for (const search of valueSearches) {
    try {
      const results = await municipal.search(search);
      console.log(`✅ ${search.description}: ${results.projects.length} projects`);
      if (results.adjustments.length > 0) {
        console.log(`   Adjustments: ${results.adjustments.join('; ')}`);
      }
      // Check if value filtering actually worked
      const hasValues = results.projects.some(p => p.value != null);
      if (hasValues && search.minValue) {
        const minActual = Math.min(...results.projects.filter(p => p.value).map(p => p.value));
        console.log(`   Actual min value: $${minActual.toLocaleString()}`);
      }
    } catch (error) {
      console.log(`❌ ${search.description} failed: ${error.message}`);
    }
  }
  
  console.log('');

  // Test 7: search() with text filters (3 variations)
  console.log('📝 TEST 7: search() - Text Filtering');
  console.log('-'.repeat(40));
  
  const textSearches = [
    { 
      municipalityId: 'sf', 
      keywords: ['renovation'],
      limit: 2,
      description: 'SF renovation projects'
    },
    { 
      municipalityId: 'la', 
      addresses: ['Main'],
      limit: 2,
      description: 'LA Main Street projects'
    },
    { 
      municipalityId: 'nyc', 
      keywords: ['building'],
      limit: 2,
      description: 'NYC building projects'
    }
  ];
  
  for (const search of textSearches) {
    try {
      const results = await municipal.search(search);
      console.log(`✅ ${search.description}: ${results.projects.length} projects`);
      if (results.projects.length > 0) {
        const project = results.projects[0];
        const text = project.description || project.title || project.address;
        console.log(`   Sample: ${text.substring(0, 80)}...`);
      }
    } catch (error) {
      console.log(`❌ ${search.description} failed: ${error.message}`);
    }
  }
  
  console.log('');

  // Test 8: search() with default municipality (no municipalityId)
  console.log('🏙️  TEST 8: search() - Default Municipality');
  console.log('-'.repeat(40));
  
  try {
    const results = await municipal.search({ limit: 1 });
    console.log(`✅ Default search: ${results.projects.length} projects from ${results.projects[0]?.source || 'unknown'}`);
  } catch (error) {
    console.log(`❌ Default search failed: ${error.message}`);
  }
  
  console.log('');

  // Test 9: getProject() (3 variations)
  console.log('📋 TEST 9: getProject() - Individual Project Lookup');
  console.log('-'.repeat(40));
  
  // First get some real project IDs
  const projectTests = [];
  
  for (const municipalityId of ['sf', 'la', 'nyc']) {
    try {
      const results = await municipal.search({ municipalityId, limit: 1 });
      if (results.projects.length > 0) {
        projectTests.push({
          municipalityId,
          projectId: results.projects[0].id,
          description: `${municipalityId.toUpperCase()} project lookup`
        });
      }
    } catch (error) {
      console.log(`⚠️  Could not get sample project ID from ${municipalityId}: ${error.message}`);
    }
  }
  
  // Test with real project IDs
  for (const test of projectTests) {
    try {
      const project = await municipal.getProject(test.municipalityId, test.projectId);
      if (project) {
        console.log(`✅ ${test.description}: Found project ${project.id}`);
        console.log(`   ${project.title || project.description || 'No title'} - ${project.status}`);
      } else {
        console.log(`⚠️  ${test.description}: Project not found (returned null)`);
      }
    } catch (error) {
      console.log(`❌ ${test.description} failed: ${error.message}`);
    }
  }
  
  // Test with non-existent project ID
  try {
    const project = await municipal.getProject('sf', 'non-existent-id-12345');
    console.log(`✅ Non-existent project test: ${project ? 'Found (unexpected)' : 'Correctly returned null'}`);
  } catch (error) {
    console.log(`❌ Non-existent project test failed: ${error.message}`);
  }
  
  console.log('');

  // Test 10: Error handling (3 variations)
  console.log('⚠️  TEST 10: Error Handling');
  console.log('-'.repeat(40));
  
  const errorTests = [
    {
      test: () => municipal.getSearchCapabilities('invalid-municipality'),
      description: 'Invalid municipality ID'
    },
    {
      test: () => municipal.getDatasetSchema('sf', 'non-existent-dataset'),
      description: 'Non-existent dataset'
    },
    {
      test: () => municipal.search({ municipalityId: 'invalid-id', limit: 1 }),
      description: 'Search with invalid municipality',
      async: true
    }
  ];
  
  for (const errorTest of errorTests) {
    try {
      if (errorTest.async) {
        await errorTest.test();
        console.log(`❌ ${errorTest.description}: Should have thrown error but didn't`);
      } else {
        errorTest.test();
        console.log(`❌ ${errorTest.description}: Should have thrown error but didn't`);
      }
    } catch (error) {
      console.log(`✅ ${errorTest.description}: Correctly threw error - ${error.message}`);
    }
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('🎉 FUNCTIONAL TESTS COMPLETE');
  console.log('');
  console.log('All major API methods tested with multiple variations.');
  console.log('Check output above for any ❌ failures that need attention.');
}

// Run the tests
runFunctionalTests().catch(error => {
  console.error('💥 Fatal error running functional tests:', error);
  process.exit(1);
});