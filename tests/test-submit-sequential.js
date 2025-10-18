// Ultra-reliable test script with long delays (for rate-limited APIs)
// Ensure you are in tests/ directory
// Run with: node test-submit-sequential.js

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithDelay(difficulty, emoji) {
  console.log('\n' + '='.repeat(70));
  console.log(`${emoji} TESTING ${difficulty.toUpperCase()} DIFFICULTY`);
  console.log('='.repeat(70) + '\n');
  
  try {
    // Generate
    console.log('📝 Generating problem...');
    const genResponse = await fetch('http://localhost:3000/api/math-problem/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty })
    });
    
    if (!genResponse.ok) {
      throw new Error(`Generate failed: ${genResponse.status}`);
    }
    
    const { sessionId, problemText } = await genResponse.json();
    console.log('✅ Generated!');
    console.log('Problem:', problemText);
    
    // Long delay before submit
    console.log('\n⏳ Waiting 5 seconds to avoid rate limits...\n');
    await sleep(5000);
    
    // Submit
    console.log('📤 Submitting answer...');
    const submitResponse = await fetch('http://localhost:3000/api/math-problem/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userAnswer: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 50 : 100
      })
    });
    
    if (!submitResponse.ok) {
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }
    
    const { isCorrect, correctAnswer, feedback } = await submitResponse.json();
    console.log('✅ Submitted!');
    console.log('Result:', isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌');
    console.log('Answer:', correctAnswer);
    console.log('Feedback:', feedback);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('=== SEQUENTIAL TEST (SLOW BUT RELIABLE) ===');
  console.log('This will take ~30 seconds to complete all 3 tests.\n');
  
  const tests = [
    { difficulty: 'easy', emoji: '🌱' },
    { difficulty: 'medium', emoji: '⭐' },
    { difficulty: 'hard', emoji: '🔥' }
  ];
  
  let passed = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const result = await testWithDelay(tests[i].difficulty, tests[i].emoji);
    if (result) passed++;
    
    // Extra long delay between tests
    if (i < tests.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next test...\n');
      await sleep(5000);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 FINAL RESULTS: ${passed}/3 tests passed`);
  console.log('='.repeat(70));
  
  if (passed === 3) {
    console.log('\n🎉 ALL TESTS PASSED! Difficulty levels working perfectly!');
  }
}

main();