import { useMemo, useState } from "react";
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

type Show = { showId: string; title: string };

type Props = {
  shows: Show[];
  events: CalendarEvent[];
};

export function CastWishEditor({ shows, events }: Props) {
  const [selectedShowId, setSelectedShowId] = useState<string>(shows[0]?.showId ?? "");
  const { getWish, toggleActor } = useRoleWishes();

  const showEvents = useMemo(
    () => events.filter(e => e.showId === selectedShowId),
    [events, selectedShowId]
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

  const wish = getWish(selectedShowId);

  if (shows.length === 0) {
    return <Box sx={{ p: 2 }}>作品データがまだありません。</Box>;
  }

  return (
    <Box sx={{ display: "grid", gap: 2, width: "min(640px, 96vw)", mx: "auto", p: 2 }}>
      <Select
        size="small"
        value={selectedShowId}
        onChange={(e) => setSelectedShowId(e.target.value)}
      >
        {shows.map(s => (
          <MenuItem key={s.showId} value={s.showId}>{s.title}</MenuItem>
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
            チェックした俳優なら観たい、とする役だけチェックしてください（役ごとに1つもチェックしなければ誰でもOK扱いになります）。
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
                            onChange={() => toggleActor(selectedShowId, role, actor)}
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
        </>
      )}
    </Box>
  );
}
