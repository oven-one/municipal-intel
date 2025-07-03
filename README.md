# @lineai/municipal-intel

Access municipal planning applications, building permits, and construction activity data from major US cities.

## Overview

`@lineai/municipal-intel` provides a unified interface to access local government data from major US cities. Built with TypeScript for maximum type safety, it features a hybrid architecture with built-in sources and runtime extensibility.

## Features

- **Unified API**: Single interface for multiple municipal data sources
- **Real-time Data**: Access live permit and planning application data
- **TypeScript Native**: Built-in sources defined in TypeScript (no JSON dependencies)
- **Runtime Extensible**: Add new cities dynamically without package updates
- **Universal Socrata Token**: Single token works across all Socrata portals
- **Transparent Adjustments**: Best-effort queries with clear reporting of any modifications
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Rate Limiting**: Built-in rate limiting and retry logic

## Supported Cities

### Built-in Sources (Ready to Use)
- **California**: San Francisco, Los Angeles
- **New York**: New York City (all 5 boroughs)

### Runtime Registration (Add Your Own)
- **Any Socrata Portal**: Add any city with Socrata-based open data
- **Custom APIs**: Register custom municipal APIs
- **Extensible**: No package updates needed for new cities

See [docs/ADD_NEW_SOURCE.md](./docs/ADD_NEW_SOURCE.md) for adding new sources.

## Installation

```bash
npm install @lineai/municipal-intel
```

## Quick Start

```typescript
import { createMunicipalIntel } from '@lineai/municipal-intel';

// Create client instance
const municipal = createMunicipalIntel({
  debug: true
});

// Set universal Socrata token (works for all cities)
municipal.setSocrataToken(process.env.SOCRATA_TOKEN);

// Search for construction permits in San Francisco
const results = await municipal.search({
  sources: ['sf'],
  types: ['permit', 'construction'],
  keywords: ['renovation', 'construction'],
  minValue: 100000,
  limit: 10
});

console.log(`Found ${results.total} projects`);
results.projects.forEach(project => {
  console.log(`${project.title} - ${project.address} - $${project.value}`);
});
```

## Authentication

### Universal Socrata Token (Recommended)

Get a **single** free app token that works across **all** Socrata portals:

1. Visit any Socrata portal (e.g., [data.sfgov.org](https://data.sfgov.org))
2. Sign up → Developer Settings → Create App Token
3. Use this **same token** for all cities!

```typescript
const municipal = createMunicipalIntel();
municipal.setSocrataToken(process.env.SOCRATA_TOKEN);
```

**Rate limits:**
- **With token**: 1000 requests/hour per portal
- **Without token**: Shared pool, very limited

## API Reference

### Search Projects

```typescript
const results = await municipal.search({
  // Location filters
  sources: ['sf', 'nyc'],           // Specific sources
  states: ['CA', 'NY'],             // By state
  cities: ['San Francisco'],        // By city name
  addresses: ['Market Street'],     // By address
  zipCodes: ['94102'],             // By ZIP code
  
  // Project filters
  types: ['permit', 'planning'],    // Project types
  statuses: ['approved', 'issued'], // Current status
  keywords: ['renovation'],         // Keywords
  
  // Date filters
  submitDateFrom: new Date('2024-01-01'),
  submitDateTo: new Date('2024-12-31'),
  
  // Value filters
  minValue: 50000,
  maxValue: 1000000,
  
  // Pagination
  limit: 50,
  offset: 0,
  
  // Sorting
  sortBy: 'submitDate',
  sortOrder: 'desc'
});
```

### Get Specific Project

```typescript
const project = await municipal.getProject('sf', 'sf-202401234567');
```

### List Available Sources

```typescript
// All sources
const allSources = municipal.getSources();

// Filter by criteria
const apiSources = municipal.getSources({ 
  type: 'api', 
  priority: 'high' 
});

// By state
const caSources = municipal.getSources({ state: 'ca' });
```

### Health Checks

```typescript
const health = await municipal.healthCheck('sf');
console.log(`Status: ${health.status}, Latency: ${health.latency}ms`);
```

### Runtime Source Registration

Add new cities without updating the package:

```typescript
// Register a new Florida city
municipal.registerSource({
  id: 'miami',
  name: 'Miami-Dade County',
  state: 'FL',
  type: 'api',
  api: {
    type: 'socrata',
    baseUrl: 'https://opendata.miamidade.gov',
    datasets: {
      buildingPermits: {
        endpoint: '/resource/8wbx-tpnc.json',
        name: 'Building Permits',
        fields: ['permit_number', 'status', 'issue_date', 'address']
      }
    },
    fieldMappings: {
      id: 'permit_number',
      status: 'status',
      submitDate: 'issue_date',
      address: 'address'
    }
  },
  priority: 'high'
});

// Now you can search Miami data
const miamiResults = await municipal.search({ sources: ['miami'] });

// Remove runtime source
municipal.unregisterSource('miami');
```

## Query Adjustments & Transparency

The library implements a best-effort approach with full transparency when handling different data sources. When a requested filter cannot be applied to a particular source, the library will continue the search and report what adjustments were made.

### Adjustments Array

All search responses include an `adjustments` array that reports any modifications made to your query:

```typescript
interface MunicipalSearchResponse {
  projects: MunicipalProject[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  adjustments: string[];  // Query modifications made during search
}
```

### Common Adjustments

**Value Filter Skipping**: Some sources don't have cost/value fields
```typescript
const results = await municipal.search({
  sources: ['sf', 'nyc'],
  minValue: 100000
});

// Results:
// {
//   projects: [...],
//   total: 1234,
//   adjustments: [
//     "NYC: Skipped minValue filter - no value field available in dataset"
//   ]
// }
```

**Field Type Conversions**: Socrata sources store numbers as text, requiring automatic casting
```typescript
// The library automatically converts text to numbers for comparisons
// SF: estimated_cost field contains "500000" (string) 
// Query: WHERE estimated_cost::number >= 100000
// No adjustment needed - handled transparently
```

### Adjustment Principles

- **Silent Success**: No adjustments reported when everything works normally
- **Transparent Failures**: Only report when something unexpected happens
- **Continue on Errors**: Skip problematic filters rather than fail entire search
- **AI-Friendly**: Clean responses for automated processing

### Best Practices

**For AI Assistants**:
```typescript
const results = await municipal.search(params);

if (results.adjustments.length > 0) {
  // Inform user about limitations
  console.log('Note: ' + results.adjustments.join('; '));
}
```

**For Applications**:
```typescript
// Always check adjustments for user feedback
if (results.adjustments.length > 0) {
  showWarning('Some filters were not available for all sources');
}
```

## Data Types

### MunicipalProject

```typescript
interface MunicipalProject {
  // Required
  id: string;              // Unique identifier
  source: string;          // Source municipality
  type: ProjectType;       // 'permit' | 'planning' | 'construction'
  title: string;           // Project description
  address: string;         // Location
  status: ProjectStatus;   // Current status
  submitDate: Date;        // Filed date
  
  // Optional
  approvalDate?: Date;     // Approval date
  value?: number;          // Estimated cost
  applicant?: string;      // Applicant name
  contractor?: string;     // Contractor
  description?: string;    // Details
  coordinates?: { lat: number; lng: number };
  documents?: Document[];  // Related files
  url?: string;           // Details page
}
```

## Examples

### Monitor New Permits

```typescript
// Get recent permits from multiple sources
const recent = await municipal.search({
  sources: ['sf', 'nyc', 'la'],
  types: ['permit'],
  submitDateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  sortBy: 'submitDate',
  sortOrder: 'desc'
});
```

### Construction Projects by Value

```typescript
// High-value construction projects
const bigProjects = await municipal.search({
  types: ['construction', 'renovation'],
  minValue: 1000000,
  statuses: ['approved', 'issued'],
  sortBy: 'value',
  sortOrder: 'desc'
});
```

### Geographic Search

```typescript
// Projects in specific area
const localProjects = await municipal.search({
  addresses: ['Market Street', 'Mission Street'],
  zipCodes: ['94102', '94103'],
  limit: 20
});
```

## Environment Variables

```bash
# .env
SOCRATA_TOKEN=your-universal-socrata-app-token
```

**Note**: A single Socrata token works across **all** Socrata portals (San Francisco, NYC, Miami, etc.)

## Error Handling

```typescript
import { MunicipalDataError, RateLimitError } from '@lineai/municipal-intel';

try {
  const results = await municipal.search({ sources: ['sf'] });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.details?.resetTime);
  } else if (error instanceof MunicipalDataError) {
    console.log('API error:', error.message, 'Source:', error.source);
  }
}
```

## Troubleshooting

### Value Filtering Issues

**Problem**: Getting 400 errors when using `minValue` parameter
```typescript
// This might fail with "Invalid SoQL query" error
const results = await municipal.search({
  sources: ['sf'],
  minValue: 100000  // 400 error
});
```

**Solution**: The library automatically handles this by converting text fields to numbers. If you see this error, ensure you're using the latest version.

**Explanation**: Socrata APIs store numeric values as text strings (e.g., `"500000"` instead of `500000`). The library automatically applies `::number` casting for all numeric comparisons.

### Missing Value Fields

**Problem**: Some sources don't return value information
```typescript
const results = await municipal.search({
  sources: ['nyc'],
  minValue: 100000
});
// NYC projects show value: null
```

**Solution**: Check the `adjustments` array for information about skipped filters:
```typescript
if (results.adjustments.length > 0) {
  console.log('Filters adjusted:', results.adjustments);
  // Output: ["NYC: Skipped minValue filter - no value field available in dataset"]
}
```

### Rate Limiting

**Problem**: Getting rate limited frequently
**Solution**: Use a Socrata app token:
```typescript
municipal.setSocrataToken(process.env.SOCRATA_TOKEN);
// Increases limit from ~100/hour to 1000/hour per portal
```

### Field Mappings

**Problem**: Custom sources not returning expected data
**Solution**: Verify field mappings match actual API response:

1. Check the API samples in `/api-samples/` directory
2. Ensure your `fieldMappings` use correct field names
3. Use the library's field discovery tools

```typescript
// Check available fields for your source
const source = municipal.getSource('your-city');
console.log('Available fields:', source.api?.datasets?.buildingPermits?.fields);
```

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Test
yarn test:unit

# Lint and fix
yarn fix
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Documentation

- [Adding New Sources](./docs/ADD_NEW_SOURCE.md) - How to add new cities and data sources
- [API Guide](./docs/MUNICIPAL_API_GUIDE.md) - Technical implementation details

## License

MIT

## Related Packages

- [@lineai/gov-deals](https://www.npmjs.com/package/@lineai/gov-deals) - Federal government contracts and opportunities