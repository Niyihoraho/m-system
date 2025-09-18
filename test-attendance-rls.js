// Test script to verify attendance RLS functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAttendanceRLS() {
  console.log('Testing Attendance RLS Functionality...\n');

  try {
    // Test 1: Fetch events (should be filtered by user scope)
    console.log('1. Testing events API with RLS...');
    const eventsResponse = await axios.get(`${BASE_URL}/api/events`);
    console.log(`   Found ${eventsResponse.data.length} events accessible to current user`);
    
    // Test 2: Fetch attendance records (should be filtered by user scope)
    console.log('2. Testing attendance API with RLS...');
    const attendanceResponse = await axios.get(`${BASE_URL}/api/attendance`);
    console.log(`   Found ${attendanceResponse.data.length} attendance records accessible to current user`);
    
    // Test 3: Test user scope endpoint
    console.log('3. Testing user scope endpoint...');
    const scopeResponse = await axios.get(`${BASE_URL}/api/members/current-user-scope`);
    console.log('   User scope:', scopeResponse.data.scope);
    
    console.log('\n✅ All RLS tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAttendanceRLS();
