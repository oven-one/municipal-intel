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
                // Original fields array - many were incorrect or missing
                // fields: ["permit_number", "permit_type", "status", "street_number", "street_name", "description", "estimated_cost", "filed_date", "issued_date"],
                // UNION of field dump + sample data (ALL fields from API responses)
                fields: [
                  "adu",
                  "application_submission_method",
                  "approved_date", // inconsistent - not in all records
                  "block",
                  "completed_date", // from sample data
                  "data_as_of",
                  "data_loaded_at",
                  "description",
                  "estimated_cost", // from sample data
                  "existing_construction_type", // from sample data
                  "existing_construction_type_description", // from sample data
                  "existing_occupancy", // from sample data
                  "existing_units", // from sample data
                  "existing_use", // from sample data
                  "filed_date",
                  "fire_only_permit", // from sample data
                  "issued_date", // inconsistent - not in all records
                  "last_permit_activity_date", // inconsistent - not in all records
                  "location", // inconsistent - not in all records
                  "lot",
                  "neighborhoods_analysis_boundaries", // inconsistent - not in all records
                  "number_of_existing_stories", // from sample data
                  "number_of_proposed_stories", // from sample data
                  "permit_creation_date",
                  "permit_number",
                  "permit_type",
                  "permit_type_definition",
                  "plansets", // from sample data
                  "point_source", // inconsistent - not in all records
                  "primary_address_flag",
                  "proposed_construction_type", // from sample data
                  "proposed_construction_type_description", // from sample data
                  "proposed_occupancy", // from sample data
                  "proposed_units", // from sample data
                  "proposed_use", // from sample data
                  "record_id",
                  "revised_cost",
                  "status",
                  "status_date",
                  "street_name",
                  "street_number",
                  "street_suffix", // inconsistent - not in all records
                  "supervisor_district", // inconsistent - not in all records
                  "unit", // from sample data
                  "zipcode" // inconsistent - not in all records
                ],
                fieldMappings: {
                  submitDate: "permit_creation_date",
                  approvalDate: "issued_date",
                  value: "revised_cost", // TEXT field - requires special handling for numeric comparisons
                  address: "street_name",
                  id: "permit_number",
                  status: "status",
                  description: "description",
                  title: "description"
                  // applicant: No applicant field available in this dataset
                }
              },
              planningApplications: {
                endpoint: "/resource/6zqd-wh5d.json",
                name: "Planning Department Project Applications",
                fields: ["record_id", "project_name", "project_address", "project_description", "case_number", "filed_date"],
                fieldMappings: {
                  submitDate: "filed_date",
                  id: "record_id",
                  title: "project_name",
                  address: "project_address",
                  description: "project_description"
                }
              }
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
                // Original fields array - contained incorrect field name
                // fields: ["pcis_permit", "permit_type", "permit_sub_type", "latest_status", "issue_date", "address_start", "street_name", "work_description", "valuation_amount"],
                // Actual fields from API dump
                fields: [
                  "address_end",
                  "address_start",
                  "applicant_first_name",
                  "applicant_last_name",
                  "assessor_book",
                  "assessor_page",
                  "assessor_parcel",
                  "block", // inconsistent - not in all records
                  "census_tract",
                  "contractor_address", // inconsistent - not in all records
                  "contractor_city", // inconsistent - not in all records
                  "contractor_state", // inconsistent - not in all records
                  "contractors_business_name", // inconsistent - not in all records
                  "floor_area_l_a_building_code_definition",
                  "floor_area_l_a_zoning_code_definition",
                  "initiating_office",
                  "issue_date",
                  "latest_status",
                  "license",
                  "license_expiration_date", // inconsistent - not in all records
                  "license_type",
                  "location_1", // inconsistent - not in all records
                  "lot",
                  "of_residential_dwelling_units", // inconsistent - not in all records
                  "of_stories",
                  "pcis_permit",
                  "permit_category",
                  "permit_sub_type",
                  "permit_type",
                  "principal_first_name",
                  "principal_last_name",
                  "principal_middle_name",
                  "reference_old_permit",
                  "status_date",
                  "street_direction",
                  "street_name",
                  "street_suffix",
                  "tract",
                  "valuation",
                  "work_description",
                  "zip_code",
                  "zone"
                ],
                fieldMappings: {
                  submitDate: "issue_date",
                  approvalDate: "issue_date",
                  value: "valuation",
                  address: "street_name",
                  id: "pcis_permit",
                  status: "latest_status",
                  description: "work_description",
                  title: "work_description"
                  // applicant: Could use applicant_first_name + applicant_last_name or contractors_business_name
                }
              }
            },
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
                // Original fields array - many fields were incorrect
                // fields: ["job__", "doc__", "borough", "house__", "street_name", "block", "lot", "bin__", "job_type", "job_status", "job_status_descrp", "filing_date", "issuance_date", "expiration_date", "permit_status", "permit_type", "owner_s_first_name", "owner_s_last_name", "owner_s_business_name", "filing_representative_first_name", "filing_representative_last_name", "filing_representative_business_name", "permit_si_no", "latitude", "longitude", "council_district", "census_tract", "nta", "community_board"],
                // Actual fields from API dump - all are consistently present
                fields: [
                  "bin__",
                  "bldg_type",
                  "block",
                  "borough",
                  "community_board",
                  "dobrundate",
                  "expiration_date",
                  "filing_date",
                  "filing_status",
                  "gis_census_tract",
                  "gis_council_district",
                  "gis_latitude",
                  "gis_longitude",
                  "gis_nta_name",
                  "house__",
                  "issuance_date",
                  "job__",
                  "job_doc___",
                  "job_start_date",
                  "job_type",
                  "lot",
                  "non_profit",
                  "owner_s_business_name",
                  "owner_s_business_type",
                  "owner_s_first_name",
                  "owner_s_last_name",
                  "owner_s_phone__",
                  "permit_sequence__",
                  "permit_si_no",
                  "permit_status",
                  "permit_subtype",
                  "permit_type",
                  "permittee_s_business_name",
                  "permittee_s_first_name",
                  "permittee_s_last_name",
                  "permittee_s_license__",
                  "permittee_s_license_type",
                  "permittee_s_phone__",
                  "self_cert",
                  "street_name",
                  "work_type",
                  "zip_code"
                ],
                fieldMappings: {
                  submitDate: "filing_date",
                  approvalDate: "issuance_date",
                  address: "street_name",
                  id: "permit_si_no",
                  status: "permit_status",
                  title: "job_type"
                }
              },
              dobNowBuildApproved: {
                endpoint: "/resource/rbx6-tga4.json",
                name: "DOB NOW: Build – Approved Permits",
                // Original fields array - most fields were incorrect or missing
                // fields: ["job_filing_number", "doc_number", "job_type", "approval_date", "job_status", "permit_status", "permit_type", "filing_date", "issuance_date", "expiration_date", "estimated_job_cost", "borough", "bin", "house_number", "street_name", "block", "lot", "community_board", "owner_name", "owner_business_name"],
                // Actual fields from API dump + sample data (UNION of both)
                fields: [
                  "applicant_business_address",
                  "applicant_business_name",
                  "applicant_first_name",
                  "applicant_last_name",
                  "applicant_license",
                  "applicant_middle_name", // from sample - inconsistent
                  "approved_date", // from sample - inconsistent
                  "bin",
                  "block",
                  "borough",
                  "c_b_no",
                  "estimated_job_costs",
                  "expired_date", // from sample - inconsistent
                  "filing_reason",
                  "filing_representative_business_name",
                  "filing_representative_first_name",
                  "filing_representative_last_name",
                  "house_no",
                  "issued_date", // from sample - inconsistent
                  "job_description",
                  "job_filing_number",
                  "lot",
                  "owner_business_name",
                  "owner_name", // inconsistent - not in all records
                  "permittee_s_license_type",
                  "street_name",
                  "work_on_floor",
                  "work_permit",
                  "work_type"
                ],
                fieldMappings: {
                  submitDate: "issued_date",
                  approvalDate: "approved_date",
                  value: "estimated_job_costs",
                  address: "street_name",
                  id: "job_filing_number",
                  status: "work_permit",
                  title: "job_description"
                }
              },
              activeMajorProjects: {
                endpoint: "/resource/n5mv-nfpy.json",
                name: "Active Major Construction Projects",
                fields: ["project_id", "project_name", "borough", "project_description", "project_start_date", "expected_completion_date", "total_construction_floor_area_sq_ft", "total_units", "construction_type"],
                fieldMappings: {
                  submitDate: "project_start_date",
                  id: "project_id",
                  title: "project_name",
                  description: "project_description",
                  value: "total_construction_floor_area_sq_ft"
                }
              }
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
