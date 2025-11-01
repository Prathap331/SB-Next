// Test Next.js API routes (must be run while dev server is running)
// First start: npm run dev
// Then run: node test-nextjs-route.js

async function testRoute(name, url, method = 'GET', body = null) {
  try {
    const startTime = Date.now();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    let data = null;
    let errorText = null;
    
    try {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          errorText = text;
        }
      }
    } catch {
      // Response might be empty
    }
    
    return {
      name,
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      elapsed: `${elapsed}s`,
      data,
      errorText,
      url,
    };
  } catch (error) {
    return {
      name,
      success: false,
      error: error.message,
      code: error.code,
      url,
    };
  }
}

async function testAllRoutes() {
  console.log('🔍 Next.js API Routes Test Suite');
  console.log('==================================');
  console.log('Make sure dev server is running: npm run dev\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test all routes simultaneously
  const tests = await Promise.all([
    // Process Topic API - GET (health check)
    testRoute(
      'Process Topic (GET)',
      `${baseUrl}/api/process-topic`,
      'GET'
    ),
    
    // Process Topic API - POST
    testRoute(
      'Process Topic (POST)',
      `${baseUrl}/api/process-topic`,
      'POST',
      { topic: 'Flying Cars' }
    ),
    
    // Generate Script API - POST (requires authentication)
    testRoute(
      'Generate Script (POST)',
      `${baseUrl}/api/generate-script`,
      'POST',
      {
        topic: 'Flying Cars',
        emotional_tone: 'excited',
        creator_type: 'tech reviewer',
        audience_description: 'technology enthusiasts',
        accent: 'neutral',
        duration_minutes: 10,
        script_structure: 'narrative'
      }
    ),
  ]);
  
  // Display results
  console.log('\n📊 Test Results:\n');
  console.log('═'.repeat(80));
  
  tests.forEach((result, index) => {
    const statusIcon = result.success ? '✅' : '❌';
    
    console.log(`\n${index + 1}. ${statusIcon} ${result.name}`);
    console.log('   URL:', result.url);
    console.log('   Status:', result.status, result.statusText || '');
    
    if (result.elapsed) {
      console.log('   Response Time:', result.elapsed);
    }
    
    if (result.success) {
      if (result.data) {
        if (result.name.includes('Process Topic (POST)')) {
          console.log('   ✅ Success! Received response');
          if (result.data.ideas && Array.isArray(result.data.ideas)) {
            console.log(`   📝 Ideas count: ${result.data.ideas.length}`);
          }
          if (result.data.descriptions && Array.isArray(result.data.descriptions)) {
            console.log(`   📄 Descriptions count: ${result.data.descriptions.length}`);
          }
        } else if (result.name.includes('Generate Script')) {
          console.log('   ✅ Success! Received response');
          if (result.data.script) {
            console.log(`   📝 Script length: ${result.data.script.length} characters`);
          }
          if (result.data.estimated_word_count) {
            console.log(`   📊 Word count: ${result.data.estimated_word_count}`);
          }
        } else {
          console.log('   Response:', JSON.stringify(result.data, null, 2));
        }
      }
    } else {
      if (result.error) {
        console.log('   ❌ Error:', result.error);
        if (result.code === 'ECONNREFUSED') {
          console.log('   💡 Make sure dev server is running: npm run dev');
        }
      } else if (result.errorText) {
        console.log('   ❌ Error Response:', result.errorText.substring(0, 200));
        if (result.status === 401) {
          console.log('   💡 This endpoint requires authentication');
        } else if (result.status === 404) {
          console.log('   💡 Route not found - check if route file exists and dev server is running');
        }
        } else if (result.data && result.data.error) {
        if (result.name.includes('Generate Script') && result.status === 401) {
          console.log('   ⚠️  API Error:', result.data.error);
          console.log('   ℹ️  This is expected - endpoint requires authentication');
        } else {
          console.log('   ❌ API Error:', result.data.error);
        }
      } else {
        console.log('   ❌ Request failed');
      }
    }
    
    console.log('   ' + '-'.repeat(76));
  });
  
  // Summary (exclude auth-required endpoints from failure count)
  const authRequired = tests.filter(t => t.name.includes('Generate Script') && t.status === 401);
  const actualFailures = tests.filter(t => !t.success && !(t.name.includes('Generate Script') && t.status === 401));
  const passed = tests.filter(t => t.success).length;
  const total = tests.length;
  
  console.log('\n\n📈 Summary:');
  console.log('═'.repeat(80));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${actualFailures.length} ❌`);
  if (authRequired.length > 0) {
    console.log(`Auth Required: ${authRequired.length} ⚠️  (401 is expected without auth token)`);
  }
  
  if (actualFailures.length === 0) {
    console.log('\n🎉 All functional tests passed!');
    if (authRequired.length > 0) {
      console.log('   Note: Generate Script requires authentication (401 is expected)');
    }
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    
    // Provide helpful suggestions
    const failed = tests.filter(t => !t.success);
    const has404 = failed.some(t => t.status === 404);
    const hasConnection = failed.some(t => t.code === 'ECONNREFUSED');
    
    console.log('\n💡 Troubleshooting:');
    if (hasConnection) {
      console.log('   • Make sure dev server is running: npm run dev');
    }
    if (has404) {
      console.log('   • Restart dev server to register route changes');
      console.log('   • Check if route files exist: src/app/api/process-topic/route.ts');
      console.log('   • Clear .next folder and rebuild: rm -rf .next && npm run build');
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

// Run tests
testAllRoutes();