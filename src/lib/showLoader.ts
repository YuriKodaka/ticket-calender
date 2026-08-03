import type { CalendarEvent, RoleAssignment } from "../types";
import { parseCsv } from "./csvParse";

export type Show = { showId: string; title: string; theatre: string };

// public/csv/{タイトル}_{劇場名}.csv （必要なら {タイトル}_{年}_{劇場名}.csv）を置いて
// index.txt にファイル名を1行追加するだけで表示される
// BASE_URL基準にすることで、file://でdist/index.htmlを直接開いた場合や
// サブディレクトリ配下で配信した場合でも解決できるようにする
const CSV_DIR = `${import.meta.env.BASE_URL}csv`;

function parseFileName(fileName: string): Show {
  const base = fileName.replace(/\.csv$/, "");
  const parts = base.split("_");

  if (parts.length < 2) {
    return { showId: base, title: base, theatre: "" };
  }

  const theatre = parts[parts.length - 1];
  const rest = parts.slice(0, -1);
  const hasYear = rest.length > 1 && /^\d{4}$/.test(rest[rest.length - 1]);
  const title = (hasYear ? rest.slice(0, -1) : rest).join("_");

  return { showId: base, title, theatre };
}

function toYmd(slashDate: string): string {
  const [y, m, d] = slashDate.split("/").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseShowCsv(show: Show, content: string): CalendarEvent[] {
  const rows = parseCsv(content);
  if (rows.length < 2) return [];

  const [, , ...roleNames] = rows[0]; // 1列目=日時, 2列目=備考, 以降=役名

  return rows.slice(1).flatMap((row, i) => {
    const [dateTime, note, ...actors] = row;
    const [datePart, time] = (dateTime ?? "").trim().split(/\s+/);
    if (!datePart || !time) return [];

    const roles: RoleAssignment[] = roleNames
      .map((role, idx) => ({ role, actor: (actors[idx] ?? "").trim() }))
      .filter(r => r.actor !== "");

    return [{
      id: `${show.showId}_${datePart}_${time}_${i}`,
      showId: show.showId,
      title: show.title,
      theatre: show.theatre,
      date: toYmd(datePart),
      time,
      roles,
      note: note?.trim() || undefined,
    }];
  });
}

export async function loadShows(): Promise<{ shows: Show[]; events: CalendarEvent[] }> {
  const indexText = await fetch(`${CSV_DIR}/index.txt`).then(r => r.text());
  const fileNames = indexText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "" && !line.startsWith("#"));

  const shows: Show[] = [];
  const events: CalendarEvent[] = [];

  const contents = await Promise.all(
    fileNames.map(fileName => fetch(`${CSV_DIR}/${encodeURIComponent(fileName)}`).then(r => r.text()))
  );

  fileNames.forEach((fileName, i) => {
    const show = parseFileName(fileName);
    shows.push(show);
    events.push(...parseShowCsv(show, contents[i]));
  });

  return { shows, events };
}
