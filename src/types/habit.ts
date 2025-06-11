
import type { Timestamp } from 'firebase/firestore';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  frequency: 'daily' | 'weekly'; 
  targetDays?: number[]; 
  archived?: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  createdAt?: Timestamp; 
}

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number; 
  level: 0 | 1 | 2 | 3 | 4; 
}

// ViewMode might be removed or simplified if only 'year' is used globally.
// For now, keeping it as it might be used elsewhere, but dashboard usage is fixed.
export type ViewMode = 'year' | 'month' | 'week';
