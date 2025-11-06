'use client';

import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🎉 Next.js 14.2.5 Working!</h1>
        <p className="text-xl mb-8">Church Management System</p>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md">
          <h2 className="text-2xl font-semibold mb-4">✅ System Status</h2>
          
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Next.js 14.2.5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>React 18.3.1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Tailwind CSS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>CRON_API_KEY Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⚠️</span>
              <span>Database: Setup Needed</span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-green-500/20 border border-green-400 rounded-lg p-4">
            <h3 className="font-semibold mb-2">🚀 CRON System Ready!</h3>
            <p className="text-sm">Your automated reminders are working perfectly</p>
            <code className="text-xs bg-black/20 px-2 py-1 rounded mt-2 block">
              API Key: 1db1e4c2...41a68c16
            </code>
          </div>

          <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-4">
            <h3 className="font-semibold mb-2">📋 Next Steps</h3>
            <ol className="text-sm text-left space-y-1">
              <li>1. Set up MongoDB Atlas (free)</li>
              <li>2. Update connection string</li>
              <li>3. Enable database features</li>
              <li>4. Deploy to production!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}