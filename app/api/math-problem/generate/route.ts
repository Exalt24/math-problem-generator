import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';
import { supabase, type ProblemType } from '@/lib/supabaseClient';

interface GeneratedProblem {
  problem_text: string;
  correct_answer: number;
  solution_steps: string;
  problem_type: ProblemType;
  hints: string[];
}

function cleanAIResponse(text: string): string {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

const DIFFICULTY_INSTRUCTIONS = {
  easy: `
DIFFICULTY: EASY (Foundational Level)
- Use WHOLE NUMBERS ONLY (no fractions or decimals)
- Maximum 2 computational steps
- Operations: Addition, subtraction, or simple multiplication/division
- Numbers should be within 100
- Very straightforward wording
- Example: "A hawker stall sold 45 chicken rice plates in the morning and 38 in the afternoon. How many plates were sold in total?"
`,
  medium: `
DIFFICULTY: MEDIUM (Grade-Level Appropriate)
- Can use simple fractions (denominators ≤ 12) or decimals (up to 2 places)
- 2-3 computational steps
- Operations: All four operations, simple percentages (10%, 25%, 50%), basic fractions
- Numbers within 1000
- May require one conversion or intermediate step
- Example: "A bookshop gave a 25% discount on a $48 storybook. How much did Sarah pay after the discount?"
`,
  hard: `
DIFFICULTY: HARD (Challenge Level)
- Can use mixed numbers, improper fractions, or decimals up to 3 places
- 3-4 computational steps
- Operations: Ratios, rates, percentages, volume, area, multi-step reasoning
- Numbers within 10,000
- Requires careful planning and multiple steps
- Example: "A rectangular tank is 80 cm long, 50 cm wide, and 60 cm tall. It is 3/4 filled with water. How many litres of water are in the tank? (1 litre = 1000 cm³)"
`
};

async function generateMathProblem(difficulty: 'easy' | 'medium' | 'hard'): Promise<GeneratedProblem> {
  const prompt = `You are creating a math word problem for a Primary 5 student in Singapore (10-11 years old).

${DIFFICULTY_INSTRUCTIONS[difficulty]}

SYLLABUS TOPICS FOR PRIMARY 5:
- Fractions: Mixed numbers, multiplication, division
- Decimals: Up to 3 decimal places, four operations
- Percentage: Finding percentage of a whole, discount, GST (9%), simple interest
- Ratio: Simple ratios (a:b), dividing quantities in ratio
- Rate: Speed, unit rate problems
- Whole numbers: Up to 10 million, four operations
- Area: Triangle, composite figures (rectangles, squares, triangles)
- Volume: Cube and cuboid (cm³, relationship with litres)
- Angles: Properties of triangles, angle sum
- Money: Singapore dollars and cents
- Time: Hours, minutes, duration problems
- Length & Mass: Metres, centimetres, kilograms, grams

SINGAPORE CONTEXT - Use realistic scenarios like:
- Shopping at NTUC FairPrice, Giant, or neighbourhood shops
- Hawker centers and coffeeshops (chicken rice, laksa, drinks)
- MRT/bus travel and fares
- HDB estates and playground dimensions
- School activities (class fundraising, field trips, sports day)
- Singapore money (dollars and cents, using $)
- Singapore measurements (metres, litres, kilograms)

REQUIREMENTS:
1. Choose ONE topic from the syllabus above
2. Create a realistic Singapore scenario
3. Follow the ${difficulty.toUpperCase()} difficulty guidelines above
4. Answer must be a single number (whole number or decimal up to 2 places)
5. Include appropriate units (e.g., $, m, cm², litres, kg)
6. Avoid ambiguous wording - be clear and direct
7. Use Singapore spelling (e.g., "metre" not "meter", "colour" not "color")
8. **CLASSIFY** the problem into ONE of these categories:
   - "Whole Numbers" (basic arithmetic with whole numbers only)
   - "Fractions" (involves fractions, mixed numbers)
   - "Decimals" (decimal operations without money context)
   - "Percentages" (finding percentages, discounts, interest)
   - "Ratios" (ratio problems)
   - "Rates" (speed, unit rates)
   - "Money" (Singapore dollars and cents calculations)
   - "Time" (time duration, clock problems)
   - "Length & Mass" (measurement problems)
   - "Area & Perimeter" (area, perimeter of shapes)
   - "Volume" (volume of 3D objects)
   - "Geometry" (angles, shapes, properties)
   - "Mixed Operations" (uses multiple unrelated concepts)

⭐ HINT GENERATION REQUIREMENTS:
Generate THREE PROGRESSIVE HINTS that help students WITHOUT giving away the answer:

**Hint 1 - Conceptual Understanding:**
- Help identify what the problem is asking for
- Clarify what information is given vs. what needs to be found
- Guide understanding of key concepts or vocabulary
- Ask guiding questions like "What do we need to find?" or "What information do we have?"

**Hint 2 - Strategic Approach:**
- Suggest a problem-solving strategy or method
- Break down the problem into smaller steps
- Recommend which operation(s) might be useful
- Guide thinking WITHOUT showing calculations

**Hint 3 - Method Nudge:**
- Give a gentle push toward the solution method
- May mention specific formulas or relationships
- Can suggest the order of operations
- Still does NOT show actual calculations or reveal the answer

CRITICAL RULES FOR HINTS:
- ❌ NEVER reveal the answer or intermediate calculations
- ❌ NEVER say things like "multiply 5 by 3" or "the answer is..."
- ✅ DO guide thinking and strategy
- ✅ DO use encouraging, age-appropriate language
- ✅ DO scaffold learning progressively (each hint should build on the last)

GOOD EXAMPLE FOR ${difficulty.toUpperCase()} LEVEL:
${difficulty === 'easy' ? `{
  "problem_text": "Raj bought 5 apples at $2 each. How much did he spend in total?",
  "correct_answer": 10,
  "problem_type": "Money",
  "solution_steps": "Step 1: Identify what we need to find\\nWe need to find the total cost of 5 apples at $2 each.\\n\\nStep 2: Calculate the total cost\\nMultiply: 5 × $2 = $10\\n\\nFinal Answer: $10",
  "hints": [
    "Let's start by understanding what we know: Raj bought a certain number of apples, and each apple has the same price. What do we need to find out?",
    "When you have multiple items that cost the same amount each, think about which operation helps you find the total cost. Should you add, subtract, multiply, or divide?",
    "The key is to use the number of apples and the cost per apple together. Remember, when you want to find the total cost of equal items, one operation makes this really simple!"
  ]
}` : difficulty === 'medium' ? `{
  "problem_text": "Mei Ling bought 3 packets of chicken rice at $3.50 each and 2 cups of barley drink at $1.80 each from a hawker center. She paid with a $20 note. How much change did she receive?",
  "correct_answer": 5.90,
  "problem_type": "Money",
  "solution_steps": "Step 1: Calculate cost of chicken rice\\n3 × $3.50 = $10.50\\n\\nStep 2: Calculate cost of drinks\\n2 × $1.80 = $3.60\\n\\nStep 3: Calculate total cost\\n$10.50 + $3.60 = $14.10\\n\\nStep 4: Calculate change\\n$20.00 - $14.10 = $5.90\\n\\nFinal Answer: $5.90",
  "hints": [
    "This is a multi-step problem! First, identify all the things Mei Ling bought and their prices. What do we need to find at the end - is it just the total cost, or something else?",
    "Break this into smaller parts: (1) Find the cost of all the chicken rice, (2) Find the cost of all the drinks, (3) Add those costs together, (4) Think about what happens when you pay with a $20 note.",
    "Remember that 'change' means the money you get back. So you'll need to compare how much Mei Ling paid with how much everything cost. What operation helps you find the difference?"
  ]
}` : `{
  "problem_text": "A rectangular swimming pool at a community club is 25 m long and 15 m wide. The pool is filled with water to a depth of 1.2 m. What is the volume of water in the pool in cubic metres?",
  "correct_answer": 450,
  "problem_type": "Volume",
  "solution_steps": "Step 1: Identify the formula for volume of a cuboid\\nVolume = length × width × height\\n\\nStep 2: Substitute the values\\nVolume = 25 m × 15 m × 1.2 m\\n\\nStep 3: Calculate step by step\\n25 × 15 = 375\\n375 × 1.2 = 450\\n\\nFinal Answer: 450 m³",
  "hints": [
    "We need to find the volume of water, which means finding how much 3D space the water takes up. Look at what measurements you're given - length, width, and depth. What shape is this?",
    "A swimming pool filled with water forms a 3D rectangular shape (a cuboid). Do you remember the formula for finding the volume of a cuboid? Think about what you need to multiply together.",
    "The formula involves all three dimensions of the pool. Once you identify which measurements to use, think about the order - does it matter which numbers you multiply first?"
  ]
}`}

SOLUTION REQUIREMENTS:
- Break down into clear, numbered steps (Step 1, Step 2, etc.)
- Show ALL calculations explicitly
- Explain the reasoning for each step in simple language
- Use \\n\\n to separate steps (double newline for spacing)
- End with "Final Answer: [number] [units]"
- Keep explanations appropriate for 10-11 year olds

Return ONLY a JSON object with this EXACT structure (no markdown, no code blocks, no extra text):
{
  "problem_text": "Your problem here",
  "correct_answer": 123.45,
  "problem_type": "CategoryName",
  "solution_steps": "Step 1: [explanation]\\n[calculation]\\n\\nStep 2: [explanation]\\n[calculation]\\n\\nFinal Answer: [answer with units]",
  "hints": [
    "Hint 1: Conceptual guidance helping identify what the problem asks",
    "Hint 2: Strategic approach suggesting methods without calculations",
    "Hint 3: Method nudge pointing toward solution approach"
  ]
}

Generate a NEW, DIFFERENT problem with FULL SOLUTION, CATEGORY, and THREE PROGRESSIVE HINTS at ${difficulty.toUpperCase()} difficulty now:`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const cleanedText = cleanAIResponse(responseText);
  
  const problemData = JSON.parse(cleanedText);
  
  if (!problemData.problem_text || 
      typeof problemData.correct_answer !== 'number' ||
      !problemData.solution_steps ||
      !problemData.problem_type ||
      !Array.isArray(problemData.hints) ||
      problemData.hints.length !== 3) {
    throw new Error('Invalid AI response structure - missing required fields or invalid hints');
  }
  
  return {
    problem_text: problemData.problem_text,
    correct_answer: problemData.correct_answer,
    solution_steps: problemData.solution_steps,
    problem_type: problemData.problem_type,
    hints: problemData.hints
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const difficulty = body.difficulty || 'medium';
    
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level. Must be "easy", "medium", or "hard".' },
        { status: 400 }
      );
    }
    
    const problemData = await generateMathProblem(difficulty as 'easy' | 'medium' | 'hard');
    
    const { data, error } = await supabase
      .from('math_problem_sessions')
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.correct_answer,
        difficulty: difficulty,
        solution_steps: problemData.solution_steps,
        problem_type: problemData.problem_type,
        hints: problemData.hints
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save problem to database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      sessionId: data.id,
      problemText: data.problem_text,
      difficulty: data.difficulty,
      solutionSteps: data.solution_steps,
      problemType: data.problem_type,
      hints: data.hints
    });
  } catch (error) {
    console.error('Error generating problem:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate problem. Please try again.' },
      { status: 500 }
    );
  }
}