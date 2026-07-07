import type { AppConfig, ImportResponse, StreamEvent } from './types';

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
).replace(/\/$/, '');

export class ApiError extends Error {
  code: string;
  status?: number;
  constructor(message: string, code = 'ERROR', status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export async function fetchConfig(signal?: AbortSignal): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/api/config`, { signal });
  if (!res.ok) {
    throw new ApiError('Could not reach the import service.', 'CONFIG_ERROR', res.status);
  }
  return res.json();
}

export interface StreamCallbacks {
  onMeta?: (event: Extract<StreamEvent, { type: 'meta' }>) => void;
  onProgress?: (event: Extract<StreamEvent, { type: 'progress' }>) => void;
}

/**
 * Upload a CSV to the streaming endpoint and consume its newline-delimited JSON
 * events, invoking callbacks for meta/progress and resolving with the final
 * result. Pass an AbortSignal to cancel in-flight.
 */
export async function importCsvStream(
  file: File,
  callbacks: StreamCallbacks = {},
  signal?: AbortSignal,
): Promise<ImportResponse> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/import/stream`, {
    method: 'POST',
    body: form,
    signal,
  });

  if (!res.ok) {
    let message = 'The import request was rejected.';
    let code = 'IMPORT_ERROR';
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
      code = body?.error?.code ?? code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, code, res.status);
  }
  if (!res.body) {
    throw new ApiError('Streaming is not supported by this browser.', 'NO_STREAM');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let final: ImportResponse | null = null;

  const handle = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let event: StreamEvent;
    try {
      event = JSON.parse(trimmed) as StreamEvent;
    } catch {
      return;
    }
    switch (event.type) {
      case 'meta':
        callbacks.onMeta?.(event);
        break;
      case 'progress':
        callbacks.onProgress?.(event);
        break;
      case 'result':
        final = event.data;
        break;
      case 'error':
        throw new ApiError(event.message, event.code);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      handle(line);
    }
  }
  if (buffer.trim()) handle(buffer);

  if (!final) {
    throw new ApiError('The server did not return a result.', 'NO_RESULT');
  }
  return final;
}

/** Non-streaming import (used as a fallback and by tests). */
export async function importCsv(file: File, signal?: AbortSignal): Promise<ImportResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/import`, {
    method: 'POST',
    body: form,
    signal,
  });
  if (!res.ok) {
    let message = 'The import request was rejected.';
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, 'IMPORT_ERROR', res.status);
  }
  return res.json();
}
