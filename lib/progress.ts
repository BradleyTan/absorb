import type {
  Challenge,
  ChallengeStatus,
  JourneyStats,
  Lesson,
  PracticeItem,
  ProgressRow,
} from "./types";

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

/**
 * Understanding is a weighted blend of how much of the journey has been read,
 * how accurate the practice has been, and whether the learning has actually
 * been applied. Practice weighs heaviest — recall beats recognition.
 */
export function understandingFrom(
  completionPct: number,
  accuracyPct: number,
  attempts: number,
  challengeStatus: ChallengeStatus,
): number {
  const applied =
    challengeStatus === "completed" ? 100 : challengeStatus === "in_progress" ? 45 : 0;
  // With no attempts yet, practice can't pull the score down — redistribute
  // its weight onto what the learner has actually done.
  if (attempts === 0) {
    return Math.round(0.8 * completionPct + 0.2 * applied);
  }
  return Math.round(0.4 * completionPct + 0.45 * accuracyPct + 0.15 * applied);
}

export function computeStats(
  lessons: Lesson[],
  practice: PracticeItem[],
  progress: ProgressRow[],
  challenge: Challenge | null,
): JourneyStats {
  const lessonIds = new Set(lessons.map((l) => l.id));
  const markers = progress.filter(
    (p) => p.practice_item_id === null && p.lesson_id && lessonIds.has(p.lesson_id),
  );
  const doneIds = new Set(
    markers.filter((p) => p.is_completed).map((p) => p.lesson_id as string),
  );

  const itemById = new Map(practice.map((p) => [p.id, p]));
  const attemptRows = progress.filter(
    (p) => p.practice_item_id !== null && itemById.has(p.practice_item_id),
  );
  // Keep only the latest attempt per item.
  const latest = new Map<string, ProgressRow>();
  for (const row of attemptRows) {
    const key = row.practice_item_id as string;
    const prev = latest.get(key);
    if (!prev || row.created_at > prev.created_at) latest.set(key, row);
  }
  const attempts = [...latest.values()];
  const correct = attempts.filter((a) => (a.practice_score ?? 0) >= 100).length;

  // Per-lesson accuracy drives the strength / weakness tags.
  const byLesson = new Map<string, { hit: number; total: number }>();
  for (const a of attempts) {
    const item = itemById.get(a.practice_item_id as string);
    const lid = item?.lesson_id;
    if (!lid) continue;
    const bucket = byLesson.get(lid) ?? { hit: 0, total: 0 };
    bucket.total += 1;
    if ((a.practice_score ?? 0) >= 100) bucket.hit += 1;
    byLesson.set(lid, bucket);
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const lesson of lessons) {
    const bucket = byLesson.get(lesson.id);
    if (!bucket || bucket.total === 0) continue;
    const tag = lesson.key_concept?.trim() || lesson.title;
    if (pct(bucket.hit, bucket.total) >= 70) strengths.push(tag);
    else weaknesses.push(tag);
  }

  const testItems = practice.filter((p) => p.type === "test");
  const testAttempts = testItems
    .map((t) => latest.get(t.id))
    .filter((r): r is ProgressRow => Boolean(r));
  const testTaken = testItems.length > 0 && testAttempts.length === testItems.length;

  const completionPct = pct(doneIds.size, lessons.length);
  const accuracyPct = pct(correct, attempts.length);
  const challengeStatus = (challenge?.status as ChallengeStatus) ?? "not_started";

  return {
    totalLessons: lessons.length,
    lessonsDone: doneIds.size,
    completionPct,
    attempts: attempts.length,
    correct,
    accuracyPct,
    understandingScore: understandingFrom(
      completionPct,
      accuracyPct,
      attempts.length,
      challengeStatus,
    ),
    challengeStatus,
    strengths,
    weaknesses,
    testTaken,
    testScorePct: testAttempts.length
      ? pct(
          testAttempts.filter((r) => (r.practice_score ?? 0) >= 100).length,
          testAttempts.length,
        )
      : null,
  };
}

/** Which lessons have been marked understood. */
export function completedLessonIds(progress: ProgressRow[]): Set<string> {
  return new Set(
    progress
      .filter((p) => p.practice_item_id === null && p.is_completed && p.lesson_id)
      .map((p) => p.lesson_id as string),
  );
}

/** Latest answer per practice item, as a correct / incorrect map. */
export function latestAttempts(progress: ProgressRow[]): Map<string, boolean> {
  const latest = new Map<string, ProgressRow>();
  for (const row of progress) {
    if (!row.practice_item_id) continue;
    const prev = latest.get(row.practice_item_id);
    if (!prev || row.created_at > prev.created_at) latest.set(row.practice_item_id, row);
  }
  const out = new Map<string, boolean>();
  for (const [id, row] of latest) out.set(id, (row.practice_score ?? 0) >= 100);
  return out;
}
