import { Client, Functions } from 'appwrite';
import type { GenerateRequest, GenerateResponse } from './types';
import { generateResponseSchema } from './types';

const USE_LOCAL_API = import.meta.env.VITE_USE_LOCAL_API === 'true';
const API_BASE = `${import.meta.env.VITE_API_HOST || 'http://localhost:3000'}/api`;

// Appwrite client setup (only used when not in local mode)
let functions: Functions | null = null;

if (!USE_LOCAL_API) {
  const client = new Client();
  client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');
  functions = new Functions(client);
}

export class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function generateCausalChain(payload: GenerateRequest): Promise<GenerateResponse> {
  if (USE_LOCAL_API) {
    // Local API call using fetch
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
  } else {
    // Appwrite function call
    if (!functions) {
      throw new ApiError(500, 'Appwrite functions not initialized');
    }

    try {
      const result = await functions.createExecution(
        'butterfly',
        JSON.stringify(payload),
        false,
        '/generate'
      );

      if (result.responseStatusCode !== 200) {
        let errorMessage = 'Failed to generate causal chain';
        
        try {
          const errorData = JSON.parse(result.responseBody);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = result.responseBody || errorMessage;
        }
        
        throw new ApiError(result.responseStatusCode, errorMessage);
      }

      const data = JSON.parse(result.responseBody);
      return generateResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}