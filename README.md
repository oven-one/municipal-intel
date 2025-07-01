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