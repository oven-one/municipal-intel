# Municipal API Technical Guide

## Overview

This guide provides technical details for integrating with municipal planning and permit APIs. It covers authentication, rate limits, best practices, and code examples for each API type.

## API Types

### 1. Socrata API (San Francisco, NYC, Oakland, Sacramento)

#### Authentication
- **Optional but Recommended**: App tokens provide higher rate limits
- **How to Get Token**:
  1. Create account at the data portal (e.g., data.sfgov.org)
  2. Navigate to Developer Settings
  3. Register new application
  4. Copy the App Token

#### Rate Limits
- **Without Token**: Shared pool, very limited
- **With Token**: 1000 requests per rolling hour
- **429 Response**: When rate limited

#### Request Format
```typescript
// Basic request
GET https://data.sfgov.org/resource/i98e-djp9.json

// With authentication
GET https://data.sfgov.org/resource/i98e-djp9.json
Headers:
  X-App-Token: YOUR_APP_TOKEN

// With SoQL query
GET https://data.sfgov.org/resource/i98e-djp9.json?$where=filed_date > '2024-01-01'&$limit=100
```

#### SoQL Query Language
```typescript
// Common query parameters
$where  - Filter conditions
$select - Choose specific fields
$limit  - Number of results (max 50000)
$offset - Pagination
$order  - Sort results

// Examples
?$where=permit_type='construction' AND estimated_cost > 100000
?$select=permit_number,address,filed_date,status
?$order=filed_date DESC
?$limit=100&$offset=200
```

#### Example Implementation
```typescript
import axios from 'axios';

class SocrataClient {
  private baseUrl: string;
  private appToken?: string;

  constructor(baseUrl: string, appToken?: string) {
    this.baseUrl = baseUrl;
    this.appToken = appToken;
  }

  async query(dataset: string, params: Record<string, any> = {}) {
    const headers = this.appToken 
      ? { 'X-App-Token': this.appToken }
      : {};

    const response = await axios.get(
      `${this.baseUrl}/resource/${dataset}.json`,
      { 
        params,
        headers,
        timeout: 30000
      }
    );

    return response.data;
  }

  // Get building permits with pagination
  async getBuildingPermits(options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const params: any = {
      $limit: options.limit || 100,
      $offset: options.offset || 0,
      $order: 'filed_date DESC'
    };

    if (options.startDate || options.endDate) {
      const conditions = [];
      if (options.startDate) {
        conditions.push(`filed_date >= '${options.startDate}'`);
      }
      if (options.endDate) {
        conditions.push(`filed_date <= '${options.endDate}'`);
      }
      params.$where = conditions.join(' AND ');
    }

    return this.query('i98e-djp9', params); // SF building permits
  }
}
```

### 2. ArcGIS REST API (San Diego)

#### Authentication
- Generally not required for public data
- May need API key for premium features

#### Request Format
```typescript
// Query service
GET https://services.arcgis.com/.../FeatureServer/0/query
?where=1=1
&outFields=*
&f=json
&resultRecordCount=100
```

#### Example Implementation
```typescript
class ArcGISClient {
  async queryFeatures(serviceUrl: string, options: {
    where?: string;
    outFields?: string[];
    maxRecords?: number;
  }) {
    const params = {
      where: options.where || '1=1',
      outFields: options.outFields?.join(',') || '*',
      f: 'json',
      resultRecordCount: options.maxRecords || 100
    };

    const response = await axios.get(`${serviceUrl}/query`, { params });
    return response.data.features;
  }
}
```

### 3. Accela Citizen Access (Orlando, Tampa, Fresno)

#### Overview
- Web-based portal system
- No official API
- Requires web scraping or browser automation

#### Approach
```typescript
// Using Puppeteer for dynamic content
import puppeteer from 'puppeteer';

class AccelaScper {
  async searchPermits(city: string, searchTerm: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(`https://aca-prod.accela.com/${city}/`);
    
    // Navigate to permit search
    await page.click('a[href*="Cap/CapHome.aspx?module=Building"]');
    
    // Perform search
    await page.type('#ctl00_PlaceHolderMain_txtSearchCondition', searchTerm);
    await page.click('#ctl00_PlaceHolderMain_btnSearch');
    
    // Wait for results
    await page.waitForSelector('.ACA_Grid_OverFlow');
    
    // Extract data
    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('.ACA_Grid_OverFlow tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          permitNumber: cells[0]?.textContent?.trim(),
          address: cells[1]?.textContent?.trim(),
          type: cells[2]?.textContent?.trim(),
          status: cells[3]?.textContent?.trim()
        };
      });
    });
    
    await browser.close();
    return results;
  }
}
```

### 4. Custom Municipal APIs (Los Angeles)

#### Los Angeles Open Data
```typescript
// LA uses modified Socrata-like API
GET https://data.lacity.org/resource/yv23-pmwf.json
?$where=issue_date > '2024-01-01'
&$select=permit_number,address,permit_type,status
```

## Data Normalization Strategy

### Common Schema
```typescript
interface MunicipalProject {
  // Required fields
  id: string;              // Unique identifier
  source: string;          // Municipality code (e.g., 'sf', 'nyc')
  type: ProjectType;       // 'permit' | 'planning' | 'construction'
  title: string;           // Project name or description
  address: string;         // Normalized address
  status: string;          // Current status
  submitDate: Date;        // Application/filing date
  
  // Optional fields
  approvalDate?: Date;     // When approved
  value?: number;          // Estimated cost/value
  applicant?: string;      // Applicant name
  contractor?: string;     // Contractor name
  description?: string;    // Detailed description
  documents?: Document[];  // Related documents
  url?: string;           // Link to details
  coordinates?: {         // Geolocation
    lat: number;
    lng: number;
  };
}
```

### Field Mapping Examples

#### San Francisco Socrata
```typescript
function normalizeSFPermit(permit: any): MunicipalProject {
  return {
    id: `sf-${permit.permit_number}`,
    source: 'sf',
    type: mapPermitType(permit.permit_type),
    title: permit.description || 'Building Permit',
    address: normalizeAddress({
      number: permit.street_number,
      street: permit.street_name,
      suffix: permit.street_suffix
    }),
    status: permit.status,
    submitDate: new Date(permit.filed_date),
    approvalDate: permit.issued_date ? new Date(permit.issued_date) : undefined,
    value: parseFloat(permit.estimated_cost) || undefined,
    applicant: permit.applicant_name,
    coordinates: permit.location ? {
      lat: parseFloat(permit.location.latitude),
      lng: parseFloat(permit.location.longitude)
    } : undefined
  };
}
```

#### NYC DOB
```typescript
function normalizeNYCPermit(permit: any): MunicipalProject {
  return {
    id: `nyc-${permit.job__}-${permit.doc__}`,
    source: 'nyc',
    type: mapNYCJobType(permit.job_type),
    title: `${permit.job_type} - ${permit.job_status_descrp}`,
    address: `${permit.house__} ${permit.street_name}, ${permit.borough}`,
    status: permit.permit_status,
    submitDate: new Date(permit.filing_date),
    approvalDate: permit.issuance_date ? new Date(permit.issuance_date) : undefined,
    value: permit.estimated_job_cost,
    applicant: permit.owner_s_business_name || 
              `${permit.owner_s_first_name} ${permit.owner_s_last_name}`,
    coordinates: permit.latitude ? {
      lat: parseFloat(permit.latitude),
      lng: parseFloat(permit.longitude)
    } : undefined
  };
}
```

## Best Practices

### 1. Rate Limiting
```typescript
import pLimit from 'p-limit';

class RateLimitedClient {
  private limit = pLimit(10); // 10 concurrent requests
  private requestCount = 0;
  private resetTime = Date.now() + 3600000; // 1 hour

  async request(fn: () => Promise<any>) {
    // Check hourly limit
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 3600000;
    }

    if (this.requestCount >= 900) { // Leave buffer
      const waitTime = this.resetTime - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    return this.limit(async () => {
      this.requestCount++;
      return fn();
    });
  }
}
```

### 2. Caching
```typescript
import NodeCache from 'node-cache';

class CachedMunicipalClient {
  private cache = new NodeCache({ 
    stdTTL: 3600, // 1 hour default
    checkperiod: 600 // Check every 10 min
  });

  async getWithCache(key: string, fetcher: () => Promise<any>, ttl?: number) {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const data = await fetcher();
    this.cache.set(key, data, ttl);
    return data;
  }
}
```

### 3. Error Handling
```typescript
class MunicipalAPIError extends Error {
  constructor(
    message: string,
    public source: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MunicipalAPIError';
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}
```

### 4. Data Validation
```typescript
import { z } from 'zod';

const MunicipalProjectSchema = z.object({
  id: z.string(),
  source: z.string(),
  type: z.enum(['permit', 'planning', 'construction']),
  title: z.string(),
  address: z.string(),
  status: z.string(),
  submitDate: z.date(),
  approvalDate: z.date().optional(),
  value: z.number().optional(),
  applicant: z.string().optional(),
  contractor: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

function validateProject(data: any): MunicipalProject {
  return MunicipalProjectSchema.parse(data);
}
```

## Environment Variables

```bash
# .env.example
# Socrata App Tokens
SF_SOCRATA_TOKEN=your-sf-app-token
NYC_SOCRATA_TOKEN=your-nyc-app-token
OAKLAND_SOCRATA_TOKEN=your-oakland-app-token

# Cache Settings
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600

# Rate Limiting
RATE_LIMIT_PER_HOUR=900
CONCURRENT_REQUESTS=10

# Scraping Settings
PUPPETEER_HEADLESS=true
SCRAPING_DELAY=1000
```

## Testing

### Mock Socrata Response
```typescript
export const mockSFPermit = {
  permit_number: "202301234567",
  permit_type: "alterations",
  status: "issued",
  street_number: "123",
  street_name: "Market",
  street_suffix: "St",
  description: "Interior renovation",
  estimated_cost: "150000",
  filed_date: "2024-01-15T00:00:00.000",
  issued_date: "2024-02-01T00:00:00.000",
  location: {
    latitude: "37.7749",
    longitude: "-122.4194"
  }
};
```

### Integration Test
```typescript
describe('Municipal API Integration', () => {
  it('should fetch SF permits', async () => {
    const client = new SocrataClient(
      'https://data.sfgov.org',
      process.env.SF_SOCRATA_TOKEN
    );

    const permits = await client.getBuildingPermits({
      startDate: '2024-01-01',
      limit: 10
    });

    expect(permits).toHaveLength(10);
    expect(permits[0]).toHaveProperty('permit_number');
  });
});
```

## Monitoring & Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'municipal-api.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log API requests
function logAPIRequest(source: string, endpoint: string, params: any) {
  logger.info('API Request', {
    source,
    endpoint,
    params,
    timestamp: new Date().toISOString()
  });
}
```

## Next Steps

1. Implement Socrata client with authentication
2. Build rate limiting middleware
3. Create caching layer
4. Develop web scraping framework
5. Set up monitoring and alerting
6. Create unified search interface