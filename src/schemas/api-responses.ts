/**
 * Zod schemas for actual API responses
 * 
 * These schemas are based on:
 * 1. Our corrected registry field lists
 * 2. Actual API sample data structures
 * 3. Field dump analysis of consistency
 */

import { z } from 'zod';

/**
 * San Francisco Building Permits API Response Schema
 * Based on registry fields + actual sample data for complex objects
 */
export const SFBuildingPermitSchema = z.object({
  // All actual fields from registry (28 total)
  adu: z.string().optional(),
  application_submission_method: z.string().optional(),
  approved_date: z.string().optional(), // inconsistent field
  block: z.string().optional(),
  data_as_of: z.string().optional(),
  data_loaded_at: z.string().optional(),
  description: z.string().optional(),
  filed_date: z.string().optional(),
  issued_date: z.string().optional(), // inconsistent field
  last_permit_activity_date: z.string().optional(), // inconsistent field
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]) // [longitude, latitude]
  }).optional(), // inconsistent field
  lot: z.string().optional(),
  neighborhoods_analysis_boundaries: z.string().optional(), // inconsistent field
  permit_creation_date: z.string().optional(),
  permit_number: z.string().optional(),
  permit_type: z.string().optional(),
  permit_type_definition: z.string().optional(),
  point_source: z.string().optional(), // inconsistent field
  primary_address_flag: z.string().optional(),
  record_id: z.string().optional(),
  revised_cost: z.string().optional(), // TEXT field - requires ::number casting
  status: z.string().optional(),
  status_date: z.string().optional(),
  street_name: z.string().optional(),
  street_number: z.string().optional(),
  street_suffix: z.string().optional(), // inconsistent field
  supervisor_district: z.string().optional(), // inconsistent field
  zipcode: z.string().optional(), // inconsistent field
  
  // Additional fields seen in sample but not in dump (allow for API evolution)
  estimated_cost: z.string().optional(),
  existing_construction_type: z.string().optional(),
  existing_construction_type_description: z.string().optional(),
  existing_occupancy: z.string().optional(),
  existing_units: z.string().optional(),
  existing_use: z.string().optional(),
  fire_only_permit: z.string().optional(),
  number_of_existing_stories: z.string().optional(),
  number_of_proposed_stories: z.string().optional(),
  plansets: z.string().optional(),
  proposed_construction_type: z.string().optional(),
  proposed_construction_type_description: z.string().optional(),
  proposed_occupancy: z.string().optional(),
  proposed_units: z.string().optional(),
  proposed_use: z.string().optional(),
  unit: z.string().optional(),
});

/**
 * Los Angeles Building Permits Current (2020-Present) API Response Schema
 * Based on registry fields from pi9x-tg5x dataset
 */
export const LACurrentBuildingPermitSchema = z.object({
  adu_changed: z.string().optional(),
  apc: z.string().optional(),
  apn: z.string().optional(),
  business_unit: z.string().optional(),
  cd: z.string().optional(),
  cnc: z.string().optional(),
  cofo_date: z.string().optional(),
  construction: z.string().optional(),
  cpa: z.string().optional(),
  ct: z.string().optional(),
  du_changed: z.string().optional(),
  ev: z.string().optional(),
  geolocation: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()])
  }).optional(),
  height: z.string().optional(),
  hl: z.string().optional(),
  issue_date: z.string().optional(),
  junior_adu: z.string().optional(),
  lat: z.string().optional(),
  lon: z.string().optional(),
  permit_group: z.string().optional(),
  permit_nbr: z.string().optional(),
  permit_sub_type: z.string().optional(),
  permit_type: z.string().optional(),
  pin_nbr: z.string().optional(),
  primary_address: z.string().optional(),
  refresh_time: z.string().optional(),
  solar: z.string().optional(),
  square_footage: z.string().optional(),
  status_date: z.string().optional(),
  status_desc: z.string().optional(),
  submitted_date: z.string().optional(),
  type_lat_lon: z.string().optional(),
  use_code: z.string().optional(),
  use_desc: z.string().optional(),
  valuation: z.string().optional(),
  work_desc: z.string().optional(),
  zip_code: z.string().optional(),
  zone: z.string().optional(),
});

/**
 * Los Angeles Building Permits Legacy API Response Schema
 * Based on registry fields (41 total from field dump)
 */
export const LABuildingPermitSchema = z.object({
  address_end: z.string().optional(),
  address_start: z.string().optional(),
  applicant_first_name: z.string().optional(),
  applicant_last_name: z.string().optional(),
  assessor_book: z.string().optional(),
  assessor_page: z.string().optional(),
  assessor_parcel: z.string().optional(),
  block: z.string().optional(), // inconsistent field
  census_tract: z.string().optional(),
  contractor_address: z.string().optional(), // inconsistent field
  contractor_city: z.string().optional(), // inconsistent field
  contractor_state: z.string().optional(), // inconsistent field
  contractors_business_name: z.string().optional(), // inconsistent field
  floor_area_l_a_building_code_definition: z.string().optional(),
  floor_area_l_a_zoning_code_definition: z.string().optional(),
  initiating_office: z.string().optional(),
  issue_date: z.string().optional(),
  latest_status: z.string().optional(),
  license: z.string().optional(),
  license_expiration_date: z.string().optional(), // inconsistent field
  license_type: z.string().optional(),
  location_1: z.object({
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    human_address: z.string().optional(),
  }).optional(), // inconsistent field
  lot: z.string().optional(),
  of_residential_dwelling_units: z.string().optional(), // inconsistent field
  of_stories: z.string().optional(),
  pcis_permit: z.string().optional(),
  permit_category: z.string().optional(),
  permit_sub_type: z.string().optional(),
  permit_type: z.string().optional(),
  principal_first_name: z.string().optional(),
  principal_last_name: z.string().optional(),
  principal_middle_name: z.string().optional(),
  reference_old_permit: z.string().optional(),
  status_date: z.string().optional(),
  street_direction: z.string().optional(),
  street_name: z.string().optional(),
  street_suffix: z.string().optional(),
  tract: z.string().optional(),
  valuation: z.string().optional(), // TEXT field - requires ::number casting
  work_description: z.string().optional(),
  zip_code: z.string().optional(),
  zone: z.string().optional(),
});

/**
 * NYC DOB Permit Issuance API Response Schema
 * Based on registry fields (41 total, all consistently present)
 */
export const NYCDOBPermitSchema = z.object({
  bin__: z.string().optional(),
  bldg_type: z.string().optional(),
  block: z.string().optional(),
  borough: z.string().optional(),
  community_board: z.string().optional(),
  dobrundate: z.string().optional(),
  expiration_date: z.string().optional(),
  filing_date: z.string().optional(),
  filing_status: z.string().optional(),
  gis_census_tract: z.string().optional(),
  gis_council_district: z.string().optional(),
  gis_latitude: z.string().optional(),
  gis_longitude: z.string().optional(),
  gis_nta_name: z.string().optional(),
  house__: z.string().optional(),
  issuance_date: z.string().optional(),
  job__: z.string().optional(),
  job_doc___: z.string().optional(),
  job_start_date: z.string().optional(),
  job_type: z.string().optional(),
  lot: z.string().optional(),
  non_profit: z.string().optional(),
  owner_s_business_name: z.string().optional(),
  owner_s_business_type: z.string().optional(),
  owner_s_first_name: z.string().optional(),
  owner_s_last_name: z.string().optional(),
  owner_s_phone__: z.string().optional(),
  permit_sequence__: z.string().optional(),
  permit_si_no: z.string().optional(),
  permit_status: z.string().optional(),
  permit_subtype: z.string().optional(),
  permit_type: z.string().optional(),
  permittee_s_business_name: z.string().optional(),
  permittee_s_first_name: z.string().optional(),
  permittee_s_last_name: z.string().optional(),
  permittee_s_license__: z.string().optional(),
  permittee_s_license_type: z.string().optional(),
  permittee_s_phone__: z.string().optional(),
  self_cert: z.string().optional(),
  street_name: z.string().optional(),
  work_type: z.string().optional(),
  zip_code: z.string().optional(),
});

/**
 * NYC DOB NOW Build Approved Permits API Response Schema
 * Based on registry UNION of dump + sample fields (29 total)
 */
export const NYCDOBNowBuildSchema = z.object({
  applicant_business_address: z.string().optional(),
  applicant_business_name: z.string().optional(),
  applicant_first_name: z.string().optional(),
  applicant_last_name: z.string().optional(),
  applicant_license: z.string().optional(),
  applicant_middle_name: z.string().optional(), // from sample
  approved_date: z.string().optional(), // from sample
  bin: z.string().optional(),
  block: z.string().optional(),
  borough: z.string().optional(),
  c_b_no: z.string().optional(),
  estimated_job_costs: z.string().optional(), // TEXT field - requires ::number casting
  expired_date: z.string().optional(), // from sample
  filing_reason: z.string().optional(),
  filing_representative_business_name: z.string().optional(),
  filing_representative_first_name: z.string().optional(),
  filing_representative_last_name: z.string().optional(),
  house_no: z.string().optional(),
  issued_date: z.string().optional(), // from sample
  job_description: z.string().optional(),
  job_filing_number: z.string().optional(),
  lot: z.string().optional(),
  owner_business_name: z.string().optional(),
  owner_name: z.string().optional(), // inconsistent field
  permittee_s_license_type: z.string().optional(),
  street_name: z.string().optional(),
  work_on_floor: z.string().optional(),
  work_permit: z.string().optional(),
  work_type: z.string().optional(),
});

/**
 * Type exports for use in tests and validation
 */
export type SFBuildingPermit = z.infer<typeof SFBuildingPermitSchema>;
export type LACurrentBuildingPermit = z.infer<typeof LACurrentBuildingPermitSchema>;
export type LABuildingPermit = z.infer<typeof LABuildingPermitSchema>;
export type NYCDOBPermit = z.infer<typeof NYCDOBPermitSchema>;
export type NYCDOBNowBuild = z.infer<typeof NYCDOBNowBuildSchema>;

/**
 * Schema map for easy lookup by municipality and dataset
 */
export const API_SCHEMAS = {
  sf: {
    buildingPermits: SFBuildingPermitSchema,
  },
  la: {
    buildingPermitsCurrent: LACurrentBuildingPermitSchema,
    buildingPermits: LABuildingPermitSchema,
  },
  nyc: {
    dobPermitIssuance: NYCDOBPermitSchema,
    dobNowBuildApproved: NYCDOBNowBuildSchema,
  },
} as const;