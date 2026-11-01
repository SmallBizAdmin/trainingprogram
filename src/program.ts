import type { Program } from "./types";

// "7-Day Rotation": a 6-day cycle run continuously across a 7-day week, so
// the days don't map to weekdays. After Day 6 the next session is Day 1.
//
// Progression: double progression — hit the top of the rep range on all
// sets, then increase load.
//
// Rest: 60-90s on the first lift, 45-60s on the rest, 30-45s on leg and ab
// work. Encoded as 90 / 60 / 45 so the card shows the upper bound.
//
// Every day ends with an optional ab finisher (2 sets) done only if time
// allows. Flagged `optional` so the app shows it as a finisher and skipping
// it isn't a missed exercise.
//
// Exercise names reuse existing records where they exist (history is matched
// by name), so bench, pulldown, laterals etc. keep their logged weights.
//
// Bump PROGRAM_VERSION whenever the template changes so saved state picks up
// the new program (sessions are kept, only the template is replaced).

export const PROGRAM_VERSION = 3;

let _id = 0;
const id = (p: string) => `${p}-${_id++}`;

const FIRST = 90; // first lift of the day
const REST = 60; // everything else upper
const LEG = 45; // leg + ab work

export const SEED_PROGRAM: Program = {
  version: PROGRAM_VERSION,
  title: "7-Day Rotation",
  description:
    "6-day cycle run continuously — after Day 6, the next session is Day 1. " +
    "Double progression: hit the top of the rep range on every set, then add load. " +
    "Rest 60-90s on the first lift, 45-60s on the rest, 30-45s on leg and ab work. " +
    "Ab finisher is optional — only if time allows.",
  days: [
    {
      id: "day-rot-1",
      name: "Day 1",
      subtitle: "chest & triceps A + quads",
      exercises: [
        {
          id: id("ex"),
          name: "Bench press",
          targetSets: 3,
          targetReps: "6-8",
          restSeconds: FIRST,
          notes: "Heavy — RAMP FIRST: bar → 40 → 60 → 75 → working.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Incline DB press",
          targetSets: 3,
          targetReps: "8-10",
          restSeconds: REST,
          notes: "",
          category: "push",
        },
        {
          id: id("ex"),
          name: "French press",
          targetSets: 3,
          targetReps: "10-12",
          restSeconds: REST,
          notes: "EZ bar. ~20-22.5kg, slow & controlled. Hard on elbows; back off if it talks.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Walking lunges (DB/KB)",
          targetSets: 2,
          targetReps: "10/leg",
          restSeconds: LEG,
          notes: "Dumbbells. Long stride, drive through the front heel.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Leg extension",
          targetSets: 2,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: "",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Standing cable crunch",
          targetSets: 2,
          targetReps: "15",
          restSeconds: LEG,
          notes: "Optional finisher — only if time allows.",
          category: "core",
          optional: true,
        },
      ],
    },
    {
      id: "day-rot-2",
      name: "Day 2",
      subtitle: "back & rear delts A + hamstrings",
      exercises: [
        {
          id: id("ex"),
          name: "Lat pulldown",
          targetSets: 3,
          targetReps: "8-10",
          restSeconds: FIRST,
          notes: "Main vertical pull. Drive elbows down, full stretch at top.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Lying row (10° incline)",
          targetSets: 3,
          targetReps: "8-10",
          restSeconds: REST,
          notes: "Chest-supported row. 40kg felt heavy for 4x10 previously — let reps come.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Face pull",
          targetSets: 3,
          targetReps: "12-15",
          restSeconds: REST,
          notes: "Rear delts + upper back, posture work.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Leg curl",
          targetSets: 3,
          targetReps: "10-12",
          restSeconds: LEG,
          notes: "Seated or lying — note which in machine/setup.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Glute/ham hyperextension",
          targetSets: 2,
          targetReps: "12",
          restSeconds: LEG,
          notes: "STOP at a straight body — don't arch past neutral. Finish with a glute squeeze, not the lower back.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Hanging knee raise",
          targetSets: 2,
          targetReps: "10-15",
          restSeconds: LEG,
          notes: "Optional finisher — only if time allows.",
          category: "core",
          optional: true,
        },
      ],
    },
    {
      id: "day-rot-3",
      name: "Day 3",
      subtitle: "shoulders & biceps A + glutes",
      exercises: [
        {
          id: id("ex"),
          name: "Military press",
          targetSets: 3,
          targetReps: "6-8",
          restSeconds: FIRST,
          notes: "Heavy — RAMP FIRST: bar → ~60% → ~80% before working sets.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Cable lateral raise",
          targetSets: 3,
          targetReps: "12-15",
          restSeconds: REST,
          notes: "In-and-out side to side.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "EZ bar curl",
          targetSets: 3,
          targetReps: "8-10",
          restSeconds: REST,
          notes: "Watch the elbow — back off load before form.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Seated glute abductor (spreaders)",
          targetSets: 3,
          targetReps: "15",
          restSeconds: LEG,
          notes: "",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Reverse hyper",
          targetSets: 2,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: "Controlled.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Pallof press",
          targetSets: 2,
          targetReps: "12/side",
          restSeconds: LEG,
          notes: "Optional finisher — only if time allows.",
          category: "core",
          optional: true,
        },
      ],
    },
    {
      id: "day-rot-4",
      name: "Day 4",
      subtitle: "chest & triceps B + quads",
      exercises: [
        {
          id: id("ex"),
          name: "Dips",
          targetSets: 3,
          targetReps: "8-12",
          restSeconds: FIRST,
          notes: "Bodyweight first, add load once 3x12 is clean.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Cable chest fly",
          targetSets: 3,
          targetReps: "12",
          restSeconds: REST,
          notes: "Cable or DB fly — note which in machine/setup.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Triceps pushdown",
          targetSets: 3,
          targetReps: "12-15",
          restSeconds: REST,
          notes: "",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Leg extension",
          targetSets: 3,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: "",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Goblet squat",
          targetSets: 2,
          targetReps: "10",
          restSeconds: LEG,
          notes: "",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Standing cable crunch",
          targetSets: 2,
          targetReps: "15",
          restSeconds: LEG,
          notes: "Optional finisher — only if time allows.",
          category: "core",
          optional: true,
        },
      ],
    },
    {
      id: "day-rot-5",
      name: "Day 5",
      subtitle: "back & rear delts B + hamstrings",
      exercises: [
        {
          id: id("ex"),
          name: "Seated row",
          targetSets: 3,
          targetReps: "10-12",
          restSeconds: FIRST,
          notes: "Seated cable row.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Single-arm DB row",
          targetSets: 3,
          targetReps: "10/side",
          restSeconds: REST,
          notes: "",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Rear delt machine",
          targetSets: 3,
          targetReps: "15",
          restSeconds: REST,
          notes: "Reverse pec deck.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Romanian deadlift",
          targetSets: 3,
          targetReps: "10",
          restSeconds: LEG,
          notes: "Dumbbells. Soft knees, push hips back. Stop where the hamstrings stop, not the lower back.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Leg curl",
          targetSets: 2,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: "",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Ab wheel rollout",
          targetSets: 2,
          targetReps: "8-12",
          restSeconds: LEG,
          notes: "Optional finisher — only if time allows.",
          category: "core",
          optional: true,
        },
      ],
    },
    {
      id: "day-rot-6",
      name: "Day 6",
      subtitle: "shoulders & biceps B + glutes",
      exercises: [
        {
          id: id("ex"),
          name: "Seated DB shoulder press",
          targetSets: 3,
          targetReps: "8-10",
          restSeconds: FIRST,
          notes: "",
          category: "push",
        },
        {
          id: id("ex"),
          name: "DB lateral raise",
          targetSets: 3,
          targetReps: "15",
          restSeconds: REST,
          notes: "Strict, lead with the elbows, no swing.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Incline DB curl",
          targetSets: 2,
          targetReps: "12",
          restSeconds: REST,
          notes: "Then straight into hammer curls.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Hammer curl",
          targetSets: 2,
          targetReps: "12",
          restSeconds: REST,
          notes: "",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Hip thrust",
          targetSets: 3,
          targetReps: "10-12",
          restSeconds: LEG,
          notes: "Hip thrust or glute bridge. Chin tucked, ribs down, squeeze hard at the top.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Standing cable abductor",
          targetSets: 2,
          targetReps: "15/side",
          restSeconds: LEG,
          notes: "",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Weighted decline crunch",
          targetSets: 2,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: "Optional finisher — only if time allows.",
          category: "core",
          optional: true,
        },
      ],
    },
  ],
};
