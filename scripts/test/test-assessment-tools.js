// Test script to verify assessment agent tools are working
const fetch = require('node-fetch');

async function testAssessmentTools() {
  const baseUrl = 'http://localhost:3001';
  
  // Test user credentials
  const testUser = {
    email: 'manager1@bythelight.band',
    password: 'test-password'
  };
  
  console.log('Testing Assessment Agent Tools...\n');
  
  try {
    // First, we need to get a valid session/token
    // This would normally come from your auth system
    
    // Test the chat-streaming endpoint with a command
    const response = await fetch(`${baseUrl}/api/agents/chat-streaming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'enter 2-0 for question 1',
        conversationId: 'test-conv-' + Date.now(),
        agentName: 'AssessmentAgent',
        metadata: {
          selectedAssessment: {
            type: 'TMP',
            subscriptionId: '12345',
            status: 'in_progress'
          },
          workflowState: {
            questions: [
              { id: 1, text: 'Sample question 1' },
              { id: 2, text: 'Sample question 2' }
            ],
            currentPageId: 1,
            completionPercentage: 25
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      fullResponse += chunk;
      process.stdout.write(chunk);
    }
    
    console.log('\n\nFull response received');
    
    // Check if the response contains the expected action tag
    if (fullResponse.includes('[ASSESSMENT_ACTION:answer_question:1:2-0]')) {
      console.log('✅ Assessment action tag found - tools are working!');
    } else {
      console.log('❌ Assessment action tag NOT found - tools may not be working');
    }
    
  } catch (error) {
    console.error('Error testing assessment tools:', error);
  }
}

// Run the test
testAssessmentTools();