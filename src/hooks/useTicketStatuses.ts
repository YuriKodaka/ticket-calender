import { useCallback, useEffect, useState } from "react";
import type { TicketStatus } from "../types";
import {
  loadTicketStatuses,
  saveTicketStatuses,
  type TicketStatusMap,
} from "../lib/ticketStatusRepository";

const STATUS_ORDER: TicketStatus[] = ["none", "considering", "secured"];

export function useTicketStatuses() {
  const [statuses, setStatuses] = useState<TicketStatusMap>(() => loadTicketStatuses());

  useEffect(() => {
    saveTicketStatuses(statuses);
  }, [statuses]);

  const getStatus = useCallback(
    (eventId: string): TicketStatus => statuses[eventId] ?? "none",
    [statuses]
  );

  const cycleStatus = useCallback((eventId: string) => {
    setStatuses(prev => {
      const current = prev[eventId] ?? "none";
      const nextIndex = (STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length;
      return { ...prev, [eventId]: STATUS_ORDER[nextIndex] };
    });
  }, []);

  return { getStatus, cycleStatus };
}
