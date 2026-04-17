export interface RaceSegment {
  kind: "run" | "station";
  order: number;
  name: string;
  distance: string | null;
  reps: number | null;
}

export const RACE_SEQUENCE: RaceSegment[] = [
  { kind: "run", order: 1, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 2, name: "SkiErg", distance: "1000m", reps: null },
  { kind: "run", order: 3, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 4, name: "Sled Push", distance: "50m", reps: null },
  { kind: "run", order: 5, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 6, name: "Sled Pull", distance: "50m", reps: null },
  { kind: "run", order: 7, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 8, name: "Burpee Broad Jumps", distance: "80m", reps: null },
  { kind: "run", order: 9, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 10, name: "Rowing", distance: "1000m", reps: null },
  { kind: "run", order: 11, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 12, name: "Farmers Carry", distance: "200m", reps: null },
  { kind: "run", order: 13, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 14, name: "Sandbag Lunges", distance: "100m", reps: null },
  { kind: "run", order: 15, name: "1km Run", distance: "1000m", reps: null },
  { kind: "station", order: 16, name: "Wall Balls", distance: null, reps: 100 },
];

export const STATIONS = RACE_SEQUENCE.filter((s) => s.kind === "station");

export interface DivisionWeights {
  sledPush: string;
  sledPull: string;
  farmersCarry: string;
  sandbagLunges: string;
  wallBalls: string;
  wallBallHeight: string;
}

export const WEIGHTS: Record<string, DivisionWeights> = {
  "Open Male": { sledPush: "152kg", sledPull: "103kg", farmersCarry: "2x24kg", sandbagLunges: "20kg", wallBalls: "6kg", wallBallHeight: "9ft" },
  "Open Female": { sledPush: "102kg", sledPull: "78kg", farmersCarry: "2x16kg", sandbagLunges: "10kg", wallBalls: "4kg", wallBallHeight: "9ft" },
  "Pro Male": { sledPush: "225kg", sledPull: "152kg", farmersCarry: "2x32kg", sandbagLunges: "30kg", wallBalls: "9kg", wallBallHeight: "10ft" },
  "Pro Female": { sledPush: "152kg", sledPull: "103kg", farmersCarry: "2x24kg", sandbagLunges: "20kg", wallBalls: "6kg", wallBallHeight: "10ft" },
  "Doubles Male": { sledPush: "152kg", sledPull: "103kg", farmersCarry: "2x24kg", sandbagLunges: "20kg", wallBalls: "6kg", wallBallHeight: "9ft" },
  "Doubles Female": { sledPush: "102kg", sledPull: "78kg", farmersCarry: "2x16kg", sandbagLunges: "10kg", wallBalls: "4kg", wallBallHeight: "9ft" },
};

export const DIVISIONS = ["Open", "Pro", "Doubles", "Mixed Doubles", "Relay"] as const;
export const GENDERS = ["Male", "Female"] as const;
