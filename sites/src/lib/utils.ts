import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { QueryState, Perspective } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// URL state management
export function encodeUrlState(state: Partial<QueryState>): string {
  const params = new URLSearchParams();
  
  if (state.event) params.set('q', state.event);
  if (state.perspective && state.perspective !== 'balanced') {
    params.set('p', state.perspective);
  }
  if (state.detailLevel && state.detailLevel !== 5) {
    params.set('d', state.detailLevel.toString());
  }
  if (state.verify) params.set('v', '1');
  
  return params.toString();
}

export function decodeUrlState(hash: string): Partial<QueryState> {
  const params = new URLSearchParams(hash.replace('#', ''));
  
  return {
    event: params.get('q') || '',
    perspective: (params.get('p') as Perspective) || 'balanced',
    detailLevel: parseInt(params.get('d') || '5', 10),
    verify: params.get('v') === '1'
  };
}

// Confidence styling helpers with causal analysis theme
export function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Low': return 'bg-red-100 text-red-700 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getConfidenceDot(confidence: string): string {
  switch (confidence) {
    case 'High': return 'bg-orange-500';
    case 'Medium': return 'bg-amber-500 animate-pulse';
    case 'Low': return 'bg-red-500 animate-ping';
    default: return 'bg-gray-500';
  }
}

// Format date strings
export function formatWhen(when: string): string {
  if (when.length === 4) return when; // YYYY
  if (when.length === 7) return when.replace('-', '/'); // YYYY-MM -> YYYY/MM
  if (when.length === 10) return when.replace(/-/g, '/'); // YYYY-MM-DD -> YYYY/MM/DD
  return when;
}

// Example prompts for empty state
export const EXAMPLE_PROMPTS = [
  "US inflation eased in August 2025",
  "OpenAI released GPT-5 in early 2024",
  "Bitcoin reached $100,000 in 2024",
  "Tesla achieved full self-driving",
  "The metaverse adoption accelerated"
];
