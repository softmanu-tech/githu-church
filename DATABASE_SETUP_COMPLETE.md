# 🗄️ Database Setup Guide - MongoDB Atlas

## 🎯 Quick Setup (5 Minutes)

### Step 1: Create MongoDB Atlas Account
1. **Go to**: [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. **Sign up** with Google/GitHub or email
3. **Choose**: "Build a database" → "FREE" (M0 Sandbox)
4. **Select**: Any cloud provider (AWS recommended)
5. **Choose**: Closest region to you
6. **Name**: `church-management-cluster`

### Step 2: Create Database User
1. **Username**: `church-admin`
2. **Password**: Generate a secure password (save it!)
3. **Database User Privileges**: Read and write to any database

### Step 3: Network Access
1. **Add IP Address**: `0.0.0.0/0` (Allow access from anywhere)
   - **Note**: For production, use specific IP addresses
2. **Save changes**

### Step 4: Get Connection String
1. **Click**: "Connect" on your cluster
2. **Choose**: "Connect your application"
3. **Driver**: Node.js, Version 4.1 or later
4. **Copy** the connection string (looks like):
   ```
   mongodb+srv://church-admin:<password>@church-management-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Update Your .env.local
Replace `<password>` with your actual password and add database name:
```env
MONGODB_URI=mongodb+srv://church-admin:YOUR_PASSWORD@church-management-cluster.xxxxx.mongodb.net/church-management?retryWrites=true&w=majority
```

## 🚀 Alternative: Quick Test Database

If you want to test immediately, I can set up a temporary local database or you can use this test connection string format:

```env
# For local testing (requires MongoDB installed)
MONGODB_URI=mongodb://localhost:27017/church-management

# Or use a sample Atlas connection (replace with your actual one)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/church-management
```

## 🔧 What Happens After Setup

Once you provide the MongoDB connection string, I'll:
1. ✅ Update your .env.local file
2. ✅ Restore the original database connection
3. ✅ Enable bishop initialization
4. ✅ Test all API routes
5. ✅ Verify CRON system with database
6. ✅ Initialize sample data if needed

## 📋 Sample Data Creation

After database connection, I'll create:
- ✅ **Bishop account** (from your environment variables)
- ✅ **Sample group** for testing
- ✅ **Sample events** to test functionality
- ✅ **Test the CRON reminders**

## 🎉 Final Result

Your complete church management system with:
- ✅ **User authentication** (Bishop, Leaders, Members)
- ✅ **Group management** (Create, assign leaders)
- ✅ **Event creation** (Leaders can create events)
- ✅ **Attendance tracking** (Mark present/absent)
- ✅ **Automated reminders** (CRON_API_KEY system)
- ✅ **Analytics dashboard** (Attendance reports)
- ✅ **Notification system** (Event reminders)

---

**Ready to proceed?** 

**Option 1**: Provide your MongoDB Atlas connection string
**Option 2**: Let me set up a local MongoDB instance
**Option 3**: Use a temporary test database

Just paste your connection string and I'll complete the setup in 2 minutes! 🚀
