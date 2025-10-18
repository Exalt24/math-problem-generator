// Enhanced test script for the generate API endpoint with difficulty levels
// Ensure you are in tests/ directory
// Run with: node test-generate.js [difficulty]
// Examples: 
//   node test-generate.js
//   node test-generate.js easy
//   node test-generate.js medium
//   node test-generate.js hard

const args = process.argv.slice(2);
const difficulty = args[0] || 'medium'; // Default to medium if not specified

// Validate difficulty
if (!['easy', 'medium', 'hard'].includes(difficulty)) {
  console.error('❌ Invalid difficulty. Must be: easy, medium, or hard');
  process.exit(1);
}

async function testGenerateAPI() {
  console.log('=== TESTING GENERATE API WITH DIFFICULTY LEVELS ===\n');
  console.log(`Testing difficulty: ${difficulty.toUpperCase()}`);
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3000/api/math-problem/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ difficulty })  // ✅ NEW: Send difficulty
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('');

    const data = await response.json();
   
    if (response.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('Session ID:', data.sessionId);
      console.log('Difficulty:', data.difficulty);  // ✅ NEW: Show difficulty
      console.log('Problem Text:', data.problemText);
      console.log('\n' + '='.repeat(60));
      console.log('✅ Problem generated and saved to database successfully!');
      console.log('\n💡 TIP: Copy the Session ID above to test submission:');
      console.log(`   node test-submit-simple.js "${data.sessionId}" <your-answer>`);
    } else {
      console.log('❌ ERROR:\n');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. You have Node 18+ with fetch support');
    console.log('3. Database migration for difficulty column was run');
  }
}

testGenerateAPI();