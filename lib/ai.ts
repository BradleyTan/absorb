import "server-only";
import * as z from "zod/v4";
import type { GeneratedJourney } from "./generator";
import { titleCase } from "./generator";

/**
 * Optional AI authoring layer.
 *
 * The core engine works with the AI switched off — `lib/generator.ts` always
 * produces a complete journey. When ANTHROPIC_API_KEY is present we ask Claude
 * to write the curriculum instead, and fall back silently on any failure.
 */
export function isAIEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const PracticeSchema = z.object({
  type: z.enum(["flashcard", "mcq", "fill_blank", "test"]),
  question: z.string(),
  answer: z.string(),
  options: z.array(z.string()),
});

const LessonSchema = z.object({
  title: z.string(),
  key_concept: z.string(),
  content: z.string(),
  practice: z.array(PracticeSchema),
});

const JourneySchema = z.object({
  journey_title: z.string(),
  topic_description: z.string(),
  lessons: z.array(LessonSchema),
  challenge: z.object({ title: z.string(), description: z.string() }),
});

const SYSTEM = `You write short, dense learning journeys for Absorb, an app that takes a learner from first exposure to real-world application.

Write exactly 5 lessons, ordered from orientation to application. Each lesson:
- "content": 3 short paragraphs separated by \\n\\n. Concrete and specific — real mechanisms, real examples, real numbers where they exist. No filler, no "in today's world", no bullet lists.
- "key_concept": one short line, the single idea the lesson earns.
- "practice": exactly 3 items.

Practice rules:
- Use "flashcard" (open recall, options: []), "mcq" (4 plausible options, options[0] is NOT required to be the answer — but "answer" MUST be character-for-character one of the options), "fill_blank" (the question contains "____" and "answer" is the single missing word, options: []), and "test" (an end-of-journey question, 4 options, same answer rule as mcq).
- Across the 5 lessons include at least 3 "test" items and at least 3 "flashcard" items.
- Distractors must be wrong but tempting — never joke answers.

The challenge is a real-world project the learner does in daily life this week: specific, small enough to finish, with a written reflection step.`;

export async function generateJourneyWithAI(
  topicTitle: string,
): Promise<GeneratedJourney | null> {
  if (!isAIEnabled()) return null;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");

    const client = new Anthropic();

    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: zodOutputFormat(JourneySchema),
      },
      messages: [
        {
          role: "user",
          content: `Write the Absorb journey for this topic: "${topicTitle}".`,
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed || parsed.lessons.length === 0) return null;

    return {
      topicTitle: titleCase(topicTitle.trim()),
      topicDescription: parsed.topic_description,
      journeyTitle: parsed.journey_title,
      source: "ai",
      lessons: parsed.lessons.map((l) => ({
        title: l.title,
        key_concept: l.key_concept,
        content: l.content,
        practice: l.practice
          // An MCQ whose answer isn't among its options can never be passed.
          .filter(
            (p) =>
              (p.type !== "mcq" && p.type !== "test") ||
              p.options.includes(p.answer),
          )
          .map((p) => ({
            type: p.type,
            question: p.question,
            answer: p.answer,
            options: p.options.length > 0 ? p.options : null,
          })),
      })),
      challenge: parsed.challenge,
    };
  } catch (err) {
    // Never let the AI path break journey creation — the caller falls back
    // to the deterministic generator.
    console.error("[absorb] AI generation failed, using built-in curriculum:", err);
    return null;
  }
}
