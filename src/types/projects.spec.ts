/**
 * Tests for project types and validation
 */

import test from 'ava';
import { 
  MunicipalProjectSchema,
  CoordinatesSchema,
  ProjectDocumentSchema
} from './projects';
import { sampleProjects, invalidProjectData } from '../helpers/fixtures';

test('MunicipalProjectSchema - validates complete project', t => {
  const completeProject = {
    id: 'sf-2024-001',
    source: 'sf',
    type: 'permit',
    title: 'Residential Addition',
    address: '123 Main St',
    status: 'approved',
    submitDate: new Date('2024-01-15'),
    approvalDate: new Date('2024-02-01'),
    expirationDate: new Date('2025-02-01'),
    completionDate: new Date('2024-03-15'),
    value: 50000,
    squareFootage: 1200,
    units: 1,
    applicant: 'John Doe',
    applicantCompany: 'Doe Construction',
    contractor: 'Jane Smith',
    contractorCompany: 'Smith Builders',
    architect: 'Bob Wilson',
    description: 'Addition to single family home',
    scope: 'Add 1 bedroom and 1 bathroom',
    documents: [
      {
        name: 'Building Plans',
        url: 'https://permits.sf.gov/docs/plan1.pdf',
        type: 'pdf',
        size: 1024000,
        uploadDate: new Date('2024-01-14')
      }
    ],
    url: 'https://permits.sf.gov/permit/2024-001',
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    },
    parcel: '123-456-789',
    block: '123',
    lot: '456',
    rawData: {
      permit_number: '2024-001',
      status: 'Issued'
    },
    lastUpdated: new Date('2024-01-30')
  };

  const result = MunicipalProjectSchema.safeParse(completeProject);
  t.true(result.success, 'Should validate complete project');
  
  if (result.success) {
    t.is(result.data.id, 'sf-2024-001', 'Should preserve ID');
    t.is(result.data.type, 'permit', 'Should preserve type');
    t.is(result.data.value, 50000, 'Should preserve numeric value');
    t.true(result.data.submitDate instanceof Date, 'Should preserve date objects');
    t.is(result.data.coordinates?.lat, 37.7749, 'Should preserve coordinates');
    t.is(result.data.documents?.length, 1, 'Should preserve documents array');
  }
});

test('MunicipalProjectSchema - validates minimal required project', t => {
  const minimalProject = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test Project',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date('2024-01-01')
  };

  const result = MunicipalProjectSchema.safeParse(minimalProject);
  t.true(result.success, 'Should validate minimal project with only required fields');
});

test('MunicipalProjectSchema - rejects missing required fields', t => {
  const missingIdProject = {
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date()
  };

  const result = MunicipalProjectSchema.safeParse(missingIdProject);
  t.false(result.success, 'Should reject project missing required ID');
  
  if (!result.success) {
    t.true(result.error.errors.some(e => e.path.includes('id')), 'Should report missing ID field');
  }
});

test('MunicipalProjectSchema - validates all project types', t => {
  const projectTypes = ['permit', 'planning', 'construction', 'renovation', 'demolition'];
  
  projectTypes.forEach(type => {
    const project = {
      id: `test-${type}`,
      source: 'test',
      type,
      title: `Test ${type}`,
      address: '123 Test St',
      status: 'pending',
      submitDate: new Date()
    };

    const result = MunicipalProjectSchema.safeParse(project);
    t.true(result.success, `Should validate ${type} project type`);
  });
});

test('MunicipalProjectSchema - rejects invalid project type', t => {
  const invalidTypeProject = {
    id: 'test-001',
    source: 'test',
    type: 'invalid-type',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date()
  };

  const result = MunicipalProjectSchema.safeParse(invalidTypeProject);
  t.false(result.success, 'Should reject invalid project type');
});

test('MunicipalProjectSchema - validates all status values', t => {
  const statusValues = [
    'pending', 'under_review', 'approved', 'issued', 
    'active', 'completed', 'expired', 'cancelled', 'on_hold'
  ];
  
  statusValues.forEach(status => {
    const project = {
      id: `test-${status}`,
      source: 'test',
      type: 'permit',
      title: `Test ${status}`,
      address: '123 Test St',
      status,
      submitDate: new Date()
    };

    const result = MunicipalProjectSchema.safeParse(project);
    t.true(result.success, `Should validate ${status} status`);
  });
});

test('MunicipalProjectSchema - rejects invalid status', t => {
  const invalidStatusProject = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'invalid-status',
    submitDate: new Date()
  };

  const result = MunicipalProjectSchema.safeParse(invalidStatusProject);
  t.false(result.success, 'Should reject invalid status');
});

test('MunicipalProjectSchema - validates numeric fields', t => {
  const projectWithNumbers = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date(),
    value: 100000.50,
    squareFootage: 1500.25,
    units: 2
  };

  const result = MunicipalProjectSchema.safeParse(projectWithNumbers);
  t.true(result.success, 'Should validate numeric fields');
  
  if (result.success) {
    t.is(result.data.value, 100000.50, 'Should preserve decimal values');
    t.is(result.data.units, 2, 'Should preserve integer values');
  }
});

test('MunicipalProjectSchema - rejects invalid numeric values', t => {
  const projectWithInvalidNumber = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date(),
    value: 'not-a-number'
  };

  const result = MunicipalProjectSchema.safeParse(projectWithInvalidNumber);
  t.false(result.success, 'Should reject invalid numeric values');
});

test('MunicipalProjectSchema - validates date fields', t => {
  const now = new Date();
  const projectWithDates = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'completed',
    submitDate: new Date('2024-01-01'),
    approvalDate: new Date('2024-02-01'),
    expirationDate: new Date('2025-02-01'),
    completionDate: new Date('2024-03-01'),
    lastUpdated: now
  };

  const result = MunicipalProjectSchema.safeParse(projectWithDates);
  t.true(result.success, 'Should validate all date fields');
  
  if (result.success) {
    t.true(result.data.submitDate instanceof Date, 'Should preserve Date objects');
    t.true(result.data.approvalDate instanceof Date, 'Should preserve optional Date objects');
    t.is(result.data.lastUpdated?.getTime(), now.getTime(), 'Should preserve exact date values');
  }
});

test('CoordinatesSchema - validates coordinate object', t => {
  const validCoordinates = {
    lat: 37.7749,
    lng: -122.4194
  };

  const result = CoordinatesSchema.safeParse(validCoordinates);
  t.true(result.success, 'Should validate valid coordinates');
  
  if (result.success) {
    t.is(result.data.lat, 37.7749, 'Should preserve latitude');
    t.is(result.data.lng, -122.4194, 'Should preserve longitude');
  }
});

test('CoordinatesSchema - rejects invalid coordinates', t => {
  const invalidCoordinates = {
    lat: 'not-a-number',
    lng: -122.4194
  };

  const result = CoordinatesSchema.safeParse(invalidCoordinates);
  t.false(result.success, 'Should reject non-numeric coordinates');
});

test('CoordinatesSchema - rejects missing coordinate fields', t => {
  const missingLng = {
    lat: 37.7749
  };

  const result = CoordinatesSchema.safeParse(missingLng);
  t.false(result.success, 'Should reject coordinates missing lng');
});

test('ProjectDocumentSchema - validates document object', t => {
  const validDocument = {
    name: 'Building Plans',
    url: 'https://permits.example.gov/docs/plan.pdf',
    type: 'pdf',
    size: 1024000,
    uploadDate: new Date('2024-01-15')
  };

  const result = ProjectDocumentSchema.safeParse(validDocument);
  t.true(result.success, 'Should validate complete document');
  
  if (result.success) {
    t.is(result.data.name, 'Building Plans', 'Should preserve document name');
    t.is(result.data.size, 1024000, 'Should preserve numeric size');
  }
});

test('ProjectDocumentSchema - validates minimal document', t => {
  const minimalDocument = {
    name: 'Simple Document',
    url: 'https://example.com/doc.pdf'
  };

  const result = ProjectDocumentSchema.safeParse(minimalDocument);
  t.true(result.success, 'Should validate minimal document');
});

test('ProjectDocumentSchema - rejects invalid URL', t => {
  const invalidUrlDocument = {
    name: 'Document',
    url: 'not-a-valid-url'
  };

  const result = ProjectDocumentSchema.safeParse(invalidUrlDocument);
  t.false(result.success, 'Should reject invalid URL');
});

test('MunicipalProjectSchema - validates documents array', t => {
  const projectWithDocuments = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date(),
    documents: [
      {
        name: 'Plan 1',
        url: 'https://example.com/plan1.pdf'
      },
      {
        name: 'Plan 2',
        url: 'https://example.com/plan2.pdf',
        type: 'pdf',
        size: 500000
      }
    ]
  };

  const result = MunicipalProjectSchema.safeParse(projectWithDocuments);
  t.true(result.success, 'Should validate project with documents array');
  
  if (result.success) {
    t.is(result.data.documents?.length, 2, 'Should preserve documents array');
    t.is(result.data.documents?.[0].name, 'Plan 1', 'Should preserve document properties');
  }
});

test('MunicipalProjectSchema - validates with sample fixture data', t => {
  sampleProjects.forEach((project, index) => {
    const result = MunicipalProjectSchema.safeParse(project);
    t.true(result.success, `Sample project ${index} should pass validation`);
    
    if (!result.success) {
      console.log(`Validation errors for sample project ${index}:`, result.error.errors);
    }
  });
});

test('MunicipalProjectSchema - rejects invalid fixture data', t => {
  Object.entries(invalidProjectData).forEach(([key, invalidProject]) => {
    const result = MunicipalProjectSchema.safeParse(invalidProject);
    t.false(result.success, `Invalid project data '${key}' should fail validation`);
    
    if (result.success) {
      t.fail(`Expected validation to fail for ${key}, but it passed`);
    }
  });
});

test('MunicipalProjectSchema - handles edge cases', t => {
  // Empty strings in required fields
  const emptyStringProject = {
    id: '',
    source: '',
    type: 'permit',
    title: '',
    address: '',
    status: 'pending',
    submitDate: new Date()
  };

  const emptyResult = MunicipalProjectSchema.safeParse(emptyStringProject);
  t.false(emptyResult.success, 'Should reject empty strings in required fields');

  // Null values
  const nullProject = {
    id: 'test',
    source: null,
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date()
  };

  const nullResult = MunicipalProjectSchema.safeParse(nullProject);
  t.false(nullResult.success, 'Should reject null values');
});

test('MunicipalProjectSchema - validates URL field', t => {
  const projectWithUrl = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date(),
    url: 'https://permits.example.gov/permit/test-001'
  };

  const result = MunicipalProjectSchema.safeParse(projectWithUrl);
  t.true(result.success, 'Should validate project with valid URL');

  // Test invalid URL
  const projectWithInvalidUrl = {
    ...projectWithUrl,
    url: 'not-a-valid-url'
  };

  const invalidResult = MunicipalProjectSchema.safeParse(projectWithInvalidUrl);
  t.false(invalidResult.success, 'Should reject project with invalid URL');
});

test('MunicipalProjectSchema - validates nested object validation', t => {
  const projectWithInvalidNested = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date(),
    coordinates: {
      lat: 'invalid',
      lng: -122.4194
    },
    documents: [
      {
        name: 'Doc',
        url: 'invalid-url'
      }
    ]
  };

  const result = MunicipalProjectSchema.safeParse(projectWithInvalidNested);
  t.false(result.success, 'Should reject project with invalid nested objects');
  
  if (!result.success) {
    const errors = result.error.errors;
    t.true(errors.some(e => e.path.some(p => p === 'lat')), 'Should report coordinate validation error');
    t.true(errors.some(e => e.path.some(p => p === 'url')), 'Should report document URL validation error');
  }
});

test('MunicipalProjectSchema - preserves rawData as any type', t => {
  const projectWithComplexRawData = {
    id: 'test-001',
    source: 'test',
    type: 'permit',
    title: 'Test',
    address: '123 Test St',
    status: 'pending',
    submitDate: new Date(),
    rawData: {
      complexObject: {
        nested: {
          arrays: [1, 2, 3],
          booleans: true,
          nulls: null,
          functions: 'not-actually-a-function'
        }
      },
      someArray: ['a', 'b', 'c'],
      someNumber: 123,
      someString: 'test'
    }
  };

  const result = MunicipalProjectSchema.safeParse(projectWithComplexRawData);
  t.true(result.success, 'Should validate project with complex rawData');
  
  if (result.success) {
    t.deepEqual(result.data.rawData, projectWithComplexRawData.rawData, 'Should preserve rawData exactly');
  }
});