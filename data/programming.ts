export interface Workout {
  day: number; // 1-6, 0 = rest
  type: string; // "Run", "Stations", "Strength", "Race Sim", "Recovery"
  full: { warmup: string; main: string; notes: string };
  quick: { warmup: string; main: string; notes: string };
}

export interface WeekData {
  phase: string;
  label: string;
  note: string;
  workouts: Workout[];
}

export const PROGRAM: WeekData[] = [
  {
    phase: "BUILD",
    label: "Week 1 of 4 — Build",
    note: "Great week to start. Aerobic base and movement quality. Jump in today.",
    workouts: [
      { day: 1, type: "Run + Stations", full: { warmup: "10 min easy jog, dynamic stretches", main: "5 x 800m @ comfortable pace (rest 90s between). Then: 3 rounds — 15 wall balls, 200m farmers carry, 500m row.", notes: "Focus on pacing — these should feel controlled, not maximal." }, quick: { warmup: "5 min easy jog", main: "3 x 800m @ moderate (rest 60s). Then: 2 rounds — 12 wall balls, 100m farmers carry.", notes: "Quality over speed today." } },
      { day: 2, type: "Strength", full: { warmup: "5 min row + mobility", main: "Back Squat 4x6 @ moderate. Romanian Deadlift 3x10. Walking Lunges 3x20 steps (bodyweight). Plank holds 3x45s.", notes: "Build a base. Don't go heavy — focus on positions." }, quick: { warmup: "3 min row", main: "Goblet Squat 3x10. Walking Lunges 3x12 steps. Plank 3x30s.", notes: "Movement quality first." } },
      { day: 3, type: "Run", full: { warmup: "10 min easy jog, strides", main: "6 x 1km @ target race pace (rest 2 min walk between). Record splits.", notes: "This is your baseline. Run at the pace you'd like to hold on race day — it should be hard but sustainable." }, quick: { warmup: "5 min jog", main: "4 x 1km @ target pace (rest 90s).", notes: "Same intent, fewer reps." } },
      { day: 4, type: "Stations", full: { warmup: "1000m SkiErg easy + mobility", main: "EMOM 24 min: Min 1 — 250m SkiErg. Min 2 — 8 burpee broad jumps. Min 3 — 15 wall balls. Min 4 — rest. (6 rounds total)", notes: "Move with intention. Practice station transitions." }, quick: { warmup: "500m SkiErg", main: "EMOM 16 min: same format (4 rounds).", notes: "Smooth and steady." } },
      { day: 5, type: "Run + Strength", full: { warmup: "10 min easy", main: "3 x 1km @ race pace into 50m sled push (light) immediately after each km. Rest 3 min between rounds. Then: 3x12 sandbag lunges + 3x250m row (moderate effort).", notes: "Practice running into stations while fatigued." }, quick: { warmup: "5 min jog", main: "2 x 1km @ race pace into 30m sled push. Rest 2 min.", notes: "Feel the transition." } },
      { day: 6, type: "Easy Run", full: { warmup: "None needed", main: "30-40 min easy jog. Conversational pace. Optional: 100m sandbag lunges after with light bag.", notes: "Active recovery. Keep it genuinely easy." }, quick: { warmup: "None", main: "20 min easy jog.", notes: "Easy means easy." } },
    ],
  },
  {
    phase: "DEVELOP",
    label: "Week 2 of 4 — Develop",
    note: "Intensity picks up. Perfect time to join — just pick today's session and go.",
    workouts: [
      { day: 1, type: "Race Simulation", full: { warmup: "10 min easy jog", main: "4-station mini race: 1km run + SkiErg 1000m + 1km run + Sled Push 50m + 1km run + Rowing 1000m + 1km run + Wall Balls 75 reps. Full Open weights.", notes: "Race effort. Time everything." }, quick: { warmup: "5 min jog", main: "2-station mini: 1km run + SkiErg 500m + 1km run + Wall Balls 50 reps.", notes: "Push the pace." } },
      { day: 2, type: "Strength", full: { warmup: "5 min row + mobility", main: "Deadlift 4x5 @ moderate-heavy. Overhead Press 3x8. Pull-ups 3x8-12. Sled Push 4 x 25m (race weight). Core circuit 3 rounds.", notes: "Heavier than last week. Stay technical." }, quick: { warmup: "3 min row", main: "Deadlift 3x5. Sled Push 3 x 25m. Core 2 rounds.", notes: "Hit the key lifts." } },
      { day: 3, type: "Intervals", full: { warmup: "10 min jog, strides", main: "8 x 600m @ faster than race pace (rest 90s). Then: 3 x 200m farmers carry (Open weight) with 60s rest.", notes: "Faster turnover today. Build speed reserve." }, quick: { warmup: "5 min jog", main: "5 x 600m @ fast (rest 60s).", notes: "Push the pace." } },
      { day: 4, type: "Stations", full: { warmup: "1000m row easy", main: "For time: 1000m SkiErg + 50m sled pull + 80m burpee broad jumps + 1000m row + 100 wall balls. Open weights. Record total time.", notes: "Benchmark workout. Save this time — compare in Week 3." }, quick: { warmup: "500m row", main: "For time: 500m SkiErg + 25m sled pull + 40m BBJ + 500m row + 50 wall balls.", notes: "Half volume, full effort." } },
      { day: 5, type: "Compromised Run", full: { warmup: "10 min easy", main: "5 rounds: 1km run at race pace + 100m sandbag lunges (Open weight) + 60s rest. Record each km split.", notes: "Running on heavy legs. This is what race day feels like." }, quick: { warmup: "5 min jog", main: "3 rounds: 1km + 50m sandbag lunges + 60s rest.", notes: "Quality reps under fatigue." } },
      { day: 6, type: "Easy Run", full: { warmup: "None", main: "35-45 min easy. Include 4 x 30s pickups in the middle.", notes: "Legs will be tired. Keep it honest." }, quick: { warmup: "None", main: "25 min easy jog.", notes: "Recover." } },
    ],
  },
  {
    phase: "PEAK",
    label: "Week 3 of 4 — Peak",
    note: "High intensity and race simulation. Jump in wherever you are.",
    workouts: [
      { day: 1, type: "Full Race Sim", full: { warmup: "15 min easy jog + race warmup routine", main: "Full 8-station Hyrox simulation: 8 x 1km runs + all 8 stations in order at Open weights. Time everything — total time and all splits.", notes: "This is your dress rehearsal. Race effort. Pace the first 4 stations, push the last 4." }, quick: { warmup: "10 min jog", main: "Half race sim: 4 x 1km + Stations 1-4 (SkiErg, Sled Push, Sled Pull, BBJ) at full effort.", notes: "First half of race, full send." } },
      { day: 2, type: "Recovery + Mobility", full: { warmup: "None", main: "20 min easy row or bike. Full mobility routine: hips, ankles, thoracic spine, shoulders. Foam rolling.", notes: "Your body needs this after yesterday. Don't skip." }, quick: { warmup: "None", main: "15 min easy movement + stretching.", notes: "Active recovery." } },
      { day: 3, type: "Speed Work", full: { warmup: "10 min jog, strides", main: "6 x 400m @ 5k pace (rest 90s). Then: 4 x 200m @ fast (rest 60s). Then: 2 x 1km at race pace to finish.", notes: "Sharpen the blade. These are fast." }, quick: { warmup: "5 min jog", main: "4 x 400m @ 5k pace (rest 60s) + 2 x 200m fast.", notes: "Short and sharp." } },
      { day: 4, type: "Station Practice", full: { warmup: "500m SkiErg + mobility", main: "Practice each station individually with focus on technique: Wall balls (3 x 20), sled push/pull technique work, BBJ form drills, farmers carry grip endurance (2 x 200m). Light weight OK.", notes: "Technical polish. Not about fitness — about movement efficiency." }, quick: { warmup: "5 min easy", main: "Wall balls 2 x 20 + BBJ form drills + 1 x 200m farmers carry.", notes: "Touch each weakness." } },
      { day: 5, type: "Race Pace", full: { warmup: "10 min easy", main: "4 x 1km at exact race goal pace (rest 2 min). Then: 50m sled push + 100m sandbag lunges + 50 wall balls — all at Open weight, race effort.", notes: "Nail your pacing. The stations afterward should feel uncomfortable but doable." }, quick: { warmup: "5 min jog", main: "3 x 1km at race pace (rest 90s).", notes: "Lock in that pace." } },
      { day: 6, type: "Easy Shake Out", full: { warmup: "None", main: "20-30 min very easy jog. Strides if feeling good. Stretch.", notes: "Light legs for next week's deload." }, quick: { warmup: "None", main: "15 min easy.", notes: "Minimum effective dose." } },
    ],
  },
  {
    phase: "DELOAD",
    label: "Week 4 of 4 — Deload",
    note: "Lower volume, active recovery. Actually a perfect week to start if you're new.",
    workouts: [
      { day: 1, type: "Easy Run + Light Stations", full: { warmup: "10 min easy jog", main: "3 x 1km at easy pace (rest 2 min). Then: 2 rounds — 500m row easy, 10 wall balls light, 50m farmers carry light.", notes: "50-60% effort. Move well, don't push." }, quick: { warmup: "5 min jog", main: "2 x 1km easy + 1 round of stations at light weight.", notes: "Just moving." } },
      { day: 2, type: "Mobility", full: { warmup: "None", main: "Full mobility session: hip openers, ankle mobility, thoracic rotation, shoulder CARs, foam rolling. 30-40 min.", notes: "This IS the workout. Invest in your body." }, quick: { warmup: "None", main: "20 min focused stretching and foam rolling.", notes: "Don't skip recovery." } },
      { day: 3, type: "Easy Run", full: { warmup: "None", main: "25-35 min conversational pace. No watch, no splits. Just run.", notes: "Enjoy it. No pressure." }, quick: { warmup: "None", main: "20 min easy jog.", notes: "Easy." } },
      { day: 4, type: "Light Stations", full: { warmup: "5 min row easy", main: "1 round through all 8 stations at 50% effort, light weight where applicable. Focus on smooth movement and breathing.", notes: "Rehearsal, not workout. Walk between stations." }, quick: { warmup: "3 min row", main: "Pick 4 stations, 1 set each at 50% effort.", notes: "Light touch." } },
      { day: 5, type: "Short Intervals", full: { warmup: "10 min easy", main: "4 x 400m at race pace (rest 2 min). That's it. Short and sharp.", notes: "Keep the engine ticking. Don't do more than prescribed." }, quick: { warmup: "5 min jog", main: "3 x 400m at race pace (rest 90s).", notes: "Quick and done." } },
      { day: 6, type: "Rest or Walk", full: { warmup: "None", main: "Complete rest or 20-30 min walk. Foam roll if desired.", notes: "Trust the taper. You're ready." }, quick: { warmup: "None", main: "Rest.", notes: "Recover." } },
    ],
  },
];
