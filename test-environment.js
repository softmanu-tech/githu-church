#!/usr/bin/env node

/**
 * Quick JWT and Environment Test
 */

console.log('🔍 Checking Environment Variables...');

// Check if JWT_SECRET is set
if (process.env.JWT_SECRET) {
  console.log('✅ JWT_SECRET is set');
} else {
  console.log('❌ JWT_SECRET is not set');
}

// Check if MONGODB_URI is set
if (process.env.MONGODB_URI) {
  console.log('✅ MONGODB_URI is set');
} else {
  console.log('❌ MONGODB_URI is not set');
}

// Check if NEXTAUTH_SECRET is set
if (process.env.NEXTAUTH_SECRET) {
  console.log('✅ NEXTAUTH_SECRET is set');
} else {
  console.log('❌ NEXTAUTH_SECRET is not set');
}

console.log('\n🔧 Environment Variables Status:');
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not Set'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not Set'}`);
console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set'}`);

// Test JWT functionality
try {
  const { jwtVerify } = require('jose');
  console.log('\n✅ JWT library is available');
} catch (error) {
  console.log('\n❌ JWT library error:', error.message);
}

// Test MongoDB connection
try {
  const mongoose = require('mongoose');
  console.log('✅ Mongoose is available');
} catch (error) {
  console.log('❌ Mongoose error:', error.message);
}
