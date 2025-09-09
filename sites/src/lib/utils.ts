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


// Format date strings with relative time
export function formatWhen(when: string): string {
  try {
    const now = new Date();
    let parsedDate: Date;

    // Parse different date formats
    if (when.length === 4) {
      // YYYY - assume January 1st
      parsedDate = new Date(parseInt(when), 0, 1);
    } else if (when.length === 7) {
      // YYYY-MM - assume 1st of the month
      const [year, month] = when.split('-');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else if (when.length === 10) {
      // YYYY-MM-DD
      parsedDate = new Date(when);
    } else {
      // Fallback for other formats
      parsedDate = new Date(when);
    }

    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return when; // Return original if invalid
    }

    // Format the date
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    let formattedDate = '';
    
    if (when.length === 4) {
      formattedDate = `${parsedDate.getFullYear()}`;
    } else if (when.length === 7) {
      formattedDate = `${monthNames[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;
    } else {
      formattedDate = `${monthNames[parsedDate.getMonth()]} ${parsedDate.getDate()}, ${parsedDate.getFullYear()}`;
    }

    // Calculate relative time
    const diffInMs = now.getTime() - parsedDate.getTime();
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    const diffInMonths = diffInMs / (1000 * 60 * 60 * 24 * 30.44);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    let relativeTime = '';
    if (diffInYears >= 1) {
      const years = Math.floor(diffInYears);
      relativeTime = `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (diffInMonths >= 1) {
      const months = Math.floor(diffInMonths);
      relativeTime = `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (diffInDays >= 1) {
      const days = Math.floor(diffInDays);
      relativeTime = `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      relativeTime = 'Today';
    }

    return `${formattedDate} - ${relativeTime}`;
  } catch (error) {
    return when; // Return original if any error occurs
  }
}

// Example prompts for empty state
export const EXAMPLE_PROMPTS = [
  "ChatGPT-4 released",
  "Apple Vision Pro launched", 
  "EU passes AI Act",
  "Taylor Swift becomes billionaire",
  "Silicon Valley Bank fails"
];
