import { useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from "@mui/material";
import type { CalendarEvent } from "../types";
import { useRoleWishes } from "../hooks/useRoleWishes";
import { performanceQualifies } from "../lib/castMatch";
import { findPlans } from "../lib/planSolver";

type Show = { showId: string; title: string; theatre: string };

type Props = {
  shows: Show[];
  events: CalendarEvent[];
};

export function SchedulePlanner({ shows, events }: Props) {
  const [selectedShowIds, setSelectedShowIds] = useState<string[]>([]);
  const { wishesByShow } = useRoleWishes();

  const toggleShow = (showId: string) => {
    setSelectedShowIds(prev =>
      prev.includes(showId) ? prev.filter(id => id !== showId) : [...prev, showId]
    );
  };

  const qualifyingByShow = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const showId of selectedShowIds) {
      const wish = wishesByShow[showId] ?? {};
      map[showId] = events.filter(e => e.showId === showId && performanceQualifies(e.roles, wish));
    }
    return map;
  }, [selectedShowIds, events, wishesByShow]);

  const emptyShowIds = selectedShowIds.filter(id => (qualifyingByShow[id]?.length ?? 0) === 0);

  const result = useMemo(() => {
    if (selectedShowIds.length < 2 || emptyShowIds.length > 0) return null;
    return findPlans(selectedShowIds, qualifyingByShow);
  }, [selectedShowIds, qualifyingByShow, emptyShowIds.length]);

  const titleOf = (showId: string) => shows.find(s => s.showId === showId)?.title ?? showId;

  return (
    <Box sx={{ display: "grid", gap: 2, width: "min(640px, 96vw)", mx: "auto", p: 2 }}>
      <Typography variant="subtitle2">プランする作品を2つ以上選ぶ</Typography>
      <FormGroup row>
        {shows.map(s => (
          <FormControlLabel
            key={s.showId}
            control={
              <Checkbox
                checked={selectedShowIds.includes(s.showId)}
                onChange={() => toggleShow(s.showId)}
              />
            }
            label={s.title}
          />
        ))}
      </FormGroup>

      {selectedShowIds.length < 2 && (
        <Typography variant="body2" color="text.secondary">
          2作品以上選択してください。
        </Typography>
      )}

      {selectedShowIds.length >= 2 && emptyShowIds.length > 0 && (
        <Typography variant="body2" color="error">
          {emptyShowIds.map(titleOf).join("、")} は、登録した希望キャストを満たす公演がありません。条件を見直してください。
        </Typography>
      )}

      {result && result.plans.length === 0 && (
        <Typography variant="body2" color="error">
          各作品ごとに希望キャストの公演はありますが、上演時間（3時間想定）が重なってしまい、同時に成立するプランがありません。
        </Typography>
      )}

      {result && result.plans.length > 0 && (
        <Stack spacing={2}>
          {result.truncated && (
            <Typography variant="body2" color="text.secondary">
              組み合わせ数が多いため、一部のプランのみ表示しています。
            </Typography>
          )}
          {result.plans.map((plan, planIndex) => (
            <Box key={planIndex} sx={{ border: "1px solid #eee", borderRadius: 2, p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                プラン {planIndex + 1}
              </Typography>
              <Stack spacing={0.5}>
                {plan.map(e => (
                  <Typography key={e.id} variant="body2">
                    {e.date} {e.time} {e.title}（{e.theatre}）
                    {e.roles && e.roles.length > 0 && (
                      <> — {e.roles.map(r => `${r.role}:${r.actor}`).join(" / ")}</>
                    )}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
