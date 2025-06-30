# Municipal Data Sources for Construction & Planning Applications

## Overview

This document catalogs municipal data sources for construction, renovation, and planning applications across major cities and counties in California, New York, and Florida. These sources complement federal contract data by providing local government project opportunities.

### Summary Statistics
- **Total Municipalities**: 65+
- **California**: 28 cities/counties
- **New York**: 17 cities/counties  
- **Florida**: 23 cities/counties
- **API-Accessible Sources**: 12
- **Portal/Structured Data**: 15
- **Web Scraping Required**: 38+

### Data Access Types
1. **API**: Direct programmatic access via REST APIs (best)
2. **Portal**: Structured data through online portals
3. **Scraping**: HTML parsing required (most challenging)

## California Municipalities

### Tier 1 - API Available

#### 1. San Francisco
- **Type**: API (Socrata)
- **API URL**: https://data.sfgov.org
- **Planning URL**: https://sfplanning.org/applications
- **Permits URL**: https://sf.gov/permits
- **Authentication**: App token recommended
- **Rate Limit**: 1000 requests/hour with token
- **Data Fields**: 
  - permit_number, permit_type, permit_status
  - address, block, lot
  - description, estimated_cost
  - filed_date, issued_date, completed_date
  - applicant_name, contractor
- **Update Frequency**: Daily
- **Priority**: HIGH

#### 2. Los Angeles
- **Type**: API (Custom)
- **API URL**: https://data.lacity.org
- **Planning URL**: https://planning.lacity.gov
- **Building URL**: https://ladbs.org
- **Authentication**: None required
- **Rate Limit**: Unknown
- **Data Fields**:
  - case_number, project_name
  - address, council_district
  - case_type, status
  - environmental_review
  - hearing_date
- **Update Frequency**: Weekly
- **Priority**: HIGH

#### 3. San Diego
- **Type**: API (ArcGIS)
- **API URL**: https://data.sandiego.gov
- **Permits URL**: https://www.sandiego.gov/development-services
- **Authentication**: None required
- **Rate Limit**: Standard ArcGIS limits
- **Data Fields**:
  - permit_id, project_id
  - address, apn
  - scope_of_work
  - valuation
  - status, dates
- **Priority**: HIGH

#### 4. Oakland
- **Type**: API (Socrata)
- **API URL**: https://data.oaklandca.gov
- **Planning URL**: https://www.oaklandca.gov/topics/planning-applications
- **Authentication**: App token recommended
- **Rate Limit**: 1000 requests/hour with token
- **Priority**: MEDIUM

#### 5. San Jose
- **Type**: API (Custom)
- **API URL**: https://data.sanjoseca.gov
- **Planning URL**: https://www.sanjoseca.gov/your-government/departments/planning-building-code-enforcement
- **Authentication**: None required
- **Priority**: MEDIUM

#### 6. Sacramento
- **Type**: API (Socrata)
- **API URL**: https://data.cityofsacramento.org
- **Authentication**: App token recommended
- **Priority**: MEDIUM

### Tier 2 - Portal/Structured Data

#### 7. Long Beach
- **Type**: Portal
- **URL**: https://www.longbeach.gov/lbds/
- **Access**: Online permit lookup
- **Priority**: MEDIUM

#### 8. Fresno
- **Type**: Portal (Accela)
- **URL**: https://aca-prod.accela.com/FRESNO/
- **Priority**: LOW

### Tier 3 - Web Scraping Required

#### 9. Belvedere
- **Type**: Scraping
- **URL**: https://www.cityofbelvedere.org/239/Current-Planning-Applications
- **Format**: HTML table/list
- **Update Frequency**: Bi-weekly
- **Priority**: LOW

#### 10. Sausalito
- **Type**: Scraping
- **URL**: https://www.sausalito.gov/departments/community-development/planning
- **Format**: HTML pages
- **Priority**: LOW

#### 11. Marin County
- **Type**: Scraping
- **URL**: https://www.marincounty.org/depts/cd/divisions/planning/projects
- **Format**: Project list with PDFs
- **Priority**: LOW

#### 12. Berkeley
- **Type**: Scraping
- **URL**: https://www.cityofberkeley.info/permits/
- **Priority**: MEDIUM

#### 13. Palo Alto
- **Type**: Scraping
- **URL**: https://www.cityofpaloalto.org/Departments/Planning-Development-Services
- **Priority**: LOW

#### 14. Mountain View
- **Type**: Scraping
- **URL**: https://www.mountainview.gov/depts/comdev/planning/
- **Priority**: LOW

#### 15. Sunnyvale
- **Type**: Scraping
- **URL**: https://www.sunnyvale.ca.gov/government/departments/community-development/planning
- **Priority**: LOW

#### 16. Santa Clara
- **Type**: Scraping
- **URL**: https://www.santaclaraca.gov/our-city/departments-a-f/community-development/planning-division
- **Priority**: LOW

#### 17. Fremont
- **Type**: Scraping
- **URL**: https://www.fremont.gov/government/departments/community-development
- **Priority**: LOW

#### 18. Orange County
- **Type**: Scraping
- **URL**: https://ocds.ocpublicworks.com/
- **Priority**: MEDIUM

#### 19. Anaheim
- **Type**: Scraping
- **URL**: https://www.anaheim.net/610/Planning-Zoning
- **Priority**: LOW

#### 20. Santa Ana
- **Type**: Scraping
- **URL**: https://www.santa-ana.org/departments/planning-building-agency
- **Priority**: LOW

#### 21. Irvine
- **Type**: Scraping
- **URL**: https://www.cityofirvine.org/community-development
- **Priority**: LOW

#### 22. Riverside
- **Type**: Scraping
- **URL**: https://riversideca.gov/cedd/planning
- **Priority**: LOW

#### 23. San Bernardino
- **Type**: Scraping
- **URL**: https://www.sbcity.org/city_hall/community_development
- **Priority**: LOW

#### 24. Santa Barbara
- **Type**: Scraping
- **URL**: https://santabarbaraca.gov/government/departments/community-development
- **Priority**: LOW

#### 25. Ventura County
- **Type**: Scraping
- **URL**: https://vcrma.org/en/planning
- **Priority**: LOW

#### 26. Bakersfield
- **Type**: Scraping
- **URL**: https://www.bakersfieldcity.us/281/Planning-Division
- **Priority**: LOW

#### 27. Modesto
- **Type**: Scraping
- **URL**: https://www.modestogov.com/1044/Planning
- **Priority**: LOW

#### 28. Stockton
- **Type**: Scraping
- **URL**: https://www.stocktonca.gov/government/departments/communityDevelop/planning
- **Priority**: LOW

## New York Municipalities

### Tier 1 - API Available

#### 1. New York City
- **Type**: API (Socrata) + DOB NOW
- **API URL**: https://data.cityofnewyork.us
- **DOB Portal**: https://a810-dobnow.nyc.gov/publish/Index.html
- **Authentication**: App token recommended for API
- **Rate Limit**: 1000 requests/hour with token
- **Coverage**: All 5 boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- **Key Datasets**:
  - DOB Permit Issuance
  - DOB NOW: Build – Approved Permits
  - Active Major Construction Projects
  - Housing New York Units by Building
- **Data Fields**:
  - job_number, permit_number, permit_type
  - borough, block, lot, bin
  - owner_name, owner_business_name
  - job_type, job_status
  - filing_date, issuance_date
  - estimated_job_cost
  - building_type, community_board
- **Update Frequency**: Daily
- **Priority**: HIGH

### Tier 2 - Portal/Structured Data

#### 2. Buffalo
- **Type**: Portal
- **URL**: https://www.buffalony.gov/592/Permits-Inspections
- **Access**: Online lookup system
- **Priority**: MEDIUM

#### 3. Nassau County
- **Type**: Portal
- **URL**: https://www.nassaucountyny.gov/
- **Departments**: Multiple municipalities
- **Priority**: MEDIUM

#### 4. Suffolk County
- **Type**: Portal
- **URL**: https://www.suffolkcountyny.gov/
- **Departments**: Multiple municipalities
- **Priority**: MEDIUM

### Tier 3 - Web Scraping Required

#### 5. Rochester
- **Type**: Scraping
- **URL**: https://www.cityofrochester.gov/permits/
- **Priority**: LOW

#### 6. Syracuse
- **Type**: Scraping
- **URL**: https://www.syracuse.ny.us/Permits/
- **Priority**: LOW

#### 7. Albany
- **Type**: Scraping
- **URL**: https://www.albanyny.gov/818/Building-Permits
- **Priority**: LOW

#### 8. Yonkers
- **Type**: Scraping
- **URL**: https://www.yonkersny.gov/work/business/permits-licenses
- **Priority**: LOW

#### 9. White Plains
- **Type**: Scraping
- **URL**: https://www.cityofwhiteplains.com/115/Building-Permits-Applications
- **Priority**: LOW

#### 10. New Rochelle
- **Type**: Scraping
- **URL**: https://www.newrochelleny.com/352/Development
- **Priority**: LOW

#### 11. Mount Vernon
- **Type**: Scraping
- **URL**: https://www.cmvny.com/departments/planning
- **Priority**: LOW

#### 12. Scarsdale
- **Type**: Scraping
- **URL**: https://www.scarsdale.com/236/Building-Department
- **Priority**: LOW

#### 13. Hempstead
- **Type**: Scraping
- **URL**: https://www.toh.li/building-department
- **Priority**: LOW

#### 14. Brookhaven
- **Type**: Scraping
- **URL**: https://www.brookhavenny.gov/Building
- **Priority**: LOW

#### 15. Islip
- **Type**: Scraping
- **URL**: https://www.islipny.gov/departments/planning-and-development
- **Priority**: LOW

#### 16. Oyster Bay
- **Type**: Scraping
- **URL**: https://oysterbaytown.com/departments/planning-and-development/
- **Priority**: LOW

#### 17. Westchester County
- **Type**: Scraping
- **URL**: https://planning.westchestergov.com/
- **Priority**: MEDIUM

## Florida Municipalities

### Tier 1 - API/Portal Available

#### 1. Miami-Dade County
- **Type**: Portal (Custom)
- **URL**: https://www.miamidade.gov/permits/
- **Portal URL**: https://www.miamidade.gov/economy/building.asp
- **Access**: eBUILD permit system
- **Coverage**: Miami + 34 municipalities
- **Data Available**:
  - Permit applications
  - Building inspections
  - Code violations
  - Certificate of occupancy
- **Priority**: HIGH

#### 2. Broward County
- **Type**: Portal (ePermits)
- **URL**: https://www.broward.org/Building/
- **System**: ePermits OneStop
- **Coverage**: Fort Lauderdale + unincorporated areas
- **Priority**: HIGH

#### 3. Orlando
- **Type**: Portal (Accela)
- **URL**: https://www.orlando.gov/Building-Development
- **Portal**: https://aca-prod.accela.com/orlando/
- **Data Available**:
  - Building permits
  - Planning applications
  - Code enforcement
- **Priority**: HIGH

#### 4. Tampa
- **Type**: Portal (Accela)
- **URL**: https://www.tampa.gov/construction-services
- **Portal**: https://aca-prod.accela.com/tampa/
- **Coverage**: City of Tampa
- **Priority**: HIGH

#### 5. Jacksonville
- **Type**: Portal
- **URL**: https://www.coj.net/departments/planning-and-development
- **System**: MyJax
- **Priority**: MEDIUM

### Tier 2 - Structured Portal Data

#### 6. Palm Beach County
- **Type**: Portal
- **URL**: https://discover.pbcgov.org/pzb/
- **Access**: Online permit search
- **Priority**: MEDIUM

#### 7. St. Petersburg
- **Type**: Portal
- **URL**: https://www.stpete.org/permits/
- **Priority**: MEDIUM

#### 8. Fort Lauderdale
- **Type**: Portal (via Broward)
- **URL**: https://www.fortlauderdale.gov/departments/sustainable-development
- **Priority**: MEDIUM

#### 9. Orange County
- **Type**: Portal
- **URL**: https://www.orangecountyfl.net/PermitsLicenses/
- **Priority**: MEDIUM

### Tier 3 - Web Scraping Required

#### 10. West Palm Beach
- **Type**: Scraping
- **URL**: https://www.wpb.org/government/development-services
- **Priority**: LOW

#### 11. Boca Raton
- **Type**: Scraping
- **URL**: https://www.myboca.us/1012/Development-Services
- **Priority**: LOW

#### 12. Pompano Beach
- **Type**: Scraping
- **URL**: https://www.pompanobeachfl.gov/government/development-services
- **Priority**: LOW

#### 13. Hollywood
- **Type**: Scraping
- **URL**: https://www.hollywoodfl.org/246/Development-Services
- **Priority**: LOW

#### 14. Coral Gables
- **Type**: Scraping
- **URL**: https://www.coralgables.com/departments/development-services
- **Priority**: LOW

#### 15. Clearwater
- **Type**: Scraping
- **URL**: https://www.myclearwater.com/government/city-departments/planning-development
- **Priority**: LOW

#### 16. Lakeland
- **Type**: Scraping
- **URL**: https://www.lakelandgov.net/departments/community-economic-development/
- **Priority**: LOW

#### 17. Tallahassee
- **Type**: Scraping
- **URL**: https://www.talgov.com/place/pln-permits.aspx
- **Priority**: LOW

#### 18. Gainesville
- **Type**: Scraping
- **URL**: https://www.gainesvillefl.gov/Government-Pages/Government/Departments/Sustainable-Development
- **Priority**: LOW

#### 19. Fort Myers
- **Type**: Scraping
- **URL**: https://www.cityftmyers.com/250/Community-Development
- **Priority**: LOW

#### 20. Cape Coral
- **Type**: Scraping
- **URL**: https://www.capecoral.gov/department/department_of_community_development/
- **Priority**: LOW

#### 21. Naples
- **Type**: Scraping
- **URL**: https://www.naplesgov.com/permits
- **Priority**: LOW

#### 22. Sarasota
- **Type**: Scraping
- **URL**: https://www.sarasotafl.gov/government/development-services
- **Priority**: LOW

#### 23. Miami Beach
- **Type**: Scraping
- **URL**: https://www.miamibeachfl.gov/city-hall/planning/
- **Priority**: LOW

## Implementation Strategy

### Phase 1 - Core API Cities (Week 1-2)
1. San Francisco (Socrata)
2. New York City (Socrata)
3. Los Angeles (Custom API)
4. San Diego (ArcGIS)

### Phase 2 - Florida Portals (Week 3)
1. Miami-Dade County
2. Broward County
3. Orlando (Accela)
4. Tampa (Accela)

### Phase 3 - Additional APIs (Week 4)
1. Oakland (Socrata)
2. San Jose
3. Sacramento (Socrata)
4. Jacksonville

### Phase 4 - High-Value Scraping (Week 5+)
1. Berkeley
2. Orange County (CA)
3. Westchester County
4. Nassau/Suffolk Counties

## Technical Considerations

### API Integration
- Implement rate limiting per source
- Cache responses (1-24 hour TTL)
- Handle authentication tokens
- Normalize data formats

### Web Scraping
- Respect robots.txt
- Implement polite crawling delays
- Monitor for site structure changes
- Use headless browser for dynamic content

### Data Normalization
All sources should map to common fields:
- `id`: Unique identifier
- `source`: Municipality name
- `type`: permit|planning|construction
- `title`: Project name/description
- `address`: Location
- `status`: Current status
- `submitDate`: Application date
- `approvalDate`: Approval date (if applicable)
- `value`: Estimated project value
- `applicant`: Applicant name
- `documents`: Related documents/links

## Next Steps
1. Create `municipal-registry.json` with structured data
2. Implement Socrata client for SF/NYC
3. Build web scraping framework
4. Create unified search interface
5. Add monitoring for new projects