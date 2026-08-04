import { useMemo, useState, useEffect } from "react";
import type { CalendarEvent } from "../types";
import { TICKET_STATUS_COLOR, TICKET_STATUS_LABEL } from "../types";
import { useTicketStatuses } from "../hooks/useTicketStatuses";
import { useRoleWishes } from "../hooks/useRoleWishes";
import { performanceQualifies } from "../lib/castMatch";
import { getJapaneseHolidays } from "../lib/japaneseHolidays";

import { Box, Button, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

type Props = {
  events: CalendarEvent[];
  selectedShowIds: string[];
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

export function MonthCalendar({ events, selectedShowIds }: Props) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { getStatus, cycleStatus } = useTicketStatuses();
  const { wishesByShow } = useRoleWishes();

  const formatMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const [currentMonth, setCurrentMonth] =  useState<string>(formatMonth(new Date()));

  // 「観たい作品」でチェックされている作品のみ、かつキャスト希望を満たす公演だけに絞る
  // （キャスト希望は会場違いをまとめてタイトル単位で持っているのでtitleで参照する）
  const visibleEvents = useMemo(
    () =>
      events.filter(
        e => selectedShowIds.includes(e.showId) && performanceQualifies(e.roles, wishesByShow[e.title] ?? {})
      ),
    [events, selectedShowIds, wishesByShow]
  );

  // 日付ごとにイベントをまとめる
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of visibleEvents) {
      (map[e.date] ??= []).push(e);
    }
    // その日内は時間順に並べとく
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [visibleEvents]);

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

  // 表示範囲にまたがる年の祝日をまとめて計算
  const holidaysByYmd = useMemo(() => {
    const years = new Set(cells.map(d => d.getFullYear()));
    const map = new Map<string, string>();
    for (const y of years) {
      for (const [ymd, name] of getJapaneseHolidays(y)) map.set(ymd, name);
    }
    return map;
  }, [cells]);

  function dateColor(d: Date, ymd: string): string | undefined {
    if (d.getDay() === 0 || holidaysByYmd.has(ymd)) return "#dc2626"; // 日・祝
    if (d.getDay() === 6) return "#2563eb"; // 土
    return undefined;
  }

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
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
        <div />
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
          <IconButton size="small" onClick={() => setCurrentMonth(m => shiftMonth(m, -1))} aria-label="前の月">
            <ChevronLeftIcon />
          </IconButton>
          <div style={{ fontWeight: 700 }}>{monthLabel}</div>
          <IconButton size="small" onClick={() => setCurrentMonth(m => shiftMonth(m, 1))} aria-label="次の月">
            <ChevronRightIcon />
          </IconButton>
        </div>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            const today = new Date();
            const ymd = toYmd(new Date());
            setCurrentMonth(formatMonth(today));
            setSelectedDate(ymd);
          }}
          sx={{ justifySelf: "end" }}
        >
          今日
        </Button>
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
          const dayEvents = eventsByDate[ymd] ?? [];
          const isSelected = selectedDate === ymd;
          const isToday = ymd === toYmd(new Date());

          return (
            <button
              key={ymd}
              onClick={() => setSelectedDate(ymd)}
              style={{
                position: "relative",
                textAlign: "left",
                padding: 8,
                minHeight: 72,
                border: isToday ? "2px solid #f59e0b" : "1px solid #ddd",
                borderRadius: 10,
                background: isSelected ? "#f3f4f6" : "white",
                opacity: inThisMonth ? 1 : 0.45,
                cursor: "pointer",
              }}
            >
              <div style={{ position: "absolute", top: 6, left: 8, fontWeight: 700, color: dateColor(d, ymd) }}>
                {d.getDate()}
              </div>
              {dayEvents.length > 0 && (
                <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {dayEvents.map(e => (
                    <span key={e.id} style={{ position: "relative", fontSize: 16, lineHeight: 1 }}>
                      {e.emoji}
                      <span
                        style={{
                          position: "absolute",
                          right: -2,
                          bottom: -2,
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          border: "1px solid white",
                          background: TICKET_STATUS_COLOR[getStatus(e.id)],
                        }}
                      />
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 選択日の詳細 */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          {selectedDate ? selectedDate.split("-").join("/") : "日付を選ぶと公演が出るよ"}
        </div>

        {selectedDate && selectedEvents.length === 0 && <div>この日は公演なし</div>}

        {selectedDate && selectedEvents.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 6, listStyle: "none", maxHeight: 320, overflowY: "auto" }}>
            {selectedEvents.map((e) => (
              <li key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                <div>
                  <div>
                    {e.time} {e.title}（{e.theatre}）
                    {e.note && <span style={{ marginLeft: 6, fontSize: 11, color: "#b45309" }}>[{e.note}]</span>}
                  </div>
                  {e.roles && e.roles.length > 0 && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {e.roles.map(r => r.actor).join(" / ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => cycleStatus(e.id)}
                  style={{
                    marginLeft: "auto",
                    flexShrink: 0,
                    width: 74,
                    whiteSpace: "nowrap",
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
