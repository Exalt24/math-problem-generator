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
  hints?: string[];
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
  const [availableHints, setAvailableHints] = useState<string[]>([]);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);

  useEffect(() => {
    if (problem && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [problem]);

  async function loadHistory(filterType?: ProblemType, page: number = 1) {
    try {
      let recentSubmissions: SubmissionWithSession[];

      if (filterType) {
        recentSubmissions = await getSubmissionsByType(filterType, 50);
      } else {
        recentSubmissions = await getRecentSubmissions(50);
      }

      const totalItems = recentSubmissions.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(totalPages);
      setTotalHistoryCount(totalItems);
      
      const validPage = Math.min(page, totalPages || 1);
      setCurrentPage(validPage);
      
      const startIndex = (validPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSubmissions = recentSubmissions.slice(startIndex, endIndex);
      
      setHistory(paginatedSubmissions);

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
      loadHistory(undefined, 1);
    } else {
      loadHistory(selectedTypeFilter, 1);
    }
  }, [selectedTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypeFilter]);

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadHistory(selectedTypeFilter === 'All' ? undefined : selectedTypeFilter, page);
    }
  }

  function goToNextPage() {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }

  function goToPreviousPage() {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }

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
        hints: data.hints
      });

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
          hintsUsed: hintsUsed
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
    if (e.key === 'Enter' && !isSubmitting && !isGenerating && userAnswer.trim()) {
      submitAnswer();
    }
  }

  const uniqueTypes = Array.from(
    new Set(history.map(item => item.math_problem_sessions.problem_type))
  ).sort();

  return (
    <main className="min-h-screen lg:h-screen bg-gray-50 overflow-y-auto lg:overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-screen lg:h-full">
        {/* Left Sidebar */}
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Logo and Title - Always Visible */}
          <div className="p-6 border-b border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg hover:rotate-6 transition-transform duration-300 mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
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
              <h1 className="text-xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Math Problem Generator
              </h1>
              <p className="text-gray-600 text-sm">
                Practice Primary 5 math problems with AI-powered feedback! 🚀
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 lg:overflow-y-auto">
            {!problem ? (
              <div className="p-6">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-800 text-center">
                    Choose Your Challenge Level 🎯
                  </h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => setDifficulty('easy')}
                      aria-label="Select easy difficulty"
                      aria-pressed={difficulty === 'easy' ? 'true' : 'false'}
                      className={`
                        w-full p-3 rounded-lg border transition-all duration-200
                        ${difficulty === 'easy'
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50 text-gray-800'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🌱</div>
                        <div className="text-left">
                          <div className="font-bold">Easy</div>
                          <div className="text-xs text-gray-600">
                            Whole numbers only, 1-2 steps
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setDifficulty('medium')}
                      aria-label="Select medium difficulty"
                      aria-pressed={difficulty === 'medium' ? 'true' : 'false'}
                      className={`
                        w-full p-3 rounded-lg border transition-all duration-200
                        ${difficulty === 'medium'
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-800'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">⭐</div>
                        <div className="text-left">
                          <div className="font-bold">Medium</div>
                          <div className="text-xs text-gray-600">
                            Fractions & decimals, 2-3 steps
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setDifficulty('hard')}
                      aria-label="Select hard difficulty"
                      aria-pressed={difficulty === 'hard' ? 'true' : 'false'}
                      className={`
                        w-full p-3 rounded-lg border transition-all duration-200
                        ${difficulty === 'hard'
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50 text-gray-800'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🔥</div>
                        <div className="text-left">
                          <div className="font-bold">Hard</div>
                          <div className="text-xs text-gray-600">
                            Complex problems, 3-4 steps
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Current Problem</h2>

                  <div className="mb-3">
                    <span className="text-sm text-gray-600 font-medium">Difficulty:</span>
                    <div className="mt-1">
                      <span className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold
                        ${problem.difficulty === 'easy' ? 'bg-green-100 text-green-900 border border-green-200' :
                          problem.difficulty === 'hard' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                            'bg-blue-100 text-blue-900 border border-blue-200'}
                      `}>
                        {problem.difficulty === 'easy' ? '🌱' : problem.difficulty === 'hard' ? '🔥' : '⭐'}
                        {problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 'Medium'}
                      </span>
                    </div>
                  </div>

                  {problem.problemType && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600 font-medium">Topic:</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                          📚 {problem.problemType}
                        </span>
                      </div>
                    </div>
                  )}

                  {hintsUsed > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600 font-medium">Hints Used:</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-yellow-100 text-yellow-900 border border-yellow-200">
                          💡 {hintsUsed} hint{hintsUsed > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={generateProblem}
                    disabled={isGenerating}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {isGenerating ? 'Generating...' : 'New Problem'}
                  </button>
                  <button
                    onClick={() => setProblem(null)}
                    disabled={isGenerating || isSubmitting}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg transition-colors text-sm"
                  >
                    Back to Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {problem && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Change difficulty:</span>
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={async () => {
                        if (problem.difficulty === level || isGenerating) return;

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
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={isGenerating}
                      className={`
                        px-2 py-1 rounded text-sm font-medium transition-all duration-200
                        ${problem.difficulty === level
                          ? level === 'easy'
                            ? 'bg-green-100 text-green-900'
                            : level === 'hard'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                        ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {isGenerating && problem.difficulty === level ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
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
                          <span className="ml-1">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 lg:overflow-y-auto">
            {!problem ? (
              <div className="min-h-full flex items-center justify-center py-12 px-6">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="relative mb-12">
                    <div className="absolute inset-0 -z-10">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-60 blur-xl"></div>
                      <div className="absolute top-8 right-1/4 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-40 blur-lg"></div>
                      <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-50 blur-lg"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="mb-8 flex justify-center">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 shadow-2xl hover:rotate-6 transition-transform duration-500">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-xs">✨</span>
                          </div>
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xs">💡</span>
                          </div>
                        </div>
                      </div>

                      <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 animate-fade-in">
                        Ready to Start?
                      </h1>
                      
                      <p className="text-xl text-gray-600 mb-4 leading-relaxed">
                        Master Primary 5 mathematics with our AI-powered problem generator
                      </p>
                      
                      <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-gray-500">
                        <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-full border border-gray-200">
                          <span className="text-green-500">✓</span>
                          <span>Instant Feedback</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-full border border-gray-200">
                          <span className="text-blue-500">✓</span>
                          <span>Step-by-Step Solutions</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-full border border-gray-200">
                          <span className="text-purple-500">✓</span>
                          <span>Progressive Hints</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-gray-600 text-lg font-medium">
                      Select your difficulty level on the left and begin your math journey! 🚀
                    </p>
                    
                    <button
                      onClick={generateProblem}
                      disabled={isGenerating}
                      aria-label="Generate a new math problem"
                      className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative flex items-center gap-3">
                        {isGenerating ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            <span>Generate New Problem</span>
                            <span className="text-2xl group-hover:animate-bounce">✨</span>
                          </>
                        )}
                      </div>
                    </button>

                    <p className="text-sm text-gray-400 mt-4">
                      Choose from Easy 🌱, Medium ⭐, or Hard 🔥 difficulty levels
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-scale-in p-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg" aria-hidden="true">?</span>
                    </div>
                    <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                      Your Challenge
                    </h2>
                  </div>
                  <p className="text-xl text-gray-900 leading-relaxed pl-11">
                    {problem.problemText}
                  </p>
                </div>

                {!feedback && availableHints.length > 0 && (
                  <div className="space-y-3 animate-slide-up">
                    {hintsUsed < availableHints.length && (
                      <button
                        onClick={revealNextHint}
                        disabled={isSubmitting || isGenerating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Need a hint? ({availableHints.length - hintsUsed} remaining)</span>
                      </button>
                    )}

                    {revealedHints.length > 0 && (
                      <div className="space-y-2">
                        {revealedHints.map((hint, index) => (
                          <div key={index} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg animate-slideIn">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-yellow-500 text-white rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="text-yellow-900 text-sm leading-relaxed">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => (
                                      <p className="text-yellow-900 leading-relaxed mb-1 last:mb-0">
                                        {children}
                                      </p>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-bold text-yellow-800">
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
                                      <li className="ml-2 text-yellow-900">{children}</li>
                                    ),
                                  }}
                                >
                                  {hint}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {hintsUsed >= availableHints.length && availableHints.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm text-center">
                        You've used all available hints. Give it your best try! 💪
                      </div>
                    )}
                  </div>
                )}

                {!feedback ? (
                  <div className="space-y-5 animate-slide-up">
                    <div>
                      <label htmlFor="answer" className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
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
                        disabled={isSubmitting || isGenerating}
                        placeholder="Enter your answer (e.g., 42 or 3.5)"
                        aria-label="Enter your answer"
                        aria-describedby="answer-hint"
                        className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-xl font-medium transition-all text-gray-900"
                      />
                      <p id="answer-hint" className="mt-2 text-sm text-gray-600">
                        Tip: You can press Enter to submit! ⏎
                      </p>
                    </div>

                    <button
                      onClick={submitAnswer}
                      disabled={isSubmitting || isGenerating || !userAnswer.trim()}
                      aria-label="Submit your answer"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-6 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Checking...</span>
                        </span>
                      ) : isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Generating...</span>
                        </span>
                      ) : (
                        <span className="text-lg">Submit Answer 🎯</span>
                      )}
                    </button>
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
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className={`text-2xl font-bold mb-3 ${isCorrect ? 'text-green-800' : 'text-amber-800'}`}>
                            {isCorrect ? '🎉 Amazing! You got it right!' : '💪 Nice try! Let\'s learn together'}
                          </h3>
                          <div className={`markdown-content prose prose-lg max-w-none ${isCorrect ? 'prose-green' : 'prose-amber'}`}>
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => (
                                  <p className="text-gray-700 leading-relaxed mb-2 last:mb-0">
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong className={`font-bold ${isCorrect ? 'text-green-800' : 'text-amber-800'}`}>
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

                    <div className={`${!problem.solutionSteps || !showSolution ? 'flex flex-col lg:flex-row gap-4' : ''}`}>
                      <button
                        onClick={generateProblem}
                        disabled={isGenerating}
                        aria-label="Try another problem"
                        className={`w-full ${!problem.solutionSteps || !showSolution ? 'lg:flex-1' : ''} bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-400 text-white font-bold px-6 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl`}
                      >
                        {isGenerating ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Generating...</span>
                          </span>
                        ) : (
                          <span className="text-lg">Try Another Problem 🚀</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="px-6">
                <div className="mt-6 bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-md animate-scale-in" role="alert" aria-live="assertive">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-1">Oops! Something went wrong</p>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="fixed bottom-6 right-6 lg:hidden z-50 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center"
          title="Toggle History"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 13.0001H21V19.0001C21 20.1047 20.1046 21.0001 19 21.0001M17 13.0001V19.0001C17 20.1047 17.8954 21.0001 19 21.0001M17 13.0001V5.75719C17 4.8518 17 4.3991 16.8098 4.13658C16.6439 3.90758 16.3888 3.75953 16.1076 3.72909C15.7853 3.6942 15.3923 3.9188 14.6062 4.368L14.2938 4.54649C14.0045 4.71183 13.8598 4.7945 13.7062 4.82687C13.5702 4.85551 13.4298 4.85551 13.2938 4.82687C13.1402 4.7945 12.9955 4.71183 12.7062 4.54649L10.7938 3.45372C10.5045 3.28838 10.3598 3.20571 10.2062 3.17334C10.0702 3.14469 9.92978 3.14469 9.79383 3.17334C9.64019 3.20571 9.49552 3.28838 9.20618 3.45372L7.29382 4.54649C7.00448 4.71183 6.85981 4.7945 6.70617 4.82687C6.57022 4.85551 6.42978 4.85551 6.29383 4.82687C6.14019 4.7945 5.99552 4.71183 5.70618 4.54649L5.39382 4.368C4.60772 3.9188 4.21467 3.6942 3.89237 3.72909C3.61123 3.75953 3.35611 3.90758 3.1902 4.13658C3 4.3991 3 4.8518 3 5.75719V16.2001C3 17.8803 3 18.7203 3.32698 19.3621C3.6146 19.9266 4.07354 20.3855 4.63803 20.6731C5.27976 21.0001 6.11984 21.0001 7.8 21.0001H19M7 13.0001H9M7 9.0001H13M7 17.0001H9M13 17.0001H13.01M13 13.0001H13.01" />
          </svg>
          {totalHistoryCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {totalHistoryCount}
            </span>
          )}
        </button>

        {!showHistory ? (
          <div className="w-12 bg-white border-l border-gray-200 hidden lg:flex flex-col items-center py-1.5">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors relative"
              title="Show History"
            >
              <div className="flex items-center gap-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 13.0001H21V19.0001C21 20.1047 20.1046 21.0001 19 21.0001M17 13.0001V19.0001C17 20.1047 17.8954 21.0001 19 21.0001M17 13.0001V5.75719C17 4.8518 17 4.3991 16.8098 4.13658C16.6439 3.90758 16.3888 3.75953 16.1076 3.72909C15.7853 3.6942 15.3923 3.9188 14.6062 4.368L14.2938 4.54649C14.0045 4.71183 13.8598 4.7945 13.7062 4.82687C13.5702 4.85551 13.4298 4.85551 13.2938 4.82687C13.1402 4.7945 12.9955 4.71183 12.7062 4.54649L10.7938 3.45372C10.5045 3.28838 10.3598 3.20571 10.2062 3.17334C10.0702 3.14469 9.92978 3.14469 9.79383 3.17334C9.64019 3.20571 9.49552 3.28838 9.20618 3.45372L7.29382 4.54649C7.00448 4.71183 6.85981 4.7945 6.70617 4.82687C6.57022 4.85551 6.42978 4.85551 6.29383 4.82687C6.14019 4.7945 5.99552 4.71183 5.70618 4.54649L5.39382 4.368C4.60772 3.9188 4.21467 3.6942 3.89237 3.72909C3.61123 3.75953 3.35611 3.90758 3.1902 4.13658C3 4.3991 3 4.8518 3 5.75719V16.2001C3 17.8803 3 18.7203 3.32698 19.3621C3.6146 19.9266 4.07354 20.3855 4.63803 20.6731C5.27976 21.0001 6.11984 21.0001 7.8 21.0001H19M7 13.0001H9M7 9.0001H13M7 17.0001H9M13 17.0001H13.01M13 13.0001H13.01" />
                </svg>
                {totalHistoryCount > 0 && (
                  <span className="text-xs text-indigo-600 font-medium">
                    {totalHistoryCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="w-full lg:w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                aria-label="Close history panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 lg:overflow-y-auto p-4">
              {history.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-green-600">{stats.correct}</div>
                      <div className="text-xs text-gray-600">Correct</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-purple-600">{stats.percentage}%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                  </div>

                  {uniqueTypes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Filter by Topic</p>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => setSelectedTypeFilter('All')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${selectedTypeFilter === 'All'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          All
                        </button>
                        {uniqueTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => setSelectedTypeFilter(type)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${selectedTypeFilter === type
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${item.is_correct
                          ? 'bg-green-50 border-green-200'
                          : 'bg-amber-50 border-amber-200'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-lg">
                                {item.is_correct ? '✅' : '❌'}
                              </span>
                              <span className={`
                                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
                                ${item.math_problem_sessions.difficulty === 'easy' ? 'bg-green-100 text-green-900 border border-green-200' :
                                  item.math_problem_sessions.difficulty === 'hard' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                                    'bg-blue-100 text-blue-900 border border-blue-200'}
                              `}>
                                {item.math_problem_sessions.difficulty === 'easy' ? '🌱' :
                                  item.math_problem_sessions.difficulty === 'hard' ? '🔥' : '⭐'}
                                {item.math_problem_sessions.difficulty ? item.math_problem_sessions.difficulty.charAt(0).toUpperCase() + item.math_problem_sessions.difficulty.slice(1) : 'Medium'}
                              </span>

                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                📚 {item.math_problem_sessions.problem_type}
                              </span>

                              {item.hints_used > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-900 border border-yellow-200">
                                  💡 {item.hints_used}
                                </span>
                              )}
                            </div>

                            <p className="text-gray-800 text-xs mb-2 leading-relaxed line-clamp-2">
                              {item.math_problem_sessions.problem_text}
                            </p>

                            <div className="flex items-center gap-3 text-xs">
                              <div>
                                <span className="text-gray-700">Your answer:</span>
                                <span className="font-bold ml-1 text-gray-900">
                                  {item.user_answer}
                                </span>
                              </div>
                              {!item.is_correct && (
                                <div>
                                  <span className="text-gray-700">Correct:</span>
                                  <span className="font-bold ml-1 text-green-700">
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

                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage <= 2) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 1) {
                            pageNum = totalPages - 2 + i;
                          } else {
                            pageNum = currentPage - 1 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`w-8 h-8 text-xs font-medium rounded-full transition-all duration-200 ${
                                currentPage === pageNum
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <span className="ml-2 text-xs text-gray-400">
                        {currentPage}/{totalPages}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-4">📊</div>
                  <p className="text-sm">No history yet. Start solving problems to see your progress!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}