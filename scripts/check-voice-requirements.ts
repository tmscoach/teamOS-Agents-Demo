// Script to check voice agent requirements

console.log('=== Voice Agent Requirements Check ===\n');

// 1. Check OpenAI API Key
console.log('1. OpenAI API Key:');
const apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  console.log('   ✓ API Key is set');
  console.log(`   - Starts with: ${apiKey.substring(0, 7)}...`);
  console.log(`   - Length: ${apiKey.length} characters`);
} else {
  console.log('   ✗ API Key is NOT set');
  console.log('   - Add OPENAI_API_KEY to your .env.local file');
}

// 2. Check if API key has Realtime access
console.log('\n2. Realtime API Access:');
console.log('   - Make sure your OpenAI account has access to:');
console.log('     • gpt-4o-realtime-preview models');
console.log('     • Realtime API endpoints');
console.log('   - Check at: https://platform.openai.com/account/limits');

// 3. Browser requirements
console.log('\n3. Browser Requirements:');
console.log('   - Use Chrome, Edge, or Safari (latest versions)');
console.log('   - Allow microphone permissions when prompted');
console.log('   - Ensure you\'re on HTTPS (or localhost for dev)');

// 4. Common fixes
console.log('\n4. Common Fixes:');
console.log('   - Clear browser cache and cookies');
console.log('   - Check browser console for specific errors');
console.log('   - Try incognito/private mode');
console.log('   - Disable browser extensions that might block WebSockets');

console.log('\n=== End of Check ===');