export interface LevelResult {
  fame: number;
  silver: number;
  fameCredits: number;
}

export type LevelType = 'weapon' | 'armor' | 'offhand'; // Different slots have different fame weights
