import type { CalendarEvent, RoleAssignment } from "../types";
import { parseCsv } from "./csvParse";

export type Show = { showId: string; title: string; theatre: string; emoji: string };

// public/csv/{タイトル}_{劇場名}.csv （必要なら {タイトル}_{年}_{劇場名}.csv）を置いて
// index.txt にファイル名を1行追加するだけで表示される（行末に ,絵文字 を書けばカレンダーに使う絵文字を指定できる）
// BASE_URL基準にすることで、file://でdist/index.htmlを直接開いた場合や
// サブディレクトリ配下で配信した場合でも解決できるようにする
const CSV_DIR = `${import.meta.env.BASE_URL}csv`;
const DEFAULT_EMOJI = "🎭";

function parseIndexLine(line: string): { fileName: string; emoji: string } {
  const commaIndex = line.indexOf(",");
  if (commaIndex === -1) return { fileName: line, emoji: DEFAULT_EMOJI };
  const fileName = line.slice(0, commaIndex).trim();
  const emoji = line.slice(commaIndex + 1).trim() || DEFAULT_EMOJI;
  return { fileName, emoji };
}

function parseFileName(fileName: string): { showId: string; title: string; theatre: string; sortKey: string } {
  const base = fileName.replace(/\.csv$/, "");
  const parts = base.split("_");

  if (parts.length < 2) {
    return { showId: base, title: base, theatre: "", sortKey: "" };
  }

  const theatre = parts[parts.length - 1];
  const rest = parts.slice(0, -1);
  const last = rest[rest.length - 1];
  const hasDateCode = rest.length > 1 && /^\d{4}$/.test(last); // 例: 2026 や 2610（年月）
  const title = (hasDateCode ? rest.slice(0, -1) : rest).join("_");
  const sortKey = hasDateCode ? last : "";

  return { showId: base, title, theatre, sortKey };
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
      emoji: show.emoji,
      date: toYmd(datePart),
      time,
      roles,
      note: note?.trim() || undefined,
    }];
  });
}

export async function loadShows(): Promise<{ shows: Show[]; events: CalendarEvent[] }> {
  // GitHub Pages はindex.txt/CSVにCDNキャッシュ（数分）を付けて配信するため、
  // ブラウザのキャッシュ無視だけでは古い内容が残ることがある。
  // リクエストごとに変わるクエリを付けてCDNキャッシュも毎回バイパスする
  const bust = Date.now();
  const noCache: RequestInit = { cache: "no-store" };

  const indexText = await fetch(`${CSV_DIR}/index.txt?v=${bust}`, noCache).then(r => r.text());
  const entries = indexText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "" && !line.startsWith("#"))
    .map(parseIndexLine);

  const shows: Show[] = [];
  const events: CalendarEvent[] = [];

  const contents = await Promise.all(
    entries.map(e => fetch(`${CSV_DIR}/${encodeURIComponent(e.fileName)}?v=${bust}`, noCache).then(r => r.text()))
  );

  const parsed = entries.map((entry, i) => ({
    show: { ...parseFileName(entry.fileName), emoji: entry.emoji },
    content: contents[i],
  }));

  // ファイル名の年月部分（例: 2610）が若い順（昇順）になるよう並べる。年月が無いものは末尾へ
  parsed.sort((a, b) => {
    if (a.show.sortKey && b.show.sortKey) return a.show.sortKey.localeCompare(b.show.sortKey);
    if (a.show.sortKey) return -1;
    if (b.show.sortKey) return 1;
    return a.show.title.localeCompare(b.show.title);
  });

  for (const { show, content } of parsed) {
    const { sortKey, ...cleanShow } = show;
    void sortKey;
    shows.push(cleanShow);
    events.push(...parseShowCsv(cleanShow, content));
  }

  return { shows, events };
}
