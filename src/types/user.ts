
import type { Timestamp } from 'firebase/firestore';

export interface UserSettings {
  userId: string;
  proactiveNudgesEnabled: boolean;
  updatedAt?: Timestamp; // Optional: track when settings were last updated
  // Add other user-specific settings here in the future
}
