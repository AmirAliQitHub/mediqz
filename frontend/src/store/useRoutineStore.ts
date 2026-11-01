import { create } from 'zustand';
import { EU, Part, Course, CourseSummary } from '../types';
import { useCourseStore } from './useCourseStore';
import { useAuthStore } from './useAuthStore';

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
  setCurrentDay: (day: number) => void;
  addItemToDay: (dayNumber: number, item: Omit<RoutineItem, 'id' | 'completed'>) => void;
  removeItemFromDay: (dayNumber: number, itemId: string) => void;
  toggleItemCompleted: (dayNumber: number, itemId: string) => void;
  generateLinearRoutine: (courses: CourseSummary[], partsPerDay?: number) => Promise<void>;
  startAutomaticRoutine: (dayNumber?: number) => Promise<boolean>;
  onPartFinishedInRoutine: () => boolean; // returns true if next part started, false if done
  recordMistake: (mistake: Omit<MistakeRecord, 'id' | 'date_str' | 'timestamp'>) => void;
  getMistakesByDate: (dateStr?: string) => MistakeRecord[];
  startMistakesCourse: (dateStr?: string) => void;
  clearMistakes: (dateStr?: string) => void;
}

const STORAGE_KEY_ROUTINE = 'mediaz_routine_days_v1';
const STORAGE_KEY_MISTAKES = 'mediaz_routine_mistakes_v1';
const STORAGE_KEY_CURRENT_DAY = 'mediaz_routine_current_day_v1';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const defaultInitialDays: RoutineDay[] = [
  { day_number: 1, title: 'روز ۱ (امروز)', items: [] },
  { day_number: 2, title: 'روز ۲', items: [] },
  { day_number: 3, title: 'روز ۳', items: [] },
  { day_number: 4, title: 'روز ۴', items: [] },
  { day_number: 5, title: 'روز ۵', items: [] },
  { day_number: 6, title: 'روز ۶', items: [] },
  { day_number: 7, title: 'روز ۷', items: [] },
];

export const useRoutineStore = create<RoutineState>((set, get) => {
  // Load saved state
  let initialDays = defaultInitialDays;
  let initialMistakes: MistakeRecord[] = [];
  let initialDayNumber = 1;

  if (typeof window !== 'undefined') {
    try {
      const savedDays = localStorage.getItem(STORAGE_KEY_ROUTINE);
      if (savedDays) initialDays = JSON.parse(savedDays);
      const savedMistakes = localStorage.getItem(STORAGE_KEY_MISTAKES);
      if (savedMistakes) initialMistakes = JSON.parse(savedMistakes);
      const savedCurDay = localStorage.getItem(STORAGE_KEY_CURRENT_DAY);
      if (savedCurDay) initialDayNumber = parseInt(savedCurDay, 10) || 1;
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

  return {
    currentDayNumber: initialDayNumber,
    days: initialDays,
    mistakes: initialMistakes,
    activeRoutineQueue: null,
    activeQueueIndex: 0,

    setCurrentDay: (day) => {
      set({ currentDayNumber: day });
      persist(get().days, get().mistakes, day);
    },

    addItemToDay: (dayNumber, item) => {
      const currentDays = [...get().days];
      let day = currentDays.find((d) => d.day_number === dayNumber);
      if (!day) {
        day = { day_number: dayNumber, title: `روز ${dayNumber}`, items: [] };
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
    },

    removeItemFromDay: (dayNumber, itemId) => {
      const currentDays = get().days.map((d) => {
        if (d.day_number !== dayNumber) return d;
        return {
          ...d,
          items: d.items.filter((i) => i.id !== itemId),
        };
      });
      set({ days: currentDays });
      persist(currentDays, get().mistakes, get().currentDayNumber);
    },

    toggleItemCompleted: (dayNumber, itemId) => {
      const currentDays = get().days.map((d) => {
        if (d.day_number !== dayNumber) return d;
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

        newDays.push({
          day_number: dayIdx,
          title: `روز ${dayIdx}${dayIdx === 1 ? ' (شروع)' : ''}`,
          items,
        });
        dayIdx++;
      }

      set({ days: newDays, currentDayNumber: 1 });
      persist(newDays, get().mistakes, 1);
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
  };
});

if (typeof window !== 'undefined') {
  (window as any).routineStore = useRoutineStore;
}
