import type { CalendarEvent } from "../types";

const PERFORMANCE_DURATION_MINUTES = 180; // 上演時間は一律3時間と仮定
const MAX_PLANS = 200;

export type Plan = CalendarEvent[]; // showIds と同じ順序で1公演ずつ

export type FindPlansResult = {
  plans: Plan[];
  truncated: boolean;
};

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timesConflict(date1: string, time1: string, date2: string, time2: string): boolean {
  if (date1 !== date2) return false;
  return Math.abs(toMinutes(time1) - toMinutes(time2)) < PERFORMANCE_DURATION_MINUTES;
}

export function findPlans(
  showIds: string[],
  qualifyingByShow: Record<string, CalendarEvent[]>
): FindPlansResult {
  const plans: Plan[] = [];
  let truncated = false;

  function backtrack(index: number, chosen: CalendarEvent[]) {
    if (truncated) return;
    if (index === showIds.length) {
      plans.push([...chosen]);
      if (plans.length >= MAX_PLANS) truncated = true;
      return;
    }
    const candidates = qualifyingByShow[showIds[index]] ?? [];
    for (const candidate of candidates) {
      const conflict = chosen.some(c => timesConflict(c.date, c.time, candidate.date, candidate.time));
      if (conflict) continue;
      chosen.push(candidate);
      backtrack(index + 1, chosen);
      chosen.pop();
      if (truncated) return;
    }
  }

  backtrack(0, []);
  return { plans, truncated };
}
