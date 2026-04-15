/**
 * One-time script: reset the bishop account password to match .env.local
 * Run: node reset-bishop.mjs
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '.env.local');
for (const line of readFileSync(envFile, 'utf8').split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
}

const require = createRequire(import.meta.url);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const BISHOP_EMAIL = process.env.BISHOP_EMAIL;
const BISHOP_PASSWORD = process.env.BISHOP_PASSWORD;

if (!MONGODB_URI || !BISHOP_EMAIL || !BISHOP_PASSWORD) {
  console.error('Missing env vars. Check .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  role:     String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  // Check what bishops exist
  const allBishops = await User.find({ role: 'bishop' }).select('email name');
  console.log(`Bishops in DB: ${allBishops.length}`);
  allBishops.forEach(b => console.log(`  - ${b.email} (${b.name})`));

  const hashed = await bcrypt.hash(BISHOP_PASSWORD, 10);

  // Upsert: update if exists, create if not
  const result = await User.findOneAndUpdate(
    { email: BISHOP_EMAIL },
    { $set: { password: hashed, role: 'bishop', name: 'Bishop' } },
    { upsert: true, new: true }
  );

  console.log(`\n✅ Bishop account set:`);
  console.log(`   Email   : ${result.email}`);
  console.log(`   Role    : ${result.role}`);
  console.log(`   Password: ${BISHOP_PASSWORD} (hashed and stored)`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(e => { console.error(e); process.exit(1); });
