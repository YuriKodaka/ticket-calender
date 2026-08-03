import { useMemo, useState, useEffect } from "react";
import type { CalendarEvent, TicketStatus } from "../types";
import { TICKET_STATUS_COLOR, TICKET_STATUS_LABEL } from "../types";
import { useTicketStatuses } from "../hooks/useTicketStatuses";

import { Box } from '@mui/material';

type Props = {
  events: CalendarEvent[];
};

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const shiftMonth = (ym: string, diff: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + diff, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// その日の公演の中で一番「進んでいる」状態を代表として表示する
function bestStatus(dayEvents: CalendarEvent[], getStatus: (eventId: string) => TicketStatus): TicketStatus {
  if (dayEvents.some(e => getStatus(e.id) === "secured")) return "secured";
  if (dayEvents.some(e => getStatus(e.id) === "considering")) return "considering";
  return "none";
}

export function MonthCalendar({ events }: Props) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { getStatus, cycleStatus } = useTicketStatuses();

  const formatMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const [currentMonth, setCurrentMonth] =  useState<string>(formatMonth(new Date()));
  
  // 日付ごとにイベントをまとめる
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      (map[e.date] ??= []).push(e);
    }
    // その日内は時間順に並べとく
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [events]);

  // 月表示に必要なセル（週の頭から週の終わりまで）を作る
  const cells = useMemo(() => {
    const first = startOfMonth(viewDate);
    const last = endOfMonth(viewDate);

    // 日曜始まり（0=Sun）
    const start = addDays(first, -first.getDay());
    const end = addDays(last, 6 - last.getDay());

    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [viewDate]);

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split("-");
    return `${y}年${Number(m)}月`;
  }, [currentMonth]);

  const selectedEvents = useMemo(() => (selectedDate ? (eventsByDate[selectedDate] ?? []) : []),
    [selectedDate, eventsByDate]
  );

  useEffect(() => {
    setSelectedDate(null);

    const [y, m] = currentMonth.split("-").map(Number);
    setViewDate(new Date(y, m - 1, 1));
  }, [currentMonth]);

  return (
    <Box style={{ display: "grid", gap: 12 }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => setCurrentMonth(m => shiftMonth(m, -1))}>
          ←
        </button>
        <div style={{ fontWeight: 700 }}>{monthLabel}</div>
        <button onClick={() => setCurrentMonth(m => shiftMonth(m, 1))}>
          →
        </button>
        <button onClick={() => {
          const today = new Date();
          const ymd = toYmd(new Date());
          setCurrentMonth(formatMonth(today));
          setSelectedDate(ymd);
        }}
        style={{ marginLeft: "auto" }}>
          今日
        </button>
      </div>

      {/* 曜日 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
          <div key={w} style={{ fontWeight: 700, textAlign: "center" }}>
            {w}
          </div>
        ))}
      </div>

      {/* グリッド */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {cells.map((d) => {
          const ymd = toYmd(d);
          const inThisMonth = d.getMonth() === viewDate.getMonth();
          const count = (eventsByDate[ymd]?.length ?? 0);
          const isSelected = selectedDate === ymd;

          return (
            <button
              key={ymd}
              onClick={() => setSelectedDate(ymd)}
              style={{
                textAlign: "left",
                padding: 8,
                minHeight: 72,
                border: "1px solid #ddd",
                borderRadius: 10,
                background: isSelected ? "#f3f4f6" : "white",
                opacity: inThisMonth ? 1 : 0.45,
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700 }}>{d.getDate()}</div>
              {count > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: TICKET_STATUS_COLOR[bestStatus(eventsByDate[ymd] ?? [], getStatus)],
                    }}
                  />
                  🎭 {count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 選択日の詳細 */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          {selectedDate ? `${selectedDate} の公演` : "日付を選ぶと公演が出るよ"}
        </div>

        {selectedDate && selectedEvents.length === 0 && <div>この日は公演なし</div>}

        {selectedDate && selectedEvents.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 6, listStyle: "none" }}>
            {selectedEvents.map((e) => (
              <li key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span>
                  {e.time} {e.title}（{e.theatre}）
                  {e.note && <span style={{ marginLeft: 6, fontSize: 11, color: "#b45309" }}>[{e.note}]</span>}
                </span>
                <button
                  onClick={() => cycleStatus(e.id)}
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 999,
                    border: "1px solid #ccc",
                    background: TICKET_STATUS_COLOR[getStatus(e.id)],
                    cursor: "pointer",
                  }}
                >
                  {TICKET_STATUS_LABEL[getStatus(e.id)]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Box>
  );
}
