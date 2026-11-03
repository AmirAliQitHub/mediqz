/**
 * Iranian Shamsi (Jalali) Calendar Utility
 * Native zero-dependency Shamsi date calculations, formatting,
 * pure leap-year safe arithmetic via standard JS Date + Intl,
 * and 4:00 AM study-day grace period logic for Konkur routines.
 */

export interface ShamsiDateInfo {
  shamsi_date: string;       // e.g. "1405-08-12"
  day_number: number;        // Day index in schedule (1, 2, 3...)
  title: string;             // e.g. "دوشنبه ۱۲ آبان" or "امروز (دوشنبه ۱۲ آبان)"
  weekday_name: string;      // e.g. "دوشنبه"
  day_str: string;           // e.g. "۱۲"
  month_name: string;        // e.g. "آبان"
  is_today: boolean;
  is_friday: boolean;        // Friday indicator (normal study day)
  is_past: boolean;
  is_future: boolean;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)] || d);
}

/**
 * Returns the effective study date taking into account the 4:00 AM grace period in Asia/Tehran time.
 * If current time in Tehran is between 00:00 and 03:59 AM, it belongs to the previous study date.
 */
export function getEffectiveStudyDate(baseDate: Date = new Date()): Date {
  const d = new Date(baseDate);
  try {
    const tehranHourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      hour: 'numeric',
      hour12: false,
    });
    const tehranHour = parseInt(tehranHourFormatter.format(d), 10);
    if (!isNaN(tehranHour) && tehranHour < 4) {
      d.setDate(d.getDate() - 1);
    }
  } catch {
    // Robust fallback to local hours if Intl timezone is unavailable
    if (d.getHours() < 4) {
      d.setDate(d.getDate() - 1);
    }
  }
  return d;
}

/**
 * Converts a Shamsi date (year, month, day) into a standard Gregorian Date object.
 * Pure algorithmic alignment with Intl.DateTimeFormat (Asia/Tehran) to guarantee
 * 100% leap-year and Esfand 30 fidelity with zero dependencies.
 */
export function shamsiToGregorian(jy: number, jm: number, jd: number): Date {
  const approxYear = jy + 621;
  const jDayOfYear = jm <= 6 ? (jm - 1) * 31 + jd : 186 + (jm - 7) * 30 + jd;
  const approxGDay = 79 + jDayOfYear;
  const candidate = new Date(Date.UTC(approxYear, 0, 1, 12, 0, 0));
  candidate.setUTCDate(candidate.getUTCDate() + approxGDay - 1);

  const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const getJalali = (d: Date) => {
    const parts = formatter.formatToParts(d);
    let y = 0;
    let m = 0;
    let day = 0;
    for (const p of parts) {
      if (p.type === 'year') y = parseInt(p.value, 10);
      if (p.type === 'month') m = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
    }
    return { y, m, day };
  };

  for (let step = 0; step < 10; step++) {
    const cur = getJalali(candidate);
    if (cur.y === jy && cur.m === jm && cur.day === jd) {
      return candidate;
    }
    const curDayOfYear = cur.m <= 6 ? (cur.m - 1) * 31 + cur.day : 186 + (cur.m - 7) * 30 + cur.day;
    const diffYears = jy - cur.y;
    const diffDays = diffYears * 365 + (jDayOfYear - curDayOfYear);
    candidate.setUTCDate(candidate.getUTCDate() + (diffDays || (jy > cur.y ? 1 : -1)));
  }

  return candidate;
}

/**
 * Parses a Shamsi date string ("YYYY-MM-DD" or "YYYY/MM/DD") into numerical year, month, and day.
 * Protected against undefined, null, or empty values.
 */
export function parseShamsiDate(shamsiDateStr?: string | null): { year: number; month: number; day: number } {
  const clean = String(shamsiDateStr || '').trim().replace(/[۰-۹]/g, (ch) => String(PERSIAN_DIGITS.indexOf(ch)));
  const parts = clean.split(/[-/]/).map((p) => parseInt(p, 10));
  return {
    year: parts[0] || 1405,
    month: parts[1] || 1,
    day: parts[2] || 1,
  };
}

/**
 * Formats a Date object into a ShamsiDateInfo object.
 * Comparison with effective today is normalized to midnight to avoid hour/minute jitter.
 */
export function getShamsiDateInfo(targetDate: Date, dayIndex: number = 1): ShamsiDateInfo {
  const effectiveToday = getEffectiveStudyDate();

  // Normalize comparison to calendar day (midnight)
  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const todayMidnight = new Date(effectiveToday.getFullYear(), effectiveToday.getMonth(), effectiveToday.getDate());

  const isToday = targetMidnight.getTime() === todayMidnight.getTime();
  const isPast = targetMidnight.getTime() < todayMidnight.getTime();
  const isFuture = targetMidnight.getTime() > todayMidnight.getTime();

  // Extract Shamsi components using standard Intl API in Asia/Tehran timezone
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
  });

  const monthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    month: 'long',
  });

  const parts = formatter.formatToParts(targetDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const weekdayName = partMap['weekday'] || '';
  const dayStr = toPersianDigits(partMap['day'] || '');
  const monthName = monthFormatter.format(targetDate);

  // Timezone-safe Friday evaluation directly from Tehran localized calendar output
  const isFriday = weekdayName === 'جمعه';

  // Format standard ISO-like Shamsi date: "1405-08-12"
  const toLatin = (s: string) => String(s || '').replace(/[۰-۹]/g, (ch) => String(PERSIAN_DIGITS.indexOf(ch)));
  const y = toLatin(partMap['year'] || '1405');
  const m = toLatin(partMap['month'] || '01').padStart(2, '0');
  const d = toLatin(partMap['day'] || '01').padStart(2, '0');
  const shamsiDate = `${y}-${m}-${d}`;

  // Standard Title Construction (Friday is a normal study day; zero "تثبیت" labels)
  let title = `${weekdayName} ${dayStr} ${monthName}`;
  if (isToday) {
    title = `امروز (${weekdayName} ${dayStr} ${monthName})`;
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
 * Derives ShamsiDateInfo directly from a Shamsi date string ("YYYY-MM-DD").
 */
export function getShamsiDateInfoFromString(shamsiDateStr: string, dayIndex: number = 1): ShamsiDateInfo {
  const { year, month, day } = parseShamsiDate(shamsiDateStr);
  const gDate = shamsiToGregorian(year, month, day);
  return getShamsiDateInfo(gDate, dayIndex);
}

/**
 * Returns the standard Shamsi date string (e.g. "1405-08-12") for today's effective study date.
 */
export function getCurrentShamsiDateString(): string {
  return getShamsiDateInfo(getEffectiveStudyDate(), 1).shamsi_date;
}

/**
 * Adds offset days to a Shamsi date string, returning the resulting Shamsi date string ("YYYY-MM-DD").
 * Guaranteed 100% leap-year and month-boundary safe with strict 2-digit padding.
 */
export function addDaysToShamsi(shamsiDateStr: string, offsetDays: number): string {
  const { year, month, day } = parseShamsiDate(shamsiDateStr);
  const gDate = shamsiToGregorian(year, month, day);
  gDate.setUTCDate(gDate.getUTCDate() + offsetDays);

  const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(gDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const toLatin = (s: string) => String(s || '').replace(/[۰-۹]/g, (ch) => String(PERSIAN_DIGITS.indexOf(ch)));
  const y = toLatin(partMap['year'] || '1405');
  const m = toLatin(partMap['month'] || '01').padStart(2, '0');
  const d = toLatin(partMap['day'] || '01').padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates day difference between two Shamsi dates (d2 - d1 in days).
 */
export function diffDaysShamsi(shamsiDate1: string, shamsiDate2: string): number {
  const p1 = parseShamsiDate(shamsiDate1);
  const p2 = parseShamsiDate(shamsiDate2);
  const g1 = shamsiToGregorian(p1.year, p1.month, p1.day);
  const g2 = shamsiToGregorian(p2.year, p2.month, p2.day);
  const diffMs = g2.getTime() - g1.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Formats a Shamsi date string into a clean Persian summary, e.g. "۱۲ آبان ۱۴۰۵".
 */
export function formatShamsiSummary(shamsiDateStr: string): string {
  const { year, month, day } = parseShamsiDate(shamsiDateStr);
  const gDate = shamsiToGregorian(year, month, day);
  const monthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    month: 'long',
  });
  const monthName = monthFormatter.format(gDate);
  return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
}

/**
 * Generates an initial sequence of Shamsi days starting from a given base date (defaults to effective today).
 */
export function generateInitialShamsiDays(count: number = 7, baseDate: Date = getEffectiveStudyDate()): ShamsiDateInfo[] {
  const days: ShamsiDateInfo[] = [];
  const start = new Date(baseDate);

  for (let i = 0; i < count; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    days.push(getShamsiDateInfo(cur, i + 1));
  }

  return days;
}
