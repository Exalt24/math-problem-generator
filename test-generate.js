// Simple test script for the generate API endpoint
// Save as: test-generate.js
// Run with: node test-generate.js

async function testGenerateAPI() {
  console.log('Testing /api/math-problem/generate endpoint...\n');

  try {
    const response = await fetch('http://localhost:3000/api/math-problem/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('');

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('Session ID:', data.sessionId);
      console.log('Problem Text:', data.problemText);
      console.log('\n✅ Problem generated and saved to database successfully!');
    } else {
      console.log('❌ ERROR:\n');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. You have Node 18+ with fetch support');
  }
}

testGenerateAPI();