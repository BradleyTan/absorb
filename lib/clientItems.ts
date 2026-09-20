import type { ClientPracticeItem } from "@/components/PracticeRunner";
import type { Lesson, PracticeItem } from "./types";

/**
 * Shapes practice items for the browser. Graded items (mcq / fill_blank / test)
 * leave their answer on the server so it can't be read out of the page before
 * the question has been attempted; flashcards are self-graded, so they need it.
 */
export function toClientItems(
  items: PracticeItem[],
  lessons?: Lesson[],
): ClientPracticeItem[] {
  const titleById = new Map((lessons ?? []).map((l) => [l.id, l.title]));
  return items.map((item) => ({
    id: item.id,
    type: item.type,
    question: item.question,
    options: item.options ?? null,
    answer: item.type === "flashcard" ? item.answer : null,
    lessonTitle: item.lesson_id ? (titleById.get(item.lesson_id) ?? null) : null,
  }));
}
