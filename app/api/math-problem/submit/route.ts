import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';
import { supabase } from '@/lib/supabaseClient';

interface SubmitRequest {
  sessionId: string;
  userAnswer: number;
}

function isAnswerCorrect(userAnswer: number, correctAnswer: number): boolean {
  const tolerance = 0.01;
  return Math.abs(userAnswer - correctAnswer) < tolerance;
}

async function generateFeedback(
  problemText: string,
  correctAnswer: number,
  userAnswer: number,
  isCorrect: boolean
): Promise<string> {
  const prompt = isCorrect
    ? `A Primary 5 student (10-11 years old) in Singapore just solved this math problem CORRECTLY:

Problem: ${problemText}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Generate encouraging feedback that:
- Celebrates their success with enthusiasm
- Reinforces what they did well (mention the specific skill, e.g., "Great work with fractions!", "Excellent percentage calculation!", "Perfect multiplication!")
- Encourages them to keep practicing
- Is warm, supportive, and age-appropriate
- Uses **bold text** (markdown format) for emphasis on key praise
- Keep it 2-3 sentences

Example: "**Excellent work!** You correctly calculated the total cost and change. Keep up this great attention to detail in your addition and subtraction!"

Generate feedback now (use **bold** for emphasis):`.trim()
    : `A Primary 5 student (10-11 years old) in Singapore attempted this math problem but got it INCORRECT:

Problem: ${problemText}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Generate helpful, educational feedback that:
- Stays positive and encouraging (avoid negative language like "wrong" or "mistake")
- Gently explains the concept they need to review
- Provides a hint about the correct approach WITHOUT giving the full solution
- Encourages them to try again
- Is warm, supportive, and age-appropriate
- Uses **bold text** (markdown format) for emphasis on key learning points
- Keep it 2-3 sentences

Example: "Good effort! This problem involves **finding a percentage** of a whole. Remember to multiply the total by the percentage (as a decimal or fraction), then subtract any discounts. Try working through the steps again!"

Generate feedback now (use **bold** for emphasis):`.trim();

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();

    if (!body.sessionId || body.userAnswer === undefined) {
      return NextResponse.json(
        { error: 'Missing sessionId or userAnswer' },
        { status: 400 }
      );
    }

    if (typeof body.userAnswer !== 'number' || isNaN(body.userAnswer)) {
      return NextResponse.json(
        { error: 'userAnswer must be a valid number' },
        { status: 400 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .select('problem_text, correct_answer')
      .eq('id', body.sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session fetch error:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const isCorrect = isAnswerCorrect(body.userAnswer, session.correct_answer);
    const feedback = await generateFeedback(
      session.problem_text,
      session.correct_answer,
      body.userAnswer,
      isCorrect
    );

    const { error: insertError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id: body.sessionId,
        user_answer: body.userAnswer,
        is_correct: isCorrect,
        feedback_text: feedback
      });

    if (insertError) {
      console.error('Submission insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isCorrect,
      feedback,
      correctAnswer: session.correct_answer
    });
  } catch (error) {
    console.error('Error processing submission:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process submission. Please try again.' },
      { status: 500 }
    );
  }
}