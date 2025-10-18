'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';

interface Problem {
  sessionId: string;
  problemText: string;
}

export default function Home() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (problem && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [problem]);

  function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }

  async function generateProblem() {
    setIsGenerating(true);
    setError(null);
    setFeedback(null);
    setIsCorrect(null);
    setCorrectAnswer(null);
    setUserAnswer('');

    try {
      const response = await fetch('/api/math-problem/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate problem');
      }

      const data = await response.json();
      setProblem({
        sessionId: data.sessionId,
        problemText: data.problemText
      });
    } catch (err) {
      console.error('Error generating problem:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate problem. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function submitAnswer() {
    if (!problem || !userAnswer.trim()) {
      setError('Please enter an answer');
      return;
    }

    const answerNumber = parseFloat(userAnswer);
    if (isNaN(answerNumber)) {
      setError('Please enter a valid number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/math-problem/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: problem.sessionId,
          userAnswer: answerNumber
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit answer');
      }

      const data = await response.json();
      setIsCorrect(data.isCorrect);
      setFeedback(data.feedback);
      setCorrectAnswer(data.correctAnswer);

      if (data.isCorrect) {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !isSubmitting && userAnswer.trim()) {
      submitAnswer();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in">
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 shadow-lg hover:rotate-6 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Math Problem Generator
            </h1>
            <p className="text-gray-600 text-lg">
              Practice Primary 5 math problems with AI-powered feedback! 🚀
            </p>
          </div>

          {!problem ? (
            <div className="text-center py-12 animate-bounce-in">
              <div className="mb-6">
                <svg
                  className="w-32 h-32 mx-auto text-indigo-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 mb-8 text-lg">
                Ready to challenge your math skills? Let's get started! 💪
              </p>
              <button
                onClick={generateProblem}
                disabled={isGenerating}
                aria-label="Generate a new math problem"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-400 text-white font-bold px-10 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Generating Problem...</span>
                  </span>
                ) : (
                  <span className="text-lg">Generate New Problem ✨</span>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-scale-in">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg" aria-hidden="true">?</span>
                  </div>
                  <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">
                    Your Challenge
                  </h2>
                </div>
                <p className="text-xl text-gray-800 leading-relaxed pl-11">
                  {problem.problemText}
                </p>
              </div>

              {!feedback ? (
                <div className="space-y-5 animate-slide-up">
                  <div>
                    <label 
                      htmlFor="answer" 
                      className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"
                    >
                      Your Answer 💭
                    </label>
                    <input
                      ref={answerInputRef}
                      id="answer"
                      type="text"
                      inputMode="decimal"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isSubmitting}
                      placeholder="Enter your answer (e.g., 42 or 3.5)"
                      aria-label="Enter your answer"
                      aria-describedby="answer-hint"
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-xl font-medium transition-all"
                    />
                    <p id="answer-hint" className="mt-2 text-sm text-gray-500">
                      Tip: You can press Enter to submit! ⏎
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={submitAnswer}
                      disabled={isSubmitting || !userAnswer.trim()}
                      aria-label="Submit your answer"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-6 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Checking...</span>
                        </span>
                      ) : (
                        <span className="text-lg">Submit Answer 🎯</span>
                      )}
                    </button>

                    <button
                      onClick={generateProblem}
                      disabled={isGenerating || isSubmitting}
                      aria-label="Skip to a new problem"
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold px-6 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                    >
                      <span className="hidden sm:inline">New Problem</span>
                      <span className="sm:hidden">Skip</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-bounce-in">
                  <div
                    className={`border-3 rounded-xl p-6 shadow-xl ${
                      isCorrect
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                        : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400'
                    }`}
                    role="alert"
                    aria-live="polite"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {isCorrect ? (
                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3
                          className={`text-2xl font-bold mb-3 ${
                            isCorrect ? 'text-green-800' : 'text-amber-800'
                          }`}
                        >
                          {isCorrect ? '🎉 Amazing! You got it right!' : '💪 Nice try! Let\'s learn together'}
                        </h3>
                        <div className={`markdown-content prose prose-lg max-w-none ${
                          isCorrect ? 'prose-green' : 'prose-amber'
                        }`}>
                          <ReactMarkdown
                            components={{
                              p: ({children}) => (
                                <p className="text-gray-700 leading-relaxed mb-2 last:mb-0">
                                  {children}
                                </p>
                              ),
                              strong: ({children}) => (
                                <strong className={`font-bold ${
                                  isCorrect ? 'text-green-800' : 'text-amber-800'
                                }`}>
                                  {children}
                                </strong>
                              ),
                              em: ({children}) => (
                                <em className="italic">{children}</em>
                              ),
                              ul: ({children}) => (
                                <ul className="list-disc list-inside space-y-1 my-2">
                                  {children}
                                </ul>
                              ),
                              ol: ({children}) => (
                                <ol className="list-decimal list-inside space-y-1 my-2">
                                  {children}
                                </ol>
                              ),
                              li: ({children}) => (
                                <li className="ml-4 text-gray-700">{children}</li>
                              ),
                            }}
                          >
                            {feedback}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    {!isCorrect && correctAnswer !== null && (
                      <div className="mt-5 pt-5 border-t-2 border-amber-200 bg-white/50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-amber-900 uppercase tracking-wide mb-1">
                              Correct Answer
                            </p>
                            <p className="text-2xl font-bold text-green-700">{correctAnswer}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-900 uppercase tracking-wide mb-1">
                              Your Answer
                            </p>
                            <p className="text-2xl font-bold text-amber-700">{userAnswer}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={generateProblem}
                    disabled={isGenerating}
                    aria-label="Try another problem"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-400 text-white font-bold px-6 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Generating...</span>
                      </span>
                    ) : (
                      <span className="text-lg">Try Another Problem 🚀</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div 
              className="mt-6 bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-md animate-scale-in"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-1">Oops! Something went wrong</p>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-sm text-gray-600 animate-fade-in">
          <p className="mb-2">Built with 💙 using Next.js, Google Gemini AI, and Supabase</p>
          <p className="text-xs text-gray-500">Designed for Primary 5 students in Singapore 🇸🇬</p>
        </footer>
      </div>
    </main>
  );
}