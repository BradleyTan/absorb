export type PracticeType = "flashcard" | "mcq" | "fill_blank" | "test";

export type Topic = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
};

export type Journey = {
  id: string;
  user_id: string | null;
  topic_id: string | null;
  title: string;
  status: string | null;
  understanding_score: number | null;
  completion_pct: number | null;
  created_at: string;
};

export type Lesson = {
  id: string;
  user_id: string | null;
  journey_id: string | null;
  title: string;
  content: string;
  key_concept: string | null;
  order: number;
  created_at: string;
};

export type PracticeItem = {
  id: string;
  user_id: string | null;
  lesson_id: string | null;
  type: PracticeType;
  question: string;
  answer: string;
  options: string[] | null;
  created_at: string;
};

export type Challenge = {
  id: string;
  user_id: string | null;
  journey_id: string | null;
  title: string;
  description: string;
  status: ChallengeStatus | null;
  created_at: string;
};

export type ChallengeStatus = "not_started" | "in_progress" | "completed";

export type ProgressRow = {
  id: string;
  user_id: string | null;
  journey_id: string | null;
  lesson_id: string | null;
  practice_item_id: string | null;
  is_completed: boolean | null;
  practice_score: number | null;
  retention_score: number | null;
  strength_tags: string[] | null;
  weakness_tags: string[] | null;
  created_at: string;
};

/**
 * Progress rows do double duty, distinguished by `practice_item_id`:
 *  - NULL     → a lesson marker (is_completed = the lesson was understood)
 *  - NOT NULL → a practice attempt (practice_score = 100 correct / 0 wrong)
 */
export const isAttempt = (p: ProgressRow) => p.practice_item_id !== null;
export const isLessonMarker = (p: ProgressRow) => p.practice_item_id === null;

export type JourneyStats = {
  totalLessons: number;
  lessonsDone: number;
  completionPct: number;
  attempts: number;
  correct: number;
  accuracyPct: number;
  understandingScore: number;
  challengeStatus: ChallengeStatus;
  strengths: string[];
  weaknesses: string[];
  testTaken: boolean;
  testScorePct: number | null;
};
