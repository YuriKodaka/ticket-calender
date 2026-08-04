import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

type Show = { showId: string; title: string; theatre: string; emoji: string };

type Props = {
  shows: Show[];
  selectedShowIds: string[];
  onToggleShow: (showId: string) => void;
};

export function ShowSelector({ shows, selectedShowIds, onToggleShow }: Props) {
  return (
    <Box sx={{ display: "grid", gap: 2, width: "100%", maxWidth: 640, mx: "auto", p: 2, boxSizing: "border-box" }}>
      <Typography variant="subtitle2" sx={{ textAlign: "center" }}>
        観たい作品にチェックを入れる
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          justifyItems: "start",
        }}
      >
        {shows.map(s => (
          <FormControlLabel
            key={s.showId}
            control={
              <Checkbox
                checked={selectedShowIds.includes(s.showId)}
                onChange={() => onToggleShow(s.showId)}
              />
            }
            label={s.theatre ? `${s.emoji}${s.title}（${s.theatre}）` : `${s.emoji}${s.title}`}
          />
        ))}
      </Box>
    </Box>
  );
}
