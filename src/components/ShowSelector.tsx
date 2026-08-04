import { Box, Checkbox, FormControlLabel, FormGroup, Typography } from "@mui/material";

type Show = { showId: string; title: string; theatre: string };

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
      <FormGroup row sx={{ justifyContent: "center" }}>
        {shows.map(s => (
          <FormControlLabel
            key={s.showId}
            control={
              <Checkbox
                checked={selectedShowIds.includes(s.showId)}
                onChange={() => onToggleShow(s.showId)}
              />
            }
            label={s.theatre ? `${s.title}（${s.theatre}）` : s.title}
          />
        ))}
      </FormGroup>
    </Box>
  );
}
