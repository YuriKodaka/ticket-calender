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
import type { CalendarEvent, RoleAssignment } from "../types";
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

  // 「この役者が出るならこの組み合わせしかない」という完全固定チーム制の作品だけ、
  // チーム選択UIにする。同じ役者が違う組み合わせ（＝チーム外の相手）でも出ている場合は
  // 純粋なチーム制ではないので、通常の役×俳優チェックのままにする。
  function castKey(cast: RoleAssignment[]): string {
    return [...cast]
      .sort((a, b) => a.role.localeCompare(b.role))
      .map(r => `${r.role}:${r.actor}`)
      .join("|");
  }

  const teams = useMemo(() => {
    const map = new Map<string, { cast: RoleAssignment[]; firstDate: string }>();
    for (const e of showEvents) {
      if (!e.roles || e.roles.length === 0) continue;
      const key = castKey(e.roles);
      if (!map.has(key)) map.set(key, { cast: e.roles, firstDate: e.date });
    }
    return [...map.values()].sort((a, b) => a.firstDate.localeCompare(b.firstDate));
  }, [showEvents]);

  const performancesWithCast = useMemo(
    () => showEvents.filter(e => e.roles && e.roles.length > 0).length,
    [showEvents]
  );

  const isTeamShow = useMemo(() => {
    if (actorsByRole.size < 2) return false; // 役が1つだけなら「チーム」の意味がない
    if (teams.length < 2 || teams.length >= performancesWithCast) return false;
    // 役に関係なく、俳優ごとに登場した組み合わせパターンが1種類だけかを見る。
    // 同じ俳優が違う相手や違う役でも出ている場合は固定チームではないので対象外にする
    const castKeysByActor = new Map<string, Set<string>>();
    for (const e of showEvents) {
      if (!e.roles || e.roles.length === 0) continue;
      const key = castKey(e.roles);
      for (const r of e.roles) {
        const set = castKeysByActor.get(r.actor) ?? new Set<string>();
        set.add(key);
        castKeysByActor.set(r.actor, set);
      }
    }
    return [...castKeysByActor.values()].every(set => set.size === 1);
  }, [teams, performancesWithCast, showEvents, actorsByRole]);

  const wish = getWish(selectedTitle);

  function toggleTeam(cast: RoleAssignment[]) {
    const allChecked = cast.every(r => (wish[r.role] ?? []).includes(r.actor));
    const target = !allChecked;
    for (const r of cast) {
      const isChecked = (wish[r.role] ?? []).includes(r.actor);
      if (isChecked !== target) toggleActor(selectedTitle, r.role, r.actor);
    }
  }

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
            {isTeamShow
              ? "観たいチームにチェックしてください。複数選択可能です。"
              : "観たい役者名にチェックしてください。複数選択可能です。チェックがない役は誰でもOKになります。"}
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
            {isTeamShow ? (
              <Table size="small">
                <TableBody>
                {teams.map(({ cast }, i) => {
                  const checked = cast.every(r => (wish[r.role] ?? []).includes(r.actor));
                  return (
                    <TableRow key={i}>
                      <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap", pt: 1.5, width: 88, pr: 0 }}>
                        <FormControlLabel
                          control={<Checkbox size="small" checked={checked} onChange={() => toggleTeam(cast)} />}
                          label={`チーム${i + 1}`}
                          sx={{ mr: 0 }}
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", pt: 1.5, fontSize: "1rem", lineHeight: 1.5 }}>
                        {cast.map(r => (
                          <div key={r.role}>{r.role}：{r.actor}</div>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            ) : (
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
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
