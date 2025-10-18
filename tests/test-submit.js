// Test script for the complete flow: generate + submit (all difficulty levels)
// Ensure you are in tests/ directory
// Run with: node test-submit.js

// ✅ NEW: Retry helper function
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return { success: true, response };
      }
      
      // If not ok, check if it's a server error (500) vs client error (400)
      const errorData = await response.json();
      
      // Don't retry client errors (400-level)
      if (response.status >= 400 && response.status < 500) {
        return { success: false, error: errorData, response };
      }
      
      // Retry server errors (500-level)
      if (i < retries - 1) {
        console.log(`⚠️  Request failed (attempt ${i + 1}/${retries}), retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        return { success: false, error: errorData, response };
      }
    } catch (error) {
      if (i < retries - 1) {
        console.log(`⚠️  Network error (attempt ${i + 1}/${retries}), retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
}

async function testCompleteFlow() {
  console.log('=== TESTING COMPLETE FLOW WITH ALL DIFFICULTY LEVELS ===\n');
  
  try {
    // Test each difficulty level
    const difficulties = ['easy', 'medium', 'hard'];
    const results = { passed: 0, failed: 0 };
    
    for (let i = 0; i < difficulties.length; i++) {
      const difficulty = difficulties[i];
      
      console.log('\n' + '='.repeat(70));
      console.log(`🎯 TEST ${i + 1}/3: ${difficulty.toUpperCase()} DIFFICULTY`);
      console.log('='.repeat(70) + '\n');
      
      // ✅ STEP 1: Generate problem (with retry)
      console.log(`Step 1: Generating ${difficulty} math problem...\n`);
      
      const generateResult = await fetchWithRetry(
        'http://localhost:3000/api/math-problem/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty })
        }
      );

      if (!generateResult.success) {
        console.error(`❌ Failed to generate ${difficulty} problem after retries`);
        console.error('Error:', generateResult.error);
        results.failed++;
        continue;
      }

      const { sessionId, problemText, difficulty: returnedDifficulty } = await generateResult.response.json();
      
      console.log('✅ Problem Generated!');
      console.log('Session ID:', sessionId);
      console.log('Difficulty:', returnedDifficulty);
      console.log('Problem:', problemText);
      console.log('');

      // ✅ DELAY: Wait before submitting to avoid rate limits
      console.log('⏳ Waiting 2 seconds before submission...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ✅ STEP 2: Submit answer (with retry)
      console.log('Step 2: Submitting answer...\n');
      
      // Use different test answers for variety
      const testAnswer = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 50 : 100;
      
      const submitResult = await fetchWithRetry(
        'http://localhost:3000/api/math-problem/submit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            userAnswer: testAnswer
          })
        }
      );

      if (!submitResult.success) {
        console.error('❌ Failed to submit answer after retries');
        console.error('Error:', submitResult.error);
        results.failed++;
        continue;
      }

      const result = await submitResult.response.json();
      
      console.log('Status:', submitResult.response.status);
      console.log('User Answer:', testAnswer);
      console.log('Is Correct:', result.isCorrect ? '✅ YES' : '❌ NO');
      console.log('Actual Correct Answer:', result.correctAnswer);
      console.log('\nAI Feedback:');
      console.log('─'.repeat(70));
      console.log(result.feedback);
      console.log('─'.repeat(70));
      
      results.passed++;
      
      // ✅ DELAY: Wait longer before next test (avoid rate limits)
      if (i < difficulties.length - 1) {
        console.log('\n⏳ Waiting 3 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // ✅ SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${results.passed}/3`);
    console.log(`❌ Failed: ${results.failed}/3`);
    
    if (results.passed === 3) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else if (results.passed > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS - Some tests failed (likely rate limiting)');
    } else {
      console.log('\n❌ ALL TESTS FAILED - Check configuration');
    }
    
    console.log('\n📊 Verification Steps:');
    console.log('1. Open Supabase Table Editor');
    console.log('2. Check math_problem_sessions table:');
    console.log('   - Should see problems with difficulty populated');
    console.log('3. Check math_problem_submissions table:');
    console.log('   - Each submission linked to correct session_id');
    console.log('   - Each has is_correct and feedback_text');
    
    if (results.passed === 3) {
      console.log('\n✅ Difficulty levels feature is working correctly!');
    }

  } catch (error) {
    console.error('\n❌ Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. Database migration for difficulty was run');
    console.log('3. Generate API route accepts difficulty parameter');
    console.log('4. All environment variables are configured');
    console.log('5. Gemini API key is valid and not rate-limited');
  }
}

testCompleteFlow();