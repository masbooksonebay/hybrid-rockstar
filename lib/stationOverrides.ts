import AsyncStorage from "@react-native-async-storage/async-storage";
import { StationSlug } from "./divisions";

export interface StationOverride {
  weight?: string;
  reps?: string;
}

const weightKey = (slug: StationSlug) => `hr_station_override_${slug}_weight`;
const repsKey = (slug: StationSlug) => `hr_station_override_${slug}_reps`;
const segmentTimeKey = (order: number) => `hr_station_override_segment_${order}_time`;

export async function loadAllOverrides(
  slugs: StationSlug[]
): Promise<Record<StationSlug, StationOverride>> {
  const keys: string[] = [];
  for (const s of slugs) {
    keys.push(weightKey(s), repsKey(s));
  }
  const pairs = await AsyncStorage.multiGet(keys);
  const map: Record<string, StationOverride> = {};
  for (const s of slugs) map[s] = {};
  for (const [k, v] of pairs) {
    if (!v) continue;
    for (const s of slugs) {
      if (k === weightKey(s)) map[s].weight = v;
      else if (k === repsKey(s)) map[s].reps = v;
    }
  }
  return map as Record<StationSlug, StationOverride>;
}

export async function saveOverride(slug: StationSlug, override: StationOverride): Promise<void> {
  const ops: [string, string][] = [];
  const removals: string[] = [];
  if (override.weight !== undefined && override.weight !== "") ops.push([weightKey(slug), override.weight]);
  else removals.push(weightKey(slug));
  if (override.reps !== undefined && override.reps !== "") ops.push([repsKey(slug), override.reps]);
  else removals.push(repsKey(slug));
  if (ops.length) await AsyncStorage.multiSet(ops);
  if (removals.length) await AsyncStorage.multiRemove(removals);
}

export async function clearOverride(slug: StationSlug): Promise<void> {
  await AsyncStorage.multiRemove([weightKey(slug), repsKey(slug)]);
}

export async function loadAllSegmentTimes(
  orders: number[]
): Promise<Record<number, string>> {
  const keys = orders.map(segmentTimeKey);
  const pairs = await AsyncStorage.multiGet(keys);
  const map: Record<number, string> = {};
  for (const [k, v] of pairs) {
    if (!v) continue;
    const match = k.match(/hr_station_override_segment_(\d+)_time/);
    if (match) map[parseInt(match[1], 10)] = v;
  }
  return map;
}

export async function saveSegmentTime(order: number, time: string | undefined): Promise<void> {
  if (time && time.trim() !== "") {
    await AsyncStorage.setItem(segmentTimeKey(order), time.trim());
  } else {
    await AsyncStorage.removeItem(segmentTimeKey(order));
  }
}

export async function clearSegmentTime(order: number): Promise<void> {
  await AsyncStorage.removeItem(segmentTimeKey(order));
}
