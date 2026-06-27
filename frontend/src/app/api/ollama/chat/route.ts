import { NextRequest, NextResponse } from 'next/server';

// Default Ollama endpoint (can be overridden via environment variable)
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Abort controller for timeout handling (fetch doesn't support timeout option)
const fetchWithTimeout = async (
  url: string,
  init?: RequestInit,
  timeoutMs = 30000,
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

/**
 * POST /api/ollama/chat
 * Send a message to Ollama and get a response (streaming or non-streaming)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      model,
      messages,
      stream = false,
      options,
    } = body as OllamaChatRequest;

    if (!model || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: model and messages' },
        { status: 400 },
      );
    }

    // Ensure model stays loaded indefinitely. In the Ollama API `keep_alive` is
    // a top-level request field — nesting it inside `options` is silently
    // ignored, which lets the model unload after the default 5-minute idle.
    const { keep_alive, ...modelOptions } = options ?? {};
    const chatBody = {
      model,
      messages,
      stream,
      keep_alive: keep_alive ?? -1,
      options: modelOptions,
    };

    const res = await fetchWithTimeout(
      `${OLLAMA_BASE_URL}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
      },
      30000,
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to chat with Ollama' },
        { status: res.status },
      );
    }

    if (stream) {
      // For streaming responses, return the raw stream
      return new NextResponse(res.body, {
        status: res.status,
        headers: res.headers,
      });
    }

    // Non-streaming response
    const data = (await res.json()) as OllamaChatResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ollama chat error:', error);
    return NextResponse.json(
      {
        error: 'Ollama not available',
        message: 'Please ensure Ollama is running',
      },
      { status: 503 },
    );
  }
}
