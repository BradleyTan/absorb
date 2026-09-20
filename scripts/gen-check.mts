/**
 * Sanity-checks the deterministic curriculum engine: every generated journey
 * must be complete and every graded item must actually be answerable.
 * Run with: node scripts/gen-check.mts
 */
import { generateJourney } from "../lib/generator.ts";

function check(topic: string): boolean {
  const j = generateJourney(topic);
  const items = j.lessons.flatMap((l) => l.practice);
  const badChoice = items.filter(
    (p) =>
      (p.type === "mcq" || p.type === "test") && !(p.options ?? []).includes(p.answer),
  );
  const badBlank = items.filter(
    (p) => p.type === "fill_blank" && !p.question.includes("____"),
  );
  const emptyContent = j.lessons.filter((l) => l.content.trim().length < 200);
  const ok =
    badChoice.length === 0 &&
    badBlank.length === 0 &&
    emptyContent.length === 0 &&
    j.lessons.length >= 5 &&
    items.filter((p) => p.type === "test").length >= 3 &&
    Boolean(j.challenge.title && j.challenge.description);

  console.log(
    [
      (ok ? "PASS" : "FAIL").padEnd(5),
      topic.padEnd(30),
      j.source.padEnd(9),
      `lessons=${j.lessons.length}`,
      `practice=${items.length}`,
      `tests=${items.filter((p) => p.type === "test").length}`,
      `badMCQ=${badChoice.length}`,
      `badBlank=${badBlank.length}`,
      `thinContent=${emptyContent.length}`,
    ].join("  "),
  );
  return ok;
}

const topics = [
  "Basics of Negotiation",
  "negotiation skills",
  "Building habits that stick",
  "How to learn Spanish grammar",
  "quantum computing",
  "Intro to SQL joins",
  "Fundamentals of photography",
];

const allOk = topics.map(check).every(Boolean);
console.log(`\n${allOk ? "ALL PASS" : "FAILURES ABOVE"}`);
process.exitCode = allOk ? 0 : 1;
