import type { PracticeType } from "./types";

export type GeneratedPractice = {
  type: PracticeType;
  question: string;
  answer: string;
  options: string[] | null;
};

export type GeneratedLesson = {
  title: string;
  content: string;
  key_concept: string;
  practice: GeneratedPractice[];
};

export type GeneratedJourney = {
  topicTitle: string;
  topicDescription: string;
  journeyTitle: string;
  lessons: GeneratedLesson[];
  challenge: { title: string; description: string };
  source: "curated" | "template" | "ai";
};

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

const FILLER = [
  "basics of",
  "the basics of",
  "introduction to",
  "intro to",
  "fundamentals of",
  "the fundamentals of",
  "learn",
  "learning",
  "how to",
  "understanding",
  "mastering",
  "master",
  "a guide to",
  "guide to",
];

/** "Basics of Negotiation" → "negotiation" */
export function coreLabel(topic: string): string {
  let t = topic.trim().toLowerCase().replace(/\s+/g, " ");
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of FILLER) {
      if (t.startsWith(f + " ")) {
        t = t.slice(f.length + 1);
        changed = true;
      }
    }
  }
  return t.replace(/[.!?]+$/, "").trim() || topic.trim().toLowerCase();
}

export function titleCase(s: string): string {
  const small = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or",
    "the", "to", "vs", "with",
  ]);
  return s
    .split(" ")
    .map((w, i) =>
      i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

type Built = Omit<GeneratedJourney, "source" | "topicTitle">;

/* ──────────────────────────────────────────────────────────────
   Curated journeys — hand-written content for common topics
   ────────────────────────────────────────────────────────────── */

const negotiation = (): Built => ({
  topicDescription:
    "Learn the core principles of effective negotiation and practice them in daily life.",
  journeyTitle: "Negotiation Foundations",
  lessons: [
    {
      title: "Interests vs Positions",
      key_concept: "Separate what people say they want from why they want it",
      content:
        "In any negotiation, people state positions but act on interests. A position is what someone says they want — “I need $5,000”. An interest is why they want it: security, fairness, or the ability to close before quarter end.\n\nPositions collide; interests rarely do. When two people argue over a single number, there is exactly one thing to split. When they surface the interests underneath, there are usually several currencies on the table — timing, scope, guarantees, reputation, future work.\n\nThe practical move is a question, not a counter-offer. “Help me understand what makes that number important for you” converts a standoff into information. Every answer you get widens the set of deals that could work.",
      practice: [
        {
          type: "flashcard",
          question: "What is the difference between a position and an interest?",
          answer:
            "A position is what someone says they want; an interest is the underlying reason they want it.",
          options: null,
        },
        {
          type: "mcq",
          question:
            "Your counterpart insists on a Friday deadline. What is the most useful next move?",
          answer: "Ask what makes Friday important to them",
          options: [
            "Ask what makes Friday important to them",
            "Immediately counter with the following Wednesday",
            "Agree to Friday to keep the relationship warm",
            "Explain in detail why Friday is unreasonable",
          ],
        },
        {
          type: "fill_blank",
          question:
            "Positions collide, but ____ can often be satisfied in more than one way.",
          answer: "interests",
          options: null,
        },
      ],
    },
    {
      title: "The Power of BATNA",
      key_concept: "Know your best alternative before you negotiate",
      content:
        "Your BATNA is your Best Alternative To a Negotiated Agreement — what you will actually do if you walk away. It is not a wish or a threat. It is the concrete fallback you already hold.\n\nBATNA matters because it sets your real walk-away point. Any offer better than your BATNA is worth taking; anything worse is not, no matter how the conversation feels in the moment. People who skip this step negotiate on emotion and accept deals that are worse than doing nothing.\n\nYou also want an estimate of their BATNA. If their alternative is weak, patience is cheap for you. The strongest single preparation you can do is to spend an hour improving your own alternative before you ever sit down — a second job offer, a second quote, a second supplier.",
      practice: [
        {
          type: "flashcard",
          question: "What does BATNA stand for, and what is it used for?",
          answer:
            "Best Alternative To a Negotiated Agreement — it sets your real walk-away point.",
          options: null,
        },
        {
          type: "mcq",
          question: "What is the most reliable way to gain leverage before a negotiation?",
          answer: "Improve your own alternative so walking away costs you less",
          options: [
            "Improve your own alternative so walking away costs you less",
            "Open with an aggressive number to unsettle them",
            "Hide all information about your situation",
            "Wait for the other side to make the first concession",
          ],
        },
        {
          type: "fill_blank",
          question: "An offer is only worth accepting if it beats your ____.",
          answer: "BATNA",
          options: null,
        },
      ],
    },
    {
      title: "Anchoring and First Offers",
      key_concept: "The first credible number reshapes the whole conversation",
      content:
        "The first number on the table pulls every later number toward it. This is anchoring, and it is one of the most reliably measured effects in negotiation research. Even people who know about it adjust insufficiently from the anchor they heard.\n\nThat argues for going first when you are well informed about the range — your anchor sets the frame. It argues for letting them go first when you genuinely do not know the market, because their opening tells you something.\n\nAn anchor works only if it is justified. A number with a reason attached (“this is what three comparable contracts closed at”) moves people. A number with nothing behind it reads as a bluff, and an extreme anchor can end the conversation entirely by destroying the trust that makes a deal possible.",
      practice: [
        {
          type: "flashcard",
          question: "Why does the first offer in a negotiation matter so much?",
          answer:
            "It anchors the conversation — later numbers are adjusted from it, and usually not far enough.",
          options: null,
        },
        {
          type: "mcq",
          question: "An extreme, unjustified anchor most often damages what?",
          answer: "Trust between the parties",
          options: [
            "Trust between the parties",
            "The legal validity of the contract",
            "Your own BATNA",
            "The other side's deadline",
          ],
        },
        {
          type: "test",
          question: "You know the market range well. Should you open first, and why?",
          answer: "Yes — a well-informed opening anchors the range in your favour",
          options: [
            "Yes — a well-informed opening anchors the range in your favour",
            "No — going first always reveals too much",
            "No — the second offer is always stronger",
            "It makes no measurable difference either way",
          ],
        },
      ],
    },
    {
      title: "Trading, Not Splitting",
      key_concept: "Trade across issues instead of splitting one",
      content:
        "Splitting the difference feels fair and usually leaves value on the table. It treats the negotiation as one dimension when almost every real deal has several: price, timing, scope, payment terms, warranty, exclusivity, who does the work.\n\nValue is created when the two sides value those dimensions differently. If speed is worth a lot to them and cash is worth a lot to you, trading a faster delivery for a higher price makes both sides better off. That trade is invisible if the only thing being discussed is the number.\n\nThe technique is to put several issues on the table at once and make package offers: “Either A at this price with 60-day terms, or B at a lower price paid up front.” Packages surface their priorities without anyone having to confess them.",
      practice: [
        {
          type: "flashcard",
          question: "Why is offering two packages better than one single offer?",
          answer:
            "Their choice between packages reveals their priorities, and both options can be acceptable to you.",
          options: null,
        },
        {
          type: "mcq",
          question: "What makes a trade across issues create value for both sides?",
          answer: "The two sides value the issues differently",
          options: [
            "The two sides value the issues differently",
            "One side is a more experienced negotiator",
            "The total number of issues is even",
            "Both sides concede the same amount",
          ],
        },
        {
          type: "test",
          question: "Splitting the difference on a single number usually means...",
          answer: "Both sides miss trades that would have made them better off",
          options: [
            "Both sides miss trades that would have made them better off",
            "The fairest possible outcome has been reached",
            "The negotiation was well prepared",
            "The stronger BATNA has won",
          ],
        },
      ],
    },
    {
      title: "Closing Without Burning the Bridge",
      key_concept: "Protect the relationship you will negotiate with again",
      content:
        "Most negotiations are repeated games. The supplier, the manager, the landlord, the colleague — you will deal with them again, and their memory of how the last one felt sets the tone of the next one.\n\nSo separate the people from the problem. Be hard on the issue and easy on the person: attack the number, not their character. Give them a way to say yes that they can defend to whoever they report to; a deal someone gets punished for agreeing to does not survive.\n\nClose explicitly. Summarise what was agreed, in writing, the same day, including the parts that were not agreed. Ambiguity at the close is the single most common source of a dispute three months later.",
      practice: [
        {
          type: "flashcard",
          question: "What should you do immediately after reaching agreement?",
          answer:
            "Summarise what was agreed — and what was not — in writing, the same day.",
          options: null,
        },
        {
          type: "mcq",
          question: "“Be hard on the problem, easy on the person” means...",
          answer: "Push firmly on the issue while protecting the relationship",
          options: [
            "Push firmly on the issue while protecting the relationship",
            "Concede on the issue to keep the peace",
            "Apply personal pressure to win the point",
            "Avoid discussing difficult issues at all",
          ],
        },
        {
          type: "test",
          question: "Why does giving the other side a defensible yes matter?",
          answer: "A deal they cannot justify to their own side tends not to survive",
          options: [
            "A deal they cannot justify to their own side tends not to survive",
            "It lets you claim a larger share of the value",
            "It removes the need to put anything in writing",
            "It guarantees they will concede next time",
          ],
        },
      ],
    },
  ],
  challenge: {
    title: "Negotiate a Better Deal This Week",
    description:
      "Find one everyday negotiation — a purchase, a deadline, a rent renewal, a favour. Before the conversation, write down three things: your interests, their likely interests, and your BATNA. During it, ask at least one question about why their position matters to them, and put two packages on the table instead of one number. Afterwards, write four lines: what you asked for, what you got, what surprised you, and what you would change next time.",
  },
});

const habits = (): Built => ({
  topicDescription:
    "Build habits that survive a bad week, using cues, friction and identity rather than willpower.",
  journeyTitle: "Habits That Actually Stick",
  lessons: [
    {
      title: "Why Motivation Is the Wrong Tool",
      key_concept: "Design the situation instead of relying on willpower",
      content:
        "Motivation is a wave: high on Sunday night, gone by Wednesday. Habits that depend on it collapse exactly when you need them most — during a stressful week, which is most weeks.\n\nBehaviour is far more responsive to the situation than to intention. The same person eats the biscuits on the counter and does not eat the biscuits in the cupboard. Nothing about their character changed; the number of steps between them and the biscuit did.\n\nSo the skill is not becoming more disciplined. It is arranging your environment so that the behaviour you want is the easy one, and the behaviour you do not want takes three extra steps.",
      practice: [
        {
          type: "flashcard",
          question: "Why do habits built on motivation tend to fail?",
          answer:
            "Motivation fluctuates and drops during stress — exactly when the habit is most needed.",
          options: null,
        },
        {
          type: "mcq",
          question: "Which change is most likely to make a new habit stick?",
          answer: "Reducing the friction between you and the behaviour",
          options: [
            "Reducing the friction between you and the behaviour",
            "Setting a more ambitious target",
            "Reminding yourself why it matters each morning",
            "Waiting until you feel ready to start",
          ],
        },
        {
          type: "fill_blank",
          question:
            "Behaviour responds more reliably to your ____ than to your intentions.",
          answer: "environment",
          options: null,
        },
      ],
    },
    {
      title: "Cue, Routine, Reward",
      key_concept: "Every habit runs on a loop you can name",
      content:
        "A habit has three parts: a cue that triggers it, a routine you perform, and a reward your brain records. Repeat the loop enough and the cue alone starts producing the craving.\n\nThis is why habits feel automatic and why they are hard to argue with. By the time you notice you are scrolling, the loop has already run. Willpower arrives late to a decision that was made by a cue.\n\nTo change a habit, keep the cue and the reward and swap the routine. The 3pm slump (cue) and the five-minute break from concentration (reward) do not have to be filled by a vending machine — a walk to the window delivers the same reward with a different routine.",
      practice: [
        {
          type: "flashcard",
          question: "What are the three parts of a habit loop?",
          answer: "Cue, routine, reward.",
          options: null,
        },
        {
          type: "mcq",
          question: "The most reliable way to change an existing habit is to...",
          answer: "Keep the cue and the reward, change the routine",
          options: [
            "Keep the cue and the reward, change the routine",
            "Remove the reward entirely",
            "Rely on tracking it in an app",
            "Replace all three parts at once",
          ],
        },
        {
          type: "test",
          question:
            "By the time you consciously notice a habit running, what has happened?",
          answer: "The cue has already triggered the loop",
          options: [
            "The cue has already triggered the loop",
            "The reward has been cancelled",
            "Willpower has been successfully applied",
            "The habit has been broken",
          ],
        },
      ],
    },
    {
      title: "Make It Absurdly Small",
      key_concept: "Shrink the habit until starting is trivial",
      content:
        "The most common failure is starting too big. Forty-five minutes at the gym, four times a week, from a standing start — that is a plan that works for eleven days.\n\nShrink the commitment until it is almost embarrassing: two pages, one push-up, open the document. The point is not the two pages. The point is that showing up becomes non-negotiable, because there is no excuse small enough to beat it.\n\nOnce the habit exists, size takes care of itself. Most days you will do more than the minimum. On the bad days you will do the minimum, and the habit — the identity — survives to the next week.",
      practice: [
        {
          type: "flashcard",
          question: "What is the purpose of making a habit absurdly small?",
          answer:
            "It removes every excuse not to start, so the habit survives bad days.",
          options: null,
        },
        {
          type: "mcq",
          question: "On a terrible day, the right move is to...",
          answer: "Do the minimum version so the habit survives",
          options: [
            "Do the minimum version so the habit survives",
            "Skip it and do double tomorrow",
            "Restart the plan from scratch next Monday",
            "Increase the target to regain motivation",
          ],
        },
        {
          type: "fill_blank",
          question: "Shrink a new habit until the act of ____ is trivially easy.",
          answer: "starting",
          options: null,
        },
      ],
    },
    {
      title: "Identity Beats Outcomes",
      key_concept: "Habits stick when they confirm who you are",
      content:
        "“I want to run a marathon” is an outcome. “I am someone who runs” is an identity. Outcomes end; identities compound.\n\nEvery time you perform the habit you cast a vote for a version of yourself. Miss once and nothing happens. Miss twice and the vote starts going the other way — which is why the practical rule is simply: never miss twice.\n\nThis also changes how you choose habits. Ask what kind of person you want to become, then pick the smallest behaviour that person does daily, and let the evidence accumulate.",
      practice: [
        {
          type: "flashcard",
          question: "What is the “never miss twice” rule?",
          answer:
            "Missing once is noise; missing twice starts a new habit. Always return on the next occasion.",
          options: null,
        },
        {
          type: "mcq",
          question: "Which framing supports a long-lasting habit?",
          answer: "“I am someone who writes daily”",
          options: [
            "“I am someone who writes daily”",
            "“I want to publish a book this year”",
            "“I should write more than I currently do”",
            "“I will write when I have more time”",
          ],
        },
        {
          type: "test",
          question: "Each repetition of a habit is best understood as...",
          answer: "A vote for the kind of person you are becoming",
          options: [
            "A vote for the kind of person you are becoming",
            "A withdrawal from a fixed store of willpower",
            "Progress toward a finish line",
            "Proof that motivation is working",
          ],
        },
      ],
    },
    {
      title: "Stacking, Tracking and Recovery",
      key_concept: "Anchor new habits to existing ones and plan the relapse",
      content:
        "Habit stacking attaches a new behaviour to an established one: after I pour my coffee, I write three lines. The existing habit supplies the cue, so you are not relying on memory or mood.\n\nTracking works for a different reason — it makes the streak visible, and the visible streak becomes its own small reward. A paper calendar and a marker outperform most apps, because the record is physically in the way.\n\nFinally, plan the relapse before it happens. Decide now what the minimum version looks like when you are travelling, ill or overloaded. A habit with a defined bad-day mode does not break; it just gets quieter.",
      practice: [
        {
          type: "flashcard",
          question: "What is habit stacking?",
          answer:
            "Attaching a new habit to an existing one, which supplies the cue: “After X, I will Y.”",
          options: null,
        },
        {
          type: "mcq",
          question: "Why is it worth defining a bad-day minimum in advance?",
          answer:
            "It keeps the habit alive through disruption instead of breaking it",
          options: [
            "It keeps the habit alive through disruption instead of breaking it",
            "It gives you permission to skip more often",
            "It replaces the need for a cue",
            "It makes the habit more ambitious",
          ],
        },
        {
          type: "test",
          question:
            "“After I pour my coffee, I write three lines” is an example of...",
          answer: "Habit stacking",
          options: [
            "Habit stacking",
            "Identity-based framing",
            "Reward substitution",
            "Friction removal",
          ],
        },
      ],
    },
  ],
  challenge: {
    title: "Run One Habit for Seven Days",
    description:
      "Pick one habit and shrink it until it takes under two minutes. Stack it onto something you already do every day (“after I ___, I will ___”). Write the seven days on paper and mark each one. Define your bad-day minimum before you start, and apply the never-miss-twice rule. At the end of the week, note which day was hardest and what the cue actually was.",
  },
});

const CURATED: Record<string, () => Built> = {
  negotiation,
  "habit building": habits,
};

/** Aliases that map free-text input onto a curated journey. */
const ALIASES: Record<string, string> = {
  negotiation: "negotiation",
  negotiating: "negotiation",
  negotiations: "negotiation",
  "negotiation skills": "negotiation",
  "salary negotiation": "negotiation",
  habits: "habit building",
  habit: "habit building",
  "habit building": "habit building",
  "building habits": "habit building",
  "good habits": "habit building",
  "atomic habits": "habit building",
  "habit formation": "habit building",
};

function findCurated(label: string): string | null {
  if (ALIASES[label]) return ALIASES[label];
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (label.includes(alias)) return key;
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────
   Template journey — works for any topic, with the AI switched off
   ────────────────────────────────────────────────────────────── */

function templateJourney(label: string): Built {
  const X = titleCase(label);
  const x = label;

  return {
    topicDescription: `A guided path through ${x}: what it really is, how it works, where people go wrong, and how to use it for real.`,
    journeyTitle: `${X}: Learn, Practice, Apply`,
    lessons: [
      {
        title: `The Big Picture of ${X}`,
        key_concept: `${X} is a skill you build by doing, not a set of facts you memorise`,
        content:
          `Most people meet ${x} as a pile of facts — a video, an article, a list of tips — and mistake recognising the words for understanding the thing. Recognition is cheap. Being able to use ${x} when it matters is a different capability entirely.\n\n` +
          `The useful way in is to ask what ${x} is actually for. What problem does it solve, and what does the world look like to someone who has solved it? Before you learn any detail, sketch a one-sentence answer. It will be wrong, and that is the point: this journey is going to correct it.\n\n` +
          `Treat this first lesson as orientation. You are not trying to retain everything. You are building a frame that later details can hang on, which is the difference between knowledge that sticks and knowledge that evaporates by Friday.`,
        practice: [
          {
            type: "flashcard",
            question: `What separates recognising ${x} from actually understanding it?`,
            answer: `Understanding means you can use ${x} in a real situation, not just recognise the vocabulary.`,
            options: null,
          },
          {
            type: "mcq",
            question: `What is the most useful first step when learning ${x}?`,
            answer: `Build a rough mental frame of what ${x} is for`,
            options: [
              `Build a rough mental frame of what ${x} is for`,
              "Memorise as much terminology as possible",
              "Find the longest available course and start at lesson one",
              "Wait until you have several uninterrupted hours",
            ],
          },
          {
            type: "fill_blank",
            question: `Learning ${x} well means building a mental ____ that later details can attach to.`,
            answer: "frame",
            options: null,
          },
        ],
      },
      {
        title: `Core Principles of ${X}`,
        key_concept: `A few repeatable fundamentals explain most outcomes in ${x}`,
        content:
          `Every field looks infinitely complicated from the outside and turns out to run on a handful of ideas applied repeatedly. ${X} is no different: a small set of fundamentals accounts for most of what experts do, and the rest is variation.\n\n` +
          `Your job in this lesson is to find those fundamentals and be able to state each one in a sentence. If you cannot say a principle plainly, you do not hold it yet — you are holding the words that describe it.\n\n` +
          `A good test: take any example of ${x} done well and try to explain it using only the principles you have named. Where the explanation runs out, you have found the next thing to learn.`,
        practice: [
          {
            type: "flashcard",
            question: `How can you tell whether you really hold a principle of ${x}?`,
            answer:
              "You can state it plainly in one sentence and use it to explain a real example.",
            options: null,
          },
          {
            type: "mcq",
            question: `Which is the better sign of progress in ${x}?`,
            answer: "Explaining a real example using the principles you've named",
            options: [
              "Explaining a real example using the principles you've named",
              "Recognising the terminology when you see it",
              "Finishing more material than last week",
              "Feeling confident while reading",
            ],
          },
          {
            type: "test",
            question: `Most expert performance in ${x} comes from...`,
            answer: "A few fundamentals applied repeatedly",
            options: [
              "A few fundamentals applied repeatedly",
              "Memorising a large volume of special cases",
              "Natural talent that cannot be trained",
              "Access to better tools than everyone else",
            ],
          },
        ],
      },
      {
        title: `How ${X} Works in Practice`,
        key_concept: `Understanding ${x} means being able to predict what happens next`,
        content:
          `Theory and practice part company the moment conditions get messy — and real conditions are always messy. This lesson is about the gap between the clean version of ${x} and the version you will actually meet.\n\n` +
          `The test of real understanding is prediction. Given a situation involving ${x}, can you say what is likely to happen, and why? Prediction is strictly harder than explanation, because you cannot work backwards from the answer.\n\n` +
          `So practise forwards. Before you look at how a case turned out, commit to a guess. Being wrong with a reason teaches you far more than being right by accident, and it shows you precisely which part of your model of ${x} is broken.`,
        practice: [
          {
            type: "flashcard",
            question: `What is the strongest test of understanding in ${x}?`,
            answer:
              "Predicting what will happen before you see the outcome — and being able to say why.",
            options: null,
          },
          {
            type: "mcq",
            question: "Why is prediction harder than explanation?",
            answer: "You cannot work backwards from an answer you haven't seen",
            options: [
              "You cannot work backwards from an answer you haven't seen",
              "It requires more background reading",
              "Explanations are always incorrect",
              "Prediction needs specialist software",
            ],
          },
          {
            type: "fill_blank",
            question: `Being ____ with a reason teaches you more than being right by accident.`,
            answer: "wrong",
            options: null,
          },
        ],
      },
      {
        title: `Where People Go Wrong with ${X}`,
        key_concept: `Most failures in ${x} come from skipping the unglamorous fundamentals`,
        content:
          `Errors in ${x} are not randomly distributed. The same few mistakes account for most of them, which is good news: you can learn to spot them before they cost you anything.\n\n` +
          `The most common pattern is skipping the basics in search of the advanced move. The fundamentals are boring, so people move past them early, and every later problem traces back to that gap. The second pattern is confusing fluency with competence — material feels easy while you are reading it, which your brain misreads as having learned it.\n\n` +
          `The antidote to both is uncomfortable practice: close the material and try to reproduce it. If that feels harder than reading, it is working. That difficulty is what makes the knowledge durable.`,
        practice: [
          {
            type: "flashcard",
            question: `What is the most common mistake people make when learning ${x}?`,
            answer:
              "Skipping the fundamentals to chase advanced material, then hitting the gap later.",
            options: null,
          },
          {
            type: "mcq",
            question: "Why does re-reading feel effective when it usually isn't?",
            answer: "Fluency while reading is mistaken for having learned it",
            options: [
              "Fluency while reading is mistaken for having learned it",
              "Reading is genuinely the fastest way to learn",
              "Because the material is too easy",
              "Because notes are more reliable than memory",
            ],
          },
          {
            type: "test",
            question: "Practice that feels difficult usually means...",
            answer: "It is building durable knowledge",
            options: [
              "It is building durable knowledge",
              "The material is too advanced for you",
              "You should switch to an easier resource",
              "You have already mastered it",
            ],
          },
        ],
      },
      {
        title: `Using ${X} in Real Life`,
        key_concept: `You only own ${x} once you've used it under real conditions`,
        content:
          `Everything up to here has been preparation. ${X} becomes yours at the moment you use it somewhere it actually matters and something depends on the outcome.\n\n` +
          `Pick a small, real application — small enough to finish this week, real enough to have a consequence. Scale is not the point; stakes are. A tiny live attempt teaches more than a large hypothetical one, because reality supplies feedback that exercises cannot.\n\n` +
          `Afterwards, do the part almost everyone skips: write down what you expected, what happened, and where the two differed. That written gap is the single most efficient learning tool you have, and it is what turns one experience into a principle you keep.`,
        practice: [
          {
            type: "flashcard",
            question: `What should you do immediately after applying ${x} for real?`,
            answer:
              "Write down what you expected, what happened, and where the two differed.",
            options: null,
          },
          {
            type: "mcq",
            question: "What makes a good first real-world application?",
            answer: "Small enough to finish, real enough to have a consequence",
            options: [
              "Small enough to finish, real enough to have a consequence",
              "Large and ambitious, to prove the skill",
              "Purely hypothetical, so mistakes are free",
              "Identical to the examples in the lessons",
            ],
          },
          {
            type: "test",
            question: `A skill in ${x} becomes durable when...`,
            answer: "It has been used under real conditions and reflected on",
            options: [
              "It has been used under real conditions and reflected on",
              "All the lessons have been read twice",
              "You can recognise the terms in conversation",
              "You feel confident about the material",
            ],
          },
        ],
      },
    ],
    challenge: {
      title: `Apply ${X} This Week`,
      description: `Find one real, small situation this week where ${x} genuinely applies — at work, at home, or in something you're already doing. Before you act, write down two lines: what you're going to try, and what you expect to happen. Do it. Afterwards, write three more lines: what actually happened, where it differed from your prediction, and which lesson from this journey explains the difference. Keep it small — a finished tiny attempt beats an abandoned ambitious one.`,
    },
  };
}

/* ──────────────────────────────────────────────────────────────
   Public API
   ────────────────────────────────────────────────────────────── */

/**
 * Builds a complete journey for any topic without calling out to an AI.
 * Curated content is used where we have it; everything else falls back to
 * the template curriculum, so the core engine works with the AI switched off.
 */
export function generateJourney(topicTitle: string): GeneratedJourney {
  const label = coreLabel(topicTitle);
  const curatedKey = findCurated(label);
  const built = curatedKey ? CURATED[curatedKey]() : templateJourney(label);

  return {
    topicTitle: titleCase(topicTitle.trim()),
    source: curatedKey ? "curated" : "template",
    ...built,
  };
}
