import { z } from 'zod';

// Request/Response schemas matching the backend
export const generateRequestSchema = z.object({
  event: z.string().min(5).max(300),
  detailLevel: z.number().min(1).max(7).default(5),
  perspective: z.enum(['economic', 'political', 'social', 'technical', 'balanced']).default('balanced')
});

export const generateResponseSchema = z.object({
  event: z.string(),
  generated_at: z.string(),
  perspective: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    when: z.string(),
    mechanism: z.string(),
    evidence_needed: z.string().nullable().optional(),
    sources: z.array(z.object({ 
      title: z.string(), 
      url: z.string().url() 
    })).optional().default([]),
    depends_on: z.array(z.string()).optional().default([])
  })).min(3).max(12)
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type GenerateResponse = z.infer<typeof generateResponseSchema>;
export type CauseStep = GenerateResponse['steps'][0];
export type Perspective = GenerateRequest['perspective'];

// UI State types
export type QueryState = {
  event: string;
  perspective: Perspective;
  detailLevel: number;
  verify: boolean;
  result?: GenerateResponse;
  loading: boolean;
  error?: string;
};