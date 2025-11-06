#!/usr/bin/env node

/**
 * Enhanced System Functionality Test with Authentication
 * Tests all major components of the Church Management System
 */

const BASE_URL = 'http://localhost:3000';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Test authentication credentials (you'll need to create these in your database)
const TEST_CREDENTIALS = {
  bishop: { email: 'bishop@church.com', password: 'bishop123' },
  leader: { email: 'leader@church.com', password: 'leader123' },
  member: { email: 'member@church.com', password: 'member123' }
};

// Store authentication tokens
let authTokens = {};

// Utility function for making requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: jsonData,
      headers: response.headers
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null
    };
  }
}

// Test function wrapper
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Testing: ${testName}`);
  try {
    const result = await testFunction();
    if (result.success) {
      console.log(`✅ ${testName}: PASSED`);
      testResults.passed++;
    } else {
      console.log(`❌ ${testName}: FAILED - ${result.error}`);
      testResults.failed++;
      testResults.errors.push({ test: testName, error: result.error });
    }
  } catch (error) {
    console.log(`💥 ${testName}: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
}

// Individual test functions
async function testServerConnection() {
  const response = await makeRequest('/api/test-connection');
  return {
    success: response.ok && response.data?.status === 'success',
    error: response.error || response.data?.message || 'Server not responding'
  };
}

async function testDatabaseConnection() {
  const response = await makeRequest('/api/test-connection');
  return {
    success: response.ok && response.data?.status === 'success',
    error: response.error || response.data?.message || 'Database connection failed'
  };
}

async function testLoginEndpoint() {
  const response = await makeRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS.bishop)
  });
  
  // Login should return 401 for invalid credentials, not 500
  return {
    success: response.status === 401 || response.status === 400 || response.ok,
    error: response.status === 500 ? 'Server error on login' : null
  };
}

async function testBishopDashboardAPI() {
  const response = await makeRequest('/api/bishop/dashboard');
  return {
    success: response.status === 401, // Should require authentication
    error: response.status === 500 ? 'Server error on bishop dashboard' : null
  };
}

async function testProtocolTeamsAPI() {
  const response = await makeRequest('/api/bishop/protocol-teams');
  return {
    success: response.status === 401, // Should require authentication
    error: response.status === 500 ? 'Server error on protocol teams' : null
  };
}

async function testProtocolAnalyticsAPI() {
  const response = await makeRequest('/api/bishop/protocol-teams/analytics/simple');
  return {
    success: response.status === 401, // Should require authentication
    error: response.status === 500 ? 'Server error on protocol analytics' : null
  };
}

async function testEventsAPI() {
  const response = await makeRequest('/api/events');
  return {
    success: response.status === 401, // Should require authentication
    error: response.status === 500 ? 'Server error on events' : null
  };
}

async function testGroupsAPI() {
  const response = await makeRequest('/api/groups');
  return {
    success: response.status === 401, // Should require authentication
    error: response.status === 500 ? 'Server error on groups' : null
  };
}

async function testMembersAPI() {
  const response = await makeRequest('/api/members');
  return {
    success: response.status === 401, // Should require authentication
    error: response.status === 500 ? 'Server error on members' : null
  };
}

async function testMainPage() {
  const response = await makeRequest('/');
  return {
    success: response.ok && response.data?.raw?.includes('G-45 Main'),
    error: response.error || 'Main page not loading'
  };
}

async function testBishopPage() {
  const response = await makeRequest('/bishop');
  return {
    success: response.ok, // Should load the page (may redirect to login)
    error: response.error || 'Bishop page not accessible'
  };
}

async function testProtocolTeamsPage() {
  const response = await makeRequest('/bishop/protocol-teams');
  return {
    success: response.ok, // Should load the page (may redirect to login)
    error: response.error || 'Protocol teams page not accessible'
  };
}

async function testProtocolAnalyticsPage() {
  const response = await makeRequest('/bishop/protocol-analytics');
  return {
    success: response.ok, // Should load the page (may redirect to login)
    error: response.error || 'Protocol analytics page not accessible'
  };
}

async function testAPIEndpointStructure() {
  // Test that all major API endpoints exist and respond appropriately
  const endpoints = [
    '/api/bishop/dashboard',
    '/api/bishop/protocol-teams',
    '/api/bishop/protocol-teams/analytics/simple',
    '/api/events',
    '/api/groups',
    '/api/members',
    '/api/login',
    '/api/logout',
    '/api/test-connection'
  ];

  let allEndpointsWorking = true;
  const endpointErrors = [];

  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint);
    if (response.status === 0) {
      allEndpointsWorking = false;
      endpointErrors.push(`${endpoint}: Connection failed`);
    } else if (response.status >= 500) {
      allEndpointsWorking = false;
      endpointErrors.push(`${endpoint}: Server error (${response.status})`);
    }
  }

  return {
    success: allEndpointsWorking,
    error: endpointErrors.length > 0 ? endpointErrors.join(', ') : null
  };
}

async function testDatabaseModels() {
  // Test that we can connect to database and models are accessible
  const response = await makeRequest('/api/test-connection');
  return {
    success: response.ok && response.data?.status === 'success',
    error: response.error || response.data?.message || 'Database models not accessible'
  };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Enhanced System Test');
  console.log('=' .repeat(50));
  
  // Core system tests
  await runTest('Server Connection', testServerConnection);
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Database Models', testDatabaseModels);
  
  // API endpoint structure tests
  await runTest('API Endpoint Structure', testAPIEndpointStructure);
  
  // API endpoint tests (should require authentication)
  await runTest('Login Endpoint', testLoginEndpoint);
  await runTest('Bishop Dashboard API', testBishopDashboardAPI);
  await runTest('Protocol Teams API', testProtocolTeamsAPI);
  await runTest('Protocol Analytics API', testProtocolAnalyticsAPI);
  await runTest('Events API', testEventsAPI);
  await runTest('Groups API', testGroupsAPI);
  await runTest('Members API', testMembersAPI);
  
  // Page accessibility tests
  await runTest('Main Page', testMainPage);
  await runTest('Bishop Page', testBishopPage);
  await runTest('Protocol Teams Page', testProtocolTeamsPage);
  await runTest('Protocol Analytics Page', testProtocolAnalyticsPage);
  
  // Results summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 FAILED TESTS:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   • ${test}: ${error}`);
    });
  }
  
  console.log('\n🎯 SYSTEM STATUS:');
  if (testResults.failed === 0) {
    console.log('🟢 ALL SYSTEMS OPERATIONAL');
  } else if (testResults.failed <= 3) {
    console.log('🟡 MINOR ISSUES DETECTED');
  } else {
    console.log('🔴 MAJOR ISSUES DETECTED');
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  if (testResults.errors.some(e => e.error && e.error.includes('Server not responding'))) {
    console.log('   • Start the development server: npm run dev');
  }
  if (testResults.errors.some(e => e.error && e.error.includes('Database connection'))) {
    console.log('   • Check MongoDB connection and environment variables');
  }
  if (testResults.errors.some(e => e.error && e.error.includes('Server error'))) {
    console.log('   • Check API route implementations for syntax errors');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('   1. Create test users in the database for authentication testing');
  console.log('   2. Test authenticated API calls with valid tokens');
  console.log('   3. Verify all CRUD operations work correctly');
  console.log('   4. Test error handling and edge cases');
}

// Run the tests
runAllTests().catch(console.error);
