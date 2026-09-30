const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

// Module-level, matching format.ts — created once, reused.
const arJoDateFmt = new Intl.DateTimeFormat("ar-JO");
const toArDigits = (n: number) => n.toLocaleString("ar-JO");

/**
 * Arabic relative time: "الآن" under a minute, then "منذ …" phrases, then a
 * full ar-JO date at 7+ days. Follows Arabic counting grammar — 1 singular,
 * 2 dual, 3–10 plural, 11+ singular again — with counts in Arabic-Indic
 * numerals (٥) matching the full ar-JO date, also Arabic-Indic.
 */
export function relativeTimeAr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const elapsed = Math.max(0, Date.now() - d.getTime());

  if (elapsed < MINUTE) return "الآن";
  const minutes = Math.floor(elapsed / MINUTE);
  if (minutes < 60) return phraseAr(minutes, "دقيقة", "دقيقتين", "دقائق");
  const hours = Math.floor(elapsed / HOUR);
  if (hours < 24) return phraseAr(hours, "ساعة", "ساعتين", "ساعات");
  const days = Math.floor(elapsed / DAY);
  if (days < 7) return phraseAr(days, "يوم", "يومين", "أيام");
  return arJoDateFmt.format(d);
}

function phraseAr(n: number, singular: string, dual: string, plural: string): string {
  if (n === 1) return `منذ ${singular}`;
  if (n === 2) return `منذ ${dual}`;
  return `منذ ${toArDigits(n)} ${n <= 10 ? plural : singular}`;
}
