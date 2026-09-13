const riyadh = "Asia/Riyadh"; // MVP: fixed display tz so SSR and client always agree

const dateFmt = new Intl.DateTimeFormat("en", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: riyadh,
});

const dateTimeFmt = new Intl.DateTimeFormat("en", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: riyadh,
});

const timeFmt = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: riyadh,
});

export function formatDate(d: Date) {
  return dateFmt.format(d);
}

export function formatDateTime(d: Date) {
  return dateTimeFmt.format(d);
}

export function formatTime(d: Date) {
  return timeFmt.format(d);
}

/** "Sat, Sep 20 · 8:00 AM – 12:00 PM" style window */
export function formatWindow(startsAt: Date, endsAt?: Date | null) {
  return endsAt
    ? `${formatDateTime(startsAt)} – ${formatTime(endsAt)}`
    : formatDateTime(startsAt);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
