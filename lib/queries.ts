import "server-only";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { computeStats } from "./progress";
import type {
  Challenge,
  Journey,
  JourneyStats,
  Lesson,
  PracticeItem,
  ProgressRow,
  Topic,
} from "./types";

export type JourneyCard = {
  journey: Journey;
  topic: Topic | null;
  stats: JourneyStats;
};

export type JourneyBundle = {
  journey: Journey;
  topic: Topic | null;
  lessons: Lesson[];
  practice: PracticeItem[];
  challenge: Challenge | null;
  progress: ProgressRow[];
  stats: JourneyStats;
};

const byOrder = (a: Lesson, b: Lesson) =>
  a.order - b.order || a.created_at.localeCompare(b.created_at);

/** Every journey on the board, with its progress rolled up. */
export async function listJourneys(): Promise<JourneyCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [journeysRes, topicsRes, lessonsRes, practiceRes, challengesRes, progressRes] =
    await Promise.all([
      supabase.from("journeys").select("*").order("created_at", { ascending: false }),
      supabase.from("topics").select("*"),
      supabase.from("lessons").select("*"),
      supabase.from("practice_items").select("*"),
      supabase.from("challenges").select("*"),
      supabase.from("progress").select("*"),
    ]);

  const journeys = (journeysRes.data ?? []) as Journey[];
  const topics = (topicsRes.data ?? []) as Topic[];
  const lessons = (lessonsRes.data ?? []) as Lesson[];
  const practice = (practiceRes.data ?? []) as PracticeItem[];
  const challenges = (challengesRes.data ?? []) as Challenge[];
  const progress = (progressRes.data ?? []) as ProgressRow[];

  const topicById = new Map(topics.map((t) => [t.id, t]));

  return journeys.map((journey) => {
    const jLessons = lessons.filter((l) => l.journey_id === journey.id).sort(byOrder);
    const lessonIds = new Set(jLessons.map((l) => l.id));
    const jPractice = practice.filter((p) => p.lesson_id && lessonIds.has(p.lesson_id));
    const jChallenge = challenges.find((c) => c.journey_id === journey.id) ?? null;
    const jProgress = progress.filter((p) => p.journey_id === journey.id);

    return {
      journey,
      topic: journey.topic_id ? (topicById.get(journey.topic_id) ?? null) : null,
      stats: computeStats(jLessons, jPractice, jProgress, jChallenge),
    };
  });
}

/** Everything needed to render a journey and its lessons, practice and challenge. */
export async function getJourney(journeyId: string): Promise<JourneyBundle | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data: journey } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", journeyId)
    .maybeSingle();

  if (!journey) return null;

  const [lessonsRes, challengeRes, progressRes, topicRes] = await Promise.all([
    supabase.from("lessons").select("*").eq("journey_id", journeyId),
    supabase.from("challenges").select("*").eq("journey_id", journeyId).limit(1),
    supabase.from("progress").select("*").eq("journey_id", journeyId),
    journey.topic_id
      ? supabase.from("topics").select("*").eq("id", journey.topic_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const lessons = ((lessonsRes.data ?? []) as Lesson[]).sort(byOrder);

  let practice: PracticeItem[] = [];
  if (lessons.length > 0) {
    const { data } = await supabase
      .from("practice_items")
      .select("*")
      .in(
        "lesson_id",
        lessons.map((l) => l.id),
      )
      .order("created_at", { ascending: true });
    practice = (data ?? []) as PracticeItem[];
  }

  const challenge = ((challengeRes.data ?? [])[0] as Challenge) ?? null;
  const progress = (progressRes.data ?? []) as ProgressRow[];

  return {
    journey: journey as Journey,
    topic: (topicRes.data as Topic) ?? null,
    lessons,
    practice,
    challenge,
    progress,
    stats: computeStats(lessons, practice, progress, challenge),
  };
}

/** Practice items grouped under their lesson, in lesson order. */
export function practiceByLesson(
  lessons: Lesson[],
  practice: PracticeItem[],
): Map<string, PracticeItem[]> {
  const map = new Map<string, PracticeItem[]>();
  for (const lesson of lessons) map.set(lesson.id, []);
  for (const item of practice) {
    if (!item.lesson_id) continue;
    map.get(item.lesson_id)?.push(item);
  }
  return map;
}

/** Roll-up across every journey, for the progress dashboard. */
export function overallStats(cards: JourneyCard[]) {
  const totals = cards.reduce(
    (acc, c) => {
      acc.lessons += c.stats.totalLessons;
      acc.lessonsDone += c.stats.lessonsDone;
      acc.attempts += c.stats.attempts;
      acc.correct += c.stats.correct;
      if (c.stats.challengeStatus === "completed") acc.challengesDone += 1;
      if (c.stats.completionPct === 100) acc.journeysDone += 1;
      for (const s of c.stats.strengths) acc.strengths.add(s);
      for (const w of c.stats.weaknesses) acc.weaknesses.add(w);
      return acc;
    },
    {
      lessons: 0,
      lessonsDone: 0,
      attempts: 0,
      correct: 0,
      challengesDone: 0,
      journeysDone: 0,
      strengths: new Set<string>(),
      weaknesses: new Set<string>(),
    },
  );

  const accuracyPct =
    totals.attempts === 0 ? 0 : Math.round((totals.correct / totals.attempts) * 100);
  const understanding =
    cards.length === 0
      ? 0
      : Math.round(
          cards.reduce((s, c) => s + c.stats.understandingScore, 0) / cards.length,
        );

  return {
    journeys: cards.length,
    journeysDone: totals.journeysDone,
    lessons: totals.lessons,
    lessonsDone: totals.lessonsDone,
    attempts: totals.attempts,
    correct: totals.correct,
    accuracyPct,
    challengesDone: totals.challengesDone,
    understanding,
    strengths: [...totals.strengths],
    weaknesses: [...totals.weaknesses],
  };
}
