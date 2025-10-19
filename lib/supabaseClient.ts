import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ProblemType = 
  | 'Whole Numbers'
  | 'Fractions'
  | 'Decimals'
  | 'Percentages'
  | 'Ratios'
  | 'Rates'
  | 'Money'
  | 'Time'
  | 'Length & Mass'
  | 'Area & Perimeter'
  | 'Volume'
  | 'Geometry'
  | 'Mixed Operations'

export type Database = {
  public: {
    Tables: {
      math_problem_sessions: {
        Row: {
          id: string
          created_at: string
          problem_text: string
          correct_answer: number
          difficulty: 'easy' | 'medium' | 'hard'
          solution_steps: string | null
          problem_type: ProblemType
          hints: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          problem_text: string
          correct_answer: number
          difficulty?: 'easy' | 'medium' | 'hard'
          solution_steps: string | null
          problem_type?: ProblemType
          hints?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          problem_text?: string
          correct_answer?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          solution_steps?: string | null
          problem_type?: ProblemType
          hints?: string[] | null
        }
      }
      math_problem_submissions: {
        Row: {
          id: string
          session_id: string
          user_answer: number
          is_correct: boolean
          feedback_text: string
          created_at: string
          hints_used: number
        }
        Insert: {
          id?: string
          session_id: string
          user_answer: number
          is_correct: boolean
          feedback_text: string
          created_at?: string
          hints_used?: number
        }
        Update: {
          id?: string
          session_id?: string
          user_answer?: number
          is_correct?: boolean
          feedback_text?: string
          created_at?: string
          hints_used?: number
        }
      }
    }
  }
}

export type SubmissionWithSession = {
  id: string
  user_answer: number
  is_correct: boolean
  created_at: string
  hints_used: number
  math_problem_sessions: {
    problem_text: string
    correct_answer: number
    difficulty: 'easy' | 'medium' | 'hard'
    solution_steps: string | null
    problem_type: ProblemType
    hints: string[] | null
  }
}

export async function getRecentSubmissions(limit: number = 10): Promise<SubmissionWithSession[]> {
  const { data, error } = await supabase
    .from('math_problem_submissions')
    .select(`
      id,
      user_answer,
      is_correct,
      created_at,
      hints_used,
      math_problem_sessions (
        problem_text,
        correct_answer,
        difficulty,
        solution_steps,
        problem_type,
        hints
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching submissions:', error)
    return []
  }

  return data as unknown as SubmissionWithSession[]
}

export async function getSubmissionStats() {
  const { data, error } = await supabase
    .from('math_problem_submissions')
    .select('is_correct')

  if (error) {
    console.error('Error fetching stats:', error)
    return { total: 0, correct: 0, percentage: 0 }
  }

  const total = data.length
  const correct = data.filter(s => s.is_correct).length
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

  return { total, correct, percentage }
}

export async function getStatsByProblemType() {
  const { data, error } = await supabase
    .from('math_problem_submissions')
    .select(`
      is_correct,
      math_problem_sessions (
        problem_type
      )
    `)

  if (error) {
    console.error('Error fetching problem type stats:', error)
    return []
  }

  type SubmissionWithType = {
    is_correct: boolean
    math_problem_sessions: {
      problem_type: ProblemType
    } | null
  }

  const typedData = data as unknown as SubmissionWithType[]

  const statsByType = typedData.reduce((acc, submission) => {
    if (!submission.math_problem_sessions) return acc
    
    const type = submission.math_problem_sessions.problem_type
    if (!acc[type]) {
      acc[type] = { total: 0, correct: 0, percentage: 0 }
    }
    
    acc[type].total++
    if (submission.is_correct) {
      acc[type].correct++
    }
    
    return acc
  }, {} as Record<ProblemType, { total: number; correct: number; percentage: number }>)

  Object.keys(statsByType).forEach((type) => {
    const stats = statsByType[type as ProblemType]
    stats.percentage = stats.total > 0 
      ? Math.round((stats.correct / stats.total) * 100) 
      : 0
  })

  return Object.entries(statsByType).map(([type, stats]) => ({
    type: type as ProblemType,
    ...stats
  }))
}

export async function getSubmissionsByType(
  problemType: ProblemType, 
  limit: number = 10
): Promise<SubmissionWithSession[]> {
  const { data, error } = await supabase
    .from('math_problem_submissions')
    .select(`
      id,
      user_answer,
      is_correct,
      created_at,
      hints_used,
      math_problem_sessions!inner (
        problem_text,
        correct_answer,
        difficulty,
        solution_steps,
        problem_type,
        hints
      )
    `)
    .eq('math_problem_sessions.problem_type', problemType)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching submissions by type:', error)
    return []
  }

  return data as unknown as SubmissionWithSession[]
}

export async function getHintStatistics() {
  const { data, error } = await supabase
    .from('math_problem_submissions')
    .select('hints_used, is_correct')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching hint statistics:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  const totalAttempts = data.length
  const attemptsWithHints = data.filter(s => s.hints_used > 0).length
  const solvedWithoutHints = data.filter(s => s.is_correct && s.hints_used === 0).length
  const totalHintsUsed = data.reduce((sum, s) => sum + s.hints_used, 0)
  const averageHints = totalHintsUsed / totalAttempts

  const hintDistribution = {
    noHints: data.filter(s => s.hints_used === 0).length,
    oneHint: data.filter(s => s.hints_used === 1).length,
    twoHints: data.filter(s => s.hints_used === 2).length,
    threeHints: data.filter(s => s.hints_used === 3).length,
  }

  return {
    totalAttempts,
    attemptsWithHints,
    solvedWithoutHints,
    totalHintsUsed,
    averageHints: parseFloat(averageHints.toFixed(1)),
    independencyRate: Math.round((solvedWithoutHints / totalAttempts) * 100),
    hintDistribution,
  }
}

export async function getHintStatsByDifficulty() {
  const { data, error } = await supabase
    .from('math_problem_submissions')
    .select(`
      hints_used,
      is_correct,
      math_problem_sessions (
        difficulty
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching hint stats by difficulty:', error)
    return null
  }

  type SubmissionWithDifficulty = {
    hints_used: number
    is_correct: boolean
    math_problem_sessions: {
      difficulty: 'easy' | 'medium' | 'hard'
    } | null
  }

  const typedData = data as unknown as SubmissionWithDifficulty[]

  const statsByDifficulty = typedData.reduce((acc, submission) => {
    if (!submission.math_problem_sessions) return acc
    
    const difficulty = submission.math_problem_sessions.difficulty
    if (!acc[difficulty]) {
      acc[difficulty] = {
        total: 0,
        totalHintsUsed: 0,
        averageHints: 0,
        solvedWithoutHints: 0,
      }
    }
    
    acc[difficulty].total++
    acc[difficulty].totalHintsUsed += submission.hints_used
    if (submission.is_correct && submission.hints_used === 0) {
      acc[difficulty].solvedWithoutHints++
    }
    
    return acc
  }, {} as Record<string, { 
    total: number
    totalHintsUsed: number
    averageHints: number
    solvedWithoutHints: number
  }>)

  Object.keys(statsByDifficulty).forEach((difficulty) => {
    const stats = statsByDifficulty[difficulty]
    stats.averageHints = stats.total > 0 
      ? parseFloat((stats.totalHintsUsed / stats.total).toFixed(1))
      : 0
  })

  return statsByDifficulty
}