// Test authentication status
console.log('🔍 Testing authentication...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Check cookies in browser
  const cookies = document.cookie;
  console.log('🍪 Browser cookies:', cookies);
  
  const authToken = cookies
    .split(';')
    .find(cookie => cookie.trim().startsWith('auth_token='))
    ?.split('=')[1];
    
  console.log('🔑 Auth token found:', authToken ? 'Yes' : 'No');
  
  if (authToken) {
    console.log('✅ User appears to be logged in');
  } else {
    console.log('❌ User is not logged in - need to login first');
  }
} else {
  console.log('🖥️ Running in server environment');
}
