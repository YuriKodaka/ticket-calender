export type RoleAssignment = { role: string; actor: string };

export type CalendarEvent = {
  id: string;
  showId: string;
  title: string;
  date: string;
  time: string;
  theatre: string;
  roles?: RoleAssignment[];
  note?: string; // 「貸切」など、CSVの備考列
};

export type RoleWishes = Record<string, string[]>; // role -> 許容する俳優名（空/未設定ならその役は誰でもOK）
export type MustSeeMap = Record<string, RoleWishes>; // showId -> RoleWishes

export type TicketStatus = "none" | "considering" | "secured";

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  none: "未定",
  considering: "検討中",
  secured: "確保済み",
};

export const TICKET_STATUS_COLOR: Record<TicketStatus, string> = {
  none: "#d1d5db",
  considering: "#f59e0b",
  secured: "#22c55e",
};