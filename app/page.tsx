'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import { 
  getRecentSubmissions, 
  getSubmissionStats, 
  getSubmissionsByType,
  type SubmissionWithSession,
  type ProblemType
} from '@/lib/supabaseClient';

interface Problem {
  sessionId: string;
  problemText: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  solutionSteps?: string;
  problemType?: ProblemType;
  hints?: string[]; // ⭐ NEW: Three progressive hints
}

export default function Home() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  
  const [history, setHistory] = useState<SubmissionWithSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0, percentage: 0 });
  const [showSolution, setShowSolution] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ProblemType | 'All'>('All');

  // ⭐ NEW: Hints state management
  const [availableHints, setAvailableHints] = useState<string[]>([]);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);

  useEffect(() => {
    if (problem && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [problem]);

  async function loadHistory(filterType?: ProblemType) {
    try {
      let recentSubmissions: SubmissionWithSession[];
      
      if (filterType) {
        recentSubmissions = await getSubmissionsByType(filterType, 10);
      } else {
        recentSubmissions = await getRecentSubmissions(10);
      }
      
      setHistory(recentSubmissions);

      const submissionStats = await getSubmissionStats();
      setStats(submissionStats);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedTypeFilter === 'All') {
      loadHistory();
    } else {
      loadHistory(selectedTypeFilter);
    }
  }, [selectedTypeFilter]);

  function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
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
    setShowSolution(false);
    
    // ⭐ NEW: Reset hints
    setAvailableHints([]);
    setRevealedHints([]);
    setHintsUsed(0);

    try {
      const response = await fetch('/api/math-problem/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate problem');
      }

      const data = await response.json();
      setProblem({
        sessionId: data.sessionId,
        problemText: data.problemText,
        difficulty: data.difficulty,
        solutionSteps: data.solutionSteps,
        problemType: data.problemType,
        hints: data.hints // ⭐ NEW: Store hints
      });
      
      // ⭐ NEW: Set available hints
      if (data.hints && Array.isArray(data.hints)) {
        setAvailableHints(data.hints);
      }
    } catch (err) {
      console.error('Error generating problem:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate problem. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  // ⭐ NEW: Function to reveal next hint
  function revealNextHint() {
    if (hintsUsed < availableHints.length) {
      const nextHint = availableHints[hintsUsed];
      setRevealedHints(prev => [...prev, nextHint]);
      setHintsUsed(prev => prev + 1);
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
          userAnswer: answerNumber,
          hintsUsed: hintsUsed // ⭐ NEW: Send hints used count
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

      await loadHistory(selectedTypeFilter === 'All' ? undefined : selectedTypeFilter);

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

  const uniqueTypes = Array.from(
    new Set(history.map(item => item.math_problem_sessions.problem_type))
  ).sort();

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
            <div className="space-y-8">
              <div className="animate-slide-up">
                <h2 className="text-center text-lg font-bold text-gray-800 mb-4">
                  Choose Your Challenge Level 🎯
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setDifficulty('easy')}
                    aria-label="Select easy difficulty"
                    aria-pressed={difficulty === 'easy' ? 'true' : 'false'}
                    className={`
                      p-6 rounded-xl border-3 transition-all duration-200 transform
                      ${difficulty === 'easy'
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105 ring-4 ring-green-200'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md hover:scale-102'
                      }
                    `}
                  >
                    <div className="text-5xl mb-3">🌱</div>
                    <div className="font-bold text-2xl text-gray-800 mb-2">Easy</div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      Whole numbers only<br />
                      1-2 simple steps<br />
                      <span className="text-xs text-gray-500 mt-1 block">Perfect for warming up!</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setDifficulty('medium')}
                    aria-label="Select medium difficulty"
                    aria-pressed={difficulty === 'medium' ? 'true' : 'false'}
                    className={`
                      p-6 rounded-xl border-3 transition-all duration-200 transform
                      ${difficulty === 'medium'
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105 ring-4 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:scale-102'
                      }
                    `}
                  >
                    <div className="text-5xl mb-3">⭐</div>
                    <div className="font-bold text-2xl text-gray-800 mb-2">Medium</div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      Fractions & decimals<br />
                      2-3 steps required<br />
                      <span className="text-xs text-gray-500 mt-1 block">Grade-level challenge!</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setDifficulty('hard')}
                    aria-label="Select hard difficulty"
                    aria-pressed={difficulty === 'hard' ? 'true' : 'false'}
                    className={`
                      p-6 rounded-xl border-3 transition-all duration-200 transform
                      ${difficulty === 'hard'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105 ring-4 ring-purple-200'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-102'
                      }
                    `}
                  >
                    <div className="text-5xl mb-3">🔥</div>
                    <div className="font-bold text-2xl text-gray-800 mb-2">Hard</div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      Complex problems<br />
                      3-4 steps to solve<br />
                      <span className="text-xs text-gray-500 mt-1 block">For math champions!</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="text-center py-6 animate-bounce-in">
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
            </div>
          ) : (
            <div className="space-y-6 animate-scale-in">
              {/* ⭐ UPDATED: Clickable difficulty badges + problem type */}
<div className="mb-4 space-y-3">
  {/* Difficulty Selection Row */}
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-sm text-gray-600 font-medium">Difficulty:</span>
    {(['easy', 'medium', 'hard'] as const).map((level) => (
      <button
        key={level}
        onClick={async () => {
          // Don't allow change if already that difficulty or after feedback
          if ((problem.difficulty || 'medium') === level || feedback || isGenerating) return;
          
          setDifficulty(level);
          setIsGenerating(true);
          setError(null);
          setFeedback(null);
          setIsCorrect(null);
          setCorrectAnswer(null);
          setUserAnswer('');
          setShowSolution(false);
          setAvailableHints([]);
          setRevealedHints([]);
          setHintsUsed(0);

          try {
            const response = await fetch('/api/math-problem/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ difficulty: level })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to generate problem');
            }

            const data = await response.json();
            setProblem({
              sessionId: data.sessionId,
              problemText: data.problemText,
              difficulty: data.difficulty,
              solutionSteps: data.solutionSteps,
              problemType: data.problemType,
              hints: data.hints
            });
            
            if (data.hints && Array.isArray(data.hints)) {
              setAvailableHints(data.hints);
            }
          } catch (err) {
            console.error('Error generating problem:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate problem. Please try again.');
            setProblem(null); // Go back to difficulty selection on error
          } finally {
            setIsGenerating(false);
          }
        }}
        disabled={!!feedback || isGenerating} // ⭐ FIX: Explicit boolean conversion
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold
          transition-all duration-200 transform
          ${feedback || isGenerating
            ? 'opacity-50 cursor-not-allowed'
            : (problem.difficulty || 'medium') === level
              ? level === 'easy' 
                ? 'bg-green-500 text-white shadow-md ring-2 ring-green-300' 
                : level === 'hard' 
                  ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' 
                  : 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 cursor-pointer'
          }
        `}
      >
        {isGenerating && (problem.difficulty || 'medium') === level ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
        ) : (
          <>
            {level === 'easy' ? '🌱' : level === 'hard' ? '🔥' : '⭐'}
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </>
        )}
      </button>
    ))}
    {!feedback && (
      <span className="text-xs text-gray-500 ml-2">
        Click to change difficulty
      </span>
    )}
  </div>
  
  {/* Problem Type Badge */}
  {problem.problemType && (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">Topic:</span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800">
        📚 {problem.problemType}
      </span>
    </div>
  )}
</div>

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

              {/* ⭐ NEW: HINTS SECTION */}
              {!feedback && availableHints.length > 0 && (
                <div className="space-y-3 animate-slide-up">
                  {/* Hint Button */}
                  {hintsUsed < availableHints.length && (
                    <button
                      onClick={revealNextHint}
                      disabled={isSubmitting}
                      className="
                        w-full
                        flex items-center justify-center gap-2
                        px-4 py-3
                        bg-yellow-50 hover:bg-yellow-100
                        dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30
                        border-2 border-yellow-300 dark:border-yellow-700
                        rounded-lg
                        text-yellow-700 dark:text-yellow-300
                        font-medium
                        transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                        />
                      </svg>
                      <span>
                        Need a hint? ({availableHints.length - hintsUsed} remaining)
                      </span>
                    </button>
                  )}

                  {/* Revealed Hints */}
                  {revealedHints.length > 0 && (
                    <div className="space-y-2">
                      {revealedHints.map((hint, index) => (
                        <div
                          key={index}
                          className="
                            p-4
                            bg-yellow-50 dark:bg-yellow-900/20
                            border-l-4 border-yellow-400 dark:border-yellow-600
                            rounded-r-lg
                            animate-slideIn
                          "
                        >
                          <div className="flex items-start gap-3">
                            <div className="
                              flex-shrink-0
                              w-6 h-6
                              flex items-center justify-center
                              bg-yellow-400 dark:bg-yellow-600
                              text-white
                              rounded-full
                              text-sm font-bold
                            ">
                              {index + 1}
                            </div>
                            <p className="
                              text-yellow-900 dark:text-yellow-100
                              text-sm
                              leading-relaxed
                            ">
                              {hint}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* All hints used message */}
                  {hintsUsed >= availableHints.length && availableHints.length > 0 && (
                    <div className="
                      p-3
                      bg-blue-50 dark:bg-blue-900/20
                      border border-blue-200 dark:border-blue-700
                      rounded-lg
                      text-blue-700 dark:text-blue-300
                      text-sm text-center
                    ">
                      You've used all available hints. Give it your best try! 💪
                    </div>
                  )}
                </div>
              )}

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
                    className={`border-3 rounded-xl p-6 shadow-xl ${isCorrect
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
                          className={`text-2xl font-bold mb-3 ${isCorrect ? 'text-green-800' : 'text-amber-800'
                            }`}
                        >
                          {isCorrect ? '🎉 Amazing! You got it right!' : '💪 Nice try! Let\'s learn together'}
                        </h3>
                        <div className={`markdown-content prose prose-lg max-w-none ${isCorrect ? 'prose-green' : 'prose-amber'
                          }`}>
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="text-gray-700 leading-relaxed mb-2 last:mb-0">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className={`font-bold ${isCorrect ? 'text-green-800' : 'text-amber-800'
                                  }`}>
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic">{children}</em>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 my-2">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-1 my-2">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
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

                  {problem.solutionSteps && (
                    <div className="animate-slide-up">
                      {!showSolution ? (
                        <button
                          onClick={() => setShowSolution(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-6 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <span>📖</span>
                          <span>Show Step-by-Step Solution</span>
                        </button>
                      ) : (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-300 rounded-xl p-6 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                              <span>📖</span>
                              Step-by-Step Solution
                            </h3>
                            <button
                              onClick={() => setShowSolution(false)}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                            >
                              Hide
                            </button>
                          </div>
                          
                          <div className="prose prose-indigo max-w-none">
                            {problem.solutionSteps.split('\n').map((line, index) => {
                              const isStepHeader = line.trim().match(/^(Step \d+|Final Answer):/i);
                              
                              if (line.trim() === '') {
                                return <div key={index} className="h-3" />;
                              }
                              
                              if (isStepHeader) {
                                return (
                                  <div key={index} className="font-bold text-indigo-900 mt-4 first:mt-0 text-lg">
                                    {line}
                                  </div>
                                );
                              }
                              
                              return (
                                <div key={index} className="text-gray-700 leading-relaxed ml-4">
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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

        {history.length > 0 && (
          <div className="mt-8 animate-fade-in">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>📊</span>
              {showHistory ? 'Hide History' : 'View History'}
              <span className="text-sm opacity-90">({history.length})</span>
            </button>

            {showHistory && (
              <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 animate-slide-up">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📜</span>
                  Recent Problems
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600 mt-1">Total</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                    <div className="text-sm text-gray-600 mt-1">Correct</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.percentage}%</div>
                    <div className="text-sm text-gray-600 mt-1">Accuracy</div>
                  </div>
                </div>

                {uniqueTypes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                      Filter by Topic 📚
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedTypeFilter('All')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          selectedTypeFilter === 'All'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      {uniqueTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedTypeFilter(type)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            selectedTypeFilter === type
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        item.is_correct
                          ? 'bg-green-50 border-green-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-2xl">
                              {item.is_correct ? '✅' : '❌'}
                            </span>
                            <span className={`
                              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
                              ${item.math_problem_sessions.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                item.math_problem_sessions.difficulty === 'hard' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'}
                            `}>
                              {item.math_problem_sessions.difficulty === 'easy' ? '🌱' :
                               item.math_problem_sessions.difficulty === 'hard' ? '🔥' : '⭐'}
                              {item.math_problem_sessions.difficulty}
                            </span>
                            
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                              📚 {item.math_problem_sessions.problem_type}
                            </span>
                            
                            {/* ⭐ NEW: Hints used indicator */}
                            {item.hints_used > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                                <svg 
                                  className="w-3 h-3" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                                  />
                                </svg>
                                {item.hints_used} hint{item.hints_used > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 text-sm mb-2 leading-relaxed">
                            {item.math_problem_sessions.problem_text}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Your answer:</span>
                              <span className="font-bold ml-1 text-gray-800">
                                {item.user_answer}
                              </span>
                            </div>
                            {!item.is_correct && (
                              <div>
                                <span className="text-gray-600">Correct:</span>
                                <span className="font-bold ml-1 text-green-600">
                                  {item.math_problem_sessions.correct_answer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="mt-8 text-center text-sm text-gray-600 animate-fade-in">
          <p className="mb-2">Built with 💙 using Next.js, Google Gemini AI, and Supabase</p>
          <p className="text-xs text-gray-500">Designed for Primary 5 students in Singapore 🇸🇬</p>
        </footer>
      </div>
    </main>
  );
}