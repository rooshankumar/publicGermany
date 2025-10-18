// Quick test script to trigger deadline reminders
// Run with: node test-email-now.js

const VERCEL_URL = 'https://publicgermany.vercel.app'; // Update if different

async function testDeadlineReminders() {
  console.log('🧪 Testing deadline reminders...');
  console.log('📍 URL:', `${VERCEL_URL}/api/test-deadline-reminders`);
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/test-deadline-reminders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Check your email inbox.');
      console.log('📧 Email should arrive in 1-2 minutes.');
      console.log('💡 Also check spam/junk folder.');
    } else {
      console.log('\n❌ FAILED!');
      console.log('Error:', data.error || data.message);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testDeadlineReminders();
