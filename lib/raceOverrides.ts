import AsyncStorage from "@react-native-async-storage/async-storage";

export type Scenario = "predict" | "goal";

export interface SegmentOverride {
  weight?: string;
  reps?: string;
  time?: string;
}

export type ScenarioOverrides = Record<number, SegmentOverride>;

const segKey = (s: Scenario, order: number, field: "weight" | "reps" | "time") =>
  `hr_${s}_station_override_${order}_${field}`;

export const PREDICT_PACE_KEY = "hr_predict_1km_pace";
export const GOAL_FINISH_KEY = "hr_goal_finish_time";

export async function loadScenarioOverrides(
  scenario: Scenario,
  orders: number[]
): Promise<ScenarioOverrides> {
  const keys: string[] = [];
  for (const o of orders) {
    keys.push(segKey(scenario, o, "weight"), segKey(scenario, o, "reps"), segKey(scenario, o, "time"));
  }
  const pairs = await AsyncStorage.multiGet(keys);
  const out: ScenarioOverrides = {};
  for (const [k, v] of pairs) {
    if (!v) continue;
    const match = k.match(/hr_(predict|goal)_station_override_(\d+)_(weight|reps|time)/);
    if (!match) continue;
    const order = parseInt(match[2], 10);
    const field = match[3] as keyof SegmentOverride;
    if (!out[order]) out[order] = {};
    out[order][field] = v;
  }
  return out;
}

export async function saveSegmentOverride(
  scenario: Scenario,
  order: number,
  override: SegmentOverride
): Promise<void> {
  const ops: [string, string][] = [];
  const removals: string[] = [];
  for (const field of ["weight", "reps", "time"] as const) {
    const val = override[field];
    if (val !== undefined && val !== "") ops.push([segKey(scenario, order, field), val]);
    else removals.push(segKey(scenario, order, field));
  }
  if (ops.length) await AsyncStorage.multiSet(ops);
  if (removals.length) await AsyncStorage.multiRemove(removals);
}

export async function clearSegmentOverride(scenario: Scenario, order: number): Promise<void> {
  await AsyncStorage.multiRemove([
    segKey(scenario, order, "weight"),
    segKey(scenario, order, "reps"),
    segKey(scenario, order, "time"),
  ]);
}

export async function loadTopInput(scenario: Scenario): Promise<string> {
  const key = scenario === "predict" ? PREDICT_PACE_KEY : GOAL_FINISH_KEY;
  return (await AsyncStorage.getItem(key)) ?? "";
}

export async function saveTopInput(scenario: Scenario, value: string): Promise<void> {
  const key = scenario === "predict" ? PREDICT_PACE_KEY : GOAL_FINISH_KEY;
  if (value.trim() === "") {
    await AsyncStorage.removeItem(key);
  } else {
    await AsyncStorage.setItem(key, value.trim());
  }
}

export async function countGoalTimeOverrides(orders: number[]): Promise<number> {
  const keys = orders.map((o) => segKey("goal", o, "time"));
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs.filter(([, v]) => v != null && v !== "").length;
}

const MIGRATION_FLAG_KEY = "hr_raceoverrides_migrated_v1";

const SLUG_TO_ORDER: Record<string, number> = {
  sled_push: 4,
  sled_pull: 6,
  farmers_carry: 12,
  sandbag_lunges: 14,
  wall_balls: 16,
};

export async function migrateBuildCIfNeeded(): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
  if (done) return;

  const legacyKeys: string[] = [];
  for (const slug of Object.keys(SLUG_TO_ORDER)) {
    legacyKeys.push(`hr_station_override_${slug}_weight`, `hr_station_override_${slug}_reps`);
  }
  for (let order = 1; order <= 16; order++) {
    legacyKeys.push(`hr_station_override_segment_${order}_time`);
  }

  const pairs = await AsyncStorage.multiGet(legacyKeys);
  const ops: [string, string][] = [];

  for (const [k, v] of pairs) {
    if (!v) continue;
    const weightReps = k.match(/hr_station_override_(.+)_(weight|reps)$/);
    if (weightReps) {
      const order = SLUG_TO_ORDER[weightReps[1]];
      if (order) ops.push([segKey("predict", order, weightReps[2] as "weight" | "reps"), v]);
      continue;
    }
    const timeMatch = k.match(/hr_station_override_segment_(\d+)_time/);
    if (timeMatch) {
      ops.push([segKey("predict", parseInt(timeMatch[1], 10), "time"), v]);
    }
  }

  if (ops.length) await AsyncStorage.multiSet(ops);

  const presentLegacyKeys = pairs.filter(([, v]) => v != null).map(([k]) => k);
  if (presentLegacyKeys.length) await AsyncStorage.multiRemove(presentLegacyKeys);

  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "true");
}
