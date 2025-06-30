# Adding New Municipal Data Sources

This guide walks you through adding new municipal data sources to the @lineai/municipal-intel package.

## Overview

The municipal-intel package supports three types of data sources:
- **API sources** (Socrata, ArcGIS, Custom APIs)
- **Portal sources** (Accela, eBUILD, custom web portals)
- **Scraping sources** (HTML scraping for static sites)

## Prerequisites

Before adding a new source, you'll need:

1. **Source Investigation**
   - Identify the municipality's data source type
   - Locate API documentation or portal URLs
   - Understand data structure and field names
   - Determine update frequency and data quality

2. **Access Requirements**
   - API tokens (if required)
   - Rate limits and authentication details
   - Legal compliance (terms of service, attribution)

3. **Development Environment**
   - Node.js and TypeScript setup
   - Municipal-intel codebase cloned
   - Universal Socrata token configured (if applicable)

## Step 1: Source Registry Configuration

Add your new source to `src/data/municipal-registry.json` under the appropriate state:

### API Source Example (Socrata)

```json
{
  "id": "seattle",
  "name": "Seattle",
  "type": "api",
  "api": {
    "type": "socrata",
    "baseUrl": "https://data.seattle.gov",
    "datasets": {
      "buildingPermits": {
        "endpoint": "/resource/k44w-2dcq.json",
        "name": "Building Permits",
        "fields": ["permit_number", "application_date", "issue_date", "address", "description"]
      }
    },
    "fieldMappings": {
      "submitDate": "application_date",
      "approvalDate": "issue_date", 
      "value": "permit_value",
      "address": "address",
      "id": "permit_number",
      "status": "status",
      "description": "description",
      "title": "permit_type",
      "applicant": "contractor_name"
    },
    "authentication": {
      "required": false,
      "recommended": true,
      "type": "app_token"
    }
  },
  "priority": "high"
}
```

### Portal Source Example

```json
{
  "id": "austin",
  "name": "Austin", 
  "type": "portal",
  "portal": {
    "url": "https://abc.austintexas.gov/web/permit/public-search-other",
    "system": "accela",
    "searchParams": {
      "permitType": "Building",
      "status": "All"
    }
  },
  "priority": "medium"
}
```

### Custom API Source Example

```json
{
  "id": "boston",
  "name": "Boston",
  "type": "api", 
  "api": {
    "type": "custom",
    "baseUrl": "https://data.boston.gov/api/3/action",
    "endpoints": {
      "permits": "/datastore_search?resource_id=6ddcd912-32a0-43df-9908-63574f8c7e77"
    }
  },
  "priority": "high"
}
```

## Step 2: Field Mapping Discovery

Understanding the source's data structure is critical for proper field mapping.

### 2.1 Explore the Data Structure

Create a discovery script to understand the API:

```typescript
// examples/discover-[city].ts
import axios from 'axios';

async function discoverFields() {
  const response = await axios.get('https://data.seattle.gov/resource/k44w-2dcq.json?$limit=2');
  
  console.log('Sample record:');
  console.log(JSON.stringify(response.data[0], null, 2));
  
  console.log('Available fields:');
  console.log(Object.keys(response.data[0]));
}
```

### 2.2 Create Field Mappings

Map the source's field names to our normalized schema:

| Logical Field | Description | Common Source Names |
|---------------|-------------|-------------------|
| `submitDate` | When permit was submitted/filed | `filed_date`, `application_date`, `submit_date`, `date_filed` |
| `approvalDate` | When permit was approved/issued | `issued_date`, `approval_date`, `issuance_date`, `approved_date` |
| `value` | Project value/cost | `estimated_cost`, `permit_value`, `project_cost`, `valuation` |
| `address` | Project address | `address`, `street_address`, `location`, `site_address` |
| `id` | Unique permit identifier | `permit_number`, `permit_id`, `application_id`, `id` |
| `status` | Current permit status | `status`, `permit_status`, `state`, `current_status` |
| `description` | Work description | `description`, `work_description`, `scope_of_work`, `project_description` |
| `title` | Permit type/title | `permit_type`, `type`, `category`, `work_type` |
| `applicant` | Who applied | `applicant_name`, `contractor`, `owner_name`, `permittee` |

### 2.3 Handle Date Formats

Different sources use different date formats. Test your date field:

```bash
# Test which date field gives recent records
curl "https://data.seattle.gov/resource/k44w-2dcq.json?\$order=application_date desc&\$limit=1"
```

## Step 3: Implementation

### 3.1 For Socrata Sources

If it's a Socrata API, you're mostly done! The existing `SocrataClient` will handle it automatically once you add the registry configuration with proper field mappings.

Test immediately:
```typescript
const municipal = createMunicipalIntel({ socrataToken: 'your-token' });
const result = await municipal.search({ sources: ['seattle'], limit: 5 });
```

### 3.2 For Custom API Sources

Create a new client class in `src/clients/[type]/`:

```typescript
// src/clients/custom/boston-client.ts
export class BostonClient extends BaseMunicipalClient {
  async search(params: MunicipalSearchParams): Promise<MunicipalSearchResponse> {
    // Custom implementation for Boston's API
  }
  
  async getProject(id: string): Promise<MunicipalProject | null> {
    // Custom implementation
  }
}
```

Update `ClientFactory` to handle the new client type.

### 3.3 For Portal Sources

Implement portal scraping or automation:

```typescript
// src/clients/portal/accela-client.ts  
export class AccelaClient extends BaseMunicipalClient {
  async search(params: MunicipalSearchParams): Promise<MunicipalSearchResponse> {
    // Portal automation implementation
  }
}
```

## Step 4: Testing

### 4.1 Basic Functionality Test

```typescript
// examples/test-[city].ts
import { createMunicipalIntel } from '../src';

async function testNewSource() {
  const municipal = createMunicipalIntel({ 
    socrataToken: process.env.SOCRATA_TOKEN 
  });

  // Test basic search
  const result = await municipal.search({
    sources: ['seattle'],
    limit: 5
  });
  
  console.log(`Retrieved ${result.projects.length} projects`);
  console.log('Sample project:', result.projects[0]);
  
  // Test specific project retrieval
  if (result.projects.length > 0) {
    const project = await municipal.getProject('seattle', result.projects[0].id);
    console.log('Retrieved specific project:', project);
  }
}
```

### 4.2 Schema Validation Test

```typescript
import { MunicipalProjectSchema } from '../src/types/projects';

// Validate each project against schema
result.projects.forEach((project, i) => {
  const validation = MunicipalProjectSchema.safeParse(project);
  if (!validation.success) {
    console.log(`Project ${i} validation failed:`, validation.error.errors);
  }
});
```

### 4.3 Field Mapping Verification

```typescript
// Verify field mappings produce expected data
const sample = result.projects[0];
console.log('Field mapping verification:');
console.log(`Submit Date: ${sample.submitDate} (should be recent)`);
console.log(`Address: ${sample.address} (should be readable)`);
console.log(`Value: ${sample.value} (should be numeric or null)`);
```

## Step 5: Quality Assurance

### 5.1 Data Quality Checks

- **Date Freshness**: Recent permits should appear first
- **Address Format**: Addresses should be readable
- **Value Consistency**: Monetary values should be reasonable
- **Status Mapping**: Status values should be standardized
- **Required Fields**: Core fields should not be null

### 5.2 Performance Testing

```typescript
// Test rate limits and response times
const start = Date.now();
const results = await Promise.all([
  municipal.search({ sources: ['seattle'], limit: 10 }),
  municipal.search({ sources: ['seattle'], limit: 10 }),
  municipal.search({ sources: ['seattle'], limit: 10 })
]);
const duration = Date.now() - start;

console.log(`3 concurrent requests completed in ${duration}ms`);
```

### 5.3 Error Handling

Test edge cases:
- Empty search results  
- Invalid project IDs
- API downtime/errors
- Rate limit exceeded
- Invalid search parameters

## Step 6: Documentation

### 6.1 Update Registry Info

Add source details to the registry metadata:

```json
{
  "metadata": {
    "totalSources": 31,
    "lastUpdated": "2025-01-30"
  }
}
```

### 6.2 Add Source Documentation

Document any source-specific quirks:

```typescript
// In source configuration, add notes
{
  "id": "seattle",
  "notes": {
    "dateFormat": "ISO 8601",
    "updateFrequency": "daily",
    "knownIssues": ["Permit values sometimes missing for residential"],
    "rateLimit": "1000 requests/hour with token"
  }
}
```

## Step 7: Integration

### 7.1 Update Tests

Add test cases for the new source:

```typescript
// src/integration.spec.ts
test('Seattle source integration', async t => {
  const municipal = createMunicipalIntel({ socrataToken: 'test-token' });
  const result = await municipal.search({ sources: ['seattle'], limit: 1 });
  
  t.is(result.projects.length, 1);
  t.truthy(result.projects[0].id);
  t.truthy(result.projects[0].submitDate);
});
```

### 7.2 Update Examples

Add the new source to examples:

```typescript
// examples/basic-usage.ts
const sources = municipal.getSources({ state: 'wa' });
console.log('Washington sources:', sources.map(s => s.name));
```

## Common Issues & Solutions

### Issue: 403 Forbidden
**Solution**: Check if API requires authentication or has IP restrictions

### Issue: 404 Not Found  
**Solution**: Verify endpoint URL and dataset ID are correct

### Issue: Date Sorting Returns Old Data
**Solution**: Use a different date field or check for null values

### Issue: Field Mapping Errors
**Solution**: Verify source field names match exactly (case-sensitive)

### Issue: Rate Limited
**Solution**: Add proper delay between requests or get API token

### Issue: Schema Validation Fails
**Solution**: Check data types and handle null values properly

## Best Practices

1. **Start Simple**: Begin with basic search functionality
2. **Test Early**: Validate field mappings with real data immediately  
3. **Handle Nulls**: Municipal data often has missing values
4. **Date Handling**: Always test date field ordering for recent data
5. **Error Gracefully**: Implement proper error handling and fallbacks
6. **Document Quirks**: Note any source-specific behaviors
7. **Monitor Quality**: Set up alerts for data quality issues
8. **Rate Limit Respect**: Always honor API rate limits

## Getting Help

- Check existing source implementations in `src/data/municipal-registry.json`
- Review `SocrataClient` for API patterns
- Use the audit script: `npx tsx examples/audit-all-sources.ts`
- Test with schema validation: `npx tsx examples/test-schema-validation.ts`

## Checklist

- [ ] Source added to registry with correct state/type
- [ ] Field mappings tested and validated  
- [ ] Date field returns recent data when sorted desc
- [ ] Schema validation passes for sample data
- [ ] Error handling implemented
- [ ] Performance acceptable (< 2s for typical queries)
- [ ] Documentation updated
- [ ] Tests added
- [ ] Integration tested with real API calls

---

**Next Steps**: Once your source is working, consider contributing it back to the main repository to help other developers access municipal data more easily!