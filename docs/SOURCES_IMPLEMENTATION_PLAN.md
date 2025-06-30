# Municipal Intel - Source Implementation Plan

## 📋 Overview
This document outlines the comprehensive plan to test all remaining sources, validate their configurations, and establish a process for implementing new municipal data sources.

## 🎯 Goals
1. Audit and test all 30+ sources in the registry
2. Add field mappings to partially implemented sources
3. Document the process for adding new sources
4. Create automated tools for source validation and implementation

## 📊 Phase 1: Registry Audit (Completed)
**Status**: ✅ Script created (`examples/audit-all-sources.ts`)

### Tasks:
- [x] Create registry audit script
- [ ] Run audit to catalog all sources
- [ ] Identify implementation status for each source
- [ ] Generate detailed audit report

### Deliverables:
- Source audit report with implementation status
- List of sources ready for testing
- List of sources needing field mappings
- List of sources needing client implementation

## 🧪 Phase 2: Test All API Sources
**Status**: 🔄 Pending

### Tasks:
- [ ] Create universal API source tester
- [ ] Test all Socrata sources with universal token
- [ ] Analyze raw data structure from each source
- [ ] Generate field mapping suggestions

### Script to Create: `examples/test-all-api-sources.ts`
```typescript
// Will test each API source and:
// 1. Validate endpoint accessibility
// 2. Sample raw data structure
// 3. Identify common field patterns
// 4. Suggest field mappings
```

## 📚 Phase 3: Implementation Guide
**Status**: 🔄 Pending

### Documentation to Create: `docs/ADD_NEW_SOURCE.md`
1. **Prerequisites**
   - Socrata app token
   - Source API documentation
   - Sample data understanding

2. **Step-by-Step Process**
   - Add source to registry JSON
   - Discover field mappings
   - Test with real data
   - Validate schema compliance

3. **Field Mapping Discovery**
   - How to identify date fields
   - How to map status values
   - How to handle address formats
   - Common field name patterns

4. **Testing Checklist**
   - [ ] Registry validation
   - [ ] API connectivity
   - [ ] Field mapping accuracy
   - [ ] Schema compliance
   - [ ] Data freshness

## 🛠️ Phase 4: Testing Tools
**Status**: 🔄 Pending

### Tools to Create:
1. **Source Validator** (`examples/validate-source.ts`)
   - Validates registry JSON structure
   - Tests API connectivity
   - Checks field mappings
   - Reports issues

2. **Field Mapping Helper** (`examples/discover-field-mappings.ts`)
   - Analyzes raw API data
   - Suggests field mappings
   - Shows data samples
   - Validates mappings

3. **Schema Tester** (`examples/test-source-schema.ts`)
   - Tests data against MunicipalProject schema
   - Reports validation errors
   - Suggests fixes

## ⚡ Phase 5: Automation
**Status**: 🔄 Pending

### Source Configuration Generator
```bash
# Interactive CLI tool
npm run add-source

? Source ID: seattle
? Source Name: Seattle
? State (2-letter): WA
? API Type: socrata
? Base URL: https://data.seattle.gov
? Primary Dataset Endpoint: /resource/xxx.json
? Analyzing data structure...
? Suggested field mappings:
  - submitDate: application_date
  - id: permit_number
  [Review and confirm...]
? Generate configuration? Yes
✅ Source configuration added to registry
✅ Field mappings configured
✅ Ready for testing
```

## 📈 Current Status Summary

### Fully Implemented ✅
- San Francisco (sf) - Socrata API with field mappings
- New York City (nyc) - Socrata API with field mappings

### Partially Implemented 🔶
- Sources with Socrata config but no field mappings
- Need to run audit to get exact count

### Not Implemented ❌
- Portal sources (Accela, eBUILD, etc.)
- Custom API sources
- ArcGIS sources
- Scraping sources

## 🚀 Next Actions When You Return

1. **Run the audit script** to get exact counts and status
2. **Test remaining Socrata sources** with universal token
3. **Add field mappings** to partially implemented sources
4. **Create implementation guide** for new sources
5. **Build testing tools** for validation

## 💾 Files Created
- `examples/audit-all-sources.ts` - Registry audit script
- `examples/test-universal-token.ts` - Token validation
- `examples/test-schema-validation.ts` - Schema compliance testing
- `examples/test-config-driven.ts` - Field mapping validation

## 🎯 Success Metrics
- [ ] All Socrata sources have field mappings
- [ ] Implementation guide completed
- [ ] Testing tools operational
- [ ] New source can be added in <30 minutes
- [ ] 95%+ schema compliance across all sources

---

**Note**: This plan ensures systematic implementation of all remaining sources while establishing sustainable processes for future expansion.