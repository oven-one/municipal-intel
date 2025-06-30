/**
 * Comprehensive audit of all sources in the registry
 * Phase 1: Catalog and categorize all 30+ municipal sources
 */

import { createMunicipalIntel } from '../src';
import * as fs from 'fs';
import * as path from 'path';

interface SourceAudit {
  id: string;
  name: string;
  state: string;
  type: 'api' | 'portal' | 'scraping';
  apiType?: string;
  priority: string;
  status: 'fully-implemented' | 'partially-implemented' | 'not-implemented' | 'unknown';
  hasFieldMappings: boolean;
  hasWorkingClient: boolean;
  endpoints: string[];
  issues: string[];
}

async function auditAllSources() {
  console.log('📊 MUNICIPAL SOURCES REGISTRY AUDIT\n');
  console.log('='.repeat(60));

  const municipal = createMunicipalIntel();
  const allSources = municipal.getSources();
  
  console.log(`📋 Total Sources Found: ${allSources.length}`);
  console.log('');

  const auditResults: SourceAudit[] = [];
  const categoryCounts = {
    'fully-implemented': 0,
    'partially-implemented': 0, 
    'not-implemented': 0,
    'unknown': 0
  };

  const typeCounts = {
    'api': 0,
    'portal': 0,
    'scraping': 0
  };

  console.log('🔍 DETAILED SOURCE ANALYSIS:\n');

  // Group sources by state for better organization
  const sourcesByState = allSources.reduce((acc, source) => {
    if (!acc[source.state]) acc[source.state] = [];
    acc[source.state].push(source);
    return acc;
  }, {} as Record<string, typeof allSources>);

  for (const [state, sources] of Object.entries(sourcesByState)) {
    console.log(`📍 ${state.toUpperCase()} (${sources.length} sources)`);
    console.log('-'.repeat(40));

    for (const source of sources) {
      const audit: SourceAudit = {
        id: source.id,
        name: source.name,
        state: source.state,
        type: source.type,
        apiType: source.api?.type,
        priority: source.priority,
        status: 'unknown',
        hasFieldMappings: Boolean(source.api?.fieldMappings && Object.keys(source.api.fieldMappings).length > 0),
        hasWorkingClient: false,
        endpoints: [],
        issues: []
      };

      typeCounts[source.type]++;

      // Collect endpoints
      if (source.api?.datasets) {
        audit.endpoints = Object.values(source.api.datasets).map(d => d.endpoint);
      } else if (source.portal?.url) {
        audit.endpoints = [source.portal.url];
      }

      // Determine implementation status
      if (source.type === 'api') {
        if (source.api?.type === 'socrata') {
          if (audit.hasFieldMappings) {
            audit.status = 'fully-implemented';
            audit.hasWorkingClient = true;
          } else {
            audit.status = 'partially-implemented';
            audit.issues.push('Missing field mappings');
          }
        } else if (source.api?.type === 'custom') {
          audit.status = 'not-implemented';
          audit.issues.push('Custom API client not implemented');
        } else if (source.api?.type === 'arcgis') {
          audit.status = 'not-implemented';
          audit.issues.push('ArcGIS client not implemented');
        }
      } else if (source.type === 'portal') {
        audit.status = 'not-implemented';
        audit.issues.push('Portal scraping not implemented');
      } else if (source.type === 'scraping') {
        audit.status = 'not-implemented';
        audit.issues.push('Web scraping not implemented');
      }

      // Additional validation
      if (source.api?.baseUrl && !source.api.baseUrl.startsWith('http')) {
        audit.issues.push('Invalid base URL format');
      }

      if (source.type === 'api' && !source.api) {
        audit.issues.push('API type source missing API configuration');
      }

      categoryCounts[audit.status]++;
      auditResults.push(audit);

      // Display source info
      const statusIcon = {
        'fully-implemented': '✅',
        'partially-implemented': '🔶', 
        'not-implemented': '❌',
        'unknown': '❓'
      }[audit.status];

      console.log(`  ${statusIcon} ${source.name} (${source.id})`);
      console.log(`     Type: ${source.type}${source.api?.type ? ` (${source.api.type})` : ''}`);
      console.log(`     Priority: ${source.priority}`);
      console.log(`     Field Mappings: ${audit.hasFieldMappings ? '✅' : '❌'}`);
      
      if (audit.endpoints.length > 0) {
        console.log(`     Endpoints: ${audit.endpoints.length}`);
        audit.endpoints.forEach(endpoint => {
          console.log(`       - ${endpoint}`);
        });
      }
      
      if (audit.issues.length > 0) {
        console.log(`     Issues: ${audit.issues.join(', ')}`);
      }
      
      console.log('');
    }
  }

  // Summary Report
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  console.log('🏗️ Implementation Status:');
  Object.entries(categoryCounts).forEach(([status, count]) => {
    const percentage = ((count / allSources.length) * 100).toFixed(1);
    const statusLabel = status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    console.log(`   ${statusLabel}: ${count}/${allSources.length} (${percentage}%)`);
  });
  console.log('');

  console.log('🔧 Source Types:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    const percentage = ((count / allSources.length) * 100).toFixed(1);
    console.log(`   ${type.toUpperCase()}: ${count}/${allSources.length} (${percentage}%)`);
  });
  console.log('');

  console.log('✅ Ready for Testing:');
  const readyForTesting = auditResults.filter(a => 
    a.status === 'fully-implemented' || 
    (a.status === 'partially-implemented' && a.type === 'api' && a.apiType === 'socrata')
  );
  console.log(`   ${readyForTesting.length} sources can be tested with universal token`);
  readyForTesting.forEach(source => {
    console.log(`     - ${source.name} (${source.id})`);
  });
  console.log('');

  console.log('🔶 Need Field Mappings:');
  const needMappings = auditResults.filter(a => 
    a.type === 'api' && a.apiType === 'socrata' && !a.hasFieldMappings
  );
  console.log(`   ${needMappings.length} Socrata sources missing field mappings`);
  needMappings.forEach(source => {
    console.log(`     - ${source.name} (${source.id})`);
  });
  console.log('');

  console.log('❌ Need Implementation:');
  const needImplementation = auditResults.filter(a => 
    a.type === 'portal' || a.type === 'scraping' || 
    (a.type === 'api' && a.apiType !== 'socrata')
  );
  console.log(`   ${needImplementation.length} sources need client implementation`);
  
  const byType = needImplementation.reduce((acc, source) => {
    const key = source.type === 'api' ? `api-${source.apiType}` : source.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(source);
    return acc;
  }, {} as Record<string, SourceAudit[]>);

  Object.entries(byType).forEach(([type, sources]) => {
    console.log(`     ${type}: ${sources.length} sources`);
    sources.slice(0, 3).forEach(source => {
      console.log(`       - ${source.name} (${source.id})`);
    });
    if (sources.length > 3) {
      console.log(`       ... and ${sources.length - 3} more`);
    }
  });
  console.log('');

  console.log('🎯 NEXT STEPS:');
  console.log(`1. Test ${readyForTesting.length} API sources with universal token`);
  console.log(`2. Add field mappings to ${needMappings.length} Socrata sources`);
  console.log(`3. Implement clients for ${Object.keys(byType).length} different source types`);
  console.log(`4. Create implementation guides for new source types`);
  console.log('');

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'source-audit-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSources: allSources.length,
      categoryCounts,
      typeCounts,
      readyForTesting: readyForTesting.length,
      needMappings: needMappings.length,
      needImplementation: needImplementation.length
    },
    sources: auditResults
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📁 Detailed report saved to: ${reportPath}`);
}

auditAllSources().catch(console.error);