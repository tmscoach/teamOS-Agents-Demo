// Development script to create test users bypassing CAPTCHA
// Usage: node scripts/create-test-user.js

async function createTestUser(email, password) {
  try {
    const response = await fetch('http://localhost:3002/api/dev/create-test-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User created successfully:', data);
    } else {
      console.error('❌ Error:', data.error);
      if (data.details) {
        console.error('Details:', JSON.stringify(data.details, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Get email and password from command line args or use defaults
const email = process.argv[2] || 'manager@bythelight.band';
const password = process.argv[3] || '1.Teamwork!';

console.log(`Creating user with email: ${email}`);

// Create user
createTestUser(email, password)
  .then(() => {
    console.log('\nYou can now sign in at http://localhost:3002/sign-in');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });