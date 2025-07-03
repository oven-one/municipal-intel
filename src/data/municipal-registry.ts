/**
 * Built-in Municipal Data Sources Registry
 * Core sources provided with the package
 */

import { SourceRegistry } from '../types/sources';

export const builtInRegistry: SourceRegistry = {
  version: "1.0.0",
  lastUpdated: "2025-01-30",
  sources: {
    ca: {
      name: "California",
      municipalities: [
        {
          id: "sf",
          name: "San Francisco",
          state: "CA",
          type: "api",
          api: {
            type: "socrata",
            baseUrl: "https://data.sfgov.org",
            datasets: {
              buildingPermits: {
                endpoint: "/resource/i98e-djp9.json",
                name: "Building Permits",
                fields: ["permit_number", "permit_type", "status", "street_number", "street_name", "description", "estimated_cost", "filed_date", "issued_date"]
              },
              planningApplications: {
                endpoint: "/resource/6zqd-wh5d.json",
                name: "Planning Department Project Applications", 
                fields: ["record_id", "project_name", "project_address", "project_description", "case_number", "filed_date"]
              }
            },
            fieldMappings: {
              submitDate: "permit_creation_date",
              approvalDate: "issued_date",
              value: "estimated_cost", // TEXT field - requires special handling for numeric comparisons
              address: "street_name",
              id: "permit_number",
              status: "status",
              description: "description",
              title: "description",
              applicant: "applicant_name"
            },
            authentication: {
              required: false,
              recommended: true,
              type: "app_token",
              header: "X-App-Token"
            },
            rateLimit: {
              withToken: 1000,
              withoutToken: "shared",
              period: "hour"
            }
          },
          urls: {
            planning: "https://sfplanning.org/project-applications",
            building: "https://sfdbi.org/building-permits"
          },
          priority: "high"
        },
        {
          id: "la",
          name: "Los Angeles",
          state: "CA",
          type: "api",
          api: {
            type: "socrata",
            baseUrl: "https://data.lacity.org",
            datasets: {
              buildingPermits: {
                endpoint: "/resource/xnhu-aczu.json",
                name: "LA BUILD PERMITS",
                fields: ["pcis_permit", "permit_type", "permit_sub_type", "latest_status", "issue_date", "address_start", "street_name", "work_description", "valuation_amount"]
              }
            },
            fieldMappings: {
              submitDate: "issue_date",
              approvalDate: "issue_date",
              value: "valuation",
              address: "street_name",
              id: "pcis_permit",
              status: "latest_status",
              description: "work_description",
              title: "work_description",
              applicant: "applicant_business_name"
            }
          },
          priority: "high"
        }
      ]
    },
    ny: {
      name: "New York",
      municipalities: [
        {
          id: "nyc",
          name: "New York City",
          state: "NY",
          type: "api",
          api: {
            type: "socrata",
            baseUrl: "https://data.cityofnewyork.us",
            datasets: {
              dobPermitIssuance: {
                endpoint: "/resource/ipu4-2q9a.json",
                name: "DOB Permit Issuance",
                fields: ["job__", "doc__", "borough", "house__", "street_name", "block", "lot", "bin__", "job_type", "job_status", "job_status_descrp", "filing_date", "issuance_date", "expiration_date", "permit_status", "permit_type", "owner_s_first_name", "owner_s_last_name", "owner_s_business_name", "filing_representative_first_name", "filing_representative_last_name", "filing_representative_business_name", "permit_si_no", "latitude", "longitude", "council_district", "census_tract", "nta", "community_board"]
              },
              dobNowBuildApproved: {
                endpoint: "/resource/rbx6-tga4.json",
                name: "DOB NOW: Build – Approved Permits",
                fields: ["job_filing_number", "doc_number", "job_type", "approval_date", "job_status", "permit_status", "permit_type", "filing_date", "issuance_date", "expiration_date", "estimated_job_cost", "borough", "bin", "house_number", "street_name", "block", "lot", "community_board", "owner_name", "owner_business_name"]
              },
              activeMajorProjects: {
                endpoint: "/resource/n5mv-nfpy.json",
                name: "Active Major Construction Projects",
                fields: ["project_id", "project_name", "borough", "project_description", "project_start_date", "expected_completion_date", "total_construction_floor_area_sq_ft", "total_units", "construction_type"]
              }
            },
            fieldMappings: {
              submitDate: "filing_date",
              approvalDate: "issuance_date",
              // value: No value/cost field available in this dataset
              address: "street_name",
              id: "permit_si_no",
              status: "permit_status",
              description: "work_type",
              title: "work_type",
              applicant: "permittee_s_business_name"
            },
            authentication: {
              required: false,
              recommended: true,
              type: "app_token"
            }
          },
          urls: {
            dob: "https://www1.nyc.gov/site/buildings/index.page",
            planning: "https://www1.nyc.gov/site/planning/index.page"
          },
          priority: "high"
        }
      ]
    },
    fl: {
      name: "Florida",
      municipalities: []
    }
  },
  commonFields: {
    required: ["id", "name", "state", "type", "priority"],
    optional: ["urls", "coverage", "updateFrequency", "enabled", "lastChecked", "lastError"],
    typeEnum: ["api", "portal", "scraping"]
  },
  implementationPriorities: {
    high: ["sf", "nyc", "la"],
    medium: [],
    low: []
  }
};