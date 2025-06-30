# @lineai/municipal-intel

Access municipal planning applications, building permits, and construction activity data from major US cities.

## Overview

`@lineai/municipal-intel` provides a unified interface to access local government data from 65+ municipalities across California, New York, and Florida. It supports multiple data sources including APIs (Socrata, ArcGIS), web portals, and web scraping.

## Features

- **Unified API**: Single interface for multiple municipal data sources
- **Real-time Data**: Access live permit and planning application data
- **Multiple Sources**: Support for Socrata APIs, web portals, and custom scrapers
- **Type Safety**: Full TypeScript support with runtime validation
- **Rate Limiting**: Built-in rate limiting and retry logic
- **Caching**: Optional caching for improved performance

## Supported Cities

### High Priority (API Available)
- **California**: San Francisco, Los Angeles, San Diego, Oakland, San Jose, Sacramento
- **New York**: New York City (all 5 boroughs)
- **Florida**: Miami-Dade County, Orlando, Tampa, Broward County

### Medium/Low Priority
- 50+ additional municipalities via web scraping and portals

See [docs/MUNICIPAL_SOURCES.md](./docs/MUNICIPAL_SOURCES.md) for the complete list.

## Installation

```bash
npm install @lineai/municipal-intel
```

## Quick Start

```typescript
import { createMunicipalIntel } from '@lineai/municipal-intel';

// Create client instance
const municipal = createMunicipalIntel({
  debug: true,
  socrataTokens: {
    sf: 'your-sf-app-token',      // Optional but recommended
    nyc: 'your-nyc-app-token'
  }
});

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

### Socrata Sources (Recommended)

For better rate limits with Socrata-based sources (San Francisco, NYC, Oakland), get free app tokens:

1. **San Francisco**: Visit [data.sfgov.org](https://data.sfgov.org) → Sign up → Developer Settings
2. **New York City**: Visit [data.cityofnewyork.us](https://data.cityofnewyork.us) → Sign up → Developer Settings

```typescript
const municipal = createMunicipalIntel({
  socrataTokens: {
    sf: process.env.SF_SOCRATA_TOKEN,
    nyc: process.env.NYC_SOCRATA_TOKEN
  }
});
```

Rate limits:
- **With token**: 1000 requests/hour
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
SF_SOCRATA_TOKEN=your-san-francisco-app-token
NYC_SOCRATA_TOKEN=your-new-york-city-app-token
OAKLAND_SOCRATA_TOKEN=your-oakland-app-token
```

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
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run fix
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Documentation

- [Municipal Sources](./docs/MUNICIPAL_SOURCES.md) - Complete list of supported municipalities
- [API Guide](./docs/MUNICIPAL_API_GUIDE.md) - Technical implementation details

## License

MIT

## Related Packages

- [@lineai/gov-deals](https://www.npmjs.com/package/@lineai/gov-deals) - Federal government contracts and opportunities