import { GoogleGenerativeAI, type GenerateContentResult } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

export const genAI = new GoogleGenerativeAI(apiKey);

// Last resort only. Google retires Gemini models on a schedule and the newest
// one is sometimes overloaded, so names are looked up at runtime and a few of
// the newest are tried in order instead of pinning one in code.
const FALLBACK_MODEL = 'gemini-flash-latest';
const MAX_CANDIDATES = 5;

interface ListedModel {
  name: string;
  supportedGenerationMethods?: string[];
}

// Stable "gemini-<version>-flash" models the key can call, newest first.
// GEMINI_MODEL overrides the lookup when a specific model is wanted.
async function resolveModelNames(): Promise<string[]> {
  if (process.env.GEMINI_MODEL) return [process.env.GEMINI_MODEL];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [FALLBACK_MODEL];
    const body = (await res.json()) as { models?: ListedModel[] };

    const names = (body.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => {
        const match = m.name.match(/^models\/(gemini-(\d+(?:\.\d+)?)-flash(-lite)?)$/);
        return match ? { id: match[1], version: parseFloat(match[2]), lite: Boolean(match[3]) } : null;
      })
      .filter((m): m is { id: string; version: number; lite: boolean } => m !== null)
      .sort((a, b) => b.version - a.version || Number(a.lite) - Number(b.lite))
      .slice(0, MAX_CANDIDATES)
      .map((m) => m.id);

    return names.length ? names : [FALLBACK_MODEL];
  } catch {
    return [FALLBACK_MODEL];
  }
}

let cached: Promise<string[]> | null = null;

function candidates(): Promise<string[]> {
  if (!cached) cached = resolveModelNames();
  return cached;
}

// An overloaded, missing or rate-limited model is worth skipping. Anything else
// (a bad prompt, a bad key) will fail the same way on every model.
function worthSkipping(error: unknown): boolean {
  return /\b(503|429|404)\b|overloaded|high demand|not found|no longer available/i.test(String(error));
}

// A model that is overloaded can also just hang, so each attempt gets a deadline
// and a slow model counts as an overloaded one.
const ATTEMPT_TIMEOUT_MS = 15000;

function withDeadline<T>(work: Promise<T>, name: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`503 ${name} did not answer in time`)), ATTEMPT_TIMEOUT_MS);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

export async function generateContent(prompt: string): Promise<GenerateContentResult> {
  const names = await candidates();
  let lastError: unknown;
  for (const name of names) {
    try {
      return await withDeadline(genAI.getGenerativeModel({ model: name }).generateContent(prompt), name);
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${name} skipped: ${String(error).slice(0, 160)}`);
      if (!worthSkipping(error)) throw error;
    }
  }
  throw lastError;
}
