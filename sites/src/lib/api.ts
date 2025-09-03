import type { GenerateRequest, GenerateResponse } from './types';
import { generateResponseSchema } from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function generateCausalChain(payload: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to generate causal chain';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage);
  }

  const data = await response.json();
  return generateResponseSchema.parse(data);
}