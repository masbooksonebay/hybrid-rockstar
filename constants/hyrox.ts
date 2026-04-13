export const STATIONS = [
  { name: "SkiErg", distance: "1000m", reps: null, order: 1 },
  { name: "Sled Push", distance: "50m", reps: null, order: 2 },
  { name: "Sled Pull", distance: "50m", reps: null, order: 3 },
  { name: "Burpee Broad Jumps", distance: "80m", reps: null, order: 4 },
  { name: "Rowing", distance: "1000m", reps: null, order: 5 },
  { name: "Farmers Carry", distance: "200m", reps: null, order: 6 },
  { name: "Sandbag Lunges", distance: "100m", reps: null, order: 7 },
  { name: "Wall Balls", distance: null, reps: 100, order: 8 },
] as const;

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
