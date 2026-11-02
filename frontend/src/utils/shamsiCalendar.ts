/**
 * Iranian Shamsi (Jalali) Calendar Utility
 * Native zero-dependency Shamsi date calculations, formatting,
 * and 4:00 AM study-day grace period logic for Konkur routines.
 */

export interface ShamsiDateInfo {
  shamsi_date: string;       // e.g. "1405-08-11"
  day_number: number;        // Day index in schedule (1, 2, 3...)
  title: string;             // e.g. "دوشنبه ۱۱ آبان" or "امروز (دوشنبه ۱۱ آبان)"
  weekday_name: string;      // e.g. "دوشنبه"
  day_str: string;           // e.g. "۱۱"
  month_name: string;        // e.g. "آبان"
  is_today: boolean;
  is_friday: boolean;        // Friday consolidation buffer
  is_past: boolean;
  is_future: boolean;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)] || d);
}

/**
 * Returns the effective study date taking into account the 4:00 AM grace period.
 * If current time is between 00:00 and 03:59 AM, it belongs to the previous study date.
 */
export function getEffectiveStudyDate(baseDate: Date = new Date()): Date {
  const d = new Date(baseDate);
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/**
 * Formats a Date object into a ShamsiDateInfo object.
 */
export function getShamsiDateInfo(targetDate: Date, dayIndex: number = 1): ShamsiDateInfo {
  const effectiveToday = getEffectiveStudyDate();
  
  // Normalize comparison dates to YYYY-MM-DD
  const isToday = (
    targetDate.getFullYear() === effectiveToday.getFullYear() &&
    targetDate.getMonth() === effectiveToday.getMonth() &&
    targetDate.getDate() === effectiveToday.getDate()
  );

  const isPast = targetDate < effectiveToday && !isToday;
  const isFuture = targetDate > effectiveToday && !isToday;

  // Day of week: 5 is Friday in JS (Sunday=0, Monday=1, ..., Friday=5, Saturday=6)
  const isFriday = targetDate.getDay() === 5;

  // Extract Shamsi components using standard Intl API
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
  });

  const monthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    month: 'long',
  });

  const parts = formatter.formatToParts(targetDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const weekdayName = partMap['weekday'] || '';
  const dayStr = partMap['day'] || '';
  const monthName = monthFormatter.format(targetDate);
  
  // Format standard ISO-like Shamsi date: "1405-08-11"
  // Convert Persian numbers back to Latin digits for reliable DB keying
  const toLatin = (s: string) => s.replace(/[۰-۹]/g, (ch) => String(PERSIAN_DIGITS.indexOf(ch)));
  const y = toLatin(partMap['year'] || '1405');
  const m = toLatin(partMap['month'] || '01').padStart(2, '0');
  const d = toLatin(partMap['day'] || '01').padStart(2, '0');
  const shamsiDate = `${y}-${m}-${d}`;

  let title = `${weekdayName} ${dayStr} ${monthName}`;
  if (isToday) {
    title = `امروز (${weekdayName} ${dayStr} ${monthName})`;
  } else if (isFriday) {
    title = `جمعه (${dayStr} ${monthName} • ایستگاه تثبیت)`;
  }

  return {
    shamsi_date: shamsiDate,
    day_number: dayIndex,
    title,
    weekday_name: weekdayName,
    day_str: dayStr,
    month_name: monthName,
    is_today: isToday,
    is_friday: isFriday,
    is_past: isPast,
    is_future: isFuture,
  };
}

/**
 * Returns the standard Shamsi date string (e.g. "1405-08-11") for today's effective study date.
 */
export function getCurrentShamsiDateString(): string {
  return getShamsiDateInfo(getEffectiveStudyDate(), 1).shamsi_date;
}

/**
 * Generates an initial 7-day Shamsi cycle starting from today's effective study date.
 */
export function generateInitialShamsiDays(count: number = 7): ShamsiDateInfo[] {
  const days: ShamsiDateInfo[] = [];
  const start = getEffectiveStudyDate();

  for (let i = 0; i < count; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    days.push(getShamsiDateInfo(cur, i + 1));
  }

  return days;
}
