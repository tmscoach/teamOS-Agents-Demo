// Debug script to see what's happening with assessment tools
const http = require('http');

const postData = JSON.stringify({
  message: 'enter 2-0 for question 1',
  conversationId: 'debug-conv-' + Date.now(),
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
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/agents/chat-streaming',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Sending request to assessment agent...\n');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  let fullResponse = '';
  
  res.on('data', (chunk) => {
    console.log('CHUNK:', chunk);
    fullResponse += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== FULL RESPONSE ===');
    console.log(fullResponse);
    
    // Check for action tags
    if (fullResponse.includes('[ASSESSMENT_ACTION:')) {
      console.log('\n✅ Assessment action detected!');
      const actionMatch = fullResponse.match(/\[ASSESSMENT_ACTION:([^\]]+)\]/);
      if (actionMatch) {
        console.log('Action:', actionMatch[1]);
      }
    } else {
      console.log('\n❌ No assessment action detected');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();