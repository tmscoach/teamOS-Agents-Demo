import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugVoiceWebSocket() {
  console.log('=== Voice WebSocket Debug ===\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  // 1. Check API Key
  console.log('1. API Key Check:');
  if (!apiKey) {
    console.log('   ✗ No API key found');
    return;
  }
  console.log(`   ✓ API Key found: ${apiKey.substring(0, 20)}...`);
  
  // 2. Test creating a session and get ephemeral token
  console.log('\n2. Testing Session Creation:');
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
    
    if (!response.ok) {
      const error = await response.text();
      console.log('   ✗ Failed to create session');
      console.log('   Status:', response.status);
      console.log('   Error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('   ✓ Session created successfully');
    console.log('   Session ID:', data.id);
    
    const ephemeralKey = data.client_secret?.value || data.client_secret;
    if (!ephemeralKey) {
      console.log('   ✗ No ephemeral key in response');
      return;
    }
    console.log('   ✓ Ephemeral key received:', ephemeralKey.substring(0, 20) + '...');
    
    // 3. Test WebSocket connection
    console.log('\n3. Testing WebSocket Connection:');
    
    // Try to create a WebSocket connection
    const WebSocketModule = await import('ws');
    const WebSocket = WebSocketModule.default;
    
    const wsUrl = 'wss://api.openai.com/v1/realtime';
    console.log('   Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${ephemeralKey}`,
        'OpenAI-Beta': 'realtime=v1',
      }
    });
    
    // Set up event handlers
    const connectionPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('   ✗ Connection timeout after 10s');
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000);
      
      ws.on('open', () => {
        console.log('   ✓ WebSocket connected successfully!');
        clearTimeout(timeout);
        
        // Send session update
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['audio', 'text'],
            voice: 'alloy',
            instructions: 'You are a helpful assistant.',
          }
        }));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('   Message received:', message.type);
        
        if (message.type === 'session.updated') {
          console.log('   ✓ Session configured successfully');
          resolve();
        }
      });
      
      ws.on('error', (error) => {
        console.log('   ✗ WebSocket error:', error.message);
        clearTimeout(timeout);
        reject(error);
      });
      
      ws.on('close', (code, reason) => {
        console.log('   WebSocket closed:', code, reason.toString());
        clearTimeout(timeout);
      });
    });
    
    await connectionPromise;
    
    // Clean up
    ws.close();
    
    console.log('\n4. Browser-Specific Issues:');
    console.log('   Common problems:');
    console.log('   - Browser blocking WebSocket: Check browser console for CSP errors');
    console.log('   - Microphone permissions: Must be HTTPS or localhost');
    console.log('   - Audio context suspended: Requires user interaction');
    console.log('   - Ad blockers: May block WebSocket connections');
    console.log('   - Corporate proxies: May block WebSocket upgrade');
    
    console.log('\n5. Debugging Steps:');
    console.log('   1. Open browser DevTools Network tab');
    console.log('   2. Look for WebSocket connection to wss://api.openai.com');
    console.log('   3. Check if connection upgrades successfully');
    console.log('   4. Look for any blocked requests or CORS errors');
    console.log('   5. Check browser console for specific errors');
    
  } catch (error) {
    console.log('   ✗ Error:', error);
  }
}

debugVoiceWebSocket().catch(console.error);