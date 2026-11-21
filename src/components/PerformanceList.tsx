import { useMemo, useState } from "react";
import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import type { CalendarEvent } from "../types";
import { TICKET_STATUS_COLOR, TICKET_STATUS_LABEL } from "../types";
import { useTicketStatuses } from "../hooks/useTicketStatuses";
import { useRoleWishes } from "../hooks/useRoleWishes";
import { performanceQualifies } from "../lib/castMatch";
import { getJapaneseHolidays } from "../lib/japaneseHolidays";

type Props = {
  events: CalendarEvent[];
  selectedShowIds: string[];
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// カレンダーと同じ絞り込み（観たい作品＋キャスト希望）の公演を、作品混在で日付順に並べた一覧
export function PerformanceList({ events, selectedShowIds }: Props) {
  const { getStatus, cycleStatus } = useTicketStatuses();
  const { wishesByShow } = useRoleWishes();
  const [showPast, setShowPast] = useState(false);

  const today = todayYmd();

  const listed = useMemo(
    () =>
      events
        .filter(e => selectedShowIds.includes(e.showId))
        .filter(e => performanceQualifies(e.roles, wishesByShow[e.title] ?? {}))
        .filter(e => showPast || e.date >= today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [events, selectedShowIds, wishesByShow, showPast, today]
  );

  // 月ごとにまとめる（"2026-12" → 公演）
  const byMonth = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of listed) {
      const ym = e.date.slice(0, 7);
      map.set(ym, [...(map.get(ym) ?? []), e]);
    }
    return map;
  }, [listed]);

  const holidays = useMemo(() => {
    const years = new Set(listed.map(e => Number(e.date.slice(0, 4))));
    const set = new Set<string>();
    for (const y of years) for (const [ymd] of getJapaneseHolidays(y)) set.add(ymd);
    return set;
  }, [listed]);

  function dateLabel(ymd: string): { text: string; color?: string } {
    const [y, m, d] = ymd.split("-").map(Number);
    const wd = new Date(y, m - 1, d).getDay();
    const color = wd === 0 || holidays.has(ymd) ? "#dc2626" : wd === 6 ? "#2563eb" : undefined; // 日・祝 / 土
    return { text: `${m}/${d}(${WEEKDAYS[wd]})`, color };
  }

  return (
    // minmax(0, 1fr)：中身が長くてもグリッドの列が画面幅より広がらないようにする
    <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 1, width: "100%", maxWidth: 640, mx: "auto", p: 2, boxSizing: "border-box" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 700 }}>{listed.length}件</Typography>
        <FormControlLabel
          control={<Switch size="small" checked={showPast} onChange={e => setShowPast(e.target.checked)} />}
          label="終わった公演も表示"
          slotProps={{ typography: { variant: "body2" } }}
          sx={{ mr: 0 }}
        />
      </Box>

      {listed.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          表示する公演がありません。観たい作品タブで作品にチェックを入れてください。
        </Typography>
      )}

      {[...byMonth.entries()].map(([ym, monthEvents]) => (
        <Box key={ym}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, py: 0.5, borderBottom: 1, borderColor: "divider" }}
          >
            {Number(ym.slice(0, 4))}年{Number(ym.slice(5))}月
          </Typography>
          {monthEvents.map((e, i) => {
            const { text, color } = dateLabel(e.date);
            const status = getStatus(e.id);
            // 同じ日の公演はまとめる：日付は1公演目だけに出し、区切り線は日の最後にだけ引く
            const firstOfDay = i === 0 || monthEvents[i - 1].date !== e.date;
            const lastOfDay = i === monthEvents.length - 1 || monthEvents[i + 1].date !== e.date;
            return (
              <Box
                key={e.id}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                  pt: firstOfDay ? 1 : 0.5,
                  pb: lastOfDay ? 1 : 0.5,
                  borderBottom: lastOfDay ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                <Box sx={{ width: "4.8em", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {firstOfDay && <Box sx={{ fontWeight: 700, color }}>{text}</Box>}
                  <Box sx={{ fontSize: 13, color: "text.secondary" }}>{e.time}</Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                  <Box>
                    {e.emoji}{e.title}
                    <Typography component="span" variant="body2" color="text.secondary">（{e.theatre}）</Typography>
                  </Box>
                  {/* 「貸切・アフタートーク」のような区切りは1項目ずつ改行 */}
                  {e.note?.split(/\s*[・／/]\s*/).map((part, i) => (
                    <Box key={i} sx={{ fontSize: 12, color: "#b45309", lineHeight: 1.4 }}>{part}</Box>
                  ))}
                  {e.roles && e.roles.length > 0 && (
                    <Box sx={{ fontSize: 13, color: "text.secondary", mt: 0.25 }}>
                      {/* 名前の途中では改行しない。区切りの「 / 」はnowrapの外に出して、名前と名前の間では改行できるようにする
                          （中に入れると全員分が1つの改行できない塊になり、画面が横にはみ出す） */}
                      {e.roles.map((r, i) => (
                        <span key={r.role}>
                          <Box component="span" sx={{ whiteSpace: "nowrap" }}>{r.actor}</Box>
                          {i < e.roles!.length - 1 && " / "}
                        </span>
                      ))}
                    </Box>
                  )}
                </Box>
                <button
                  onClick={() => cycleStatus(e.id)}
                  style={{
                    flexShrink: 0,
                    width: 74,
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 999,
                    border: "1px solid #ccc",
                    background: TICKET_STATUS_COLOR[status],
                    cursor: "pointer",
                  }}
                >
                  {TICKET_STATUS_LABEL[status]}
                </button>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
