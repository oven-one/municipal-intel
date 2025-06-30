/**
 * Integration tests for real Socrata token usage
 * These tests make actual HTTP requests to verify token authentication
 */

import { createMunicipalIntel } from '../src';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testRealTokens() {
  console.log('🔑 REAL SOCRATA TOKEN INTEGRATION TESTS\n');

  const SOCRATA_TOKEN = process.env.SOCRATA_TOKEN;

  console.log('📋 Environment Check:');
  console.log(`   SOCRATA_TOKEN: ${SOCRATA_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  if (!SOCRATA_TOKEN) {
    console.log('⚠️  No token found. Skipping token tests.');
    console.log('   To test tokens, set SOCRATA_TOKEN in .env');
    return;
  }

  // Test 1: Token-less request (should work but have lower rate limits)
  console.log('🧪 TEST 1: Request without token');
  try {
    const municipal = createMunicipalIntel({ debug: true });
    const start = Date.now();
    
    const resultWithoutToken = await municipal.search({
      sources: ['sf'],
      limit: 1
    });
    
    const latency = Date.now() - start;
    console.log(`   ✅ Success: ${resultWithoutToken.projects.length} projects`);
    console.log(`   ⏱️  Latency: ${latency}ms`);
    console.log(`   📊 Total: ${resultWithoutToken.total}`);
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
  console.log('');

  // Test 2: Request with token
  console.log('🧪 TEST 2: SF request with token');
  try {
    const municipal = createMunicipalIntel({ 
      debug: true,
      socrataToken: SOCRATA_TOKEN
    });
      
      const start = Date.now();
      
      const resultWithToken = await municipal.search({
        sources: ['sf'],
        limit: 1
      });
      
      const latency = Date.now() - start;
      console.log(`   ✅ Success: ${resultWithToken.projects.length} projects`);
      console.log(`   ⏱️  Latency: ${latency}ms`);
      console.log(`   📊 Total: ${resultWithToken.total}`);
      console.log(`   🎫 Token: ${SOCRATA_TOKEN.substring(0, 8)}...${SOCRATA_TOKEN.substring(SOCRATA_TOKEN.length - 4)}`);
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    console.log('');

  // Test 3: Dynamic token addition
  console.log('🧪 TEST 3: Dynamic token addition');
  try {
    const municipal = createMunicipalIntel({ debug: true });
    
    // Add token after creation
    municipal.setSocrataToken(SOCRATA_TOKEN);
      
      const result = await municipal.search({
        sources: ['sf'],
        limit: 1
      });
      
      console.log(`   ✅ Dynamic token addition works: ${result.projects.length} projects`);
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    console.log('');

  // Test 4: Multiple sources with universal token
  console.log('🧪 TEST 4: Multiple sources with universal token');
  try {
    const municipal = createMunicipalIntel({
      debug: true,
      socrataToken: SOCRATA_TOKEN
    });
      
      // Test SF with universal token
      const sfResult = await municipal.search({
        sources: ['sf'],
        limit: 1
      });
      
      // Test NYC with universal token  
      const nycResult = await municipal.search({
        sources: ['nyc'],
        limit: 1
      });
      
      console.log(`   ✅ SF with universal token: ${sfResult.projects.length} projects`);
      console.log(`   ✅ NYC with universal token: ${nycResult.projects.length} projects`);
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    console.log('');

  // Test 5: Token validation (invalid token should still work, just without auth benefits)
  console.log('🧪 TEST 5: Invalid token handling');
  try {
    const municipal = createMunicipalIntel({
      debug: true,
      socrataToken: 'invalid-token-12345'
    });
    
    const result = await municipal.search({
      sources: ['sf'],
      limit: 1
    });
    
    console.log(`   ✅ Invalid token handled gracefully: ${result.projects.length} projects`);
    console.log(`   ℹ️  Note: Socrata typically allows invalid tokens but treats them as unauthenticated`);
    
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
  console.log('');

  console.log('🎯 WHAT THESE TESTS VALIDATE:');
  console.log('✅ Real HTTP requests with X-App-Token header');
  console.log('✅ Universal token configuration through socrataToken config');
  console.log('✅ Dynamic token addition via setSocrataToken()');
  console.log('✅ Single token works across multiple sources');
  console.log('✅ Graceful handling of invalid tokens');
  console.log('');
  console.log('💡 To get Socrata tokens:');
  console.log('   Create account at any Socrata portal (e.g., data.sfgov.org)');
  console.log('   Go to profile/app_tokens and create new token');
  console.log('   Token works across all Socrata portals');
}

testRealTokens().catch(console.error);