// Simple test for submit endpoint only
// Save as: test-submit-simple.js
// Usage: node test-submit-simple.js <sessionId> <answer>
// Example: node test-submit-simple.js "abc-123-def" 42

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node test-submit-simple.js <sessionId> <answer>');
  console.log('Example: node test-submit-simple.js "your-session-id" 42');
  console.log('\nTo get a sessionId, first run: node test-generate.js');
  process.exit(1);
}

const sessionId = args[0];
const userAnswer = parseFloat(args[1]);

if (isNaN(userAnswer)) {
  console.error('❌ Answer must be a number');
  process.exit(1);
}

async function testSubmit() {
  console.log('Testing /api/math-problem/submit endpoint...\n');
  console.log('Session ID:', sessionId);
  console.log('User Answer:', userAnswer);
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/math-problem/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        userAnswer: userAnswer
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('');

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('Is Correct:', data.isCorrect ? '✅ YES' : '❌ NO');
      console.log('Correct Answer:', data.correctAnswer);
      console.log('Feedback:', data.feedback);
      console.log('\n✅ Submission saved to database successfully!');
    } else {
      console.log('❌ ERROR:\n');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. SessionId is valid (from a generated problem)');
  }
}

testSubmit();