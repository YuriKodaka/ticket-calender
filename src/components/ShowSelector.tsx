import { Box, Checkbox, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";

type Show = { showId: string; title: string; theatre: string; emoji: string; sortKey: string };

type Props = {
  shows: Show[];
  selectedShowIds: string[];
  onToggleShow: (showId: string) => void;
};

// ファイル名の年月コード（例: 2703）を「27/03」に。年（例: 2026）などYYMMでなければそのまま、無ければ「—」
function formatYearMonth(code: string): string {
  if (!code) return "—";
  const mm = Number(code.slice(2));
  return mm >= 1 && mm <= 12 ? `${code.slice(0, 2)}/${code.slice(2)}` : code;
}

export function ShowSelector({ shows, selectedShowIds, onToggleShow }: Props) {
  return (
    <Box sx={{ display: "grid", gap: 2, width: "100%", maxWidth: 640, mx: "auto", p: 2, boxSizing: "border-box" }}>
      <Typography variant="subtitle2">
        観たい作品にチェックを入れる
      </Typography>
      <Table size="small">
        <TableBody>
          {shows.map(s => {
            const checked = selectedShowIds.includes(s.showId);
            return (
              <TableRow
                key={s.showId}
                hover
                selected={checked}
                onClick={() => onToggleShow(s.showId)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={checked} inputProps={{ "aria-label": `${s.title} ${s.theatre}` }} />
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", px: 1 }}>
                  {formatYearMonth(s.sortKey)}
                </TableCell>
                <TableCell sx={{ px: 1 }}>{s.emoji}{s.title}</TableCell>
                <TableCell sx={{ px: 1 }}>{s.theatre}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
