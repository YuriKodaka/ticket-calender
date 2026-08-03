import type { RoleAssignment, RoleWishes } from "../types";

// 役ごとに1人以上チェックされている場合のみ制約とする（未チェックの役は誰でもOK）
export function performanceQualifies(roles: RoleAssignment[] | undefined, wish: RoleWishes): boolean {
  const constraints = Object.entries(wish).filter(([, actors]) => actors.length > 0);
  if (constraints.length === 0) return true;
  if (!roles) return false;
  return constraints.every(([role, actors]) =>
    roles.some(r => r.role === role && actors.includes(r.actor))
  );
}
