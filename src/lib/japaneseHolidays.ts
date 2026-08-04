// 日本の祝日を計算する（春分・秋分は近似式、対象範囲おおよそ1980〜2099年）
function toYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function dayOfWeek(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d).getDay();
}

function nthMondayDate(year: number, month: number, n: number): number {
  const first = new Date(year, month - 1, 1);
  const firstMonday = 1 + ((8 - first.getDay()) % 7);
  return firstMonday + (n - 1) * 7;
}

function vernalEquinoxDay(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function autumnalEquinoxDay(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

export function getJapaneseHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();
  const add = (m: number, d: number, name: string) => holidays.set(toYmd(year, m, d), name);

  add(1, 1, "元日");
  add(1, nthMondayDate(year, 1, 2), "成人の日");
  add(2, 11, "建国記念の日");
  add(2, 23, "天皇誕生日");
  add(3, vernalEquinoxDay(year), "春分の日");
  add(4, 29, "昭和の日");
  add(5, 3, "憲法記念日");
  add(5, 4, "みどりの日");
  add(5, 5, "こどもの日");
  add(7, nthMondayDate(year, 7, 3), "海の日");
  add(8, 11, "山の日");
  add(9, nthMondayDate(year, 9, 3), "敬老の日");
  add(9, autumnalEquinoxDay(year), "秋分の日");
  add(10, nthMondayDate(year, 10, 2), "スポーツの日");
  add(11, 3, "文化の日");
  add(11, 23, "勤労感謝の日");

  // 国民の休日: 前後が祝日に挟まれた平日（祝日でも日曜でもない日）
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 2; d < daysInMonth; d++) {
      const ymd = toYmd(year, m, d);
      if (holidays.has(ymd) || dayOfWeek(year, m, d) === 0) continue;
      const prevYmd = toYmd(year, m, d - 1);
      const nextYmd = toYmd(year, m, d + 1);
      if (holidays.has(prevYmd) && holidays.has(nextYmd)) {
        holidays.set(ymd, "国民の休日");
      }
    }
  }

  // 振替休日: 祝日が日曜なら、その後最初の非祝日を休日にする
  for (const [ymd] of [...holidays.entries()]) {
    const [y, m, d] = ymd.split("-").map(Number);
    if (dayOfWeek(y, m, d) !== 0) continue;
    let next = new Date(y, m - 1, d + 1);
    while (holidays.has(toYmd(next.getFullYear(), next.getMonth() + 1, next.getDate()))) {
      next = new Date(next.getFullYear(), next.getMonth(), next.getDate() + 1);
    }
    holidays.set(toYmd(next.getFullYear(), next.getMonth() + 1, next.getDate()), "振替休日");
  }

  return holidays;
}
