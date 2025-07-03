# @lineai/municipal-intel

Access municipal planning applications, building permits, and construction activity data from major US cities.

## Overview

`@lineai/municipal-intel` provides a unified interface to access local government data from major US cities. Built with TypeScript for maximum type safety, it features a hybrid architecture with built-in sources and runtime extensibility.

## Features

### AI-First Design
- **Discovery API**: Comprehensive discovery methods for AI assistants
- **Strong Typing**: TypeScript autocomplete for municipality IDs and search parameters
- **Search Capabilities**: Dynamic capability detection per municipality
- **Self-Documenting**: Rich metadata about available datasets and fields

### Data Access
- **Unified API**: Single interface for multiple municipal data sources
- **Real-time Data**: Access live permit and planning application data
- **Transparent Adjustments**: Best-effort queries with clear reporting of any modifications
- **Schema Validation**: Zod schemas ensure data consistency and catch API changes

### Developer Experience
- **TypeScript Native**: Built-in sources with full type safety
- **Runtime Extensible**: Add new cities dynamically without package updates
- **Universal Socrata Token**: Single token works across all Socrata portals
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

// 🤖 AI Discovery: Find what's available
const municipalities = municipal.getAvailableMunicipalities();
console.log('Available municipalities:', municipalities);

// Check search capabilities for San Francisco
const capabilities = municipal.getSearchCapabilities('sf');
console.log('SF supports:', capabilities.supportedFilters);

// Search for construction permits in San Francisco
const results = await municipal.search({
  municipalityId: 'sf',        // Type-safe municipality ID
  keywords: ['renovation'],
  minValue: 100000,
  limit: 10
});

console.log(`Found ${results.total} projects`);
results.projects.forEach(project => {
  console.log(project.description); // Natural language description
  console.log('Raw data:', project.rawData); // Full original data
});

// Check for any query adjustments
if (results.adjustments.length > 0) {
  console.log('Query adjustments:', results.adjustments);
}
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

### 🤖 AI Discovery Methods

```typescript
// Get all available municipalities with their datasets
const municipalities = municipal.getAvailableMunicipalities();
// Returns: [{ id: 'sf', name: 'San Francisco', state: 'CA', datasets: [...] }]

// Check what search capabilities a municipality supports
const capabilities = municipal.getSearchCapabilities('sf');
// Returns: { supportedFilters: ['minValue', 'submitDate', ...], limitations: [...] }

// Get detailed field schema for a dataset
const schema = municipal.getDatasetSchema('sf', 'buildingPermits');
// Returns: [{ name: 'permit_number', type: 'string', searchable: true }]
```

### Search Projects

```typescript
const results = await municipal.search({
  // Location filters  
  municipalityId: 'sf',             // Type-safe municipality ('sf' | 'nyc' | 'la')
  addresses: ['Market Street'],     // By address
  zipCodes: ['94102'],             // By ZIP code
  
  // Project filters
  types: ['permit', 'planning'],    // Project types
  statuses: ['approved', 'issued'], // Current status
  keywords: ['renovation'],         // Keywords
  
  // Date filters
  submitDateFrom: new Date('2024-01-01'),
  submitDateTo: new Date('2024-12-31'),
  
  // Value filters (if supported by municipality)
  minValue: 50000,
  maxValue: 1000000,
  
  // Pagination
  limit: 50,
  offset: 0,
  
  // Sorting
  sortBy: 'submitDate',
  sortOrder: 'desc'
});

// Check for query adjustments
console.log('Adjustments:', results.adjustments);
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
        fields: ['permit_number', 'status', 'issue_date', 'address', 'valuation', 'description'],
        fieldMappings: {
          id: 'permit_number',
          status: 'status',
          submitDate: 'issue_date',
          address: 'address',
          value: 'valuation',
          description: 'description'
        }
      }
    }
  },
  priority: 'high'
});

// Now you can search Miami data
const miamiResults = await municipal.search({ municipalityId: 'miami' });

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

### MunicipalProject (AI-First Design)

```typescript
interface MunicipalProject {
  // Core fields optimized for AI consumption
  id: string;              // Unique identifier (e.g., "sf-2024-001234")
  source: string;          // Source municipality ID (e.g., "sf", "nyc")
  description: string;     // Natural language description with full context
  rawData: any;           // Complete original API response
  lastUpdated: Date;      // When data was last fetched
}
```

**Key Design Principles:**
- **AI-Optimized**: Natural language descriptions instead of failed field normalization
- **Complete Context**: Descriptions include full geographic and municipal context
- **Raw Data Preserved**: Full original API response available for detailed analysis
- **Lightweight**: Reduced payload size by ~70% vs. previous complex schema

## Examples

### Monitor New Permits

```typescript
// Get recent permits from San Francisco
const recent = await municipal.search({
  municipalityId: 'sf',
  types: ['permit'],
  submitDateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  sortBy: 'submitDate',
  sortOrder: 'desc'
});

// AI-friendly output with natural language descriptions
recent.projects.forEach(project => {
  console.log(project.description);
  // Example: "Residential alteration permit for kitchen renovation at 123 Main St, San Francisco, CA 94102. Filed 2024-01-15, issued 2024-02-01. Estimated cost: $75,000."
});

// Monitor multiple municipalities
const municipalities = municipal.getAvailableMunicipalities();
for (const municipality of municipalities) {
  const permits = await municipal.search({
    municipalityId: municipality.id,
    limit: 5
  });
  console.log(`\n${municipality.name}: ${permits.total} recent projects`);
  permits.projects.forEach(p => console.log(`  • ${p.description}`));
}
```

### Construction Projects by Value

```typescript
// High-value construction projects in SF
const bigProjects = await municipal.search({
  municipalityId: 'sf',
  minValue: 1000000,
  sortBy: 'value',
  sortOrder: 'desc'
});

// Natural language descriptions include value context automatically
bigProjects.projects.forEach(project => {
  console.log(project.description);
  // Example: "New construction permit for 45-unit residential building at 456 Market St, San Francisco, CA 94105. Filed 2024-01-10, approved 2024-03-15. Estimated cost: $12,500,000. Developer: XYZ Development Corp."
  
  // Access raw data for detailed analysis
  const rawValue = project.rawData.estimated_cost;
  const submitter = project.rawData.applicant_name;
});

// Check capabilities
const municipalities = municipal.getAvailableMunicipalities();
for (const municipality of municipalities) {
  const capabilities = municipal.getSearchCapabilities(municipality.id);
  if (capabilities.supportedFilters.includes('minValue')) {
    console.log(`${municipality.name} supports value filtering`);
  }
}
```

### Geographic Search

```typescript
// Projects in specific SF area
const localProjects = await municipal.search({
  municipalityId: 'sf',
  addresses: ['Market Street', 'Mission Street'],
  zipCodes: ['94102', '94103'],
  limit: 20
});

// Descriptions include full geographic context
localProjects.projects.forEach(project => {
  console.log(project.description);
  // Example: "Commercial tenant improvement at 789 Mission St, San Francisco, CA 94103. Restaurant buildout permit filed 2024-02-20, under review. Estimated cost: $150,000."
});

// Cross-municipality geographic search
const addressSearch = async (streetName: string) => {
  const municipalities = municipal.getAvailableMunicipalities();
  for (const municipality of municipalities) {
    const results = await municipal.search({
      municipalityId: municipality.id,
      addresses: [streetName],
      limit: 3
    });
    console.log(`\n${municipality.name}: ${results.total} projects on ${streetName}`);
    results.projects.forEach(p => {
      console.log(`  • ${p.description}`);
    });
  }
};

await addressSearch('Main Street');
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
  municipalityId: 'sf',
  minValue: 100000  // 400 error
});
```

**Solution**: The library automatically handles this by converting text fields to numbers. If you see this error, ensure you're using the latest version.

**Explanation**: Socrata APIs store numeric values as text strings (e.g., `"500000"` instead of `500000`). The library automatically applies `::number` casting for all numeric comparisons.

### Missing Value Fields

**Problem**: Some sources don't return value information
```typescript
const results = await municipal.search({
  municipalityId: 'nyc',
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
2. Ensure your `fieldMappings` use correct field names at the dataset level
3. Use the library's field discovery tools

```typescript
// Check available fields for your source
const source = municipal.getSource('your-city');
console.log('Available fields:', source.api?.datasets?.buildingPermits?.fields);

// Check what fields are mapped
const fieldMappings = source.api?.datasets?.buildingPermits?.fieldMappings;
console.log('Field mappings:', fieldMappings);

// Use schema discovery to validate
const schema = municipal.getDatasetSchema('your-city', 'buildingPermits');
console.log('Schema:', schema);
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

- [AI-First Design Philosophy](./docs/AI_FIRST_DESIGN.md) - Complete guide to the natural language description approach
- [Adding New Sources](./docs/ADD_NEW_SOURCE.md) - How to add new cities and data sources
- [API Guide](./docs/MUNICIPAL_API_GUIDE.md) - Technical implementation details

## License

MIT

## Related Packages

- [@lineai/gov-deals](https://www.npmjs.com/package/@lineai/gov-deals) - Federal government contracts and opportunities