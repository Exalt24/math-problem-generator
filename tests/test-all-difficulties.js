// Quick test to generate one problem of each difficulty
// Ensure you are in tests/ directory
// Run with: node test-all-difficulties.js

async function testAllDifficulties() {
  console.log('=== QUICK TEST: ALL DIFFICULTY LEVELS ===\n');
  
  const difficulties = ['easy', 'medium', 'hard'];
  const emojis = { easy: '🌱', medium: '⭐', hard: '🔥' };
  
  for (const difficulty of difficulties) {
    console.log(`\n${emojis[difficulty]} Testing ${difficulty.toUpperCase()}...`);
    console.log('─'.repeat(70));
    
    try {
      const response = await fetch('http://localhost:3000/api/math-problem/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Generated successfully');
        console.log('Problem:', data.problemText);
        console.log('Session ID:', data.sessionId.slice(0, 8) + '...');
      } else {
        console.log('❌ Failed');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    // Brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Test complete! Check Supabase for 3 new problems.');
}

testAllDifficulties();