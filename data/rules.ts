export interface RuleSection {
  title: string;
  items: { heading: string; body: string }[];
}

export const RULES: RuleSection[] = [
  {
    title: "General Race Rules",
    items: [
      { heading: "Race format", body: "A Hyrox race consists of 8 x 1km runs, each followed by one functional workout station, completed in a fixed order. Total distance is 8km of running plus 8 stations." },
      { heading: "Wave starts", body: "Athletes start in assigned waves at scheduled times. You must be in your wave corral before your start time. Late arrivals may be moved to a later wave or disqualified." },
      { heading: "Timing", body: "Chip timing is used. Your time starts when your wave crosses the start mat and ends when you cross the finish mat. Transition times between stations count toward your total." },
      { heading: "Course markings", body: "Follow all course markings and directions from marshals. Cutting the course or skipping sections results in disqualification." },
      { heading: "Equipment", body: "Athletes must use the equipment provided at each station. Personal equipment such as gloves or lifting straps is not permitted at most stations unless specified." },
      { heading: "Assistance", body: "External coaching or physical assistance during the race is not permitted. Athletes must complete all work independently (except in Doubles)." },
      { heading: "Age groups", body: "Age group categories include 16-24, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60-64, 65-69, and 70+. Age is determined by birth year." },
    ],
  },
  {
    title: "Station 1: SkiErg",
    items: [
      { heading: "Distance", body: "1000 meters on a Concept2 SkiErg." },
      { heading: "Movement standard", body: "Athletes pull both handles simultaneously in a downward motion. The monitor must reach 1000m before the athlete leaves the station. Any pulling technique is permitted." },
      { heading: "Weights", body: "No external weight. Damper setting is athlete's choice." },
    ],
  },
  {
    title: "Station 2: Sled Push",
    items: [
      { heading: "Distance", body: "50 meters on a track." },
      { heading: "Movement standard", body: "Push the sled with both hands on the vertical posts. The sled must cross the finish line completely. Athletes may not pull the sled or use ropes." },
      { heading: "Open weights", body: "Male: 152kg total sled weight. Female: 102kg total sled weight." },
      { heading: "Pro weights", body: "Male: 225kg total sled weight. Female: 152kg total sled weight." },
    ],
  },
  {
    title: "Station 3: Sled Pull",
    items: [
      { heading: "Distance", body: "50 meters on a track." },
      { heading: "Movement standard", body: "Pull the sled toward you using the attached rope while staying in a fixed position. Once the sled reaches you, move to the end of the rope and repeat until 50m is complete. Athletes may not walk backward while holding the rope." },
      { heading: "Open weights", body: "Male: 103kg total sled weight. Female: 78kg total sled weight." },
      { heading: "Pro weights", body: "Male: 152kg total sled weight. Female: 103kg total sled weight." },
    ],
  },
  {
    title: "Station 4: Burpee Broad Jumps",
    items: [
      { heading: "Distance", body: "80 meters total." },
      { heading: "Movement standard", body: "From standing, drop to the ground with chest and thighs touching the floor. Push up, then jump forward with both feet leaving the ground simultaneously. Each rep must show full extension at the top and chest-to-floor contact at the bottom. Landing must be with both feet." },
      { heading: "Weights", body: "Bodyweight only. No external load." },
    ],
  },
  {
    title: "Station 5: Rowing",
    items: [
      { heading: "Distance", body: "1000 meters on a Concept2 rowing machine." },
      { heading: "Movement standard", body: "Row using any technique. The monitor must reach 1000m before leaving. Damper setting is athlete's choice." },
      { heading: "Weights", body: "No external weight." },
    ],
  },
  {
    title: "Station 6: Farmers Carry",
    items: [
      { heading: "Distance", body: "200 meters." },
      { heading: "Movement standard", body: "Carry two kettlebells by the handles, one in each hand. Walk the full 200m. If you set the kettlebells down, you must pick them up and continue from where you stopped. Running is permitted." },
      { heading: "Open weights", body: "Male: 2x24kg. Female: 2x16kg." },
      { heading: "Pro weights", body: "Male: 2x32kg. Female: 2x24kg." },
    ],
  },
  {
    title: "Station 7: Sandbag Lunges",
    items: [
      { heading: "Distance", body: "100 meters of walking lunges." },
      { heading: "Movement standard", body: "Carry the sandbag on your shoulders or in a bear hug position. Perform walking lunges where the trailing knee touches or nearly touches the ground on each rep. Full hip extension at the top of each step." },
      { heading: "Open weights", body: "Male: 20kg sandbag. Female: 10kg sandbag." },
      { heading: "Pro weights", body: "Male: 30kg sandbag. Female: 20kg sandbag." },
    ],
  },
  {
    title: "Station 8: Wall Balls",
    items: [
      { heading: "Reps", body: "100 reps." },
      { heading: "Movement standard", body: "Hold the medicine ball, squat below parallel (hip crease below knee), then stand and throw the ball to hit the target line on the wall. The ball must visibly contact at or above the target line. Catch and repeat. Reps where the ball does not reach the line do not count." },
      { heading: "Open weights", body: "Male: 6kg ball to 9ft target. Female: 4kg ball to 9ft target." },
      { heading: "Pro weights", body: "Male: 9kg ball to 10ft target. Female: 6kg ball to 10ft target." },
    ],
  },
  {
    title: "Divisions & Weights",
    items: [
      { heading: "Open", body: "Standard division. Open to all athletes regardless of competitive experience. Uses standard weights listed per station." },
      { heading: "Pro", body: "Elite division with heavier weights and higher wall ball targets. Athletes must qualify or self-select into Pro." },
      { heading: "Doubles", body: "Two athletes complete the race together. They run all 8km together but split station work — one athlete does odd stations, the other does even stations (or vice versa). Uses Open weights." },
      { heading: "Mixed Doubles", body: "Same as Doubles but with one male and one female athlete. Each uses their gender-specific Open weights at their assigned stations." },
      { heading: "Relay", body: "Teams of 4 athletes. Each athlete completes 2 runs and 2 stations in order. The baton passes at designated exchange zones." },
    ],
  },
  {
    title: "Penalties",
    items: [
      { heading: "Incomplete reps", body: "If a judge determines a rep does not meet the movement standard, the athlete must redo that rep. There is no time penalty — you simply must complete the work correctly before moving on." },
      { heading: "Skipping stations", body: "Skipping a station or portion of the course results in disqualification." },
      { heading: "Outside assistance", body: "Receiving physical assistance from anyone other than race officials results in disqualification. Verbal encouragement from spectators is permitted." },
      { heading: "Unsportsmanlike conduct", body: "Aggressive behavior, interference with other athletes, or abuse of race officials results in disqualification." },
      { heading: "Equipment misuse", body: "Intentionally damaging equipment or using it in an unsafe manner may result in disqualification." },
    ],
  },
  {
    title: "Doubles Rules",
    items: [
      { heading: "Running", body: "Both athletes must run all 8 x 1km segments together. They must stay within approximately 5 meters of each other during running segments." },
      { heading: "Station work", body: "Partners split stations — one athlete completes odd-numbered stations (SkiErg, Sled Pull, Rowing, Sandbag Lunges), the other completes even-numbered stations (Sled Push, Burpee Broad Jumps, Farmers Carry, Wall Balls). The split is decided before the race and cannot change." },
      { heading: "Waiting", body: "The non-working partner must wait in the designated area during station work." },
      { heading: "Weights", body: "Doubles uses Open division weights regardless of athletic ability." },
    ],
  },
  {
    title: "Relay Rules",
    items: [
      { heading: "Team size", body: "4 athletes per relay team." },
      { heading: "Legs", body: "Each athlete completes 2 running legs and 2 stations in order: Athlete 1 does Run 1 + SkiErg + Run 2 + Sled Push, Athlete 2 does Run 3 + Sled Pull + Run 4 + Burpee Broad Jumps, etc." },
      { heading: "Exchange zones", body: "The baton must be passed in designated exchange zones. Passing outside the zone results in a penalty." },
      { heading: "Weights", body: "Relay uses Open division weights." },
    ],
  },
];
