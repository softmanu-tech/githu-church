#!/usr/bin/env node

/**
 * Test script for the CRON_API_KEY and reminders endpoint
 * Usage: node test-cron.js [url]
 * 
 * Example:
 * node test-cron.js http://localhost:3000
 * node test-cron.js https://your-domain.com
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Get the base URL from command line or use default
const baseUrl = process.argv[2] || 'http://localhost:3000';
const endpoint = `${baseUrl}/api/cron/reminders`;

// Get the CRON_API_KEY from .env.local file
const fs = require('fs');
const path = require('path');

let cronApiKey = process.env.CRON_API_KEY;

// If not in environment, try to read from .env.local
if (!cronApiKey) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/CRON_API_KEY=(.+)/);
    cronApiKey = match ? match[1].trim() : null;
  } catch (error) {
    console.error(`❌ Error reading .env.local: ${error.message}`);
  }
}

if (!cronApiKey) {
  console.error('❌ CRON_API_KEY not found in environment variables');
  console.error('Make sure you have a .env.local file with CRON_API_KEY set');
  process.exit(1);
}

console.log('🔐 Testing CRON API Key...');
console.log(`📡 Endpoint: ${endpoint}`);
console.log(`🔑 API Key: ${cronApiKey.substring(0, 8)}...${cronApiKey.substring(cronApiKey.length - 8)}`);
console.log('');

// Parse the URL to determine if it's HTTP or HTTPS
const parsedUrl = url.parse(endpoint);
const isHttps = parsedUrl.protocol === 'https:';
const client = isHttps ? https : http;

// Prepare the request options
const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || (isHttps ? 443 : 80),
  path: parsedUrl.path,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${cronApiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Church Management Cron Test'
  }
};

// Make the request
const req = client.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    console.log('');
    
    try {
      const response = JSON.parse(data);
      console.log('📄 Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 && response.success) {
        console.log('');
        console.log('✅ CRON API Key is working correctly!');
        console.log(`📧 Event reminders sent: ${response.data?.eventRemindersSent || 0}`);
        console.log(`📋 Attendance reminders sent: ${response.data?.attendanceRemindersSent || 0}`);
      } else if (res.statusCode === 401) {
        console.log('');
        console.log('❌ Authentication failed - check your CRON_API_KEY');
      } else {
        console.log('');
        console.log('⚠️  Request completed but with errors');
      }
    } catch (error) {
      console.log('📄 Raw Response:');
      console.log(data);
      console.log('');
      console.log('❌ Failed to parse JSON response');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  
  if (error.code === 'ECONNREFUSED') {
    console.error('💡 Make sure your Next.js server is running with: npm run dev');
  } else if (error.code === 'ENOTFOUND') {
    console.error('💡 Check the URL - the hostname could not be resolved');
  }
});

// Set a timeout
req.setTimeout(10000, () => {
  console.error('❌ Request timeout - server took too long to respond');
  req.destroy();
});

// Send the request
req.end();

console.log('⏳ Sending request...');
