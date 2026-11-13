import type { Program } from "./types";

// "7-Day Rotation": a 6-day cycle run continuously across a 7-day week, so
// the days don't map to weekdays. After Day 6 the next session is Day 1.
//
// Progression: double progression — hit the top of the rep range on the
// WORKING sets, then increase load.
//
// Structure (v4, taken from how the first cycle was actually run):
//   * First two compounds of the day: 3 working sets + a 4th back-off set
//     (21s, or a drop to ~70% for 12-20). Progress on the working sets only.
//   * Isolation: 3 straight sets.
//   * Glute isolation: last set is a hold + pulses.
//   * Posterior-chain leg work 3 sets, quad work 2.
//   * Finishers, both optional: 2 sets of abs, then a functional carry/sled
//     on the non-biceps days (1, 2, 4, 5). Reps for carries are METRES.
//
// Rest: 90s first lift, 60s the rest, 45s legs/abs, 0s inside a superset.
//
// Gym constraints (v5): no Smith machine for pressing (fine for squats), no
// hyper / reverse hyper, no decline bench. Don't program around those.
//
// Exercise names reuse existing records where they exist (history is matched
// by name, case-insensitive), so logged weights carry over.
//
// Bump PROGRAM_VERSION whenever the template changes so saved state picks up
// the new program (sessions are kept, only the template is replaced).

export const PROGRAM_VERSION = 5;

let _id = 0;
const id = (p: string) => `${p}-${_id++}`;

const FIRST = 90; // first lift of the day
const REST = 60; // everything else upper
const LEG = 45; // leg + ab work

const BO = "Sets 1-3 working. Set 4 back-off: 21s or drop to ~70% for 12-20. Progress on the working sets only.";
const OPT = "Optional finisher — only if time allows.";
const CARRY = "Functional finisher, optional. Reps are METRES (track is 14m). Swap for any carry / sled that's free.";
const PULSE = "Last set: 15s hold + 15 pulses.";

export const SEED_PROGRAM: Program = {
  version: PROGRAM_VERSION,
  title: "7-Day Rotation",
  description:
    "6-day cycle run continuously — after Day 6, the next session is Day 1. " +
    "First two compounds: 3 working sets + a back-off set. Double progression on the working sets. " +
    "Rest 90s first lift, 60s the rest, 45s legs/abs. " +
    "Abs and carries are optional finishers.",
  days: [
    {
      id: "day-rot-1",
      name: "Day 1",
      subtitle: "chest & triceps A + quads",
      exercises: [
        {
          id: id("ex"),
          name: "DB press",
          targetSets: 4,
          targetReps: "8-10",
          restSeconds: FIRST,
          notes: `Flat. Flat feet, slow and controlled. ${BO}`,
          category: "push",
        },
        {
          id: id("ex"),
          name: "Incline bench",
          targetSets: 4,
          targetReps: "8-10",
          restSeconds: REST,
          notes: `Barbell. ${BO}`,
          category: "push",
        },
        {
          id: id("ex"),
          name: "French press",
          targetSets: 3,
          targetReps: "10-12",
          restSeconds: REST,
          notes: "EZ bar (count bar as 7.5kg). Slow & controlled. Hard on elbows; back off if it talks.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Walking lunges (DB/KB)",
          targetSets: 3,
          targetReps: "10/leg",
          restSeconds: LEG,
          notes: "Long stride, drive through the front heel.",
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
          name: "Kneeling cable crunch",
          targetSets: 2,
          targetReps: "15",
          restSeconds: LEG,
          notes: OPT,
          category: "core",
          optional: true,
        },
        {
          id: id("ex"),
          name: "Sled push",
          targetSets: 2,
          targetReps: "28m",
          restSeconds: REST,
          notes: CARRY,
          category: "other",
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
          targetSets: 4,
          targetReps: "8-10",
          restSeconds: FIRST,
          notes: `Wide grip. Drive elbows down, full stretch at top. ${BO}`,
          category: "pull",
        },
        {
          id: id("ex"),
          name: "T bar row machine",
          targetSets: 4,
          targetReps: "8-10",
          restSeconds: REST,
          notes: `Neutral grip, hole 2. ${BO}`,
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Face pull",
          targetSets: 3,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: "Rear delts + upper back, posture work.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Leg curl",
          targetSets: 3,
          targetReps: "10-12",
          restSeconds: REST,
          notes: "Pelvic tilt. Slow down. Machine 2 and 2.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Kettlebell DL",
          targetSets: 3,
          targetReps: "15",
          restSeconds: REST,
          notes: "Raised on 30cm pads. Last set hip hinge.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Hanging knee raise",
          targetSets: 2,
          targetReps: "10-15",
          restSeconds: LEG,
          notes: OPT,
          category: "core",
          optional: true,
        },
        {
          id: id("ex"),
          name: "Farmers walk",
          targetSets: 2,
          targetReps: "56m",
          restSeconds: REST,
          notes: CARRY,
          category: "other",
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
          targetSets: 4,
          targetReps: "6-8",
          restSeconds: FIRST,
          notes: `RAMP FIRST: bar → ~60% → ~80%. ${BO}`,
          category: "push",
        },
        {
          id: id("ex"),
          name: "Cable lateral raise",
          targetSets: 3,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: "In-and-out side to side.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "EZ bar curl",
          targetSets: 4,
          targetReps: "8-10",
          restSeconds: REST,
          notes: `EZ bar counted as 7.5kg. ${BO} Watch the elbow — back off load before form.`,
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Standing cable curl",
          targetSets: 3,
          targetReps: "12",
          restSeconds: REST,
          notes: "Constant tension, elbows pinned. Easier on the elbow than the bar.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Seated glute abductor (spreaders)",
          targetSets: 4,
          targetReps: "15",
          restSeconds: LEG,
          notes: PULSE,
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Glute kickback",
          targetSets: 2,
          targetReps: "10",
          restSeconds: REST,
          notes: "",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Pallof press",
          targetSets: 2,
          targetReps: "12/side",
          restSeconds: LEG,
          notes: OPT,
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
          name: "Floor press",
          targetSets: 4,
          targetReps: "8",
          restSeconds: FIRST,
          notes: BO,
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
          targetSets: 4,
          targetReps: "12-15",
          restSeconds: REST,
          notes: `Straight bar. ${BO}`,
          category: "push",
        },
        {
          id: id("ex"),
          name: "Goblet squat",
          targetSets: 3,
          targetReps: "10",
          restSeconds: LEG,
          notes: "Kettlebell.",
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
          name: "Kneeling cable crunch",
          targetSets: 2,
          targetReps: "15",
          restSeconds: LEG,
          notes: OPT,
          category: "core",
          optional: true,
        },
        {
          id: id("ex"),
          name: "Overhead carry",
          targetSets: 2,
          targetReps: "28m",
          restSeconds: REST,
          notes: `${CARRY} KB or DB locked out overhead, ribs down.`,
          category: "other",
          optional: true,
        },
        {
          id: id("ex"),
          name: "Medicine ball press",
          targetSets: 1,
          targetReps: "100",
          restSeconds: 0,
          notes: "One set of 100 to finish.",
          category: "push",
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
          name: "Bent over row",
          targetSets: 4,
          targetReps: "10",
          restSeconds: FIRST,
          notes: `Barbell. Hinge and hold it — no heaving. ${BO}`,
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Seated row",
          targetSets: 4,
          targetReps: "10-12",
          restSeconds: REST,
          notes: `Seated cable row. ${BO}`,
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Rear delt machine",
          targetSets: 3,
          targetReps: "15",
          restSeconds: LEG,
          notes: "Reverse pec deck.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Romanian deadlift",
          targetSets: 3,
          targetReps: "10",
          restSeconds: REST,
          notes: "Soft knees, push hips back. Stop where the hamstrings stop, not the lower back.",
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
          name: "Suitcase carry",
          targetSets: 2,
          targetReps: "28m/side",
          restSeconds: REST,
          notes: `${CARRY} One heavy KB, stay dead upright.`,
          category: "other",
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
          targetSets: 4,
          targetReps: "8-10",
          restSeconds: FIRST,
          notes: BO,
          category: "push",
        },
        {
          id: id("ex"),
          name: "DB lateral raise",
          targetSets: 3,
          targetReps: "15",
          restSeconds: LEG,
          notes: "Strict, lead with the elbows, no swing.",
          category: "push",
        },
        {
          id: id("ex"),
          name: "Incline DB curl",
          targetSets: 2,
          targetReps: "12",
          restSeconds: 0,
          notes: "SUPERSET: straight into hammer curls, rest after the pair.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Hammer curl",
          targetSets: 2,
          targetReps: "12",
          restSeconds: REST,
          notes: "Second half of the superset. Rest 60s after.",
          category: "pull",
        },
        {
          id: id("ex"),
          name: "Hip thrust",
          targetSets: 3,
          targetReps: "10-12",
          restSeconds: REST,
          notes: "Machine — weight is additional only. Chin tucked, ribs down, squeeze hard at the top.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Cable pull-through",
          targetSets: 3,
          targetReps: "12-15",
          restSeconds: REST,
          notes: "Rope between the legs, walk out, hinge back and let it stretch, squeeze the glutes at lockout. A hinge, not a squat.",
          category: "legs",
        },
        {
          id: id("ex"),
          name: "Lying leg raise",
          targetSets: 2,
          targetReps: "12-15",
          restSeconds: LEG,
          notes: OPT,
          category: "core",
          optional: true,
        },
      ],
    },
  ],
};
