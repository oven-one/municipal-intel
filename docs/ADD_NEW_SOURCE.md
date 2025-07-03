# Adding New Municipal Data Sources

This guide shows you **two ways** to add municipal data sources: **runtime registration** (recommended for most users) and **built-in sources** (for package contributors).

## Overview

The municipal-intel package uses a **hybrid architecture**:
- **Built-in sources**: Pre-configured in TypeScript (SF, LA, NYC)
- **Runtime sources**: Added dynamically by users without package updates

**Data source types supported:**
- **API sources** (Socrata, ArcGIS, Custom APIs) ✅ Ready
- **Portal sources** (Accela, eBUILD, web portals) 🚧 Coming soon
- **Scraping sources** (HTML scraping) 🚧 Coming soon

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

3. **Field Discovery**
   - Use the `api-samples/` directory to see real data structures
   - Verify field names and data types from existing sources
   - Understand how numeric values are stored (often as text in Socrata)

4. **Development Environment**
   - Node.js and TypeScript setup
   - Universal Socrata token configured (if applicable)

## Method 1: Runtime Registration (Recommended)

**Use this approach** if you want to add a city for your own use without modifying the package.

### Step 1: Find the Data Portal

Look for the city's open data portal. Many cities use Socrata:
- `data.cityname.gov` or `opendata.cityname.gov`
- Search for "building permits" or "planning applications"
- Note the **dataset ID** from the API URL (e.g., `/resource/abc1-def2.json`)

### Step 2: Register the Source

```typescript
import { createMunicipalIntel } from '@lineai/municipal-intel';

const municipal = createMunicipalIntel();
municipal.setSocrataToken(process.env.SOCRATA_TOKEN);

// Register Seattle as an example
municipal.registerSource({
  id: 'seattle',
  name: 'Seattle',
  state: 'WA',
  type: 'api',
  api: {
    type: 'socrata',
    baseUrl: 'https://data.seattle.gov',
    datasets: {
      buildingPermits: {
        endpoint: '/resource/k44w-2dcq.json',
        name: 'Building Permits',
        fields: ['permit_number', 'application_date', 'issue_date', 'address', 'description']
      }
    },
    fieldMappings: {
      id: 'permit_number',
      submitDate: 'application_date', 
      approvalDate: 'issue_date',
      address: 'address',
      description: 'description'
    }
  },
  priority: 'high'
});

// Now search Seattle data
const results = await municipal.search({ sources: ['seattle'] });
```

### Step 3: Test and Refine

```typescript
// Test the source
try {
  const results = await municipal.search({ 
    sources: ['seattle'], 
    limit: 3 
  });
  console.log(`Found ${results.projects.length} permits from Seattle`);
  
  // Check field mappings work correctly
  results.projects.forEach(project => {
    console.log(`${project.id}: ${project.address} - ${project.status}`);
  });
} catch (error) {
  console.error('Source needs refinement:', error.message);
}

// Adjust field mappings as needed
municipal.unregisterSource('seattle');
municipal.registerSource({
  // ... updated configuration
});
```

**That's it!** No package updates, PRs, or waiting required.

---

## Method 2: Built-in Sources (Package Contributors)

**Use this approach** if you're contributing a commonly-requested city to the main package.

### Step 1: Fork and Setup

```bash
git clone https://github.com/oven-one/municipal-intel.git
cd municipal-intel
yarn install
```

### Step 2: Add to Built-in Registry

Edit `src/data/municipal-registry.ts` and add your source:

```typescript
// In the appropriate state section (wa, fl, etc.)
{
  id: "seattle",
  name: "Seattle",
  state: "WA",
  type: "api",
  api: {
    type: "socrata",
    baseUrl: "https://data.seattle.gov",
    datasets: {
      buildingPermits: {
        endpoint: "/resource/k44w-2dcq.json",
        name: "Building Permits",
        fields: ["permit_number", "application_date", "issue_date", "address", "description"]
      }
    },
    fieldMappings: {
      submitDate: "application_date",
      approvalDate: "issue_date", 
      value: "permit_value",
      address: "address",
      id: "permit_number",
      status: "status",
      description: "description",
      title: "permit_type",
      applicant: "contractor_name"
    },
    authentication: {
      required: false,
      recommended: true,
      type: "app_token"
    }
  },
  priority: "high"
}
```

### Portal Source Example (Coming Soon)

```typescript
{
  id: "austin",
  name: "Austin", 
  state: "TX",
  type: "portal",
  portal: {
    url: "https://abc.austintexas.gov/web/permit/public-search-other",
    system: "accela"
  },
  priority: "medium"
}
```

**Note**: Portal clients are not yet implemented. Use API sources for now.

### Step 3: Test and Build

```bash
# Build the package
yarn build

# Test your new source
yarn test:unit

# Test with real data (if you have a token)
SOCRATA_TOKEN=your-token node -e "
const { createMunicipalIntel } = require('./build/main');
const m = createMunicipalIntel();
m.setSocrataToken(process.env.SOCRATA_TOKEN);
m.search({ sources: ['seattle'], limit: 1 }).then(r => 
  console.log('Success:', r.projects.length, 'projects')
).catch(e => console.error('Error:', e.message));
"
```

### Step 4: Submit PR

```bash
git checkout -b add-seattle-source
git add src/data/municipal-registry.ts
git commit -m "Add Seattle building permits source"
git push origin add-seattle-source
# Create PR on GitHub
```

---

## Common Issues & Solutions

### Value Filtering Problems

**Issue**: 400 errors when using `minValue` with custom Socrata sources
```
Error: Invalid SoQL query
```

**Solution**: Socrata stores numeric values as text. The library automatically handles this with `::number` casting. Ensure your field mappings are correct:

```typescript
fieldMappings: {
  value: "estimated_cost",  // Make sure this field name exists in the API
  // ...
}
```

**Check field names** using the API samples in `/api-samples/` or test queries directly.

### Missing Fields

**Issue**: Some fields return `undefined` or `null`
**Solution**: Use the adjustments framework to understand what's happening:

```typescript
const results = await municipal.search({
  sources: ['your-city'],
  minValue: 100000
});

if (results.adjustments.length > 0) {
  console.log('Query adjustments:', results.adjustments);
  // May show: "YOUR-CITY: Skipped minValue filter - no value field available in dataset"
}
```

### Field Discovery

**Use API samples** to understand data structure:
1. Check `/api-samples/sf-sample.json` for field naming patterns
2. Look at `/api-samples/la-fields.json` for available field lists
3. Compare your API response to existing patterns

**Test your field mappings**:
```typescript
// Register with minimal fields first
municipal.registerSource({
  id: 'test-city',
  fieldMappings: {
    id: 'permit_number',     // Start with required fields only
    status: 'permit_status'
  }
});

// Test basic search first
const results = await municipal.search({ sources: ['test-city'], limit: 1 });
console.log('Raw data:', results.projects[0]?.rawData);
```

### Data Type Issues

**Socrata quirks**:
- Numbers stored as strings: `"50000"` not `50000`
- Dates in various formats: `"2024-01-15T00:00:00.000"` or `"01/15/2024"`
- Boolean values as strings: `"Y"/"N"` or `"true"/"false"`

**The library handles these automatically** but your field mappings must point to correct field names.

### Universal Token Issues

**Problem**: Rate limiting or authentication errors
**Solution**: 
1. Get a universal Socrata token from any Socrata portal
2. Use the same token for all Socrata sources
3. Configure with `municipal.setSocrataToken(token)`

## Summary

| Method | Use Case | Effort | Availability |
|--------|----------|--------|-------------|
| **Runtime Registration** | Personal/internal use | Low | Immediate |
| **Built-in Sources** | Popular cities for all users | Medium | Next release |

**Recommendation**: Start with runtime registration to test your source, then consider contributing it as a built-in source if it's a major city that others would benefit from.

## Advanced: Custom API Example

For non-Socrata APIs (runtime registration):

```typescript
municipal.registerSource({
  id: "boston",
  name: "Boston",
  state: "MA",
  type: "api",
  api: {
    type: "custom",
    baseUrl: "https://api.boston.gov",
    endpoints: {
      permits: "/permits/search",
      applications: "/applications/list"
    },
    fieldMappings: {
      id: "permit_id",
      status: "current_status", 
      submitDate: "submitted_at",
      address: "property_address"
    }
  },
  priority: "high"
});
```

**Note**: Custom API clients require additional implementation. Socrata APIs work out of the box.

## Need Help?

- 🐛 **Issues**: [GitHub Issues](https://github.com/oven-one/municipal-intel/issues)
- 📖 **API Docs**: [MUNICIPAL_API_GUIDE.md](./MUNICIPAL_API_GUIDE.md)
- 💬 **Questions**: Create a discussion on GitHub
