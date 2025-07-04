/**
 * Built-in Municipal Data Sources Registry
 * Core sources provided with the package
 */

import { SourceRegistry, SocrataRecord } from '../types/sources';
import type {
  SFBuildingPermit,
  LACurrentBuildingPermit,
  LABuildingPermit,
  NYCDOBPermit,
  NYCDOBNowBuild
} from '../schemas/api-responses';

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
            defaultDataset: "buildingPermits",
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
                },
                getFullAddress: (data: SFBuildingPermit) => {
                  const parts = [
                    data.street_number,
                    data.street_name,
                    data.street_suffix
                  ].filter(Boolean);
                  const address = parts.join(' ');
                  return data.zipcode ? `${address}, ${data.zipcode}` : address || 'Unknown Address';
                },
                getDescription: (data: SFBuildingPermit) => {
                  const parts = [];

                  // Permit type and description
                  if (data.permit_type) parts.push(data.permit_type);
                  if (data.description) parts.push(data.description);

                  // Address with full context
                  const addressParts = [data.street_number, data.street_name, data.street_suffix].filter(Boolean);
                  if (addressParts.length > 0) {
                    const address = addressParts.join(' ');
                    parts.push(`at ${address}, San Francisco, CA${data.zipcode ? ` ${data.zipcode}` : ''}`);
                  }

                  // Status and cost
                  const statusInfo = [];
                  if (data.status) statusInfo.push(`(${data.status})`);
                  if (data.revised_cost && !isNaN(Number(data.revised_cost))) {
                    statusInfo.push(`$${Number(data.revised_cost).toLocaleString()}`);
                  }
                  if (statusInfo.length > 0) parts.push(statusInfo.join(' '));

                  // Filing date
                  if (data.permit_creation_date) {
                    try {
                      const date = new Date(data.permit_creation_date);
                      parts.push(`filed ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  }

                  return parts.filter(Boolean).join(' ') || 'San Francisco Building Permit';
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
                },
                getFullAddress: (data: SocrataRecord) => {
                  return (data as any).project_address || 'Unknown Address';
                },
                getDescription: (data: SocrataRecord) => {
                  const anyData = data as any;
                  const parts = [];

                  if (anyData.project_name) parts.push(anyData.project_name);
                  if (anyData.project_address) {
                    parts.push(`at ${anyData.project_address}, San Francisco, CA`);
                  }
                  if (anyData.project_description) parts.push(`- ${anyData.project_description}`);
                  if (anyData.filed_date) {
                    try {
                      const date = new Date(anyData.filed_date);
                      parts.push(`filed ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  }

                  return parts.filter(Boolean).join(' ') || 'San Francisco Planning Application';
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
            defaultDataset: "buildingPermitsCurrent",
            datasets: {
              buildingPermitsCurrent: {
                endpoint: "/resource/pi9x-tg5x.json",
                name: "LA Building Permits (2020-Present)",
                // UNION of all fields found across multiple API samples
                fields: [
                  "adu_changed",
                  "apc",
                  "apn",
                  "business_unit",
                  "cd",
                  "cnc",
                  "cofo_date",
                  "construction",
                  "cpa",
                  "ct",
                  "du_changed",
                  "ev",
                  "geolocation",
                  "height",
                  "hl",
                  "issue_date",
                  "junior_adu",
                  "lat",
                  "lon",
                  "permit_group",
                  "permit_nbr",
                  "permit_sub_type",
                  "permit_type",
                  "pin_nbr",
                  "primary_address",
                  "refresh_time",
                  "solar",
                  "square_footage",
                  "status_date",
                  "status_desc",
                  "submitted_date",
                  "type_lat_lon",
                  "use_code",
                  "use_desc",
                  "valuation",
                  "work_desc",
                  "zip_code",
                  "zone"
                ],
                fieldMappings: {
                  submitDate: "submitted_date",
                  approvalDate: "issue_date",
                  value: "valuation",
                  address: "primary_address",
                  id: "permit_nbr",
                  status: "status_desc",
                  description: "work_desc",
                  title: "work_desc"
                },
                getFullAddress: (data: LACurrentBuildingPermit) => {
                  const address = data.primary_address || '';
                  return data.zip_code ? `${address}, ${data.zip_code}` : address || 'Unknown Address';
                },
                getDescription: (data: LACurrentBuildingPermit) => {
                  const parts = [];

                  // Permit type and subtype
                  if (data.permit_sub_type) parts.push(data.permit_sub_type);
                  if (data.permit_type) parts.push(data.permit_type);

                  // Work description
                  if (data.work_desc) parts.push(`${data.work_desc}`);

                  // Address with full context
                  if (data.primary_address) {
                    const address = `at ${data.primary_address}, Los Angeles, CA${data.zip_code ? ` ${data.zip_code}` : ''}`;
                    parts.push(address);
                  }

                  // Cost and status
                  const statusInfo = [];
                  if (data.valuation && !isNaN(Number(data.valuation))) {
                    statusInfo.push(`($${Number(data.valuation).toLocaleString()})`);
                  }
                  if (data.status_desc) statusInfo.push(data.status_desc);
                  if (statusInfo.length > 0) parts.push(statusInfo.join(' '));

                  // Submit date
                  if (data.submitted_date) {
                    try {
                      const date = new Date(data.submitted_date);
                      parts.push(`submitted ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  }

                  return parts.filter(Boolean).join(' ') || 'Los Angeles Building Permit';
                }
              },
              buildingPermits: {
                endpoint: "/resource/xnhu-aczu.json",
                name: "LA BUILD PERMITS (Legacy - Corrupted Dates)",
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
                },
                getFullAddress: (data: LABuildingPermit) => {
                  const parts = [
                    data.address_start,
                    data.street_direction,
                    data.street_name,
                    data.street_suffix
                  ].filter(Boolean);
                  const address = parts.join(' ');
                  return data.zip_code ? `${address}, ${data.zip_code}` : address || 'Unknown Address';
                },
                getDescription: (data: LABuildingPermit) => {
                  const parts = [];

                  // Permit type
                  if (data.permit_type) parts.push(data.permit_type);

                  // Work description
                  if (data.work_description) parts.push(`${data.work_description}`);

                  // Address with full context
                  const addressParts = [
                    data.address_start,
                    data.street_direction,
                    data.street_name,
                    data.street_suffix
                  ].filter(Boolean);
                  if (addressParts.length > 0) {
                    const address = `at ${addressParts.join(' ')}, Los Angeles, CA${data.zip_code ? ` ${data.zip_code}` : ''}`;
                    parts.push(address);
                  }

                  // Cost and status
                  const statusInfo = [];
                  if (data.latest_status) statusInfo.push(`(${data.latest_status})`);
                  if (data.valuation && !isNaN(Number(data.valuation))) {
                    statusInfo.push(`$${Number(data.valuation).toLocaleString()}`);
                  }
                  if (statusInfo.length > 0) parts.push(statusInfo.join(' '));

                  // Issue date
                  if (data.issue_date) {
                    try {
                      const date = new Date(data.issue_date);
                      parts.push(`issued ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  }

                  return parts.filter(Boolean).join(' ') || 'Los Angeles Building Permit (Legacy)';
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
            defaultDataset: "dobPermitIssuance",
            datasets: {
              dobPermitIssuance: {
                endpoint: "/resource/ipu4-2q9a.json",
                name: "DOB Permit Issuance",
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
                },
                getFullAddress: (data: NYCDOBPermit) => {
                  const parts = [
                    data.house__,
                    data.street_name
                  ].filter(Boolean);
                  const address = parts.join(' ');
                  return data.zip_code ? `${address}, ${data.zip_code}` : address || 'Unknown Address';
                },
                getDescription: (data: NYCDOBPermit) => {
                  const parts = [];

                  // Job type (main permit type)
                  if (data.job_type) parts.push(data.job_type);

                  // Address with full context
                  const addressParts = [data.house__, data.street_name].filter(Boolean);
                  if (addressParts.length > 0) {
                    const address = addressParts.join(' ');
                    const location = data.borough ? `${address}, ${data.borough}, New York, NY` : `${address}, New York, NY`;
                    if (data.zip_code) {
                      parts.push(`at ${location} ${data.zip_code}`);
                    } else {
                      parts.push(`at ${location}`);
                    }
                  }

                  // Status
                  if (data.permit_status) parts.push(`(${data.permit_status})`);

                  // Filing date
                  if (data.filing_date) {
                    try {
                      const date = new Date(data.filing_date);
                      parts.push(`filed ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  }

                  return parts.filter(Boolean).join(' ') || 'New York City DOB Permit';
                }
              },
              dobNowBuildApproved: {
                endpoint: "/resource/rbx6-tga4.json",
                name: "DOB NOW: Build – Approved Permits",
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
                },
                getFullAddress: (data: NYCDOBNowBuild) => {
                  const parts = [
                    data.house_no,
                    data.street_name
                  ].filter(Boolean);
                  return parts.join(' ') || 'Unknown Address';
                },
                getDescription: (data: NYCDOBNowBuild) => {
                  const parts = [];

                  // Job description
                  if (data.job_description) parts.push(data.job_description);

                  // Address with full context
                  const addressParts = [data.house_no, data.street_name].filter(Boolean);
                  if (addressParts.length > 0) {
                    const address = addressParts.join(' ');
                    const location = data.borough ? `${address}, ${data.borough}, New York, NY` : `${address}, New York, NY`;
                    parts.push(`at ${location}`);
                  }

                  // Cost and status
                  const statusInfo = [];
                  if (data.estimated_job_costs && !isNaN(Number(data.estimated_job_costs))) {
                    statusInfo.push(`($${Number(data.estimated_job_costs).toLocaleString()})`);
                  }
                  if (data.work_permit) statusInfo.push(data.work_permit);
                  if (statusInfo.length > 0) parts.push(statusInfo.join(' '));

                  // Issue/approval date
                  if (data.issued_date) {
                    try {
                      const date = new Date(data.issued_date);
                      parts.push(`issued ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  } else if (data.approved_date) {
                    try {
                      const date = new Date(data.approved_date);
                      parts.push(`approved ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  }

                  return parts.filter(Boolean).join(' ') || 'New York City DOB NOW Build Permit';
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
                },
                getFullAddress: (_data: SocrataRecord) => {
                  return 'Unknown Address'; // This dataset doesn't have address fields
                },
                getDescription: (data: SocrataRecord) => {
                  const anyData = data as any;
                  const parts = [];

                  // Project name
                  if (anyData.project_name) parts.push(anyData.project_name);

                  // Location
                  if (anyData.borough) {
                    parts.push(`in ${anyData.borough}, New York, NY`);
                  }

                  // Project details
                  const details = [];
                  if (anyData.construction_type) details.push(anyData.construction_type.toLowerCase());
                  if (anyData.total_construction_floor_area_sq_ft && !isNaN(Number(anyData.total_construction_floor_area_sq_ft))) {
                    const sqft = Number(anyData.total_construction_floor_area_sq_ft);
                    if (sqft >= 1000000) {
                      details.push(`${(sqft / 1000000).toFixed(1)}M sq ft`);
                    } else if (sqft >= 1000) {
                      details.push(`${(sqft / 1000).toFixed(0)}K sq ft`);
                    } else {
                      details.push(`${sqft.toLocaleString()} sq ft`);
                    }
                  }
                  if (anyData.total_units && !isNaN(Number(anyData.total_units))) {
                    details.push(`${Number(anyData.total_units).toLocaleString()} units`);
                  }
                  if (details.length > 0) parts.push(details.join(', '));

                  // Completion date
                  if (anyData.expected_completion_date) {
                    try {
                      const date = new Date(anyData.expected_completion_date);
                      parts.push(`completion expected ${date.toLocaleDateString()}`);
                    } catch (e) {
                      // Skip invalid dates
                    }
                  }

                  return parts.filter(Boolean).join(': ').replace(': : ', ': ') || 'New York City Major Construction Project';
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
