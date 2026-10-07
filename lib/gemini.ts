import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

export const genAI = new GoogleGenerativeAI(apiKey);

// Last resort only. Google retires Gemini models on a schedule, so the
// name is looked up at runtime instead of being pinned in code.
const FALLBACK_MODEL = 'gemini-flash-latest';

interface ListedModel {
  name: string;
  supportedGenerationMethods?: string[];
}

// Picks the newest stable "gemini-<version>-flash" model the key can call.
// GEMINI_MODEL overrides the lookup when a specific model is wanted.
async function resolveModelName(): Promise<string> {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${apiKey}`
    );
    if (!res.ok) return FALLBACK_MODEL;
    const body = (await res.json()) as { models?: ListedModel[] };

    const flash = (body.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => {
        const match = m.name.match(/^models\/(gemini-(\d+(?:\.\d+)?)-flash)$/);
        return match ? { id: match[1], version: parseFloat(match[2]) } : null;
      })
      .filter((m): m is { id: string; version: number } => m !== null)
      .sort((a, b) => b.version - a.version);

    return flash[0]?.id ?? FALLBACK_MODEL;
  } catch {
    return FALLBACK_MODEL;
  }
}

let cached: Promise<GenerativeModel> | null = null;

export function getModel(): Promise<GenerativeModel> {
  if (!cached) {
    cached = resolveModelName().then((name) => genAI.getGenerativeModel({ model: name }));
  }
  return cached;
}
