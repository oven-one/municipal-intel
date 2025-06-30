/**
 * HTTP mocking utilities for tests
 */

import { AxiosResponse, AxiosError } from 'axios';

export interface MockResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

export interface MockRequest {
  method: string;
  url: string;
  params?: any;
  headers?: any;
}

/**
 * Create a mock Axios response
 */
export function createMockResponse(data: any, status: number = 200): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {} as any,
    request: {}
  };
}

/**
 * Create a mock Axios error
 */
export function createMockError(
  message: string,
  status: number = 500,
  data?: any
): AxiosError {
  const error = new Error(message) as AxiosError;
  error.isAxiosError = true;
  error.response = {
    status,
    statusText: 'Error',
    data,
    headers: {},
    config: {} as any,
    request: {}
  };
  return error;
}

/**
 * Mock Socrata API responses
 */
export const mockSocrataResponses = {
  buildingPermits: [
    {
      permit_number: '2024-001',
      permit_type: 'Residential Addition',
      status: 'Issued',
      filed_date: '2024-01-15T00:00:00.000',
      issued_date: '2024-02-01T00:00:00.000',
      estimated_cost: '50000',
      street_number: '123',
      street_name: 'Main St',
      description: 'Addition to single family home',
      applicant_name: 'John Doe'
    },
    {
      permit_number: '2024-002',
      permit_type: 'Commercial Renovation',
      status: 'Under Review',
      filed_date: '2024-01-20T00:00:00.000',
      estimated_cost: '250000',
      street_number: '456',
      street_name: 'Commercial Ave',
      description: 'Office space renovation',
      applicant_name: 'ABC Corp'
    }
  ],

  healthCheck: [
    {
      permit_number: 'HEALTH-CHECK',
      status: 'Issued',
      filed_date: '2024-01-01T00:00:00.000'
    }
  ],

  count: [
    {
      total: '1234'
    }
  ],

  empty: []
};

/**
 * Mock HTTP client that captures requests
 */
export class MockHttpClient {
  private responses: Map<string, MockResponse> = new Map();
  private requests: MockRequest[] = [];

  /**
   * Set up a mock response for a specific URL pattern
   */
  mockResponse(urlPattern: string, response: MockResponse): void {
    this.responses.set(urlPattern, response);
  }

  /**
   * Mock a successful response
   */
  mockSuccess(urlPattern: string, data: any): void {
    this.mockResponse(urlPattern, { status: 200, data });
  }

  /**
   * Mock an error response
   */
  mockError(urlPattern: string, status: number, data?: any): void {
    this.mockResponse(urlPattern, { status, data });
  }

  /**
   * Get all captured requests
   */
  getRequests(): MockRequest[] {
    return [...this.requests];
  }

  /**
   * Get the last request
   */
  getLastRequest(): MockRequest | undefined {
    return this.requests[this.requests.length - 1];
  }

  /**
   * Clear all requests and responses
   */
  reset(): void {
    this.responses.clear();
    this.requests.splice(0);
  }

  /**
   * Simulate an HTTP request
   */
  async request(config: any): Promise<AxiosResponse> {
    const request: MockRequest = {
      method: config.method || 'GET',
      url: config.url,
      params: config.params,
      headers: config.headers
    };

    this.requests.push(request);

    // Find matching response
    for (const [pattern, response] of this.responses) {
      if (config.url.includes(pattern)) {
        if (response.status >= 400) {
          throw createMockError(`HTTP ${response.status}`, response.status, response.data);
        }
        return createMockResponse(response.data, response.status);
      }
    }

    // Default success response
    return createMockResponse({ message: 'Mock response' });
  }
}

/**
 * Create a mock axios instance
 */
export function createMockAxios(mockClient: MockHttpClient = new MockHttpClient()) {
  return {
    get: (url: string, config?: any) => mockClient.request({ ...config, method: 'GET', url }),
    post: (url: string, data?: any, config?: any) => mockClient.request({ ...config, method: 'POST', url, data }),
    put: (url: string, data?: any, config?: any) => mockClient.request({ ...config, method: 'PUT', url, data }),
    delete: (url: string, config?: any) => mockClient.request({ ...config, method: 'DELETE', url }),
    create: () => createMockAxios(mockClient),
    interceptors: {
      request: { use: () => {} },
      response: { use: () => {} }
    }
  };
}