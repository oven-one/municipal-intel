/**
 * Source Validator - Comprehensive validation tool for municipal data sources
 * Tests API connectivity, field mappings, schema compliance, and data quality
 */

import { createMunicipalIntel } from '../src';
import { MunicipalProjectSchema } from '../src/types/projects';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface ValidationResult {
  sourceId: string;
  sourceName: string;
  overall: 'PASS' | 'FAIL' | 'WARNING';
  tests: {
    connectivity: 'PASS' | 'FAIL' | 'SKIP';
    fieldMappings: 'PASS' | 'FAIL' | 'SKIP';
    schemaCompliance: 'PASS' | 'FAIL' | 'SKIP';
    dataQuality: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
    performance: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
  };
  issues: string[];
  suggestions: string[];
  metrics: {
    responseTime?: number;
    recordCount?: number;
    schemaCompliance?: number;
    dataFreshness?: number;
  };
}

async function validateSource(sourceId: string): Promise<ValidationResult> {
  console.log(`🔍 VALIDATING SOURCE: ${sourceId.toUpperCase()}`);
  console.log('='.repeat(60));

  const result: ValidationResult = {
    sourceId,
    sourceName: '',
    overall: 'PASS',
    tests: {
      connectivity: 'SKIP',
      fieldMappings: 'SKIP', 
      schemaCompliance: 'SKIP',
      dataQuality: 'SKIP',
      performance: 'SKIP'
    },
    issues: [],
    suggestions: [],
    metrics: {}
  };

  const municipal = createMunicipalIntel({
    debug: false,
    socrataToken: process.env.SOCRATA_TOKEN
  });

  try {
    // Get source configuration
    const sources = municipal.getSources();
    const source = sources.find(s => s.id === sourceId);
    
    if (!source) {
      result.issues.push(`Source '${sourceId}' not found in registry`);
      result.overall = 'FAIL';
      return result;
    }
    
    result.sourceName = source.name;
    console.log(`📍 Source: ${source.name} (${source.state.toUpperCase()})`);
    console.log(`🔧 Type: ${source.type}${source.api?.type ? ` (${source.api.type})` : ''}`);
    console.log('');

    // Test 1: Connectivity
    console.log('🌐 TEST 1: API Connectivity');
    try {
      const startTime = Date.now();
      const health = await municipal.healthCheck(sourceId);
      const responseTime = Date.now() - startTime;
      
      result.metrics.responseTime = responseTime;
      
      if (health.status === 'healthy') {
        result.tests.connectivity = 'PASS';
        console.log(`   ✅ API accessible (${responseTime}ms)`);
      } else {
        result.tests.connectivity = 'FAIL';
        result.issues.push(`API health check failed: ${health.error}`);
        console.log(`   ❌ API health check failed: ${health.error}`);
      }
    } catch (error: any) {
      result.tests.connectivity = 'FAIL';
      result.issues.push(`Connectivity test failed: ${error.message}`);
      console.log(`   ❌ Connectivity failed: ${error.message}`);
    }

    // Test 2: Field Mappings (only for API sources)
    if (source.type === 'api' && source.api?.fieldMappings) {
      console.log('\n🗂️  TEST 2: Field Mappings');
      
      try {
        const testResult = await municipal.search({ 
          sources: [sourceId], 
          limit: 1 
        });
        
        if (testResult.projects.length > 0) {
          const project = testResult.projects[0];
          const mappings = source.api.fieldMappings;
          let mappingIssues = 0;
          
          Object.entries(mappings).forEach(([logical, physical]) => {
            const hasValue = project.rawData[physical] !== undefined;
            const normalizedValue = (project as any)[logical];
            
            if (!hasValue) {
              mappingIssues++;
              result.issues.push(`Field mapping '${logical}' → '${physical}' not found in data`);
              console.log(`   ❌ ${logical} → ${physical}: NOT FOUND`);
            } else if (normalizedValue === undefined || normalizedValue === null) {
              console.log(`   ⚠️  ${logical} → ${physical}: NULL VALUE`);
            } else {
              console.log(`   ✅ ${logical} → ${physical}: ${typeof normalizedValue === 'string' && normalizedValue.length > 30 ? normalizedValue.substring(0, 30) + '...' : normalizedValue}`);
            }
          });
          
          result.tests.fieldMappings = mappingIssues === 0 ? 'PASS' : 'FAIL';
          
        } else {
          result.tests.fieldMappings = 'FAIL';
          result.issues.push('No data returned for field mapping test');
          console.log('   ❌ No data returned for field mapping test');
        }
      } catch (error: any) {
        result.tests.fieldMappings = 'FAIL';
        result.issues.push(`Field mapping test failed: ${error.message}`);
        console.log(`   ❌ Field mapping test failed: ${error.message}`);
      }
    } else {
      console.log('\n🗂️  TEST 2: Field Mappings - SKIPPED (not API source or no mappings)');
    }

    // Test 3: Schema Compliance
    console.log('\n📋 TEST 3: Schema Compliance');
    
    try {
      const testResult = await municipal.search({ 
        sources: [sourceId], 
        limit: 5 
      });
      
      result.metrics.recordCount = testResult.projects.length;
      
      if (testResult.projects.length > 0) {
        let validProjects = 0;
        const schemaErrors: string[] = [];
        
        testResult.projects.forEach((project, i) => {
          const validation = MunicipalProjectSchema.safeParse(project);
          if (validation.success) {
            validProjects++;
          } else {
            validation.error.errors.forEach(err => {
              schemaErrors.push(`Project ${i + 1}: ${err.path.join('.')} - ${err.message}`);
            });
          }
        });
        
        const compliance = (validProjects / testResult.projects.length) * 100;
        result.metrics.schemaCompliance = compliance;
        
        if (compliance === 100) {
          result.tests.schemaCompliance = 'PASS';
          console.log(`   ✅ 100% schema compliance (${validProjects}/${testResult.projects.length})`);
        } else if (compliance >= 80) {
          result.tests.schemaCompliance = 'WARNING';
          console.log(`   ⚠️  ${compliance.toFixed(1)}% schema compliance (${validProjects}/${testResult.projects.length})`);
          schemaErrors.slice(0, 3).forEach(error => {
            result.issues.push(error);
            console.log(`   ❌ ${error}`);
          });
          if (schemaErrors.length > 3) {
            console.log(`   ... and ${schemaErrors.length - 3} more errors`);
          }
        } else {
          result.tests.schemaCompliance = 'FAIL';
          result.issues.push(`Low schema compliance: ${compliance.toFixed(1)}%`);
          console.log(`   ❌ Low schema compliance: ${compliance.toFixed(1)}%`);
        }
      } else {
        result.tests.schemaCompliance = 'FAIL';
        result.issues.push('No data returned for schema test');
        console.log('   ❌ No data returned for schema test');
      }
    } catch (error: any) {
      result.tests.schemaCompliance = 'FAIL';
      result.issues.push(`Schema compliance test failed: ${error.message}`);
      console.log(`   ❌ Schema compliance test failed: ${error.message}`);
    }

    // Test 4: Data Quality
    console.log('\n📊 TEST 4: Data Quality');
    
    try {
      const testResult = await municipal.search({ 
        sources: [sourceId], 
        limit: 10 
      });
      
      if (testResult.projects.length > 0) {
        let qualityIssues = 0;
        let recentCount = 0;
        
        // Check data freshness (projects from 2020+)
        testResult.projects.forEach(project => {
          if (project.submitDate && project.submitDate.getFullYear() >= 2020) {
            recentCount++;
          }
        });
        
        const freshness = (recentCount / testResult.projects.length) * 100;
        result.metrics.dataFreshness = freshness;
        
        if (freshness >= 80) {
          console.log(`   ✅ Data freshness: ${freshness.toFixed(1)}% recent (2020+)`);
        } else if (freshness >= 50) {
          console.log(`   ⚠️  Data freshness: ${freshness.toFixed(1)}% recent (2020+)`);
          qualityIssues++;
        } else {
          console.log(`   ❌ Data freshness: ${freshness.toFixed(1)}% recent (2020+)`);
          qualityIssues++;
          result.issues.push(`Low data freshness: ${freshness.toFixed(1)}% recent`);
        }
        
        // Check for null/empty values in key fields
        const keyFields = ['id', 'submitDate', 'address'];
        keyFields.forEach(field => {
          const nullCount = testResult.projects.filter(p => !(p as any)[field]).length;
          const nullPercent = (nullCount / testResult.projects.length) * 100;
          
          if (nullPercent === 0) {
            console.log(`   ✅ ${field}: No null values`);
          } else if (nullPercent <= 20) {
            console.log(`   ⚠️  ${field}: ${nullPercent.toFixed(1)}% null values`);
          } else {
            console.log(`   ❌ ${field}: ${nullPercent.toFixed(1)}% null values`);
            qualityIssues++;
            result.issues.push(`High null rate in ${field}: ${nullPercent.toFixed(1)}%`);
          }
        });
        
        result.tests.dataQuality = qualityIssues === 0 ? 'PASS' : qualityIssues <= 2 ? 'WARNING' : 'FAIL';
        
      } else {
        result.tests.dataQuality = 'FAIL';
        result.issues.push('No data returned for quality test');
        console.log('   ❌ No data returned for quality test');
      }
    } catch (error: any) {
      result.tests.dataQuality = 'FAIL';
      result.issues.push(`Data quality test failed: ${error.message}`);
      console.log(`   ❌ Data quality test failed: ${error.message}`);
    }

    // Test 5: Performance
    console.log('\n⚡ TEST 5: Performance');
    
    try {
      const tests = [
        { name: 'Small query', params: { sources: [sourceId], limit: 5 } },
        { name: 'Medium query', params: { sources: [sourceId], limit: 25 } },
        { name: 'Large query', params: { sources: [sourceId], limit: 100 } }
      ];
      
      let performanceIssues = 0;
      
      for (const test of tests) {
        const startTime = Date.now();
        const testResult = await municipal.search(test.params);
        const duration = Date.now() - startTime;
        
        if (duration < 2000) {
          console.log(`   ✅ ${test.name}: ${duration}ms (${testResult.projects.length} records)`);
        } else if (duration < 5000) {
          console.log(`   ⚠️  ${test.name}: ${duration}ms (${testResult.projects.length} records)`);
          performanceIssues++;
        } else {
          console.log(`   ❌ ${test.name}: ${duration}ms (${testResult.projects.length} records)`);
          performanceIssues++;
          result.issues.push(`Slow ${test.name.toLowerCase()}: ${duration}ms`);
        }
      }
      
      result.tests.performance = performanceIssues === 0 ? 'PASS' : performanceIssues <= 1 ? 'WARNING' : 'FAIL';
      
    } catch (error: any) {
      result.tests.performance = 'FAIL';
      result.issues.push(`Performance test failed: ${error.message}`);
      console.log(`   ❌ Performance test failed: ${error.message}`);
    }

    // Generate suggestions
    if (result.tests.connectivity === 'FAIL') {
      result.suggestions.push('Check API endpoint and authentication requirements');
    }
    
    if (result.tests.fieldMappings === 'FAIL') {
      result.suggestions.push('Review field mappings against actual API response structure');
    }
    
    if (result.tests.schemaCompliance !== 'PASS') {
      result.suggestions.push('Fix data transformation to match MunicipalProject schema');
    }
    
    if (result.metrics.dataFreshness !== undefined && result.metrics.dataFreshness < 50) {
      result.suggestions.push('Verify data source is actively maintained and updated');
    }
    
    if (result.tests.performance !== 'PASS') {
      result.suggestions.push('Consider implementing data caching or pagination optimization');
    }

    // Determine overall result
    const testResults = Object.values(result.tests);
    const hasFail = testResults.includes('FAIL');
    const hasWarning = testResults.includes('WARNING');
    
    if (hasFail) {
      result.overall = 'FAIL';
    } else if (hasWarning) {
      result.overall = 'WARNING';  
    } else {
      result.overall = 'PASS';
    }

  } catch (error: any) {
    result.overall = 'FAIL';
    result.issues.push(`Validation failed: ${error.message}`);
    console.log(`\n❌ VALIDATION FAILED: ${error.message}`);
  }

  return result;
}

async function main() {
  const sourceId = process.argv[2];
  
  if (!sourceId) {
    console.log('Usage: npx tsx examples/validate-source.ts <source-id>');
    console.log('');
    console.log('Example: npx tsx examples/validate-source.ts sf');
    process.exit(1);
  }

  const result = await validateSource(sourceId);
  
  // Print summary
  console.log('\n📋 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Source: ${result.sourceName} (${result.sourceId})`);
  console.log(`Overall: ${result.overall === 'PASS' ? '✅' : result.overall === 'WARNING' ? '⚠️' : '❌'} ${result.overall}`);
  console.log('');
  
  console.log('Test Results:');
  Object.entries(result.tests).forEach(([test, status]) => {
    const icon = status === 'PASS' ? '✅' : status === 'WARNING' ? '⚠️' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`  ${icon} ${test}: ${status}`);
  });
  
  if (Object.keys(result.metrics).length > 0) {
    console.log('\nMetrics:');
    Object.entries(result.metrics).forEach(([metric, value]) => {
      if (value !== undefined) {
        const display = typeof value === 'number' && metric.includes('Time') 
          ? `${value}ms` 
          : typeof value === 'number' && metric.includes('ompliance')
          ? `${value.toFixed(1)}%`
          : value;
        console.log(`  📊 ${metric}: ${display}`);
      }
    });
  }
  
  if (result.issues.length > 0) {
    console.log('\n❌ Issues:');
    result.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (result.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    result.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
  }
  
  console.log('');
  
  // Exit with appropriate code
  process.exit(result.overall === 'FAIL' ? 1 : 0);
}

main().catch(console.error);