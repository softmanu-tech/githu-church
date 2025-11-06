
// src/lib/models/index.ts
// Import models in dependency order to avoid circular reference issues

// Base models first
export * from './Group';
export * from './Notification';

// Protocol models (must be loaded before User to avoid ref errors)
export * from './ProtocolTeam';
export * from './Visitor';
export * from './ProtocolStrategy';

// User model (references ProtocolTeam)
export * from './User';

// Event-related models
export * from './Event';
export * from './Attendance';
export * from './FollowUp';
export * from './Member';

// Prayer request model
export * from './PrayerRequest';

// Thanksgiving model
export * from './Thanksgiving';