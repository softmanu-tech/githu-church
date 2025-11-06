// Temporary disabled database connection for testing
import mongoose, { Mongoose } from 'mongoose';

// Mock connection that doesn't actually connect to MongoDB
async function dbConnect(): Promise<Mongoose> {
    console.log('🔄 Database connection disabled for testing');
    
    // Return a mock mongoose instance
    return {
        connection: {
            readyState: 1,
            on: () => {},
            once: () => {},
            removeListener: () => {}
        }
    } as any as Mongoose;
}

export default dbConnect;
