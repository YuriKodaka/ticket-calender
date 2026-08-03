import type { TicketStatus } from "../types";

const STORAGE_KEY = "ticketStatuses";

export type TicketStatusMap = Record<string, TicketStatus>;

export function loadTicketStatuses(): TicketStatusMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTicketStatuses(statuses: TicketStatusMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
}
