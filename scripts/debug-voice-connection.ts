import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testVoiceConnection() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('=== Voice Connection Debug ===\n');
  
  // 1. Check API Key
  console.log('1. API Key Check:');
  if (apiKey) {
    console.log(`   ✓ API Key found: ${apiKey.substring(0, 20)}...`);
    console.log(`   Length: ${apiKey.length}`);
  } else {
    console.log('   ✗ No API key found');
    return;
  }
  
  // 2. Test creating a session
  console.log('\n2. Testing Realtime Session Creation:');
  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['audio', 'text'],
        voice: 'alloy',
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✓ Session created successfully');
      console.log('   Session ID:', data.id);
      console.log('   Has ephemeral key:', !!data.client_secret);
    } else {
      const error = await response.text();
      console.log('   ✗ Failed to create session');
      console.log('   Status:', response.status);
      console.log('   Error:', error);
      
      if (response.status === 404) {
        console.log('\n   ⚠️  Your API key may not have access to Realtime API');
        console.log('   Visit: https://platform.openai.com/account/limits');
      }
    }
  } catch (error) {
    console.log('   ✗ Network error:', error);
  }
  
  console.log('\n=== Common Voice Issues ===');
  console.log('1. WebSocket blocked by firewall/proxy');
  console.log('2. Browser blocking microphone (check URL bar)');
  console.log('3. Audio context not resuming after user interaction');
  console.log('4. Model not available in your region/tier');
}

testVoiceConnection().catch(console.error);