/**
 * Basic usage examples for @lineai/municipal-intel
 */

import { createMunicipalIntel } from '../src';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // Create municipal intel instance
  const municipal = createMunicipalIntel({
    debug: true,
    // Add Socrata token if available
    socrataToken: process.env.SOCRATA_TOKEN
  });

  console.log('🏙️  Municipal Intel Demo\n');

  // 1. Get registry information
  console.log('📊 Registry Info:');
  const registryInfo = municipal.getRegistryInfo();
  console.log(`   Version: ${registryInfo.version}`);
  console.log(`   Total Sources: ${registryInfo.totalSources}`);
  console.log(`   Last Updated: ${registryInfo.lastUpdated}\n`);

  // 2. List available sources
  console.log('📍 Available API Sources:');
  const apiSources = municipal.getSources({ type: 'api', priority: 'high' });
  apiSources.forEach(source => {
    console.log(`   - ${source.name} (${source.id}) - ${source.state.toUpperCase()}`);
  });

  // 3. List California sources
  console.log('\n🌴 California Sources:');
  const caSources = municipal.getSources({ state: 'ca' });
  console.log(`   Found ${caSources.length} sources in California`);
  
  // 4. Show San Francisco details
  const sfSource = caSources.find(s => s.id === 'sf');
  if (sfSource) {
    console.log('\n🌉 San Francisco Source Details:');
    console.log(`   Name: ${sfSource.name}`);
    console.log(`   Type: ${sfSource.type}`);
    console.log(`   API Type: ${sfSource.api?.type}`);
    console.log(`   Base URL: ${sfSource.api?.baseUrl}`);
    console.log(`   Priority: ${sfSource.priority}`);
    
    if (sfSource.api?.datasets) {
      console.log('   Available Datasets:');
      Object.entries(sfSource.api.datasets).forEach(([key, dataset]) => {
        console.log(`     - ${key}: ${dataset.name}`);
      });
    }
  }

  // 5. Check if we have tokens configured
  console.log('\n🔑 Authentication Status:');
  console.log(`   Socrata Token: ${process.env.SOCRATA_TOKEN ? '✅ Configured' : '❌ Not configured'}`);

  // 6. Try a health check (will fail without proper configuration)
  console.log('\n🏥 Health Check Demo:');
  try {
    // This will fail because we haven't implemented source-specific mappings yet
    const health = await municipal.healthCheck('sf');
    console.log(`   San Francisco API: ${health.status}`);
    if (health.latency) {
      console.log(`   Latency: ${health.latency}ms`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Health check failed: ${error.message}`);
    console.log('   (This is expected - source-specific implementations needed)');
  }

  // 7. VALIDATION: Test the fix for date field sorting
  console.log('\n🔧 VALIDATION: Testing the field mapping fix');
  try {
    // Test the municipal.search() API with default sorting 
    const searchResult = await municipal.search({
      sources: ['sf'],
      limit: 2
    });
    
    console.log('   ✅ Search with default sorting (should now return recent permits):');
    searchResult.projects.forEach((project, i) => {
      console.log(`     ${i + 1}. ${project.id}: ${project.submitDate?.toISOString()?.split('T')[0]} - ${project.title}`);
    });
    
    console.log(`   📊 Total found: ${searchResult.total}, Page: ${searchResult.page}`);
    
    // Verify the dates are recent (2020s, not 1990s)
    const firstProjectYear = searchResult.projects[0]?.submitDate?.getFullYear();
    if (firstProjectYear && firstProjectYear >= 2020) {
      console.log('   🎉 SUCCESS: Now returning recent permits (2020s)!');
    } else {
      console.log(`   ❌ Still returning old data: ${firstProjectYear}`);
    }

  } catch (error: any) {
    console.log(`   ⚠️  Validation failed: ${error.message}`);
  }

  console.log('\n✅ Demo completed!');
  console.log('\nNext steps:');
  console.log('1. Get Socrata app token from any Socrata portal (e.g., data.sfgov.org)');
  console.log('2. Add SOCRATA_TOKEN to .env file');
  console.log('3. Implement additional source field mappings');
  console.log('4. Add more data sources');
}

// Run the demo
main().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});