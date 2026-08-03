import type { MustSeeMap } from "../types";

const STORAGE_KEY = "roleWishes";

export function loadRoleWishes(): MustSeeMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRoleWishes(wishes: MustSeeMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
}
