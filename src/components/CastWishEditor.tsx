import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import type { CalendarEvent } from "../types";
import { useRoleWishes } from "../hooks/useRoleWishes";
import { performanceQualifies } from "../lib/castMatch";

type Show = { showId: string; title: string; theatre: string; emoji: string };

type Props = {
  shows: Show[];
  events: CalendarEvent[];
  selectedShowIds: string[];
};

export function CastWishEditor({ shows, events, selectedShowIds }: Props) {
  // 観たい作品でチェックされている作品を、会場違いは同じ作品としてタイトルでまとめる
  // （会場ごとに観たいキャストが変わることはない前提）
  const visibleShows = useMemo(() => {
    const seen = new Set<string>();
    const out: { title: string; emoji: string }[] = [];
    for (const s of shows) {
      if (!selectedShowIds.includes(s.showId) || seen.has(s.title)) continue;
      seen.add(s.title);
      out.push({ title: s.title, emoji: s.emoji });
    }
    return out;
  }, [shows, selectedShowIds]);

  const visibleTitles = useMemo(() => visibleShows.map(s => s.title), [visibleShows]);

  const [selectedTitle, setSelectedTitle] = useState<string>(visibleTitles[0] ?? "");

  // 観たい作品タブでのチェックが外れて選択中の作品が見えなくなったら、見える作品に切り替える
  useEffect(() => {
    if (!visibleTitles.includes(selectedTitle)) {
      setSelectedTitle(visibleTitles[0] ?? "");
    }
  }, [visibleTitles, selectedTitle]);

  const { getWish, toggleActor } = useRoleWishes();

  const showEvents = useMemo(
    () => events.filter(e => e.title === selectedTitle),
    [events, selectedTitle]
  );

  // 役ごとに登場した俳優一覧（登場順）
  const actorsByRole = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of showEvents) {
      for (const r of e.roles ?? []) {
        const list = map.get(r.role) ?? [];
        if (!list.includes(r.actor)) list.push(r.actor);
        map.set(r.role, list);
      }
    }
    return map;
  }, [showEvents]);

  const wish = getWish(selectedTitle);

  // 今チェックしている条件を満たす公演数
  const qualifyingCount = useMemo(
    () => showEvents.filter(e => performanceQualifies(e.roles, wish)).length,
    [showEvents, wish]
  );

  if (shows.length === 0) {
    return <Box sx={{ p: 2 }}>作品データがまだありません。</Box>;
  }

  if (visibleTitles.length === 0) {
    return <Box sx={{ p: 2 }}>観たい作品タブで作品にチェックを入れると、ここに表示されます。</Box>;
  }

  return (
    <Box sx={{ display: "grid", gap: 2, width: "100%", maxWidth: 640, mx: "auto", p: 2, boxSizing: "border-box" }}>
      <Select
        size="small"
        value={selectedTitle}
        onChange={(e) => setSelectedTitle(e.target.value)}
        MenuProps={{ disableScrollLock: true }}
      >
        {visibleShows.map(s => (
          <MenuItem key={s.title} value={s.title}>
            {s.title}{s.emoji}
          </MenuItem>
        ))}
      </Select>

      {actorsByRole.size === 0 && (
        <Typography variant="body2" color="text.secondary">
          この作品にはまだキャストデータがありません。
        </Typography>
      )}

      {actorsByRole.size > 0 && (
        <>
          <Typography variant="body2" color="text.secondary">
            観たい役者名にチェックしてください。複数選択可能です。チェックがない役は誰でもOKになります。
          </Typography>
          <Box sx={{ position: "relative", mt: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: -24,
                right: 0,
                px: 1.2,
                py: 0.4,
                fontSize: '1em',
                fontWeight: 700,
              }}
            >
              該当：{qualifyingCount}件
            </Typography>
            <Table size="small">
              <TableBody>
              {[...actorsByRole.entries()].map(([role, actors]) => (
                <TableRow key={role}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", verticalAlign: "top", pt: 1.5 }}>
                    {role}
                  </TableCell>
                  <TableCell>
                    {actors.map(actor => (
                      <FormControlLabel
                        key={actor}
                        control={
                          <Checkbox
                            size="small"
                            checked={(wish[role] ?? []).includes(actor)}
                            onChange={() => toggleActor(selectedTitle, role, actor)}
                          />
                        }
                        label={actor}
                      />
                    ))}
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  );
}
