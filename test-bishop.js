#!/usr/bin/env node

/**
 * Test script to check if the bishop account exists and verify credentials
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read environment variables
let mongoUri, bishopEmail, bishopPassword;
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
  const emailMatch = envContent.match(/BISHOP_EMAIL=(.+)/);
  const passwordMatch = envContent.match(/BISHOP_PASSWORD=(.+)/);
  
  mongoUri = mongoMatch ? mongoMatch[1].trim() : null;
  bishopEmail = emailMatch ? emailMatch[1].trim() : null;
  bishopPassword = passwordMatch ? passwordMatch[1].trim() : null;
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
  process.exit(1);
}

if (!mongoUri || !bishopEmail || !bishopPassword) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function testBishopAccount() {
  try {
    console.log('🔍 Testing Bishop Account...');
    console.log(`📧 Email: ${bishopEmail}`);
    console.log(`🔑 Password: ${bishopPassword}`);
    console.log('');

    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if bishop exists
    console.log('👤 Checking for bishop account...');
    const bishop = await User.findOne({ email: bishopEmail }).select('+password');
    
    if (!bishop) {
      console.log('❌ Bishop account not found!');
      console.log('💡 Creating bishop account...');
      
      const hash = await bcrypt.hash(bishopPassword, 10);
      const newBishop = await User.create({
        name: "Bishop",
        email: bishopEmail,
        password: hash,
        role: "bishop"
      });
      
      console.log('✅ Bishop account created!');
      console.log(`📋 ID: ${newBishop._id}`);
    } else {
      console.log('✅ Bishop account found!');
      console.log(`📋 ID: ${bishop._id}`);
      console.log(`👤 Name: ${bishop.name}`);
      console.log(`📧 Email: ${bishop.email}`);
      console.log(`🎭 Role: ${bishop.role}`);
      
      // Test password
      console.log('🔐 Testing password...');
      const passwordMatch = await bcrypt.compare(bishopPassword, bishop.password);
      
      if (passwordMatch) {
        console.log('✅ Password matches!');
      } else {
        console.log('❌ Password does not match!');
        console.log('💡 Updating password...');
        
        const newHash = await bcrypt.hash(bishopPassword, 10);
        await User.findByIdAndUpdate(bishop._id, { password: newHash });
        console.log('✅ Password updated!');
      }
    }

    console.log('');
    console.log('🎉 Bishop account is ready for login!');
    console.log(`📧 Email: ${bishopEmail}`);
    console.log(`🔑 Password: ${bishopPassword}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testBishopAccount();
