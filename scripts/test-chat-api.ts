async function testChatAPI() {
  try {
    // Create a test conversation
    const response = await fetch('http://localhost:3000/api/agents/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a fake auth header for testing (this won't work in production)
        'x-test-mode': 'true'
      },
      body: JSON.stringify({
        message: 'Test message from script',
        teamId: 'demo-team-1'
      })
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('\nConversation ID:', data.conversationId);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testChatAPI();