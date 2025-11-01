#!/usr/bin/env node
/**
 * Test script to see what the Politiloggen API actually returns
 */

const axios = require('axios');

async function testAPI() {
  console.log('🔍 Testing Politiloggen API directly...\n');

  const baseURL = 'https://api.politiet.no/politiloggen/v1';

  // Test 1: Just /messages with no params
  console.log('Test 1: GET /messages (no params)');
  try {
    const response = await axios.get(`${baseURL}/messages`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseMap/1.0',
      },
      timeout: 10000,
    });
    console.log('✅ Status:', response.status);
    console.log('📦 Response type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
    if (Array.isArray(response.data)) {
      console.log('📊 Count:', response.data.length);
      if (response.data.length > 0) {
        console.log('📋 First item:', JSON.stringify(response.data[0], null, 2));
      }
    } else {
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.log('📋 Error response:', error.response.data);
    }
  }

  console.log('\n---\n');

  // Test 2: With Take parameter
  console.log('Test 2: GET /messages?Take=10');
  try {
    const response = await axios.get(`${baseURL}/messages`, {
      params: { Take: 10 },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseMap/1.0',
      },
      timeout: 10000,
    });
    console.log('✅ Status:', response.status);
    console.log('📦 Response type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
    if (Array.isArray(response.data)) {
      console.log('📊 Count:', response.data.length);
      if (response.data.length > 0) {
        console.log('📋 First item keys:', Object.keys(response.data[0]));
        console.log('📋 First item:', JSON.stringify(response.data[0], null, 2));
      }
    } else {
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.message);
  }

  console.log('\n---\n');

  // Test 3: With Districts parameter
  console.log('Test 3: GET /messages?Take=10&Districts=Oslo');
  try {
    const response = await axios.get(`${baseURL}/messages`, {
      params: {
        Take: 10,
        Districts: ['Oslo']
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseMap/1.0',
      },
      timeout: 10000,
    });
    console.log('✅ Status:', response.status);
    console.log('📦 Response type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
    if (Array.isArray(response.data)) {
      console.log('📊 Count:', response.data.length);
    } else {
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.message);
  }

  console.log('\n---\n');

  // Test 4: Different parameter format
  console.log('Test 4: GET /messages?take=10 (lowercase)');
  try {
    const response = await axios.get(`${baseURL}/messages`, {
      params: { take: 10 },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseMap/1.0',
      },
      timeout: 10000,
    });
    console.log('✅ Status:', response.status);
    console.log('📊 Count:', Array.isArray(response.data) ? response.data.length : 'N/A');
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.message);
  }

  console.log('\n✅ Test complete!');
}

testAPI();
