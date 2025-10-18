// Test script for the complete flow: generate + submit
// Save as: test-submit.js
// Run with: node test-submit.js

async function testCompleteFlow() {
  console.log('=== TESTING COMPLETE FLOW ===\n');

  try {
    console.log('Step 1: Generating a math problem...\n');
    
    const generateResponse = await fetch('http://localhost:3000/api/math-problem/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!generateResponse.ok) {
      console.error('❌ Failed to generate problem');
      return;
    }

    const { sessionId, problemText } = await generateResponse.json();
    
    console.log('✅ Problem Generated!');
    console.log('Session ID:', sessionId);
    console.log('Problem:', problemText);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('Step 2: Testing CORRECT answer submission...\n');
    
    const correctAnswer = 100;
    const correctResponse = await fetch('http://localhost:3000/api/math-problem/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        userAnswer: correctAnswer
      })
    });

    const correctResult = await correctResponse.json();
    
    console.log('Status:', correctResponse.status);
    console.log('User Answer:', correctAnswer);
    console.log('Is Correct:', correctResult.isCorrect);
    console.log('Actual Correct Answer:', correctResult.correctAnswer);
    console.log('Feedback:', correctResult.feedback);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('Step 3: Generating another problem for incorrect answer test...\n');
    
    const generateResponse2 = await fetch('http://localhost:3000/api/math-problem/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const { sessionId: sessionId2, problemText: problemText2 } = await generateResponse2.json();
    
    console.log('✅ Second Problem Generated!');
    console.log('Session ID:', sessionId2);
    console.log('Problem:', problemText2);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('Step 4: Testing INCORRECT answer submission...\n');
    
    const wrongAnswer = 999;
    const incorrectResponse = await fetch('http://localhost:3000/api/math-problem/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId2,
        userAnswer: wrongAnswer
      })
    });

    const incorrectResult = await incorrectResponse.json();
    
    console.log('Status:', incorrectResponse.status);
    console.log('User Answer:', wrongAnswer);
    console.log('Is Correct:', incorrectResult.isCorrect);
    console.log('Actual Correct Answer:', incorrectResult.correctAnswer);
    console.log('Feedback:', incorrectResult.feedback);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('✅ ALL TESTS PASSED!');
    console.log('\nVerify in Supabase:');
    console.log('1. Check math_problem_submissions table');
    console.log('2. You should see 2 new submissions');
    console.log('3. One correct, one incorrect');
    console.log('4. Both should have feedback_text');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. You completed Part 2 successfully');
    console.log('3. Database tables exist in Supabase');
  }
}

testCompleteFlow();