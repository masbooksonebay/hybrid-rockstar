export type Substitution = {
  tier: "ideal" | "good" | "acceptable" | "lastResort";
  name: string;
  note: string;
};

export type Movement = {
  id: string;
  name: string;
  setup: string[];
  execution: string[];
  commonMistakes: string[];
  substitutions: Substitution[];
};

export const HYROX_MOVEMENTS: Record<string, Movement> = {
  skiErg: {
    id: "skiErg",
    name: "Ski Erg",
    setup: [
      "Feet hip-width, slight bend in knees, arms extended overhead gripping handles",
      "Weight over mid-foot, core engaged before the first pull",
      "Handles at full extension with a slight forward lean from the hips",
    ],
    execution: [
      "Pull is 60% legs, 30% core (hip hinge), 10% arms — same power sequence as a deadlift",
      "Arms stay relatively straight; pull down past the hips, not biceps-curling",
      "Return handles overhead with arms, let chain retract fully before next pull",
      "Steady rhythm beats erratic hard pulls — aim for consistent pace per 500m",
    ],
    commonMistakes: [
      "Pulling with arms first (burns you out, weak output)",
      "Standing too upright (no hip hinge = no posterior chain engagement)",
      "Going too hard early — you've got 7 more stations after this",
    ],
    substitutions: [
      { tier: "ideal", name: "Rowing machine", note: "Same energy system and similar technique" },
      { tier: "good", name: "Heavy banded rows walking backward", note: "Pulls posterior chain and lats similarly" },
      { tier: "acceptable", name: "Battle ropes alternating waves", note: "Builds grip and cardio but less specific pattern" },
      { tier: "lastResort", name: "Seated cable row for reps at moderate pace", note: "Strength-biased; loses conditioning emphasis" },
    ],
  },
  sledPush: {
    id: "sledPush",
    name: "Sled Push",
    setup: [
      "Low body position, arms locked straight on sled handles",
      "Hips low, chest down, head neutral (don't crane up)",
      "One foot staggered slightly forward to drive off",
    ],
    execution: [
      "Drive from the legs — short aggressive steps, full foot contact",
      "Keep arms locked; if arms bend, you're wasting power and risking shoulder strain",
      "Stay low the entire way — standing up means more friction and slower times",
      "Small fast steps beat long stride steps",
    ],
    commonMistakes: [
      "Standing too upright (dramatically increases sled friction)",
      "Bending arms (absorbs force instead of transferring to sled)",
      "Pushing with one leg dominant — alternate aggressively",
    ],
    substitutions: [
      { tier: "ideal", name: "Weighted prowler or car push", note: "Identical movement pattern" },
      { tier: "good", name: "Heavy hill sprints or treadmill incline walks at 15%+ grade with resistance", note: "Quad and glute emphasis" },
      { tier: "acceptable", name: "Bear crawl forward for distance", note: "Low-body position, full-body conditioning" },
      { tier: "lastResort", name: "Leg press heavy for reps", note: "Strength focus; loses conditioning and locomotion" },
    ],
  },
  sledPull: {
    id: "sledPull",
    name: "Sled Pull",
    setup: [
      "Face the sled, grip the rope firmly, lean back into your body weight",
      "Feet planted wide, knees slightly bent, hips down",
      "Keep a neutral spine — don't round the lower back under load",
    ],
    execution: [
      "Pull hand-over-hand in steady rhythm",
      "Walk backward between pulls — don't stand stationary and arm-pull",
      "Engage lats by pulling elbows back past ribs on each pull",
      "Alternate hand leading positions to balance fatigue",
    ],
    commonMistakes: [
      "All arms, no backward stepping (upper body burns out fast)",
      "Rounded lower back under load (injury risk)",
      "Standing still and arm-pulling instead of walking backward",
    ],
    substitutions: [
      { tier: "ideal", name: "Pull loaded backpack or sandbag on turf with rope (DIY sled)", note: "Closest replication of the movement" },
      { tier: "good", name: "Banded hand-over-hand walks backward", note: "Pulls posterior chain" },
      { tier: "acceptable", name: "Farmer carry backward for distance", note: "Grip and posterior chain" },
      { tier: "lastResort", name: "Renegade rows for reps", note: "Pulling pattern but no locomotion" },
    ],
  },
  burpeeBroadJumps: {
    id: "burpeeBroadJumps",
    name: "Burpee Broad Jumps",
    setup: [
      "Start standing tall, feet hip-width",
      "Chest up, arms ready to swing",
    ],
    execution: [
      "Drop to burpee: chest touches floor, full body extended",
      "Pop up explosively, feet landing under hips",
      "Jump forward aggressively — focus on distance, not height",
      "Stick the landing soft-kneed, immediately drop into the next burpee",
      "Target 3-4 feet per jump; consistent pace over time is the goal",
    ],
    commonMistakes: [
      "Jumping up instead of forward (wastes vertical energy, covers no distance)",
      "Stiff-knee landing (hurts hips/knees and slows next rep)",
      "Sprinting early reps then gassing out halfway through the 80m",
    ],
    substitutions: [
      { tier: "ideal", name: "Burpees plus standalone broad jumps separately", note: "Closest biomechanical match" },
      { tier: "good", name: "Burpee tuck jumps or burpee box jumps", note: "Vertical substitute for horizontal" },
      { tier: "acceptable", name: "Squat-thrust-to-jump", note: "Burpee variant, covers less distance" },
      { tier: "lastResort", name: "Plain burpees for distance", note: "Reps only; loses jump component" },
    ],
  },
  rowing: {
    id: "rowing",
    name: "Rowing",
    setup: [
      "Feet strapped in, shins vertical at the catch, arms extended, body forward",
      "Weight over mid-foot on the drive, not balls of feet",
      "Grip handle with straight wrists, arms relaxed",
    ],
    execution: [
      "Drive sequence: legs, then back, then arms (in that order, each completing before the next starts)",
      "Recovery sequence: arms, then back, then legs (reverse order)",
      "Legs do ~60% of the work, back ~30%, arms ~10%",
      "Pull handle to lower ribs, not chest or chin",
      "Steady stroke rate (24-28 spm for most) beats frantic high-rate rowing",
    ],
    commonMistakes: [
      "Pulling with arms first (you have 1000m of race left — arms will fail you)",
      "Bending knees before hands clear them on recovery (banging shins)",
      "Heaving the body back excessively (lumbar strain, no power gain)",
    ],
    substitutions: [
      { tier: "ideal", name: "Ski erg", note: "Closest energy-system match" },
      { tier: "good", name: "Assault bike or echo bike", note: "Same duration, similar conditioning demands" },
      { tier: "acceptable", name: "Kettlebell swings for time", note: "Posterior chain and cardio, but less sustained" },
      { tier: "lastResort", name: "Running at equivalent effort", note: "No pulling pattern, different energy demands" },
    ],
  },
  farmersCarry: {
    id: "farmersCarry",
    name: "Farmer's Carry",
    setup: [
      "Pick up kettlebells with a flat back — treat it like a deadlift, not a bend-and-grab",
      "Stand tall, shoulders packed down and back",
      "Handles held neutrally, arms straight, wrists neutral",
    ],
    execution: [
      "Walk with short quick steps — long strides cause the KBs to swing",
      "Keep chest up, core braced hard, shoulders pulled back",
      "Don't let the bells touch your legs (chafing and lost rhythm)",
      "Breathe rhythmically despite the load — don't hold your breath",
    ],
    commonMistakes: [
      "Rounding forward under load (lumbar strain)",
      "Long strides (bells swing, wastes energy stabilizing)",
      "Shrugging shoulders up toward ears (traps fatigue and poor posture)",
    ],
    substitutions: [
      { tier: "ideal", name: "Dumbbell or trap-bar carry at equivalent load", note: "Identical pattern" },
      { tier: "good", name: "Suitcase carry", note: "Unilateral version, harder core demand" },
      { tier: "acceptable", name: "Heavy overhead carry", note: "Grip and shoulder stability" },
      { tier: "lastResort", name: "Static holds at top of deadlift for time", note: "Loses locomotion component" },
    ],
  },
  sandbagLunges: {
    id: "sandbagLunges",
    name: "Sandbag Lunges",
    setup: [
      "Sandbag on shoulders or in bear-hug position (shoulder is typically more efficient)",
      "Chest up, core braced, weight balanced",
    ],
    execution: [
      "Step forward into a lunge, back knee just kissing the ground (not slamming)",
      "Front shin stays roughly vertical, knee tracks over foot not past toes",
      "Drive up through the front heel, step the back leg through to the next lunge",
      "Small controlled steps beat big aggressive steps (fewer chances to lose balance)",
    ],
    commonMistakes: [
      "Front knee caving inward (weak glute medius; focus on pushing knee out)",
      "Chest collapsing forward under sandbag load (core weakness — slow down)",
      "Landing hard on back knee (impacts the patella)",
    ],
    substitutions: [
      { tier: "ideal", name: "Barbell back rack lunges or weighted vest lunges", note: "Same movement pattern" },
      { tier: "good", name: "Kettlebell front-rack lunges", note: "Similar torso position under load" },
      { tier: "acceptable", name: "Bodyweight walking lunges for distance", note: "No load, but preserves pattern" },
      { tier: "lastResort", name: "Split squats in place", note: "Loses locomotion and balance demand" },
    ],
  },
  wallBalls: {
    id: "wallBalls",
    name: "Wall Balls",
    setup: [
      "Feet shoulder-width, ball held at chest, elbows under ball",
      "Face wall, about 6 inches away",
      "Target line on wall (9 or 10 feet depending on division)",
    ],
    execution: [
      "Descend into a full squat (hips below parallel)",
      "Drive up explosively — the ball should feel weightless at the top of the squat",
      "Release the ball using the upward momentum of the squat, not an arm press",
      "Catch the ball with soft arms, absorb into the next squat",
      "Continuous rhythm — don't pause at the bottom",
    ],
    commonMistakes: [
      "Arm-pressing the ball (uses small muscles, gasses out shoulders)",
      "Not hitting depth on the squat (failed reps, coach calls \"no rep\")",
      "Catching with straight arms (slams into chest, breaks rhythm)",
      "Hitting low on the wall (missing the target line)",
    ],
    substitutions: [
      { tier: "ideal", name: "Medicine ball throws against any wall", note: "Identical pattern if wall and ball available" },
      { tier: "good", name: "Thrusters with dumbbells or barbell", note: "Same squat-to-press pattern, no wall target" },
      { tier: "acceptable", name: "Goblet squats plus push press as two movements", note: "Decoupled but both patterns present" },
      { tier: "lastResort", name: "Dumbbell squat clean thrusters", note: "Less cyclical, harder to pace" },
    ],
  },
};

const RACE_NAME_TO_ID: Record<string, string> = {
  "SkiErg": "skiErg",
  "Ski Erg": "skiErg",
  "Sled Push": "sledPush",
  "Sled Pull": "sledPull",
  "Burpee Broad Jumps": "burpeeBroadJumps",
  "Rowing": "rowing",
  "Farmers Carry": "farmersCarry",
  "Farmer's Carry": "farmersCarry",
  "Sandbag Lunges": "sandbagLunges",
  "Wall Balls": "wallBalls",
};

export function movementIdForRaceName(name: string): string | null {
  return RACE_NAME_TO_ID[name] ?? null;
}

export function getMovement(id: string): Movement | null {
  return HYROX_MOVEMENTS[id] ?? null;
}
