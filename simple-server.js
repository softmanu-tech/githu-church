#!/usr/bin/env node

/**
 * Simple Express server to test the CRON_API_KEY functionality
 * This mimics the Next.js API endpoint for testing purposes
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Read CRON_API_KEY from .env.local
let cronApiKey;
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/CRON_API_KEY=(.+)/);
  cronApiKey = match ? match[1].trim() : null;
} catch (error) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

if (!cronApiKey) {
  console.error('❌ CRON_API_KEY not found in .env.local');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle the cron reminders endpoint
  if (parsedUrl.pathname === '/api/cron/reminders' && req.method === 'POST') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing Authorization header' }));
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (token !== cronApiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API key' }));
      return;
    }
    
    // Simulate successful reminder sending
    const response = {
      success: true,
      data: {
        eventRemindersSent: Math.floor(Math.random() * 5),
        attendanceRemindersSent: Math.floor(Math.random() * 3),
        timestamp: new Date().toISOString(),
        message: 'Reminders sent successfully (simulated)'
      }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  // Handle root path
  if (parsedUrl.pathname === '/' && req.method === 'GET') {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Church Management Test Server</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .success { color: #22c55e; }
            .info { color: #3b82f6; }
            .warning { color: #f59e0b; }
            pre { background: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .endpoint { background: #1f2937; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>🎉 Church Management Test Server</h1>
        <p class="success">✅ CRON_API_KEY is working correctly!</p>
        
        <h2>Available Endpoints:</h2>
        <div class="endpoint">
            <strong>POST /api/cron/reminders</strong><br>
            Headers: Authorization: Bearer ${cronApiKey.substring(0, 8)}...${cronApiKey.substring(cronApiKey.length - 8)}
        </div>
        
        <h2>Test the CRON API:</h2>
        <pre>node test-cron.js http://localhost:3001</pre>
        
        <h2>Or use curl:</h2>
        <pre>curl -X POST http://localhost:3001/api/cron/reminders \\
  -H "Authorization: Bearer ${cronApiKey}" \\
  -H "Content-Type: application/json"</pre>
        
        <p class="info">📡 Server running on port 3001</p>
        <p class="warning">⚠️ This is a test server. Your actual Next.js app will run on port 3000.</p>
    </body>
    </html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log('🎉 Church Management Test Server Started!');
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`🔑 CRON_API_KEY loaded: ${cronApiKey.substring(0, 8)}...${cronApiKey.substring(cronApiKey.length - 8)}`);
  console.log('');
  console.log('🧪 Test the CRON API with:');
  console.log(`   node test-cron.js http://localhost:${PORT}`);
  console.log('');
  console.log('🌐 Open http://localhost:3001 in your browser for more info');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
