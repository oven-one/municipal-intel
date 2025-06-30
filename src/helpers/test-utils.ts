/**
 * Test utilities and helper functions
 */

import { MunicipalProject } from '../types/projects';
import { MunicipalSource } from '../types/sources';

/**
 * Helper to compare dates with tolerance for test timing
 */
export function assertDateClose(t: any, actual: Date, expected: Date, toleranceMs: number = 1000): void {
  const diff = Math.abs(actual.getTime() - expected.getTime());
  t.true(diff <= toleranceMs, `Expected date ${actual.toISOString()} to be within ${toleranceMs}ms of ${expected.toISOString()}`);
}

/**
 * Helper to assert project structure
 */
export function assertValidProject(t: any, project: MunicipalProject): void {
  t.truthy(project.id, 'Project should have an ID');
  t.truthy(project.source, 'Project should have a source');
  t.truthy(project.type, 'Project should have a type');
  t.truthy(project.title, 'Project should have a title');
  t.truthy(project.address, 'Project should have an address');
  t.truthy(project.status, 'Project should have a status');
  t.true(project.submitDate instanceof Date, 'Submit date should be a Date object');
  
  // Check ID format (should be prefixed with source)
  t.true(project.id.startsWith(project.source + '-'), 'Project ID should start with source prefix');
}

/**
 * Helper to assert source structure
 */
export function assertValidSource(t: any, source: MunicipalSource): void {
  t.truthy(source.id, 'Source should have an ID');
  t.truthy(source.name, 'Source should have a name');
  t.truthy(source.state, 'Source should have a state');
  t.truthy(source.type, 'Source should have a type');
  t.truthy(source.priority, 'Source should have a priority');
  
  // Check state format (should be 2-letter uppercase)
  t.is(source.state.length, 2, 'State should be 2 characters');
  t.is(source.state, source.state.toUpperCase(), 'State should be uppercase');
}

/**
 * Sleep utility for async tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a test timeout wrapper
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Test timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const logs: string[] = [];
  const errors: string[] = [];

  console.log = (...args: any[]) => {
    logs.push(args.join(' '));
  };

  console.error = (...args: any[]) => {
    errors.push(args.join(' '));
  };

  return {
    logs,
    errors,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    }
  };
}

/**
 * Helper to create test environment variables
 */
export function withTestEnv(env: Record<string, string>, fn: () => void | Promise<void>): Promise<void> {
  const originalEnv = { ...process.env };
  
  // Set test environment variables
  Object.assign(process.env, env);
  
  const restore = () => {
    // Restore original environment
    process.env = originalEnv;
  };

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(restore);
    } else {
      restore();
      return Promise.resolve();
    }
  } catch (error) {
    restore();
    throw error;
  }
}

/**
 * Generate test data with variations
 */
export function generateTestProjects(count: number, sourceId: string = 'test'): MunicipalProject[] {
  const projects: MunicipalProject[] = [];
  const statuses = ['pending', 'under_review', 'approved', 'completed'] as const;
  const types = ['permit', 'planning', 'construction'] as const;
  
  for (let i = 0; i < count; i++) {
    projects.push({
      id: `${sourceId}-${i + 1}`,
      source: sourceId,
      type: types[i % types.length],
      title: `Test Project ${i + 1}`,
      address: `${100 + i} Test Street`,
      status: statuses[i % statuses.length],
      submitDate: new Date(2024, 0, i + 1),
      value: (i + 1) * 10000,
      applicant: `Test Applicant ${i + 1}`,
      description: `Test description for project ${i + 1}`,
      lastUpdated: new Date()
    });
  }
  
  return projects;
}

/**
 * Assert error properties
 */
export function assertError(t: any, error: Error, expectedMessage?: string, expectedName?: string): void {
  t.truthy(error, 'Error should exist');
  t.true(error instanceof Error, 'Should be an Error instance');
  
  if (expectedMessage) {
    t.true(error.message.includes(expectedMessage), `Error message should contain "${expectedMessage}", got: ${error.message}`);
  }
  
  if (expectedName) {
    t.is(error.name, expectedName, `Error name should be "${expectedName}"`);
  }
}