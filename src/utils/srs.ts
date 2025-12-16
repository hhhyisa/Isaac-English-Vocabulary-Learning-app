import { FlashcardData, ReviewData } from '../types';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

export const initializeReviewData = (): ReviewData => ({
  nextReviewDate: Date.now(),
  interval: 0,
  repetition: 0,
  easeFactor: 2.5,
});

export const calculateNextReview = (currentData: ReviewData | undefined, rating: Rating): ReviewData => {
  let { interval, repetition, easeFactor } = currentData || initializeReviewData();

  if (rating === 'again') {
    repetition = 0;
    interval = 0; // Due immediately (or 1 min, but for this app "now")
  } else {
    // Update ease factor (Standard SM-2 formula)
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    // q: 5=easy, 4=good, 3=hard. 
    // We map: easy->5, good->4, hard->3.
    let quality = 3;
    if (rating === 'good') quality = 4;
    if (rating === 'easy') quality = 5;

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    repetition += 1;

    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // If "hard", we can penalize the interval slightly compared to good, but SM-2 usually handles it via EaseFactor.
  // We'll stick to standard logic but ensure 'hard' doesn't explode the interval.
  if (rating === 'hard' && interval > 1) {
      interval = Math.max(1, Math.floor(interval * 0.8)); 
  }

  return {
    nextReviewDate: Date.now() + (interval * MILLISECONDS_IN_DAY),
    interval,
    repetition,
    easeFactor,
  };
};

export const getReviewStatusColor = (rating: Rating) => {
  switch (rating) {
    case 'again': return 'bg-red-500 hover:bg-red-600';
    case 'hard': return 'bg-orange-500 hover:bg-orange-600';
    case 'good': return 'bg-blue-500 hover:bg-blue-600';
    case 'easy': return 'bg-green-500 hover:bg-green-600';
  }
};
