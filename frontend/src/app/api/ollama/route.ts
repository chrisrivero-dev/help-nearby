import { NextRequest, NextResponse } from 'next/server';

// Default Ollama endpoint (can be overridden via environment variable or request body)
const DEFAULT_OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Abort controller for timeout handling (fetch doesn't support timeout option)
const fetchWithTimeout = async (
  url: string,
  init?: RequestInit,
  timeoutMs = 5000,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
};

/* ── Ollama Model Interface ── */
export interface OllamaModel {
  name: string;
  digest: string;
  size: number;
  modified_at: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

/* ── Ollama Chat Interfaces ── */
export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // Base64 encoded images (optional)
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
    keep_alive?: number | string;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Helper to get endpoint from request (client-provided or env var)
const getOllamaEndpoint = (req: NextRequest): string => {
  // Check for endpoint in request headers (sent from client)
  const endpointHeader = req.headers.get('x-ollama-endpoint');
  if (endpointHeader) {
    try {
      new URL(endpointHeader);
      return endpointHeader;
    } catch {
      console.warn('Invalid endpoint in header, falling back to default');
    }
  }
  // Check for endpoint in request body
  return DEFAULT_OLLAMA_BASE_URL;
};

/* ── API Endpoints ── */

/**
 * GET /api/ollama
 * Discover available Ollama models on the local or configured machine
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const endpoint = getOllamaEndpoint(req);
    console.log(`[ollama] Fetching models from: ${endpoint}`);

    // List all installed models (not just the ones currently loaded in memory)
    const res = await fetchWithTimeout(`${endpoint}/api/tags`, {}, 5000);

    if (!res.ok) {
      if (res.status === 503 || res.status === 404) {
        // Ollama not available - return empty list
        return NextResponse.json({ models: [] });
      }
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: 502 },
      );
    }

    // Ollama /api/tags returns { models: [...] } directly
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[ollama] API error:', error);
    return NextResponse.json(
      {
        error: 'Ollama not available',
        message: `Please ensure Ollama is running at the configured endpoint`,
      },
      { status: 503 },
    );
  }
}
