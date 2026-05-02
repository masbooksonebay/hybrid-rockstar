import cycleData from "../data/programming/hr-cycle-1.json";
import stationsData from "../data/programming/hyrox-stations-2025-26.json";

export type BlockPhase = "foundation" | "build" | "peak" | "race_prep";
export type SessionType = string;
export type Wk12Variant = "racer" | "continuous";

export type StepType =
  | "warmup"
  | "main"
  | "cooldown"
  | "strength_set"
  | "rounds"
  | "emom"
  | "intervals"
  | "station_rotation";

export interface Step {
  type: StepType;
  description: string;
  duration_minutes?: number;
  rest?: string;
  details?: string[];
}

export interface SessionVersion {
  estimated_duration_minutes: number;
  structure: Step[];
}

export interface SessionScaling {
  beginner?: string;
  advanced?: string;
}

export interface SessionNotes {
  about: string;
  week_context: string;
  block_context: string;
  collision_warning?: string;
  scaling?: SessionScaling;
  substitutions?: string;
}

export interface CycleSession {
  title: string;
  stimulus: string;
  session_type?: SessionType;
  simulation_type?: string;
  optional?: boolean;
  replaces?: string;
  full_rox: SessionVersion;
  quick_rox: SessionVersion;
  notes: SessionNotes;
}

export interface BlockEntry {
  key: BlockPhase;
  label: string;
  weeks: number[];
}

export interface WeekNotes {
  about: string;
  week_context: string;
  block_context: string;
  collision_warning?: string;
}

export interface VariantWeek {
  label: string;
  session_count: number;
  intro: string;
  sequencing?: string;
  sessions: Record<string, CycleSession>;
}

export interface CycleWeek {
  cycle_week: number;
  block_phase: BlockPhase;
  block_week: number;
  title: string;
  summary: string;
  session_count?: number;
  optional_session_count?: number;
  is_divergent?: boolean;
  sessions?: Record<string, CycleSession>;
  variants?: { racer: VariantWeek; continuous: VariantWeek };
  notes: WeekNotes;
}

export interface Cycle {
  cycle_id: string;
  cycle_version: string;
  cycle_length_weeks: number;
  block_structure: BlockEntry[];
  session_type_labels: Record<string, string>;
  weeks: CycleWeek[];
}

export interface StationWeight {
  key: string;
  label: string;
  distance: string;
  weights: {
    open_men: string;
    open_women: string;
    pro_men: string;
    pro_women: string;
  };
}

export interface StationsData {
  version: string;
  source_note: string;
  divisions: string[];
  division_labels: Record<string, string>;
  stations: StationWeight[];
  run_format: string;
}

const CYCLE = cycleData as unknown as Cycle;
const STATIONS = stationsData as unknown as StationsData;

export function getCycle(): Cycle {
  return CYCLE;
}

export function getStations(): StationsData {
  return STATIONS;
}

export function getCycleWeek(weekNumber: number): CycleWeek | undefined {
  return CYCLE.weeks.find((w) => w.cycle_week === weekNumber);
}

export const BLOCK_LABELS: Record<BlockPhase, string> = {
  foundation: "Foundation",
  build: "Build",
  peak: "Peak",
  race_prep: "Race Prep",
};

export function getSessionLabel(typeKey: string): string {
  return CYCLE.session_type_labels[typeKey] ?? typeKey;
}

export function getWeekSessions(
  week: CycleWeek,
  variant?: Wk12Variant
): Array<{ key: string; session: CycleSession }> {
  if (week.is_divergent && week.variants) {
    const v = variant ?? "continuous";
    const src = week.variants[v].sessions;
    return Object.entries(src).map(([key, session]) => ({ key, session }));
  }
  if (week.sessions) {
    return Object.entries(week.sessions).map(([key, session]) => ({ key, session }));
  }
  return [];
}

export function getSession(
  week: CycleWeek,
  sessionKey: string,
  variant?: Wk12Variant
): CycleSession | undefined {
  if (week.is_divergent && week.variants) {
    const v = variant ?? "continuous";
    return week.variants[v].sessions[sessionKey];
  }
  return week.sessions?.[sessionKey];
}

export function sessionUsesStationWeights(session: CycleSession): boolean {
  const t = session.session_type;
  if (!t) return false;
  return (
    t === "compromised_running" ||
    t === "simulation" ||
    t === "hyrox_movement_pattern"
  );
}

export function blockMiniSummary(week: CycleWeek): string {
  switch (week.cycle_week) {
    case 7:
      return "Mini-deload week";
    case 8:
      return "Half-Sim";
    case 9:
      return "APEX";
    case 10:
      return "Full Sim";
    case 11:
      return "Sharpening";
    case 12:
      return "Race week / structural deload";
    default:
      return week.summary;
  }
}
