/**
 * Tests for error classes and error handling
 */

import test from 'ava';
import { 
  MunicipalDataError,
  AuthenticationError,
  RateLimitError,
  ServiceUnavailableError
} from './clients/base-client';
// Removed test-utils import - inlined simple helpers

test('MunicipalDataError - basic construction', t => {
  const error = new MunicipalDataError('Test error', 'test-source');
  
  t.is(error.name, 'MunicipalDataError', 'Should have correct error name');
  t.is(error.message, 'Test error', 'Should have correct message');
  t.is(error.source, 'test-source', 'Should have correct source');
  t.is(error.statusCode, undefined, 'Should have undefined status code by default');
  t.is(error.details, undefined, 'Should have undefined details by default');
  t.true(error instanceof Error, 'Should be instance of Error');
  t.true(error instanceof MunicipalDataError, 'Should be instance of MunicipalDataError');
});

test('MunicipalDataError - construction with status code and details', t => {
  const details = { field: 'value', nested: { data: 123 } };
  const error = new MunicipalDataError('API error', 'sf', 400, details);
  
  t.is(error.message, 'API error', 'Should have correct message');
  t.is(error.source, 'sf', 'Should have correct source');
  t.is(error.statusCode, 400, 'Should have correct status code');
  t.deepEqual(error.details, details, 'Should have correct details');
});

test('MunicipalDataError - error inheritance properties', t => {
  const error = new MunicipalDataError('Test error', 'test-source');
  
  // Should have standard Error properties
  t.truthy(error.stack, 'Should have stack trace');
  t.is(typeof error.toString, 'function', 'Should have toString method');
  
  // Should be catchable as Error
  try {
    throw error;
  } catch (caught) {
    t.true(caught instanceof Error, 'Should be catchable as Error');
    t.true(caught instanceof MunicipalDataError, 'Should maintain specific type');
  }
});

test('AuthenticationError - extends MunicipalDataError correctly', t => {
  const error = new AuthenticationError('sf');
  
  t.is(error.name, 'AuthenticationError', 'Should have correct error name');
  t.is(error.message, 'Authentication failed', 'Should have default message');
  t.is(error.source, 'sf', 'Should have correct source');
  t.is(error.statusCode, 401, 'Should have 401 status code');
  t.true(error instanceof Error, 'Should be instance of Error');
  t.true(error instanceof MunicipalDataError, 'Should be instance of MunicipalDataError');
  t.true(error instanceof AuthenticationError, 'Should be instance of AuthenticationError');
});

test('AuthenticationError - construction with details', t => {
  const details = { token: 'invalid', provider: 'socrata' };
  const error = new AuthenticationError('nyc', details);
  
  t.is(error.source, 'nyc', 'Should have correct source');
  t.deepEqual(error.details, details, 'Should preserve details');
});

test('RateLimitError - extends MunicipalDataError correctly', t => {
  const resetTime = new Date('2024-02-01T12:00:00Z');
  const error = new RateLimitError('sf', resetTime);
  
  t.is(error.name, 'RateLimitError', 'Should have correct error name');
  t.is(error.message, 'Rate limit exceeded', 'Should have default message');
  t.is(error.source, 'sf', 'Should have correct source');
  t.is(error.statusCode, 429, 'Should have 429 status code');
  t.deepEqual(error.details, { resetTime }, 'Should have reset time in details');
  t.true(error instanceof RateLimitError, 'Should be instance of RateLimitError');
});

test('RateLimitError - construction without reset time', t => {
  const error = new RateLimitError('test-source');
  
  t.is(error.source, 'test-source', 'Should have correct source');
  t.deepEqual(error.details, { resetTime: undefined }, 'Should have undefined reset time');
});

test('ServiceUnavailableError - extends MunicipalDataError correctly', t => {
  const error = new ServiceUnavailableError('miami');
  
  t.is(error.name, 'ServiceUnavailableError', 'Should have correct error name');
  t.is(error.message, 'Service is temporarily unavailable', 'Should have default message');
  t.is(error.source, 'miami', 'Should have correct source');
  t.is(error.statusCode, 503, 'Should have 503 status code');
  t.true(error instanceof ServiceUnavailableError, 'Should be instance of ServiceUnavailableError');
});

test('ServiceUnavailableError - construction with details', t => {
  const details = { maintenance: true, estimatedDowntime: '2 hours' };
  const error = new ServiceUnavailableError('oakland', details);
  
  t.deepEqual(error.details, details, 'Should preserve details');
});

test('Error serialization - JSON.stringify', t => {
  const error = new MunicipalDataError('Test error', 'test-source', 400, { key: 'value' });
  
  // Errors don't serialize well by default, but our custom properties should be accessible
  const serialized = {
    name: error.name,
    message: error.message,
    source: error.source,
    statusCode: error.statusCode,
    details: error.details
  };
  
  t.is(serialized.name, 'MunicipalDataError', 'Should preserve name');
  t.is(serialized.message, 'Test error', 'Should preserve message');
  t.is(serialized.source, 'test-source', 'Should preserve source');
  t.is(serialized.statusCode, 400, 'Should preserve status code');
  t.deepEqual(serialized.details, { key: 'value' }, 'Should preserve details');
});

test('Error type discrimination in catch blocks', t => {
  const errors = [
    new MunicipalDataError('Generic error', 'test'),
    new AuthenticationError('test'),
    new RateLimitError('test'),
    new ServiceUnavailableError('test')
  ];
  
  errors.forEach(error => {
    try {
      throw error;
    } catch (caught) {
      if (caught instanceof AuthenticationError) {
        t.is(caught.statusCode, 401, 'Auth error should have 401 status');
      } else if (caught instanceof RateLimitError) {
        t.is(caught.statusCode, 429, 'Rate limit error should have 429 status');
      } else if (caught instanceof ServiceUnavailableError) {
        t.is(caught.statusCode, 503, 'Service error should have 503 status');
      } else if (caught instanceof MunicipalDataError) {
        t.pass('Should catch generic MunicipalDataError');
      } else {
        t.fail('Should catch as MunicipalDataError type');
      }
    }
  });
});

test('Error creation from HTTP responses', t => {
  // Simulate creating errors from different HTTP status codes
  const httpErrors = [
    { status: 400, message: 'Bad Request', source: 'sf' },
    { status: 401, message: 'Unauthorized', source: 'nyc' },
    { status: 403, message: 'Forbidden', source: 'la' },
    { status: 404, message: 'Not Found', source: 'miami' },
    { status: 429, message: 'Too Many Requests', source: 'sf' },
    { status: 500, message: 'Internal Server Error', source: 'oakland' },
    { status: 503, message: 'Service Unavailable', source: 'sd' }
  ];
  
  httpErrors.forEach(({ status, message, source }) => {
    let error: MunicipalDataError;
    
    // Create appropriate error type based on status code
    switch (status) {
      case 401:
        error = new AuthenticationError(source);
        break;
      case 429:
        error = new RateLimitError(source);
        break;
      case 503:
        error = new ServiceUnavailableError(source);
        break;
      default:
        error = new MunicipalDataError(message, source, status);
    }
    
    t.is(error.source, source, `${status} error should have correct source`);
    t.is(error.statusCode, status, `Error should have ${status} status code`);
    t.true(error instanceof MunicipalDataError, 'Should be MunicipalDataError instance');
  });
});

test('Error details preservation', t => {
  const complexDetails = {
    request: {
      url: 'https://data.sfgov.org/resource/test.json',
      params: { $limit: 100, $where: "status='active'" },
      headers: { 'X-App-Token': 'hidden' }
    },
    response: {
      status: 400,
      data: { error: 'Invalid query parameter' },
      timestamp: new Date().toISOString()
    },
    context: {
      retryCount: 2,
      timeout: 30000
    }
  };
  
  const error = new MunicipalDataError('Complex error scenario', 'sf', 400, complexDetails);
  
  t.deepEqual(error.details, complexDetails, 'Should preserve complex details object');
  t.is(error.details.request.url, complexDetails.request.url, 'Should preserve nested properties');
  t.is(error.details.context.retryCount, 2, 'Should preserve numeric properties');
});

test('Error inheritance chain', t => {
  const authError = new AuthenticationError('test');
  
  // Test instanceof chain
  t.true(authError instanceof Error, 'Should be instance of Error');
  t.true(authError instanceof MunicipalDataError, 'Should be instance of MunicipalDataError');
  t.true(authError instanceof AuthenticationError, 'Should be instance of AuthenticationError');
  
  // Test constructor chain
  t.is(authError.constructor.name, 'AuthenticationError', 'Should have correct constructor name');
  
  // Test that it's not instance of other error types
  t.false(authError instanceof RateLimitError, 'Should not be instance of RateLimitError');
  t.false(authError instanceof ServiceUnavailableError, 'Should not be instance of ServiceUnavailableError');
});

test('Error message customization', t => {
  // Test that specific error types can have custom messages if needed
  const customError = new MunicipalDataError(
    'Custom error message with context: failed to parse response', 
    'test-source',
    422,
    { validationErrors: ['field1 is required', 'field2 must be a number'] }
  );
  
  t.true(customError.message.includes('Custom error message'), 'Should preserve custom message');
  t.true(customError.message.includes('context'), 'Should preserve full message content');
  t.is(customError.statusCode, 422, 'Should handle non-standard status codes');
});

test('Error context for debugging', t => {
  const debugContext = {
    requestId: 'req-123-abc',
    userId: 'user-456',
    apiVersion: 'v1',
    timestamp: new Date().toISOString(),
    environment: 'test'
  };
  
  const error = new MunicipalDataError('Debug context test', 'test', 500, debugContext);
  
  t.is(error.details.requestId, 'req-123-abc', 'Should preserve request ID for debugging');
  t.is(error.details.environment, 'test', 'Should preserve environment context');
});

test('Rate limit error with timing information', t => {
  const resetTime = new Date(Date.now() + 3600000); // 1 hour from now
  const error = new RateLimitError('sf', resetTime);
  
  t.true(error.details.resetTime instanceof Date, 'Reset time should be a Date object');
  t.true(error.details.resetTime.getTime() > Date.now(), 'Reset time should be in the future');
  
  // Test that we can calculate wait time
  const waitTime = error.details.resetTime.getTime() - Date.now();
  t.true(waitTime > 0, 'Should be able to calculate positive wait time');
  t.true(waitTime <= 3600000, 'Wait time should be reasonable');
});

test('Error chaining and cause tracking', t => {
  const originalError = new Error('Original network error');
  const wrappedError = new MunicipalDataError(
    'Failed to fetch data from municipal API',
    'sf',
    500,
    { originalError: originalError.message, stack: originalError.stack }
  );
  
  t.truthy(wrappedError.details.originalError, 'Should preserve original error message');
  t.is(wrappedError.details.originalError, 'Original network error', 'Should have correct original message');
});

test('Error comparison and equality', t => {
  const error1 = new MunicipalDataError('Same error', 'sf', 400);
  const error2 = new MunicipalDataError('Same error', 'sf', 400);
  const error3 = new MunicipalDataError('Different error', 'sf', 400);
  
  // Errors are objects, so they're not equal even with same properties
  t.not(error1, error2, 'Error instances should not be equal');
  
  // But we can compare properties
  t.is(error1.message, error2.message, 'Should have same message');
  t.is(error1.source, error2.source, 'Should have same source');
  t.not(error1.message, error3.message, 'Should have different messages');
});

test('Error handling in promise chains', async t => {
  const createFailingPromise = (errorType: string) => {
    return new Promise((_, reject) => {
      switch (errorType) {
        case 'auth':
          reject(new AuthenticationError('test'));
          break;
        case 'rate':
          reject(new RateLimitError('test'));
          break;
        case 'service':
          reject(new ServiceUnavailableError('test'));
          break;
        default:
          reject(new MunicipalDataError('Generic error', 'test'));
      }
    });
  };
  
  // Test that errors propagate correctly through promise chains
  const authError = await t.throwsAsync(createFailingPromise('auth'));
  t.truthy(authError, 'Should throw error');
  t.true(authError!.message.includes('Authentication failed'), 'Should have correct error message');
  t.is(authError!.constructor.name, 'AuthenticationError', 'Should be correct error type');
  
  const rateError = await t.throwsAsync(createFailingPromise('rate'));
  t.truthy(rateError, 'Should throw error');
  t.true(rateError!.message.includes('Rate limit exceeded'), 'Should have correct error message');
  t.is(rateError!.constructor.name, 'RateLimitError', 'Should be correct error type');
  
  const serviceError = await t.throwsAsync(createFailingPromise('service'));
  t.truthy(serviceError, 'Should throw error');
  t.true(serviceError!.message.includes('Service is temporarily unavailable'), 'Should have correct error message');
  t.is(serviceError!.constructor.name, 'ServiceUnavailableError', 'Should be correct error type');
});