import { useMemo } from "react";
import { Box, Checkbox, Divider, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import type { CalendarEvent } from "../types";

type Show = { showId: string; title: string; theatre: string; emoji: string; sortKey: string };

type Props = {
  shows: Show[];
  events: CalendarEvent[];
  selectedShowIds: string[];
  onToggleShow: (showId: string) => void;
};

// ファイル名の年月コード（例: 2703）を「27/03」に。年（例: 2026）などYYMMでなければそのまま、無ければ「—」
function formatYearMonth(code: string): string {
  if (!code) return "—";
  const mm = Number(code.slice(2));
  return mm >= 1 && mm <= 12 ? `${code.slice(0, 2)}/${code.slice(2)}` : code;
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ShowSelector({ shows, events, selectedShowIds, onToggleShow }: Props) {
  // 全公演が今日より前に終わっている作品は、区切り線の下にまとめる（公演データが無い作品は終わっていない扱い）
  const { upcoming, ended } = useMemo(() => {
    const lastDate = new Map<string, string>();
    for (const e of events) {
      if (e.date > (lastDate.get(e.showId) ?? "")) lastDate.set(e.showId, e.date);
    }
    const today = todayYmd();
    const isEnded = (s: Show) => {
      const last = lastDate.get(s.showId);
      return last !== undefined && last < today;
    };
    return { upcoming: shows.filter(s => !isEnded(s)), ended: shows.filter(isEnded) };
  }, [shows, events]);

  function renderRow(s: Show) {
    const checked = selectedShowIds.includes(s.showId);
    return (
      <TableRow
        key={s.showId}
        hover
        selected={checked}
        onClick={() => onToggleShow(s.showId)}
        sx={{ cursor: "pointer" }}
      >
        <TableCell padding="checkbox" sx={{ p: 0 }}>
          <Checkbox checked={checked} inputProps={{ "aria-label": `${s.title} ${s.theatre}` }} />
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", px: 1 }}>
          {formatYearMonth(s.sortKey)}
        </TableCell>
        <TableCell sx={{ px: 1 }}>{s.emoji}{s.title}</TableCell>
        <TableCell sx={{ px: 1 }}>{s.theatre}</TableCell>
      </TableRow>
    );
  }

  // 表が2つに分かれても列の位置が揃うよう、列幅を固定する
  function renderTable(rows: Show[]) {
    return (
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: 42 }} />
          <col style={{ width: "4em" }} />
          <col />
          <col style={{ width: "35%" }} />
        </colgroup>
        <TableBody>{rows.map(renderRow)}</TableBody>
      </Table>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2, width: "100%", maxWidth: 640, mx: "auto", p: 2, boxSizing: "border-box" }}>
      {/* キャスト希望タブの説明文と同じ薄さ・大きさに揃える */}
      <Typography variant="body2" color="text.secondary">
        観たい作品にチェックを入れてください。
      </Typography>
      {renderTable(upcoming)}
      {/* 終わった作品は横線で区切った別の表に（上下の余白は外側のgap） */}
      {ended.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          {renderTable(ended)}
        </>
      )}
    </Box>
  );
}
