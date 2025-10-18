import { NextResponse } from 'next/server';
import { model } from '@/lib/gemini';
import { supabase } from '@/lib/supabaseClient';

interface GeneratedProblem {
  problem_text: string;
  correct_answer: number;
}

function cleanAIResponse(text: string): string {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

async function generateMathProblem(): Promise<GeneratedProblem> {
  const prompt = `You are creating a math word problem for a Primary 5 student in Singapore (10-11 years old).

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
3. Problem should require 2-4 steps to solve (not too simple, not too complex)
4. Answer must be a single number (whole number or decimal up to 2 places)
5. Include appropriate units (e.g., $, m, cm², litres, kg)
6. Avoid ambiguous wording - be clear and direct
7. Use Singapore spelling (e.g., "metre" not "meter", "colour" not "color")

GOOD EXAMPLE:
{
  "problem_text": "Mei Ling bought 3 packets of chicken rice at $3.50 each and 2 cups of barley drink at $1.80 each from a hawker center. She paid with a $20 note. How much change did she receive?",
  "correct_answer": 6.90
}

ANOTHER GOOD EXAMPLE:
{
  "problem_text": "A rectangular swimming pool at a community club is 25 m long and 15 m wide. The pool is filled with water to a depth of 1.2 m. What is the volume of water in the pool in cubic metres?",
  "correct_answer": 450
}

ONE MORE EXAMPLE:
{
  "problem_text": "During a school sale, Wei Jie sold 3/5 of his 240 stickers in the morning. In the afternoon, he sold 2/3 of the remaining stickers. How many stickers did he have left at the end of the day?",
  "correct_answer": 32
}

Return ONLY a JSON object with this EXACT structure (no markdown, no code blocks, no extra text):
{
  "problem_text": "Your problem here",
  "correct_answer": 123.45
}

Generate a NEW, DIFFERENT problem now:`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const cleanedText = cleanAIResponse(responseText);
  
  const problemData = JSON.parse(cleanedText);
  
  if (!problemData.problem_text || typeof problemData.correct_answer !== 'number') {
    throw new Error('Invalid AI response structure');
  }
  
  return {
    problem_text: problemData.problem_text,
    correct_answer: problemData.correct_answer
  };
}

export async function POST() {
  try {
    const problemData = await generateMathProblem();
    
    const { data, error } = await supabase
      .from('math_problem_sessions')
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.correct_answer
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
      problemText: data.problem_text
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