import { create } from 'zustand';
import { EU, Part, Course, CourseSummary } from '../types';
import { useCourseStore } from './useCourseStore';
import { useAuthStore } from './useAuthStore';
import { api } from '../services/api';
import {
  generateInitialShamsiDays,
  getShamsiDateInfo,
  getShamsiDateInfoFromString,
  getEffectiveStudyDate,
  getCurrentShamsiDateString,
  diffDaysShamsi,
  addDaysToShamsi,
  ShamsiDateInfo
} from '../utils/shamsiCalendar';

export type RoutineSortMode = 'even' | 'leitner' | 'cram' | 'friday_buffer';
export type RoutineApplyStrategy = 'merge' | 'replace_course' | 'replace_all';

export interface SmartRoutineSortOptions {
  courseId: string;
  courseTitle: string;
  parts: Array<{ part_id: string; title: string; eus?: any[] }>;
  startDateShamsi?: string;
  partsPerDay: number;
  repeatDays?: number;
  startFromUncompleted?: boolean;
  strategy?: RoutineApplyStrategy;
}

export interface SmartRoutinePreview {
  totalParts: number;
  partsPerDay: number;
  repeatDays: number;
  totalBatches: number;
  totalStudyDays: number;
  startDateShamsi: string;
  endDateShamsi: string;
  batches: Array<{
    batchIndex: number;
    partTitles: string[];
    initialStudyDate: string;
    repeatDates: string[];
  }>;
}

/**
 * Pure pedagogical calculation for the 4-step Smart Sorter with Continuous Repetition:
 * Groups N parts into K batches of size P, repeats each batch across R consecutive days,
 * and computes exact calendar dates and end date in Shamsi without leap-year errors.
 */
export function calculateSmartRoutinePreview(
  parts: Array<{ part_id: string; title: string; eus?: any[] }>,
  partsPerDay: number,
  repeatDays: number = 0,
  startDateShamsi: string = getCurrentShamsiDateString()
): SmartRoutinePreview {
  const N = Math.max(0, parts.length);
  const P = Math.max(1, partsPerDay);
  const R = Math.max(0, repeatDays);

  if (N === 0) {
    return {
      totalParts: 0,
      partsPerDay: P,
      repeatDays: R,
      totalBatches: 0,
      totalStudyDays: 0,
      startDateShamsi,
      endDateShamsi: startDateShamsi,
      batches: [],
    };
  }

  const K = Math.ceil(N / P);
  const daysPerBatch = 1 + R;
  const totalStudyDays = K * daysPerBatch;
  const endDateShamsi = addDaysToShamsi(startDateShamsi, Math.max(0, totalStudyDays - 1));

  const batches: SmartRoutinePreview['batches'] = [];
  for (let j = 0; j < K; j++) {
    const batchParts = parts.slice(j * P, (j + 1) * P);
    const startDayOffset = j * daysPerBatch;
    const initialStudyDate = addDaysToShamsi(startDateShamsi, startDayOffset);
    const repeatDates: string[] = [];
    for (let r = 1; r <= R; r++) {
      repeatDates.push(addDaysToShamsi(startDateShamsi, startDayOffset + r));
    }
    batches.push({
      batchIndex: j + 1,
      partTitles: batchParts.map((p) => p.title),
      initialStudyDate,
      repeatDates,
    });
  }

  return {
    totalParts: N,
    partsPerDay: P,
    repeatDays: R,
    totalBatches: K,
    totalStudyDays,
    startDateShamsi,
    endDateShamsi,
    batches,
  };
}

export interface DistributeCoursePartsOptions {
  courseId: string;
  courseTitle: string;
  parts: Array<{ part_id: string; title: string; eus?: any[] }>;
  sortMode?: RoutineSortMode;
  partsPerDay?: number;
  durationDays?: number;
  strategy?: RoutineApplyStrategy;
  startDayNumber?: number;
  startDateShamsi?: string;
  repeatDays?: number;
}

export interface CourseDistributionPreview {
  totalParts: number;
  activeDaysCount: number;
  totalDaysCount: number;
  baseQuota: number;
  remainder: number;
  dailyBreakdown: Array<{ dayNumber: number; count: number; isFriday: boolean }>;
}

export function previewCourseDistribution(
  partsCount: number,
  mode: RoutineSortMode,
  partsPerDay: number,
  durationDays: number,
  startStudyDate: Date = getEffectiveStudyDate()
): CourseDistributionPreview {
  const N = Math.max(0, partsCount);
  const pPerDay = Math.max(1, partsPerDay);

  let totalDays = Math.max(durationDays, 7);
  if (mode === 'friday_buffer') {
    const minActive = Math.max(1, Math.ceil(N / pPerDay));
    let activeFound = 0;
    let dIdx = 0;
    while (activeFound < minActive || dIdx < durationDays) {
      const d = new Date(startStudyDate);
      d.setDate(startStudyDate.getDate() + dIdx);
      const isFriday = d.getDay() === 5;
      if (!isFriday) activeFound++;
      dIdx++;
    }
    totalDays = dIdx;
  } else {
    totalDays = Math.max(durationDays, Math.max(1, Math.ceil(N / pPerDay)));
  }

  const dailyBreakdown: Array<{ dayNumber: number; count: number; isFriday: boolean }> = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startStudyDate);
    d.setDate(startStudyDate.getDate() + i);
    dailyBreakdown.push({
      dayNumber: i + 1,
      count: 0,
      isFriday: d.getDay() === 5,
    });
  }

  const activeDays = dailyBreakdown.filter((d) => (mode === 'friday_buffer' ? !d.isFriday : true));
  const D = activeDays.length;

  if (D > 0 && N > 0) {
    if (mode === 'cram') {
      if (D <= 1) {
        activeDays[0].count = N;
      } else {
        const D1 = Math.max(1, Math.ceil(D / 2));
        const D2 = D - D1;
        const N1 = Math.min(N, Math.ceil(0.65 * N));
        const N2 = N - N1;
        const base1 = Math.floor(N1 / D1);
        const rem1 = N1 % D1;
        for (let i = 0; i < D1; i++) activeDays[i].count = base1 + (i < rem1 ? 1 : 0);
        const base2 = Math.floor(N2 / D2);
        const rem2 = N2 % D2;
        for (let i = 0; i < D2; i++) activeDays[D1 + i].count = base2 + (i < rem2 ? 1 : 0);
      }
    } else if (mode === 'leitner') {
      if (D <= 1) {
        activeDays[0].count = N;
      } else {
        const weights = activeDays.map((_, idx) => (idx % 2 === 0 ? 2 : 1));
        const totalW = weights.reduce((a, b) => a + b, 0);
        const baseUnit = Math.floor(N / totalW);
        let assigned = 0;
        for (let i = 0; i < D; i++) {
          activeDays[i].count = weights[i] * baseUnit;
          assigned += activeDays[i].count;
        }
        let rem = N - assigned;
        for (let i = 0; i < D && rem > 0; i++) {
          if (weights[i] === 2) {
            activeDays[i].count++;
            rem--;
          }
        }
        for (let i = 0; i < D && rem > 0; i++) {
          activeDays[i].count++;
          rem--;
        }
      }
    } else {
      const baseQuota = Math.floor(N / D);
      const rem = N % D;
      for (let i = 0; i < D; i++) {
        activeDays[i].count = baseQuota + (i < rem ? 1 : 0);
      }
    }
  }

  const baseQuota = D > 0 ? Math.floor(N / D) : 0;
  const remainder = D > 0 ? N % D : 0;

  return {
    totalParts: N,
    activeDaysCount: D,
    totalDaysCount: totalDays,
    baseQuota,
    remainder,
    dailyBreakdown,
  };
}

export interface RoutineItem {
  id: string;
  course_id: string;
  course_title: string;
  part_id: string;
  part_title: string;
  slide_count: number;
  completed: boolean;
  completed_at?: string;
}

export interface RoutineDay {
  day_number: number;
  title: string;
  shamsi_date: string;
  weekday_name?: string;
  day_str?: string;
  month_name?: string;
  is_today?: boolean;
  is_friday?: boolean;
  is_past?: boolean;
  is_future?: boolean;
  date_label?: string;
  items: RoutineItem[];
}

export interface MistakeRecord {
  id: string;
  course_id: string;
  course_title: string;
  part_id: string;
  part_title: string;
  unit_id: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  date_str: string; // YYYY-MM-DD
  timestamp: string;
  raw_eu?: EU;
}

interface RoutineState {
  currentDayNumber: number;
  days: RoutineDay[];
  mistakes: MistakeRecord[];
  activeRoutineQueue: RoutineItem[] | null;
  activeQueueIndex: number;

  // Actions
  recheckEffectiveDate: () => void;
  setCurrentDay: (day: number) => void;
  addItemToDay: (dayNumber: number, item: Omit<RoutineItem, 'id' | 'completed'>) => void;
  removeItemFromDay: (dayNumber: number, itemId: string) => void;
  toggleItemCompleted: (dayNumber: number, itemId: string) => void;
  generateLinearRoutine: (courses: CourseSummary[], partsPerDay?: number) => Promise<void>;
  distributeCourseParts: (options: DistributeCoursePartsOptions) => Promise<{ distributedCount: number; daysCount: number }>;
  applySmartRoutineSchedule: (options: SmartRoutineSortOptions) => Promise<{
    distributedCount: number;
    daysCount: number;
    endDateShamsi: string;
    totalBatches: number;
  }>;
  startAutomaticRoutine: (dayNumber?: number) => Promise<boolean>;
  onPartFinishedInRoutine: () => boolean; // returns true if next part started, false if done
  recordMistake: (mistake: Omit<MistakeRecord, 'id' | 'date_str' | 'timestamp'>) => void;
  getMistakesByDate: (dateStr?: string) => MistakeRecord[];
  startMistakesCourse: (dateStr?: string) => void;
  clearMistakes: (dateStr?: string) => void;
  syncWithCloud: () => Promise<void>;
  loadCloudRoutines: () => Promise<void>;
}

const STORAGE_KEY_ROUTINE = 'mediaz_routine_days_v1';
const STORAGE_KEY_MISTAKES = 'mediaz_routine_mistakes_v1';
const STORAGE_KEY_CURRENT_DAY = 'mediaz_routine_current_day_v1';

function getTodayStr(): string {
  return getCurrentShamsiDateString();
}

/**
 * Pure re-anchoring helper for Routine days:
 * Maps persisted routine items by their canonical shamsi_date,
 * re-evaluates calendar day tabs dynamically from currentEffectiveDate,
 * and eliminates stale `is_today` / `is_future` flags cached in localStorage.
 */
export function reanchorDays(
  persistedDays: RoutineDay[],
  currentEffectiveDate: Date = getEffectiveStudyDate()
): { reanchoredDays: RoutineDay[]; todayDayNumber: number } {
  const todayInfo = getShamsiDateInfo(currentEffectiveDate, 1);
  const todayShamsi = todayInfo.shamsi_date;

  // 1. Group items by canonical shamsi_date
  const itemsByDate = new Map<string, RoutineItem[]>();
  for (const d of persistedDays) {
    if (d.items && d.items.length > 0) {
      const dateKey = d.shamsi_date || todayShamsi;
      const existing = itemsByDate.get(dateKey) || [];
      const seenIds = new Set(existing.map((it) => it.id));
      for (const it of d.items) {
        if (!seenIds.has(it.id)) {
          existing.push(it);
          seenIds.add(it.id);
        }
      }
      itemsByDate.set(dateKey, existing);
    }
  }

  // 2. Identify maximum future offset (at least 7 days total, i.e., 0..6)
  let maxFutureOffset = 6;
  for (const dateKey of itemsByDate.keys()) {
    const diff = diffDaysShamsi(todayShamsi, dateKey);
    if (diff > maxFutureOffset) {
      maxFutureOffset = Math.min(diff, 60);
    }
  }

  // 3. Identify past dates that carry items (limited to recent 3 days to avoid pill bloat)
  const pastDates: string[] = [];
  for (const dateKey of itemsByDate.keys()) {
    const diff = diffDaysShamsi(todayShamsi, dateKey);
    if (diff < 0 && diff >= -3 && (itemsByDate.get(dateKey)?.length || 0) > 0) {
      pastDates.push(dateKey);
    }
  }
  pastDates.sort((a, b) => a.localeCompare(b));

  const resultDays: RoutineDay[] = [];
  let dayCounter = 1;

  // Add past days with items (guaranteeing no "امروز" prefix in title)
  for (const pDate of pastDates) {
    const sInfo = getShamsiDateInfoFromString(pDate, dayCounter);
    const cleanTitle = sInfo.title.replace(/^امروز\s*\((.*)\)$/, '$1');
    resultDays.push({
      day_number: dayCounter,
      title: cleanTitle,
      shamsi_date: sInfo.shamsi_date,
      weekday_name: sInfo.weekday_name,
      day_str: sInfo.day_str,
      month_name: sInfo.month_name,
      is_today: false,
      is_friday: sInfo.is_friday,
      is_future: false,
      is_past: true,
      items: itemsByDate.get(pDate) || [],
    });
    dayCounter++;
  }

  // Record today's day number in the list
  const todayDayNumber = dayCounter;

  // Add today and forward days
  for (let offset = 0; offset <= maxFutureOffset; offset++) {
    const curDate = new Date(currentEffectiveDate);
    curDate.setDate(currentEffectiveDate.getDate() + offset);
    const sInfo = getShamsiDateInfo(curDate, dayCounter);
    const dayItems = itemsByDate.get(sInfo.shamsi_date) || [];

    resultDays.push({
      day_number: dayCounter,
      title: sInfo.title,
      shamsi_date: sInfo.shamsi_date,
      weekday_name: sInfo.weekday_name,
      day_str: sInfo.day_str,
      month_name: sInfo.month_name,
      is_today: sInfo.is_today,
      is_friday: sInfo.is_friday,
      is_future: sInfo.is_future,
      is_past: sInfo.is_past,
      items: dayItems,
    });
    dayCounter++;
  }

  return { reanchoredDays: resultDays, todayDayNumber };
}

const initialShamsiList = generateInitialShamsiDays(7);
const defaultInitialDays: RoutineDay[] = initialShamsiList.map((s) => ({
  day_number: s.day_number,
  title: s.title,
  shamsi_date: s.shamsi_date,
  weekday_name: s.weekday_name,
  day_str: s.day_str,
  month_name: s.month_name,
  is_today: s.is_today,
  is_friday: s.is_friday,
  is_past: s.is_past,
  is_future: s.is_future,
  items: [],
}));

export const useRoutineStore = create<RoutineState>((set, get) => {
  // Load saved state with dynamic re-anchoring
  let initialDays = defaultInitialDays;
  let initialMistakes: MistakeRecord[] = [];
  let initialDayNumber = 1;

  if (typeof window !== 'undefined') {
    try {
      const savedDays = localStorage.getItem(STORAGE_KEY_ROUTINE);
      if (savedDays) {
        const parsed: RoutineDay[] = JSON.parse(savedDays);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { reanchoredDays, todayDayNumber } = reanchorDays(parsed, getEffectiveStudyDate());
          initialDays = reanchoredDays;
          initialDayNumber = todayDayNumber;
        }
      }
      const savedMistakes = localStorage.getItem(STORAGE_KEY_MISTAKES);
      if (savedMistakes) initialMistakes = JSON.parse(savedMistakes);
      const savedCurDay = localStorage.getItem(STORAGE_KEY_CURRENT_DAY);
      if (savedCurDay) {
        const parsedDay = parseInt(savedCurDay, 10);
        const exists = initialDays.find((d) => d.day_number === parsedDay);
        if (exists && !exists.is_past) {
          initialDayNumber = parsedDay;
        }
      }
    } catch {
      // ignore
    }
  }

  const persist = (days: RoutineDay[], mistakes: MistakeRecord[], currentDay: number) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_ROUTINE, JSON.stringify(days));
        localStorage.setItem(STORAGE_KEY_MISTAKES, JSON.stringify(mistakes));
        localStorage.setItem(STORAGE_KEY_CURRENT_DAY, String(currentDay));
      } catch {
        // ignore
      }
    }
  };

  /**
   * Internal helper for full-payload cloud synchronization on touched dates.
   * Sends the full aggregated list of all courses for those dates to prevent
   * the backend DELETE clause from wiping out coexisting courses.
   */
  const syncDatesToBackend = async (shamsiDates: string[], days: RoutineDay[]) => {
    const user = useAuthStore.getState().user;
    if (!user?.id || shamsiDates.length === 0) return;

    try {
      const datesSet = new Set(shamsiDates);
      const syncRoutines: any[] = [];
      const datesWithItems = new Set<string>();

      for (const d of days) {
        if (datesSet.has(d.shamsi_date)) {
          if (d.items.length > 0) {
            datesWithItems.add(d.shamsi_date);
          }
          for (let idx = 0; idx < d.items.length; idx++) {
            const it = d.items[idx];
            syncRoutines.push({
              shamsi_date: d.shamsi_date,
              course_id: it.course_id,
              course_title: it.course_title,
              part_id: it.part_id,
              part_title: it.part_title,
              slide_count: it.slide_count,
              completed: it.completed,
              order_idx: idx,
            });
          }
        }
      }

      // Explicitly identify touched dates that now have 0 items to eliminate zombie resurrection
      const clearedDates = shamsiDates.filter((date) => !datesWithItems.has(date));

      if (syncRoutines.length > 0 || clearedDates.length > 0) {
        await api.post('/reviews/routines', {
          routines: syncRoutines,
          cleared_dates: clearedDates,
        });
      }
    } catch {
      // Fail-silent for offline resilience
    }
  };

  return {
    currentDayNumber: initialDayNumber,
    days: initialDays,
    mistakes: initialMistakes,
    activeRoutineQueue: null,
    activeQueueIndex: 0,

    recheckEffectiveDate: () => {
      const currentDays = get().days;
      const { reanchoredDays, todayDayNumber } = reanchorDays(currentDays, getEffectiveStudyDate());
      const currentTodayShamsi = currentDays.find((d) => d.is_today)?.shamsi_date;
      const realTodayShamsi = getCurrentShamsiDateString();
      if (currentTodayShamsi !== realTodayShamsi) {
        set({ days: reanchoredDays, currentDayNumber: todayDayNumber });
        persist(reanchoredDays, get().mistakes, todayDayNumber);
      }
    },

    setCurrentDay: (day) => {
      set({ currentDayNumber: day });
      persist(get().days, get().mistakes, day);
    },

    addItemToDay: (dayNumber, item) => {
      const currentDays = [...get().days];
      let day = currentDays.find((d) => d.day_number === dayNumber);
      if (!day) {
        const start = getEffectiveStudyDate();
        const curDate = new Date(start);
        const todayDay = currentDays.find((d) => d.is_today);
        const offsetFromToday = todayDay ? (dayNumber - todayDay.day_number) : (dayNumber - 1);
        curDate.setDate(start.getDate() + offsetFromToday);
        const sInfo = getShamsiDateInfo(curDate, dayNumber);
        day = {
          day_number: dayNumber,
          title: sInfo.title,
          shamsi_date: sInfo.shamsi_date,
          weekday_name: sInfo.weekday_name,
          day_str: sInfo.day_str,
          month_name: sInfo.month_name,
          is_today: sInfo.is_today,
          is_friday: sInfo.is_friday,
          is_past: sInfo.is_past,
          is_future: sInfo.is_future,
          items: [],
        };
        currentDays.push(day);
        currentDays.sort((a, b) => a.day_number - b.day_number);
      }

      // Check for duplicate in same day
      const exists = day.items.some(
        (i) => i.course_id === item.course_id && i.part_id === item.part_id
      );
      if (exists) return;

      const newItem: RoutineItem = {
        ...item,
        id: `rt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        completed: false,
      };

      day.items.push(newItem);
      set({ days: currentDays });
      persist(currentDays, get().mistakes, get().currentDayNumber);

      if (day.shamsi_date) {
        void syncDatesToBackend([day.shamsi_date], currentDays);
      }
    },

    removeItemFromDay: (dayNumber, itemId) => {
      let targetShamsiDate: string | undefined;
      const currentDays = get().days.map((d) => {
        if (d.day_number !== dayNumber) return d;
        targetShamsiDate = d.shamsi_date;
        return {
          ...d,
          items: d.items.filter((i) => i.id !== itemId),
        };
      });
      set({ days: currentDays });
      persist(currentDays, get().mistakes, get().currentDayNumber);

      if (targetShamsiDate) {
        void syncDatesToBackend([targetShamsiDate], currentDays);
      }
    },

    toggleItemCompleted: (dayNumber, itemId) => {
      let targetShamsiDate: string | undefined;
      const currentDays = get().days.map((d) => {
        if (d.day_number !== dayNumber) return d;
        targetShamsiDate = d.shamsi_date;
        return {
          ...d,
          items: d.items.map((i) => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              completed: !i.completed,
              completed_at: !i.completed ? new Date().toISOString() : undefined,
            };
          }),
        };
      });
      set({ days: currentDays });
      persist(currentDays, get().mistakes, get().currentDayNumber);

      if (targetShamsiDate) {
        void syncDatesToBackend([targetShamsiDate], currentDays);
      }
    },

    generateLinearRoutine: async (courseSummaries, partsPerDay = 2) => {
      if (!courseSummaries || courseSummaries.length === 0) return;

      const courseStore = useCourseStore.getState();
      const loadedCourses: Course[] = [];
      for (const cs of courseSummaries) {
        const full = await courseStore.fetchCourseById(cs.id);
        if (full) loadedCourses.push(full);
      }

      // Flatten parts across courses with course metadata
      const allParts: Array<{ course: Course; part: Part }> = [];
      loadedCourses.forEach((c) => {
        c.parts.forEach((p) => {
          allParts.push({ course: c, part: p });
        });
      });

      if (allParts.length === 0) return;

      const newDays: RoutineDay[] = [];
      let dayIdx = 1;
      for (let i = 0; i < allParts.length; i += partsPerDay) {
        const slice = allParts.slice(i, i + partsPerDay);
        const items: RoutineItem[] = slice.map((item, subIdx) => ({
          id: `rt_${dayIdx}_${subIdx}_${Math.random().toString(36).substring(2, 6)}`,
          course_id: item.course.course_id,
          course_title: item.course.title,
          part_id: item.part.part_id,
          part_title: item.part.title,
          slide_count: item.part.eus.length,
          completed: false,
        }));

        const start = getEffectiveStudyDate();
        const curDate = new Date(start);
        curDate.setDate(start.getDate() + (dayIdx - 1));
        const sInfo = getShamsiDateInfo(curDate, dayIdx);

        newDays.push({
          day_number: dayIdx,
          title: sInfo.title,
          shamsi_date: sInfo.shamsi_date,
          weekday_name: sInfo.weekday_name,
          day_str: sInfo.day_str,
          month_name: sInfo.month_name,
          is_today: sInfo.is_today,
          is_friday: sInfo.is_friday,
          is_future: sInfo.is_future,
          items,
        });
        dayIdx++;
      }

      set({ days: newDays, currentDayNumber: 1 });
      persist(newDays, get().mistakes, 1);
    },

    distributeCourseParts: async (options) => {
      const {
        courseId,
        courseTitle,
        parts,
        sortMode = 'friday_buffer',
        partsPerDay = 2,
        durationDays = 7,
        strategy = 'merge',
        startDayNumber = get().currentDayNumber || 1,
      } = options;

      if (!parts || parts.length === 0) {
        return { distributedCount: 0, daysCount: get().days.length };
      }

      const startStudyDate = getEffectiveStudyDate();
      let currentDays: RoutineDay[] = get().days.map((d) => ({
        ...d,
        items: [...d.items],
      }));

      // 1. Filter / Prepare target parts according to strategy
      let targetParts = [...parts];

      if (strategy === 'replace_all') {
        currentDays = [];
        const pPerDay = Math.max(1, partsPerDay);
        let dayCount = Math.max(durationDays, 7);

        if (sortMode === 'friday_buffer') {
          const minActiveDays = Math.max(1, Math.ceil(parts.length / pPerDay));
          let activeFound = 0;
          let dIdx = 0;
          while (activeFound < minActiveDays || dIdx < durationDays) {
            const d = new Date(startStudyDate);
            d.setDate(startStudyDate.getDate() + dIdx);
            if (d.getDay() !== 5) activeFound++;
            dIdx++;
          }
          dayCount = dIdx;
        } else {
          dayCount = Math.max(durationDays, Math.max(1, Math.ceil(parts.length / pPerDay)));
        }

        for (let dayOffset = 0; dayOffset < dayCount; dayOffset++) {
          const d = new Date(startStudyDate);
          d.setDate(startStudyDate.getDate() + dayOffset);
          const sInfo = getShamsiDateInfo(d, dayOffset + 1);
          currentDays.push({
            day_number: dayOffset + 1,
            title: sInfo.title,
            shamsi_date: sInfo.shamsi_date,
            weekday_name: sInfo.weekday_name,
            day_str: sInfo.day_str,
            month_name: sInfo.month_name,
            is_today: sInfo.is_today,
            is_friday: sInfo.is_friday,
            is_future: sInfo.is_future,
            items: [],
          });
        }
      } else if (strategy === 'replace_course') {
        // Strip only items belonging to this specific course, preserving other courses
        currentDays = currentDays.map((d) => ({
          ...d,
          items: d.items.filter((it) => it.course_id !== courseId),
        }));
      } else {
        // 'merge' (default): De-duplicate! Exclude parts that are already scheduled in ANY day
        const alreadyScheduledPartIds = new Set<string>();
        currentDays.forEach((d) => {
          d.items.forEach((it) => {
            if (it.course_id === courseId) {
              alreadyScheduledPartIds.add(it.part_id);
            }
          });
        });
        targetParts = parts.filter((p) => !alreadyScheduledPartIds.has(p.part_id));
        if (targetParts.length === 0) {
          return { distributedCount: 0, daysCount: currentDays.length };
        }
      }

      const N = targetParts.length;

      // Helper to dynamically ensure days exist when extending schedule
      const ensureDayExists = (dayNum: number): RoutineDay => {
        let found = currentDays.find((d) => d.day_number === dayNum);
        if (!found) {
          const d = new Date(startStudyDate);
          d.setDate(startStudyDate.getDate() + (dayNum - 1));
          const sInfo = getShamsiDateInfo(d, dayNum);
          found = {
            day_number: dayNum,
            title: sInfo.title,
            shamsi_date: sInfo.shamsi_date,
            weekday_name: sInfo.weekday_name,
            day_str: sInfo.day_str,
            month_name: sInfo.month_name,
            is_today: sInfo.is_today,
            is_friday: sInfo.is_friday,
            is_future: sInfo.is_future,
            items: [],
          };
          currentDays.push(found);
          currentDays.sort((a, b) => a.day_number - b.day_number);
        }
        return found;
      };

      // 2. Mathematical Allocation
      if (strategy === 'replace_all') {
        const activeDays = currentDays.filter((d) => {
          if (sortMode === 'friday_buffer') return !d.is_friday;
          return true;
        });

        const distributionDays = activeDays.length > 0 ? activeDays : currentDays;
        const D = distributionDays.length;
        const dayQuotas: number[] = new Array(D).fill(0);

        if (sortMode === 'cram') {
          if (D <= 1) {
            dayQuotas[0] = N;
          } else {
            // Exam-Cram Frontloading: First half gets Math.ceil(0.65 * N)
            const D1 = Math.max(1, Math.ceil(D / 2));
            const D2 = D - D1;
            const N1 = Math.min(N, Math.ceil(0.65 * N));
            const N2 = N - N1;

            const base1 = Math.floor(N1 / D1);
            const rem1 = N1 % D1;
            for (let i = 0; i < D1; i++) {
              dayQuotas[i] = base1 + (i < rem1 ? 1 : 0);
            }

            const base2 = Math.floor(N2 / D2);
            const rem2 = N2 % D2;
            for (let i = 0; i < D2; i++) {
              dayQuotas[D1 + i] = base2 + (i < rem2 ? 1 : 0);
            }
          }
        } else if (sortMode === 'leitner') {
          if (D <= 1) {
            dayQuotas[0] = N;
          } else {
            // Weighted 2:1 for Odd (New) vs Even (Review) days
            const weights = distributionDays.map((_, idx) => (idx % 2 === 0 ? 2 : 1));
            const totalW = weights.reduce((a, b) => a + b, 0);
            const baseUnit = Math.floor(N / totalW);
            let assigned = 0;
            for (let i = 0; i < D; i++) {
              dayQuotas[i] = weights[i] * baseUnit;
              assigned += dayQuotas[i];
            }
            let rem = N - assigned;
            for (let i = 0; i < D && rem > 0; i++) {
              if (weights[i] === 2) {
                dayQuotas[i]++;
                rem--;
              }
            }
            for (let i = 0; i < D && rem > 0; i++) {
              dayQuotas[i]++;
              rem--;
            }
          }
        } else {
          // Largest Remainder Allocation: base = floor(N / D), rem = N % D
          const baseQuota = Math.floor(N / D);
          const rem = N % D;
          for (let i = 0; i < D; i++) {
            dayQuotas[i] = baseQuota + (i < rem ? 1 : 0);
          }
        }

        let partIdx = 0;
        for (let i = 0; i < distributionDays.length; i++) {
          const targetDay = distributionDays[i];
          const countForThisDay = dayQuotas[i];
          for (let c = 0; c < countForThisDay && partIdx < N; c++) {
            const pt = targetParts[partIdx++];
            targetDay.items.push({
              id: `rt_${Date.now()}_${targetDay.day_number}_${partIdx}`,
              course_id: courseId,
              course_title: courseTitle,
              part_id: pt.part_id,
              part_title: pt.title,
              slide_count: pt.eus?.length || 0,
              completed: false,
            });
          }
        }

        // Condense ghost days if N is smaller than duration and trailing days are completely empty
        while (
          currentDays.length > 7 &&
          currentDays[currentDays.length - 1].items.length === 0 &&
          currentDays.length > durationDays
        ) {
          currentDays.pop();
        }
      } else {
        // 'merge' or 'replace_course': Non-destructive slotting into existing/appended days
        let partIdx = 0;
        let dayCursor = startDayNumber;

        while (partIdx < N) {
          const curDay = ensureDayExists(dayCursor);

          // Check if Friday buffer applies
          if (sortMode === 'friday_buffer' && curDay.is_friday) {
            dayCursor++;
            continue;
          }

          let quota = partsPerDay;
          if (sortMode === 'leitner') {
            quota = curDay.day_number % 2 === 0 ? Math.max(1, Math.floor(partsPerDay / 2)) : Math.max(1, partsPerDay);
          } else if (sortMode === 'cram') {
            const isEarlyDay = (dayCursor - startDayNumber) < Math.max(3, Math.ceil(durationDays / 2));
            quota = isEarlyDay ? Math.ceil(partsPerDay * 1.5) : Math.max(1, Math.floor(partsPerDay * 0.75));
          }

          const existingOfThisCourse = curDay.items.filter((it) => it.course_id === courseId).length;
          const slotsAvailable = Math.max(0, quota - existingOfThisCourse);

          // Defect 1.3 fix: If no slots available, advance day cursor without forcing parts
          if (slotsAvailable <= 0) {
            dayCursor++;
            continue;
          }

          const toAdd = Math.min(slotsAvailable, N - partIdx);
          for (let k = 0; k < toAdd && partIdx < N; k++) {
            const pt = targetParts[partIdx++];
            curDay.items.push({
              id: `rt_${Date.now()}_${curDay.day_number}_${partIdx}`,
              course_id: courseId,
              course_title: courseTitle,
              part_id: pt.part_id,
              part_title: pt.title,
              slide_count: pt.eus?.length || 0,
              completed: false,
            });
          }

          dayCursor++;
        }
      }

      // Defect 1.5 fix: Only reset to 1 in replace_all, preserve active day in merge / replace_course
      const targetCurrentDay = strategy === 'replace_all' ? 1 : (get().currentDayNumber || 1);
      set({ days: currentDays, currentDayNumber: targetCurrentDay });
      persist(currentDays, get().mistakes, targetCurrentDay);

      // Requirement 2.1: Non-blocking fail-silent cloud sync
      const user = useAuthStore.getState().user;
      if (user?.id) {
        try {
          const syncRoutines = [];
          for (const d of currentDays) {
            for (let idx = 0; idx < d.items.length; idx++) {
              const it = d.items[idx];
              syncRoutines.push({
                shamsi_date: d.shamsi_date,
                course_id: it.course_id,
                course_title: it.course_title,
                part_id: it.part_id,
                part_title: it.part_title,
                slide_count: it.slide_count,
                completed: it.completed,
                order_idx: idx,
              });
            }
          }
          void api.post('/reviews/routines', { routines: syncRoutines }).catch(() => {});
        } catch {
          // Fail-silent
        }
      }

      return { distributedCount: N, daysCount: currentDays.length };
    },

    applySmartRoutineSchedule: async (options) => {
      const {
        courseId,
        courseTitle,
        parts,
        startDateShamsi = getCurrentShamsiDateString(),
        partsPerDay = 2,
        repeatDays = 0,
        startFromUncompleted = true,
        strategy = 'replace_course',
      } = options;

      if (!parts || parts.length === 0) {
        return {
          distributedCount: 0,
          daysCount: get().days.length,
          endDateShamsi: startDateShamsi,
          totalBatches: 0,
        };
      }

      // 1. Progress Awareness: Optionally start from first uncompleted part
      let targetParts = [...parts];
      if (startFromUncompleted) {
        const completedPartIds = new Set<string>();
        for (const d of get().days) {
          for (const it of d.items) {
            if (it.course_id === courseId && it.completed) {
              completedPartIds.add(it.part_id);
            }
          }
        }
        const firstUncompletedIndex = parts.findIndex((p) => !completedPartIds.has(p.part_id));
        if (firstUncompletedIndex > 0) {
          targetParts = parts.slice(firstUncompletedIndex);
        }
      }

      const N = targetParts.length;
      const P = Math.max(1, partsPerDay);
      const R = Math.max(0, repeatDays);
      const K = Math.ceil(N / P);
      const daysPerBatch = 1 + R;
      const totalDaysRequired = K * daysPerBatch;
      const endDateShamsi = addDaysToShamsi(startDateShamsi, Math.max(0, totalDaysRequired - 1));

      // 2. Clone current days
      let currentDays = get().days.map((d) => ({
        ...d,
        items: [...d.items],
      }));

      // 3. Strategy Handling from startDateShamsi forward
      const touchedDates = new Set<string>();

      if (strategy === 'replace_all') {
        currentDays = currentDays.map((d) => {
          if (d.shamsi_date >= startDateShamsi) {
            touchedDates.add(d.shamsi_date);
            return { ...d, items: [] };
          }
          return d;
        });
      } else if (strategy === 'replace_course') {
        // Strip only parts belonging to this specific course from startDateShamsi forward
        currentDays = currentDays.map((d) => {
          if (d.shamsi_date >= startDateShamsi) {
            touchedDates.add(d.shamsi_date);
            return {
              ...d,
              items: d.items.filter((it) => it.course_id !== courseId),
            };
          }
          return d;
        });
      }

      // Helper to ensure a specific Shamsi date exists in currentDays
      const ensureDayByDate = (shamsiDate: string): RoutineDay => {
        let found = currentDays.find((d) => d.shamsi_date === shamsiDate);
        if (!found) {
          const sInfo = getShamsiDateInfoFromString(shamsiDate, currentDays.length + 1);
          found = {
            day_number: currentDays.length + 1,
            title: sInfo.title,
            shamsi_date: sInfo.shamsi_date,
            weekday_name: sInfo.weekday_name,
            day_str: sInfo.day_str,
            month_name: sInfo.month_name,
            is_today: sInfo.is_today,
            is_friday: sInfo.is_friday,
            is_past: sInfo.is_past,
            is_future: sInfo.is_future,
            items: [],
          };
          currentDays.push(found);
        }
        return found;
      };

      // 4. Mathematical Continuous Repetition Allocation
      let scheduledItemCount = 0;
      for (let j = 0; j < K; j++) {
        const batchParts = targetParts.slice(j * P, (j + 1) * P);
        const startDayOffset = j * daysPerBatch;
        const initialStudyDate = addDaysToShamsi(startDateShamsi, startDayOffset);

        // Compute all target dates for this batch (Day 1 initial + R repeat days)
        const batchDates = [initialStudyDate];
        for (let r = 1; r <= R; r++) {
          batchDates.push(addDaysToShamsi(startDateShamsi, startDayOffset + r));
        }

        // Schedule each part in the batch on each of the batch dates with a date-specific ID
        for (const targetDate of batchDates) {
          touchedDates.add(targetDate);
          const targetDay = ensureDayByDate(targetDate);

          for (const pt of batchParts) {
            const itemDateId = `${courseId}_${pt.part_id}_${targetDate}`;

            // De-duplicate if merge
            const exists = targetDay.items.some((it) => it.id === itemDateId);
            if (!exists) {
              targetDay.items.push({
                id: itemDateId,
                course_id: courseId,
                course_title: courseTitle,
                part_id: pt.part_id,
                part_title: pt.title,
                slide_count: pt.eus?.length || 0,
                completed: false,
              });
              scheduledItemCount++;
            }
          }
        }
      }

      // 5. Re-anchor days with pure reanchorDays to ensure seamless day numbers and chronological sorting
      const { reanchoredDays, todayDayNumber } = reanchorDays(currentDays, getEffectiveStudyDate());
      const activeDay = get().currentDayNumber || todayDayNumber;
      set({ days: reanchoredDays, currentDayNumber: activeDay });
      persist(reanchoredDays, get().mistakes, activeDay);

      // 6. Full-payload cloud sync for touched dates (preserves other courses on those dates)
      void syncDatesToBackend(Array.from(touchedDates), reanchoredDays);

      return {
        distributedCount: scheduledItemCount,
        daysCount: reanchoredDays.length,
        endDateShamsi,
        totalBatches: K,
      };
    },

    startAutomaticRoutine: async (dayNumber) => {
      const targetDay = dayNumber || get().currentDayNumber;
      const day = get().days.find((d) => d.day_number === targetDay);
      if (!day || day.items.length === 0) {
        return false;
      }

      // Find first uncompleted item or start from index 0
      const uncompletedIndex = day.items.findIndex((i) => !i.completed);
      const startIndex = uncompletedIndex >= 0 ? uncompletedIndex : 0;
      const targetItem = day.items[startIndex];

      set({
        activeRoutineQueue: day.items,
        activeQueueIndex: startIndex,
      });

      // Fetch course and launch player
      const courseStore = useCourseStore.getState();
      await courseStore.fetchCourseById(targetItem.course_id);
      courseStore.startPartPlayer(targetItem.part_id);
      useAuthStore.getState().setActiveTab('player');
      return true;
    },

    onPartFinishedInRoutine: () => {
      const { activeRoutineQueue, activeQueueIndex, currentDayNumber } = get();
      if (!activeRoutineQueue) return false;

      // Mark current item as completed
      const currentItem = activeRoutineQueue[activeQueueIndex];
      if (currentItem) {
        get().toggleItemCompleted(currentDayNumber, currentItem.id);
      }

      // Check if there is next item in queue
      const nextIndex = activeQueueIndex + 1;
      if (nextIndex < activeRoutineQueue.length) {
        const nextItem = activeRoutineQueue[nextIndex];
        set({ activeQueueIndex: nextIndex });
        const courseStore = useCourseStore.getState();
        void courseStore.fetchCourseById(nextItem.course_id).then(() => {
          courseStore.startPartPlayer(nextItem.part_id);
        });
        return true;
      }

      // Routine queue finished!
      set({ activeRoutineQueue: null, activeQueueIndex: 0 });
      return false;
    },

    recordMistake: (mistake) => {
      const date_str = getTodayStr();
      const newRecord: MistakeRecord = {
        ...mistake,
        id: `mis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date_str,
        timestamp: new Date().toISOString(),
      };

      // Prevent duplicate mistake for same unit on same day
      const existing = get().mistakes.find(
        (m) => m.unit_id === mistake.unit_id && m.date_str === date_str
      );
      let updated: MistakeRecord[];
      if (existing) {
        updated = get().mistakes.map((m) =>
          m.id === existing.id ? { ...newRecord, id: existing.id } : m
        );
      } else {
        updated = [newRecord, ...get().mistakes];
      }

      set({ mistakes: updated });
      persist(get().days, updated, get().currentDayNumber);
    },

    getMistakesByDate: (dateStr) => {
      const targetDate = dateStr || getTodayStr();
      return get().mistakes.filter((m) => m.date_str === targetDate);
    },

    startMistakesCourse: (dateStr) => {
      const mistakes = get().getMistakesByDate(dateStr);
      if (mistakes.length === 0) return;

      // Construct dynamic EUs from recorded mistakes
      const eus: EU[] = mistakes.map((m, idx) => {
        if (m.raw_eu) {
          return {
            ...m.raw_eu,
            id: `mistake_${idx}_${m.unit_id}`,
          };
        }
        return {
          id: `mistake_${idx}_${m.unit_id}`,
          type: 'fill_in_the_blank',
          topic_tag: `رفع اشکال: ${m.course_title}`,
          payload: {
            word: m.question,
            sentence: m.question,
            full_meaning: m.correct_answer,
            prompt: 'شکل یا معنی صحیح این واژه را بنویسید (مرور اشتباه):',
            keywords: [m.correct_answer],
          },
        };
      });

      const mistakePart: Part = {
        part_id: `mistakes_${dateStr || getTodayStr()}`,
        title: `مرور اشتباهات (${dateStr || 'امروز'})`,
        eus,
      };

      const mistakeCourse: Course = {
        course_id: `course_mistakes`,
        title: `کارگاه رفع اشکال اشتباهات روتین`,
        description: `شامل تمام واحدهایی که در تاریخ ${dateStr || 'امروز'} به آن‌ها پاسخ اشتباه داده‌اید.`,
        topic_code: 'MISTAKES',
        parts: [mistakePart],
      };

      const courseStore = useCourseStore.getState();
      courseStore.setSelectedCourse(mistakeCourse);
      courseStore.startPartPlayer(mistakePart.part_id);
      useAuthStore.getState().setActiveTab('player');
    },

    clearMistakes: (dateStr) => {
      const targetDate = dateStr || getTodayStr();
      const updated = get().mistakes.filter((m) => m.date_str !== targetDate);
      set({ mistakes: updated });
      persist(get().days, updated, get().currentDayNumber);
    },

    syncWithCloud: async () => {
      const allDates = get().days.map((d) => d.shamsi_date);
      await syncDatesToBackend(allDates, get().days);
    },

    loadCloudRoutines: async () => {
      const user = useAuthStore.getState().user;
      if (!user?.id) return;

      try {
        const rows = await api.get<any[]>('/reviews/routines');
        if (!Array.isArray(rows) || rows.length === 0) return;

        // Group cloud items by canonical shamsi_date
        const cloudItemsByDate = new Map<string, RoutineItem[]>();
        for (const r of rows) {
          const sDate = r.shamsi_date;
          if (!sDate) continue;
          const list = cloudItemsByDate.get(sDate) || [];
          list.push({
            id: `${r.course_id}_${r.part_id}_${sDate}`,
            course_id: r.course_id,
            course_title: r.course_title || '',
            part_id: r.part_id,
            part_title: r.part_title || '',
            slide_count: r.slide_count || 0,
            completed: Boolean(r.completed),
            completed_at: r.completed_at || undefined,
          });
          cloudItemsByDate.set(sDate, list);
        }

        // Merge with existing days or construct new days
        let existingDays = [...get().days];
        for (const [sDate, cloudItems] of cloudItemsByDate.entries()) {
          let day = existingDays.find((d) => d.shamsi_date === sDate);
          if (!day) {
            const sInfo = getShamsiDateInfoFromString(sDate, existingDays.length + 1);
            day = {
              day_number: existingDays.length + 1,
              title: sInfo.title,
              shamsi_date: sInfo.shamsi_date,
              weekday_name: sInfo.weekday_name,
              day_str: sInfo.day_str,
              month_name: sInfo.month_name,
              is_today: sInfo.is_today,
              is_friday: sInfo.is_friday,
              is_past: sInfo.is_past,
              is_future: sInfo.is_future,
              items: [],
            };
            existingDays.push(day);
          }

          if (day.items.length === 0) {
            day.items = cloudItems;
          } else {
            const localMap = new Map(day.items.map((it) => [it.id, it]));
            for (const cItem of cloudItems) {
              if (!localMap.has(cItem.id)) {
                day.items.push(cItem);
              } else {
                const local = localMap.get(cItem.id);
                if (local && cItem.completed && !local.completed) {
                  local.completed = true;
                  local.completed_at = cItem.completed_at;
                }
              }
            }
          }
        }

        const { reanchoredDays, todayDayNumber } = reanchorDays(existingDays, getEffectiveStudyDate());
        const activeDay = get().currentDayNumber || todayDayNumber;
        set({ days: reanchoredDays, currentDayNumber: activeDay });
        persist(reanchoredDays, get().mistakes, activeDay);
      } catch {
        // Fail-silent for offline resilience
      }
    },
  };
});

if (typeof window !== 'undefined') {
  (window as any).routineStore = useRoutineStore;

  // Reactive study date rollover check with HMR guard against duplicate listeners
  if (!(window as any).__mediaz_routine_vis_attached) {
    (window as any).__mediaz_routine_vis_attached = true;
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        try {
          useRoutineStore.getState().recheckEffectiveDate();
        } catch {}
      }
    });
  }
}
