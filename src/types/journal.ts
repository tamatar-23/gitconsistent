
import type { Timestamp } from 'firebase/firestore';

export interface JournalEntry {
  id: string; // Firestore document ID
  userId: string;
  date: string; // YYYY-MM-DD
  entryText: string;
  aiDaySummary: string;
  aiMoodAnalysis: string;
  createdAt: Timestamp;
  entrySuffix: number; // 1, 2, 3... for multiple entries on the same day
}
