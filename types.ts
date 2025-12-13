export interface Example {
  sentence: string;
  translation: string;
  source_type: 'News' | 'Comedy' | 'YouTube' | 'Movie' | 'General';
  source_context?: string; // e.g., "Friends - Season 2"
}

export interface ReviewData {
  nextReviewDate: number; // Timestamp
  interval: number; // Days
  repetition: number; // Number of successful reviews
  easeFactor: number; // Multiplier
}

export interface FlashcardData {
  id: string;
  word: string;
  pronunciation_ipa?: string;
  meanings: {
    english: string;
    chinese: string;
  };
  examples: Example[];
  reviewData?: ReviewData;
}

export enum AppView {
  INPUT = 'INPUT',
  FLASHCARDS = 'FLASHCARDS',
  QUIZ = 'QUIZ',
  PERSONAL_CENTER = 'PERSONAL_CENTER',
  REVIEW = 'REVIEW',
  DICTATION = 'DICTATION',
  ARTICLE = 'ARTICLE',
  STORY_SETUP = 'STORY_SETUP',
}

export interface QuizQuestion {
  question: string; // The word or the definition
  options: string[]; // 4 options
  correctAnswer: string;
  type: 'word-to-meaning' | 'meaning-to-word';
  originalCardId: string;
}

export interface GeneratedArticle {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  targetWords: string[];
}