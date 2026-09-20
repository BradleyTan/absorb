"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { generateJourney } from "./generator";
import { generateJourneyWithAI } from "./ai";
import { computeStats } from "./progress";
import type {
  Challenge,
  ChallengeStatus,
  Lesson,
  PracticeItem,
  PracticeType,
  ProgressRow,
} from "./types";

export type ActionResult = { ok: boolean; error?: string };

const NOT_CONFIGURED =
  "The database isn't connected yet. Run `vercel env pull .env.local` and restart the dev server.";

/* ──────────────────────────────────────────────────────────────
   Core verb — turn a topic into a full journey
   ────────────────────────────────────────────────────────────── */

export async function createJourneyAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = String(formData.get("topic") ?? "").trim();
  if (raw.length < 2) return { ok: false, error: "Give your topic a name first." };
  if (raw.length > 120) return { ok: false, error: "Keep the topic under 120 characters." };
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const supabase = await createClient();

  // The AI writes the curriculum when a key is configured; the built-in
  // generator always produces a complete journey otherwise.
  const plan = (await generateJourneyWithAI(raw)) ?? generateJourney(raw);

  const { data: topic, error: topicErr } = await supabase
    .from("topics")
    .insert({ title: plan.topicTitle, description: plan.topicDescription })
    .select()
    .single();
  if (topicErr || !topic) {
    return { ok: false, error: topicErr?.message ?? "Could not save the topic." };
  }

  const { data: journey, error: journeyErr } = await supabase
    .from("journeys")
    .insert({
      topic_id: topic.id,
      title: plan.journeyTitle,
      status: "active",
      understanding_score: 0,
      completion_pct: 0,
    })
    .select()
    .single();
  if (journeyErr || !journey) {
    await supabase.from("topics").delete().eq("id", topic.id);
    return { ok: false, error: journeyErr?.message ?? "Could not start the journey." };
  }

  const { data: lessons, error: lessonErr } = await supabase
    .from("lessons")
    .insert(
      plan.lessons.map((l, i) => ({
        journey_id: journey.id,
        title: l.title,
        content: l.content,
        key_concept: l.key_concept,
        order: i + 1,
      })),
    )
    .select();
  if (lessonErr || !lessons) {
    await supabase.from("journeys").delete().eq("id", journey.id);
    await supabase.from("topics").delete().eq("id", topic.id);
    return { ok: false, error: lessonErr?.message ?? "Could not write the lessons." };
  }

  const ordered = [...lessons].sort((a, b) => a.order - b.order);
  const practiceRows = plan.lessons.flatMap((l, i) =>
    (l.practice ?? []).map((p) => ({
      lesson_id: ordered[i]?.id,
      type: p.type,
      question: p.question,
      answer: p.answer,
      options: p.options,
    })),
  );
  if (practiceRows.length > 0) {
    await supabase.from("practice_items").insert(practiceRows);
  }

  await supabase.from("challenges").insert({
    journey_id: journey.id,
    title: plan.challenge.title,
    description: plan.challenge.description,
    status: "not_started",
  });

  revalidatePath("/");
  revalidatePath("/progress");
  redirect(`/journey/${journey.id}`);
}

/* ──────────────────────────────────────────────────────────────
   Progress
   ────────────────────────────────────────────────────────────── */

/** Recompute completion + understanding and persist them onto the journey. */
async function recomputeJourney(journeyId: string) {
  const supabase = await createClient();

  const [{ data: lessons }, { data: progress }, { data: challenges }] = await Promise.all([
    supabase.from("lessons").select("*").eq("journey_id", journeyId),
    supabase.from("progress").select("*").eq("journey_id", journeyId),
    supabase.from("challenges").select("*").eq("journey_id", journeyId).limit(1),
  ]);

  const lessonList = (lessons ?? []) as Lesson[];
  let practice: PracticeItem[] = [];
  if (lessonList.length > 0) {
    const { data } = await supabase
      .from("practice_items")
      .select("*")
      .in(
        "lesson_id",
        lessonList.map((l) => l.id),
      );
    practice = (data ?? []) as PracticeItem[];
  }

  const stats = computeStats(
    lessonList,
    practice,
    (progress ?? []) as ProgressRow[],
    ((challenges ?? [])[0] as Challenge) ?? null,
  );

  await supabase
    .from("journeys")
    .update({
      completion_pct: stats.completionPct,
      understanding_score: stats.understandingScore,
      status: stats.completionPct === 100 ? "completed" : "active",
    })
    .eq("id", journeyId);

  // Keep the per-lesson strength / weakness tags on the lesson markers so the
  // signal survives outside of a recompute.
  for (const lesson of lessonList) {
    const tag = lesson.key_concept?.trim() || lesson.title;
    const isStrength = stats.strengths.includes(tag);
    const isWeakness = stats.weaknesses.includes(tag);
    if (!isStrength && !isWeakness) continue;
    await supabase
      .from("progress")
      .update({
        strength_tags: isStrength ? [tag] : [],
        weakness_tags: isWeakness ? [tag] : [],
      })
      .eq("journey_id", journeyId)
      .eq("lesson_id", lesson.id)
      .is("practice_item_id", null);
  }

  return stats;
}

export async function setLessonComplete(
  journeyId: string,
  lessonId: string,
  completed: boolean,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("progress")
    .select("id")
    .eq("journey_id", journeyId)
    .eq("lesson_id", lessonId)
    .is("practice_item_id", null)
    .limit(1);

  const row = (existing ?? [])[0];
  if (row) {
    const { error } = await supabase
      .from("progress")
      .update({ is_completed: completed })
      .eq("id", row.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("progress").insert({
      journey_id: journeyId,
      lesson_id: lessonId,
      is_completed: completed,
    });
    if (error) return { ok: false, error: error.message };
  }

  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  revalidatePath("/");
  revalidatePath("/progress");
  return { ok: true };
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export type GradeResult = {
  ok: boolean;
  correct: boolean;
  answer: string;
  keyConcept: string | null;
  error?: string;
};

/**
 * Grades an answer on the server — the correct answer for a graded item is
 * never shipped to the browser before it's been attempted.
 */
export async function gradePractice(
  journeyId: string,
  itemId: string,
  submitted: string,
): Promise<GradeResult> {
  const empty = { ok: false, correct: false, answer: "", keyConcept: null };
  if (!isSupabaseConfigured()) return { ...empty, error: NOT_CONFIGURED };

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("practice_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) return { ...empty, error: "That practice item no longer exists." };

  const typed = item as PracticeItem;
  const correct =
    typed.type === "flashcard"
      ? submitted === "knew_it"
      : normalise(submitted) === normalise(typed.answer);

  const { error } = await supabase.from("progress").insert({
    journey_id: journeyId,
    lesson_id: typed.lesson_id,
    practice_item_id: typed.id,
    practice_score: correct ? 100 : 0,
    retention_score: correct ? 100 : 0,
  });
  if (error) {
    return { ok: false, correct, answer: typed.answer, keyConcept: null, error: error.message };
  }

  let keyConcept: string | null = null;
  if (typed.lesson_id) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("key_concept")
      .eq("id", typed.lesson_id)
      .maybeSingle();
    keyConcept = lesson?.key_concept ?? null;
  }

  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  revalidatePath("/");
  revalidatePath("/progress");

  return { ok: true, correct, answer: typed.answer, keyConcept };
}

export async function resetPractice(journeyId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const supabase = await createClient();
  const { error } = await supabase
    .from("progress")
    .delete()
    .eq("journey_id", journeyId)
    .not("practice_item_id", "is", null);
  if (error) return { ok: false, error: error.message };

  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  revalidatePath("/progress");
  return { ok: true };
}

/* ──────────────────────────────────────────────────────────────
   Challenge
   ────────────────────────────────────────────────────────────── */

export async function setChallengeStatus(
  journeyId: string,
  challengeId: string,
  status: ChallengeStatus,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const supabase = await createClient();
  const { error } = await supabase
    .from("challenges")
    .update({ status })
    .eq("id", challengeId);
  if (error) return { ok: false, error: error.message };

  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  revalidatePath("/");
  revalidatePath("/progress");
  return { ok: true };
}

export async function updateChallenge(
  journeyId: string,
  challengeId: string,
  title: string,
  description: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  if (!title.trim() || !description.trim()) {
    return { ok: false, error: "A challenge needs a title and a description." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("challenges")
    .update({ title: title.trim(), description: description.trim() })
    .eq("id", challengeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/journey/${journeyId}`, "layout");
  return { ok: true };
}

/* ──────────────────────────────────────────────────────────────
   Journey / lesson / practice CRUD
   ────────────────────────────────────────────────────────────── */

export async function renameJourney(
  journeyId: string,
  title: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  if (!title.trim()) return { ok: false, error: "A journey needs a title." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("journeys")
    .update({ title: title.trim() })
    .eq("id", journeyId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/journey/${journeyId}`, "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteJourney(journeyId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const supabase = await createClient();

  const { data: journey } = await supabase
    .from("journeys")
    .select("topic_id")
    .eq("id", journeyId)
    .maybeSingle();

  const { error } = await supabase.from("journeys").delete().eq("id", journeyId);
  if (error) return { ok: false, error: error.message };

  // Drop the topic too when nothing else hangs off it.
  if (journey?.topic_id) {
    const { data: siblings } = await supabase
      .from("journeys")
      .select("id")
      .eq("topic_id", journey.topic_id);
    if ((siblings ?? []).length === 0) {
      await supabase.from("topics").delete().eq("id", journey.topic_id);
    }
  }

  revalidatePath("/");
  revalidatePath("/progress");
  redirect("/");
}

export async function saveLesson(
  journeyId: string,
  lessonId: string | null,
  values: { title: string; content: string; key_concept: string },
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const title = values.title.trim();
  const content = values.content.trim();
  if (!title) return { ok: false, error: "A lesson needs a title." };
  if (!content) return { ok: false, error: "A lesson needs some content." };

  const supabase = await createClient();

  if (lessonId) {
    const { error } = await supabase
      .from("lessons")
      .update({ title, content, key_concept: values.key_concept.trim() || null })
      .eq("id", lessonId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: siblings } = await supabase
      .from("lessons")
      .select("order")
      .eq("journey_id", journeyId);
    const next =
      Math.max(0, ...((siblings ?? []) as { order: number }[]).map((l) => l.order)) + 1;
    const { error } = await supabase.from("lessons").insert({
      journey_id: journeyId,
      title,
      content,
      key_concept: values.key_concept.trim() || null,
      order: next,
    });
    if (error) return { ok: false, error: error.message };
  }

  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteLesson(
  journeyId: string,
  lessonId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) return { ok: false, error: error.message };
  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function savePracticeItem(
  journeyId: string,
  lessonId: string,
  itemId: string | null,
  values: {
    type: PracticeType;
    question: string;
    answer: string;
    options: string[];
  },
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const question = values.question.trim();
  const answer = values.answer.trim();
  const options = values.options.map((o) => o.trim()).filter(Boolean);

  if (!question) return { ok: false, error: "The question can't be empty." };
  if (!answer) return { ok: false, error: "The answer can't be empty." };
  if (values.type === "mcq" || values.type === "test") {
    if (options.length < 2) {
      return { ok: false, error: "Give the question at least two options." };
    }
    if (!options.includes(answer)) {
      return { ok: false, error: "The answer must exactly match one of the options." };
    }
  }
  if (values.type === "fill_blank" && !question.includes("____")) {
    return { ok: false, error: "A fill-in-the-blank question needs ____ in it." };
  }

  const supabase = await createClient();
  const payload = {
    type: values.type,
    question,
    answer,
    options: options.length > 0 ? options : null,
  };

  if (itemId) {
    const { error } = await supabase
      .from("practice_items")
      .update(payload)
      .eq("id", itemId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("practice_items")
      .insert({ ...payload, lesson_id: lessonId });
    if (error) return { ok: false, error: error.message };
  }

  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  return { ok: true };
}

export async function deletePracticeItem(
  journeyId: string,
  itemId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const supabase = await createClient();
  const { error } = await supabase.from("practice_items").delete().eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  await recomputeJourney(journeyId);
  revalidatePath(`/journey/${journeyId}`, "layout");
  return { ok: true };
}
