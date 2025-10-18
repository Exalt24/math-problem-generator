import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';
import { supabase } from '@/lib/supabaseClient';

interface SubmitRequest {
  sessionId: string;
  userAnswer: number;
  hintsUsed: number; // ⭐ NEW: Number of hints the student used (0-3)
}

function isAnswerCorrect(userAnswer: number, correctAnswer: number): boolean {
  const tolerance = 0.01;
  return Math.abs(userAnswer - correctAnswer) < tolerance;
}

async function generateFeedback(
  problemText: string,
  correctAnswer: number,
  userAnswer: number,
  isCorrect: boolean,
  hintsUsed: number // ⭐ NEW: Include hints context in feedback
): Promise<string> {
  // ⭐ NEW: Add context about hint usage
  const hintContext = hintsUsed > 0
    ? `The student used ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} to help solve this problem.`
    : 'The student solved this problem independently without using any hints.';

  const prompt = isCorrect
    ? `A Primary 5 student (10-11 years old) in Singapore just solved this math problem CORRECTLY:

Problem: ${problemText}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Context: ${hintContext}

Generate encouraging feedback that:
- Celebrates their success with enthusiasm
- ${hintsUsed === 0 ? '**Extra praise** for solving independently without hints!' : 'Acknowledges that using hints is a smart learning strategy'}
- Reinforces what they did well (mention the specific skill, e.g., "Great work with fractions!", "Excellent percentage calculation!", "Perfect multiplication!")
- Encourages them to keep practicing
- Is warm, supportive, and age-appropriate
- Uses **bold text** (markdown format) for emphasis on key praise
- Keep it 2-3 sentences

Example (no hints used): "**Outstanding work!** You solved this independently and showed great understanding of fractions. Your problem-solving skills are really developing!"

Example (hints used): "**Great job!** Using hints to guide your thinking was a smart choice, and you successfully worked through the problem. Keep building on these strategies!"

Generate feedback now (use **bold** for emphasis):`.trim()
    : `A Primary 5 student (10-11 years old) in Singapore attempted this math problem but got it INCORRECT:

Problem: ${problemText}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Context: ${hintContext}

Generate helpful, educational feedback that:
- Stays positive and encouraging (avoid negative language like "wrong" or "mistake")
- ${hintsUsed === 3 ? 'Acknowledges they tried all available hints - offer extra encouragement' : hintsUsed > 0 ? 'Suggests trying the remaining hints if they want more guidance' : 'Gently suggests using the hints if they need help'}
- Gently explains the concept they need to review
- Provides a hint about the correct approach WITHOUT giving the full solution
- Encourages them to try again
- Is warm, supportive, and age-appropriate
- Uses **bold text** (markdown format) for emphasis on key learning points
- Keep it 2-3 sentences

Example (no hints used): "Good effort! If you're stuck, try using the **hints button** to guide your thinking. This problem involves finding a percentage - the hints will help you break it down step by step."

Example (some hints used): "You're on the right track! Consider reviewing the hints you've seen and try working through each step carefully. Remember to **multiply first, then subtract** for discount problems."

Example (all hints used): "Nice try! You used all the hints - that shows great persistence. Review the steps in the hints carefully, then give the problem another go. You're **very close** to getting it!"

Generate feedback now (use **bold** for emphasis):`.trim();

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();

    // ⭐ UPDATED: Validate hintsUsed is provided
    if (!body.sessionId || body.userAnswer === undefined || body.hintsUsed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userAnswer, or hintsUsed' },
        { status: 400 }
      );
    }

    // Validate userAnswer
    if (typeof body.userAnswer !== 'number' || isNaN(body.userAnswer)) {
      return NextResponse.json(
        { error: 'userAnswer must be a valid number' },
        { status: 400 }
      );
    }

    // ⭐ NEW: Validate hintsUsed
    if (typeof body.hintsUsed !== 'number' || body.hintsUsed < 0 || body.hintsUsed > 3) {
      return NextResponse.json(
        { error: 'hintsUsed must be a number between 0 and 3' },
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
    
    // ⭐ UPDATED: Pass hintsUsed to feedback generation
    const feedback = await generateFeedback(
      session.problem_text,
      session.correct_answer,
      body.userAnswer,
      isCorrect,
      body.hintsUsed
    );

    // ⭐ UPDATED: Include hints_used in database insert
    const { error: insertError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id: body.sessionId,
        user_answer: body.userAnswer,
        is_correct: isCorrect,
        feedback_text: feedback,
        hints_used: body.hintsUsed
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