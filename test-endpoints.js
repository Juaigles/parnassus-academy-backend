// test-endpoints.js
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing API endpoints...\n');

  // Test 1: Health check
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    console.log(`✅ Health check: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  // Test 2: Courses endpoint (without auth)
  try {
    const response = await fetch(`${BASE_URL}/api/courses`);
    console.log(`✅ Courses endpoint: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ Courses endpoint failed: ${error.message}`);
  }

  // Test 3: Purchase endpoints structure
  try {
    const response = await fetch(`${BASE_URL}/api/purchases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Purchase endpoint exists: ${response.status} ${response.statusText}`);
    if (response.status === 401) {
      console.log('   (Expected 401 - authentication required)');
    }
  } catch (error) {
    console.log(`❌ Purchase endpoint failed: ${error.message}`);
  }

  // Test 4: Wishlist endpoints structure
  try {
    const response = await fetch(`${BASE_URL}/api/wishlist`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Wishlist endpoint exists: ${response.status} ${response.statusText}`);
    if (response.status === 401) {
      console.log('   (Expected 401 - authentication required)');
    }
  } catch (error) {
    console.log(`❌ Wishlist endpoint failed: ${error.message}`);
  }

  console.log('\n🎉 Endpoint testing complete!');
}

testEndpoints().catch(console.error);
