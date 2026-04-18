import { Format, Tier } from "./store";

export type StationSlug =
  | "sled_push"
  | "sled_pull"
  | "farmers_carry"
  | "sandbag_lunges"
  | "wall_balls";

export interface StationWeight {
  primary: string;
  secondary?: string;
  reps?: number;
}

interface PerGenderWeight {
  male: { primary: string; reps?: number };
  female: { primary: string; reps?: number };
}

const SLED_PUSH: Record<"open" | "pro", PerGenderWeight> = {
  open: { male: { primary: "152kg" }, female: { primary: "102kg" } },
  pro: { male: { primary: "202kg" }, female: { primary: "132kg" } },
};

const SLED_PULL: Record<"open" | "pro", PerGenderWeight> = {
  open: { male: { primary: "103kg" }, female: { primary: "78kg" } },
  pro: { male: { primary: "153kg" }, female: { primary: "103kg" } },
};

const FARMERS_CARRY: Record<"open" | "pro", PerGenderWeight> = {
  open: { male: { primary: "2x24kg" }, female: { primary: "2x16kg" } },
  pro: { male: { primary: "2x32kg" }, female: { primary: "2x24kg" } },
};

const SANDBAG_LUNGES: Record<"open" | "pro", PerGenderWeight> = {
  open: { male: { primary: "20kg" }, female: { primary: "10kg" } },
  pro: { male: { primary: "30kg" }, female: { primary: "20kg" } },
};

const WALL_BALLS: Record<"open" | "pro", PerGenderWeight> = {
  open: { male: { primary: "9kg", reps: 100 }, female: { primary: "6kg", reps: 75 } },
  pro: { male: { primary: "9kg", reps: 100 }, female: { primary: "6kg", reps: 75 } },
};

const TABLES: Record<StationSlug, Record<"open" | "pro", PerGenderWeight>> = {
  sled_push: SLED_PUSH,
  sled_pull: SLED_PULL,
  farmers_carry: FARMERS_CARRY,
  sandbag_lunges: SANDBAG_LUNGES,
  wall_balls: WALL_BALLS,
};

export interface DivisionContext {
  format: Format | null;
  tier: Tier | null;
  gender: string | null;
}

function effectiveTier(format: Format | null, tier: Tier | null): "open" | "pro" {
  if (format === "Individual" && tier === "Pro") return "pro";
  return "open";
}

export function getStationWeight(
  slug: StationSlug,
  ctx: DivisionContext
): StationWeight | null {
  if (!ctx.format) return null;
  const eff = effectiveTier(ctx.format, ctx.tier);
  const table = TABLES[slug][eff];

  if (ctx.format === "Mixed Doubles") {
    const m = table.male;
    const f = table.female;
    return {
      primary: `M ${m.primary} / F ${f.primary}`,
      reps: m.reps,
    };
  }

  const g = ctx.gender === "Female" ? "female" : ctx.gender === "Male" ? "male" : null;
  if (!g) return null;
  const v = table[g];
  return { primary: v.primary, reps: v.reps };
}

export const STATION_LABELS: Record<StationSlug, string> = {
  sled_push: "Sled Push",
  sled_pull: "Sled Pull",
  farmers_carry: "Farmers Carry",
  sandbag_lunges: "Sandbag Lunges",
  wall_balls: "Wall Balls",
};
