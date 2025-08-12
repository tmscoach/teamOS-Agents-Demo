import { OpenAIRealtimeWebSocket } from 'openai/beta/realtime/websocket';

console.log('=== Testing OpenAI Realtime Import ===\n');

console.log('1. Import Check:');
console.log('   OpenAIRealtimeWebSocket type:', typeof OpenAIRealtimeWebSocket);
console.log('   Is constructor:', typeof OpenAIRealtimeWebSocket === 'function');
console.log('   Constructor name:', OpenAIRealtimeWebSocket.name);

console.log('\n2. Try to create instance:');
try {
  const rt = new OpenAIRealtimeWebSocket({
    model: 'gpt-4o-realtime-preview-2024-12-17',
    dangerouslyAllowBrowser: true,
  }, {
    apiKey: 'test-key',
    baseURL: 'wss://api.openai.com/v1'
  });
  
  console.log('   ✓ Instance created successfully');
  console.log('   Instance type:', rt.constructor.name);
  console.log('   Has socket:', !!rt.socket);
  
  // Don't actually connect, just test creation
  if (rt.socket) {
    rt.socket.close();
  }
} catch (error: any) {
  console.log('   ✗ Failed to create instance');
  console.log('   Error:', error.message);
  console.log('   Stack:', error.stack);
}

console.log('\n=== Test Complete ===');