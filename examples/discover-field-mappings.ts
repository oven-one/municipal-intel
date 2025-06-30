/**
 * Field Mapping Discovery Tool
 * Analyzes raw API data to suggest field mappings for new sources
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface FieldSuggestion {
  logicalField: string;
  candidates: Array<{
    fieldName: string;
    confidence: number;
    reason: string;
    sampleValue: any;
  }>;
}

async function discoverFieldMappings(apiUrl: string): Promise<FieldSuggestion[]> {
  console.log('🔍 DISCOVERING FIELD MAPPINGS');
  console.log('='.repeat(50));
  console.log(`📡 API URL: ${apiUrl}`);
  console.log('');

  const SOCRATA_TOKEN = process.env.SOCRATA_TOKEN;
  const headers = SOCRATA_TOKEN ? { 'X-App-Token': SOCRATA_TOKEN } : {};

  try {
    // Fetch sample data
    const url = `${apiUrl}?$limit=5&$order=:updated_at desc`;
    console.log(`📋 Fetching sample data...`);
    
    const response = await axios.get(url, { headers });
    console.log(`✅ Retrieved ${response.data.length} sample records`);
    
    if (response.data.length === 0) {
      console.log('❌ No data returned from API');
      return [];
    }

    const sampleRecord = response.data[0];
    console.log(`📊 Found ${Object.keys(sampleRecord).length} fields in data`);
    console.log('');

    // Analyze all available fields
    console.log('📝 RAW FIELD ANALYSIS:');
    console.log('-'.repeat(30));
    Object.entries(sampleRecord).forEach(([field, value]) => {
      const preview = typeof value === 'string' && value.length > 40 
        ? value.substring(0, 40) + '...' 
        : value;
      const type = Array.isArray(value) ? 'array' : typeof value;
      console.log(`${field.padEnd(25)} | ${type.padEnd(8)} | ${preview}`);
    });
    console.log('');

    // Generate field mapping suggestions
    const suggestions: FieldSuggestion[] = [
      analyzeLogicalField('submitDate', sampleRecord, ['date', 'filed', 'submit', 'application', 'applied', 'created']),
      analyzeLogicalField('approvalDate', sampleRecord, ['approval', 'approved', 'issued', 'issuance', 'complete', 'final']),
      analyzeLogicalField('value', sampleRecord, ['cost', 'value', 'amount', 'fee', 'valuation', 'estimate']),
      analyzeLogicalField('address', sampleRecord, ['address', 'street', 'location', 'site', 'property']),
      analyzeLogicalField('id', sampleRecord, ['id', 'number', 'permit', 'application', 'case', 'ref']),
      analyzeLogicalField('status', sampleRecord, ['status', 'state', 'stage', 'phase', 'condition']),
      analyzeLogicalField('description', sampleRecord, ['description', 'desc', 'work', 'scope', 'details', 'summary']),
      analyzeLogicalField('title', sampleRecord, ['title', 'name', 'type', 'category', 'kind', 'class']),
      analyzeLogicalField('applicant', sampleRecord, ['applicant', 'owner', 'contractor', 'permittee', 'customer', 'client'])
    ];

    return suggestions;

  } catch (error: any) {
    console.log(`❌ Error fetching data: ${error.message}`);
    return [];
  }
}

function analyzeLogicalField(logicalField: string, record: any, keywords: string[]): FieldSuggestion {
  const candidates: Array<{
    fieldName: string;
    confidence: number;
    reason: string;
    sampleValue: any;
  }> = [];

  Object.entries(record).forEach(([fieldName, value]) => {
    const fieldLower = fieldName.toLowerCase();
    let confidence = 0;
    let reasons: string[] = [];

    // Keyword matching
    keywords.forEach(keyword => {
      if (fieldLower.includes(keyword)) {
        confidence += 30;
        reasons.push(`contains '${keyword}'`);
      }
      if (fieldLower === keyword) {
        confidence += 20; // Exact match bonus
        reasons.push('exact match');
      }
      if (fieldLower.startsWith(keyword) || fieldLower.endsWith(keyword)) {
        confidence += 10;
        reasons.push(`starts/ends with '${keyword}'`);
      }
    });

    // Type-specific analysis
    switch (logicalField) {
      case 'submitDate':
      case 'approvalDate':
        if (isDateLike(value)) {
          confidence += 40;
          reasons.push('date format detected');
        }
        break;
        
      case 'value':
        if (isNumericValue(value)) {
          confidence += 30;
          reasons.push('numeric value');
        }
        if (typeof value === 'string' && value.includes('$')) {
          confidence += 20;
          reasons.push('contains currency symbol');
        }
        break;
        
      case 'id':
        if (fieldLower.includes('id') || fieldLower.includes('number')) {
          confidence += 25;
          reasons.push('ID-like field name');
        }
        if (typeof value === 'string' && /^[A-Z0-9\-]+$/.test(value)) {
          confidence += 15;
          reasons.push('alphanumeric ID format');
        }
        break;
        
      case 'address':
        if (typeof value === 'string' && /\d+\s+\w+/.test(value)) {
          confidence += 30;
          reasons.push('address-like format');
        }
        break;
        
      case 'status':
        if (typeof value === 'string' && /^(active|pending|approved|issued|complete|final|open|closed)$/i.test(value)) {
          confidence += 35;
          reasons.push('status-like value');
        }
        break;
    }

    // Common field name patterns
    if (fieldLower.includes('_')) {
      confidence += 5; // Slightly prefer snake_case (common in APIs)
    }

    if (confidence > 0) {
      candidates.push({
        fieldName,
        confidence,
        reason: reasons.join(', '),
        sampleValue: value
      });
    }
  });

  // Sort by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  return {
    logicalField,
    candidates: candidates.slice(0, 3) // Top 3 candidates
  };
}

function isDateLike(value: any): boolean {
  if (typeof value !== 'string') return false;
  
  // Check common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO date
    /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
  ];
  
  return datePatterns.some(pattern => pattern.test(value));
}

function isNumericValue(value: any): boolean {
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    // Remove common currency and formatting characters
    const cleaned = value.replace(/[$,\s]/g, '');
    return /^\d+(\.\d+)?$/.test(cleaned);
  }
  return false;
}

function generateFieldMappingJSON(suggestions: FieldSuggestion[]): string {
  const mappings: Record<string, string> = {};
  
  suggestions.forEach(suggestion => {
    if (suggestion.candidates.length > 0) {
      const bestCandidate = suggestion.candidates[0];
      if (bestCandidate.confidence >= 30) { // Only include high-confidence mappings
        mappings[suggestion.logicalField] = bestCandidate.fieldName;
      }
    }
  });

  return JSON.stringify(mappings, null, 2);
}

async function main() {
  const apiUrl = process.argv[2];
  
  if (!apiUrl) {
    console.log('Usage: npx tsx examples/discover-field-mappings.ts <api-url>');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx examples/discover-field-mappings.ts "https://data.seattle.gov/resource/k44w-2dcq.json"');
    console.log('  npx tsx examples/discover-field-mappings.ts "https://data.sfgov.org/resource/i98e-djp9.json"');
    console.log('');
    process.exit(1);
  }

  const suggestions = await discoverFieldMappings(apiUrl);
  
  if (suggestions.length === 0) {
    console.log('❌ Could not analyze field mappings');
    process.exit(1);
  }

  console.log('🎯 FIELD MAPPING SUGGESTIONS:');
  console.log('='.repeat(50));
  
  suggestions.forEach(suggestion => {
    console.log(`\n📋 ${suggestion.logicalField}:`);
    
    if (suggestion.candidates.length === 0) {
      console.log('   ❌ No candidates found');
    } else {
      suggestion.candidates.forEach((candidate, index) => {
        const icon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        const preview = typeof candidate.sampleValue === 'string' && candidate.sampleValue.length > 30 
          ? candidate.sampleValue.substring(0, 30) + '...' 
          : candidate.sampleValue;
          
        console.log(`   ${icon} ${candidate.fieldName} (confidence: ${candidate.confidence}%)`);
        console.log(`      Reason: ${candidate.reason}`);
        console.log(`      Sample: ${preview}`);
      });
    }
  });

  console.log('\n📝 SUGGESTED FIELD MAPPINGS JSON:');
  console.log('='.repeat(50));
  console.log(generateFieldMappingJSON(suggestions));

  console.log('\n💡 NEXT STEPS:');
  console.log('1. Review the suggested mappings above');
  console.log('2. Test date field ordering to ensure recent data comes first');
  console.log('3. Verify value fields contain reasonable numeric data');
  console.log('4. Add the fieldMappings to your source configuration in municipal-registry.json');
  console.log('5. Test with: npx tsx examples/validate-source.ts <source-id>');
}

main().catch(console.error);