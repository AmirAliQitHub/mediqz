import { create } from 'zustand';
import { CourseSummary, Course, Part, EU } from '../types';
import { api } from '../services/api';
import { useRoutineStore } from './useRoutineStore';

export interface EUResult {
  eu_id: string;
  order: number;
  type: string;
  topic_tag: string;
  title: string;
  is_interactive: boolean;
  status: 'correct' | 'wrong' | 'viewed' | 'unanswered' | 'null';
  user_answer?: string | null;
  correct_answer?: string | null;
}

export interface AutoReviewItem {
  course_id: string;
  part_id: string;
  title: string;
  next_due_at?: string;
}

export interface ReviewSessionContext {
  isReviewSession: boolean;
  isAutomaticReview?: boolean;
  reviewCourseId: string;
  reviewPartId: string;
  allEUs: EU[];
  absentEuIds: string[];
  previousSummary?: any;
}

interface CourseState {
  courses: CourseSummary[];
  selectedCourse: Course | null;
  activePart: Part | null;
  currentSlideIndex: number;
  euResults: Record<string, EUResult>;
  isPartCompleted: boolean;
  isLoading: boolean;
  reviewContext: ReviewSessionContext | null;
  autoReviewQueue: AutoReviewItem[];
  autoReviewIndex: number;
  autoReviewActive: boolean;
  showContextSentence: boolean;
  isRedemptionMode: boolean;
  redemptionQueue: EU[];
  redemptionIndex: number;
  showRedemptionInterstitial: boolean;

  fetchCourses: (includeDev?: boolean) => Promise<void>;
  selectCourse: (courseId: string) => Promise<void>;
  fetchCourseById: (courseId: string) => Promise<Course | null>;
  setSelectedCourse: (course: Course | null) => void;
  setShowContextSentence: (show: boolean) => void;
  toggleContextSentence: () => void;
  startPartPlayer: (partId: string) => void;
  startReviewSession: (part: Part, course: Course, context: ReviewSessionContext) => void;
  startAutomaticReviewSession: (items: AutoReviewItem[]) => void;
  advanceAutomaticReview: () => boolean;
  clearAutomaticReview: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  recordEUResult: (euId: string, result: Partial<EUResult>) => void;
  markCurrentPartDone: () => void;
  dismissRedemptionInterstitial: () => void;
  nextRedemptionSlide: () => void;
  resolveRedemptionSlide: (euId: string) => void;
  resetPlayer: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  selectedCourse: null,
  activePart: null,
  currentSlideIndex: 0,
  euResults: {},
  isPartCompleted: false,
  isLoading: false,
  reviewContext: null,
  autoReviewQueue: [],
  autoReviewIndex: 0,
  autoReviewActive: false,
  isRedemptionMode: false,
  redemptionQueue: [],
  redemptionIndex: 0,
  showRedemptionInterstitial: false,
  showContextSentence: typeof window !== 'undefined' ? localStorage.getItem('alqualite_show_context_sentence') !== 'false' : true,

  setShowContextSentence: (show: boolean) => {
    try {
      localStorage.setItem('alqualite_show_context_sentence', String(show));
    } catch {}
    set({ showContextSentence: show });
  },

  toggleContextSentence: () => {
    const current = get().showContextSentence;
    const nextVal = !current;
    try {
      localStorage.setItem('alqualite_show_context_sentence', String(nextVal));
    } catch {}
    set({ showContextSentence: nextVal });
  },

  fetchCourses: async (includeDev?: boolean) => {
    set({ isLoading: true });
    try {
      const url = includeDev ? '/courses?include_dev=true' : '/courses';
      const res = await api.get<CourseSummary[]>(url);
      set({ courses: res, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectCourse: async (courseId: string) => {
    set({ isLoading: true });
    try {
      const course = await api.get<Course>(`/courses/${encodeURIComponent(courseId)}`);
      set({ selectedCourse: course, isLoading: false, reviewContext: null });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  fetchCourseById: async (courseId: string) => {
    set({ isLoading: true });
    try {
      const course = await api.get<Course>(`/courses/${encodeURIComponent(courseId)}`);
      set({ selectedCourse: course, isLoading: false });
      return course;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  setSelectedCourse: (course: Course | null) => {
    set({ selectedCourse: course });
  },

  startPartPlayer: (partId: string) => {
    const course = get().selectedCourse;
    if (!course) return;
    const part = course.parts.find((p) => p.part_id === partId) || course.parts[0];
    if (!part) return;

    const initialResults: Record<string, EUResult> = {};
    part.eus.forEach((eu, idx) => {
      initialResults[eu.id] = {
        eu_id: eu.id,
        order: eu.order || idx + 1,
        type: eu.type,
        topic_tag: eu.topic_tag || 'عمومی',
        title: eu.payload?.word || eu.payload?.title || eu.payload?.statement || `واحد ${idx + 1}`,
        is_interactive: eu.type !== 'learn_box',
        status: eu.type === 'learn_box' ? 'viewed' : 'unanswered',
      };
    });

    set({
      activePart: part,
      currentSlideIndex: 0,
      euResults: initialResults,
      isPartCompleted: false,
      isRedemptionMode: false,
      redemptionQueue: [],
      redemptionIndex: 0,
      showRedemptionInterstitial: false,
      reviewContext: null,
    });
  },

  startAutomaticReviewSession: (items) => {
    const queue = [...items].sort((a, b) => {
      if (a.next_due_at && b.next_due_at) {
        return new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime();
      }
      if (a.next_due_at) return -1;
      if (b.next_due_at) return 1;
      return a.title.localeCompare(b.title, 'fa');
    });
    set({ autoReviewQueue: queue, autoReviewIndex: 0, autoReviewActive: queue.length > 0 });
  },

  advanceAutomaticReview: () => {
    const { autoReviewIndex, autoReviewQueue, autoReviewActive } = get();
    if (!autoReviewActive) return false;
    const nextIndex = autoReviewIndex + 1;
    if (nextIndex < autoReviewQueue.length) {
      set({ autoReviewIndex: nextIndex });
      return true;
    }
    set({ autoReviewQueue: [], autoReviewIndex: 0, autoReviewActive: false });
    return false;
  },

  clearAutomaticReview: () => {
    set({ autoReviewQueue: [], autoReviewIndex: 0, autoReviewActive: false });
  },

  startReviewSession: (part: Part, course: Course, context: ReviewSessionContext) => {
    const initialResults: Record<string, EUResult> = {};
    part.eus.forEach((eu, idx) => {
      initialResults[eu.id] = {
        eu_id: eu.id,
        order: eu.order || idx + 1,
        type: eu.type,
        topic_tag: eu.topic_tag || 'مرور',
        title: eu.payload?.word || eu.payload?.title || eu.payload?.statement || `واحد ${idx + 1}`,
        is_interactive: eu.type !== 'learn_box',
        status: eu.type === 'learn_box' ? 'viewed' : 'unanswered',
      };
    });

    set({
      selectedCourse: course,
      activePart: part,
      currentSlideIndex: 0,
      euResults: initialResults,
      isPartCompleted: false,
      isRedemptionMode: false,
      redemptionQueue: [],
      redemptionIndex: 0,
      showRedemptionInterstitial: false,
      reviewContext: context,
    });
  },

  nextSlide: () => {
    const { isRedemptionMode } = get();
    if (isRedemptionMode) {
      get().nextRedemptionSlide();
      return;
    }

    const { activePart, currentSlideIndex } = get();
    if (!activePart) return;
    if (currentSlideIndex < activePart.eus.length - 1) {
      set({ currentSlideIndex: currentSlideIndex + 1 });
    } else {
      get().markCurrentPartDone();
    }
  },

  prevSlide: () => {
    const { isRedemptionMode, redemptionQueue, redemptionIndex, currentSlideIndex } = get();
    if (isRedemptionMode) {
      if (redemptionQueue.length > 0) {
        const prevIdx = redemptionIndex > 0 ? redemptionIndex - 1 : redemptionQueue.length - 1;
        set({ redemptionIndex: prevIdx });
      }
      return;
    }

    if (currentSlideIndex > 0) {
      set({ currentSlideIndex: currentSlideIndex - 1 });
    }
  },

  recordEUResult: (euId, result) => {
    const { euResults, selectedCourse, activePart, isRedemptionMode } = get();

    // STRICT DATABASE IMMUTABILITY LAW:
    // If in redemption mode, do NOT log to mistakes or write to SQLite eu_activity_logs!
    if (isRedemptionMode || (result as any).isRedemption) {
      if (result.status === 'correct') {
        get().resolveRedemptionSlide(euId);
      }
      return;
    }

    const existing = euResults[euId] || {
      eu_id: euId,
      order: 1,
      type: 'custom',
      topic_tag: 'عمومی',
      title: 'واحد آموزشی',
      is_interactive: true,
      status: 'unanswered',
    };
    set({
      euResults: {
        ...euResults,
        [euId]: { ...existing, ...result },
      },
    });

    // If answer is wrong, automatically record into RoutineHub's mistakes hunter (first pass ONLY)
    if (result.status === 'wrong') {
      try {
        const currentEu = activePart?.eus.find((e) => e.id === euId);
        const questionText =
          currentEu?.payload?.word ||
          currentEu?.payload?.sentence ||
          currentEu?.payload?.statement ||
          currentEu?.payload?.pair ||
          currentEu?.payload?.prompt ||
          existing.title ||
          'پرسش';
        const correctText =
          result.correct_answer ||
          currentEu?.payload?.full_meaning ||
          currentEu?.payload?.meaning ||
          (Array.isArray(currentEu?.payload?.keywords) ? currentEu.payload.keywords[0] : '') ||
          '';

        useRoutineStore.getState().recordMistake({
          course_id: selectedCourse?.course_id || 'general',
          course_title: selectedCourse?.title || 'دوره آموزشی',
          part_id: activePart?.part_id || 'general_part',
          part_title: activePart?.title || 'پارت آموزشی',
          unit_id: euId,
          question: String(questionText),
          user_answer: result.user_answer ? String(result.user_answer) : 'پاسخ نادرست',
          correct_answer: String(correctText),
          raw_eu: currentEu,
        });
      } catch (err) {
        console.warn('Failed to record mistake in RoutineStore:', err);
      }
    }
  },

  markCurrentPartDone: () => {
    const { activePart, euResults } = get();
    if (!activePart) {
      set({ isPartCompleted: true });
      return;
    }

    // Duolingo Redemption Check: Collect all interactive slides where status === 'wrong' or 'null'
    const unmastered = activePart.eus.filter((eu) => {
      if (eu.type === 'learn_box') return false;
      const res = euResults[eu.id];
      return res?.status === 'wrong' || res?.status === 'null';
    });

    if (unmastered.length > 0) {
      set({
        isRedemptionMode: true,
        redemptionQueue: unmastered,
        redemptionIndex: 0,
        showRedemptionInterstitial: true,
      });
    } else {
      set({
        isPartCompleted: true,
        isRedemptionMode: false,
        redemptionQueue: [],
        redemptionIndex: 0,
        showRedemptionInterstitial: false,
      });
    }
  },

  dismissRedemptionInterstitial: () => {
    set({ showRedemptionInterstitial: false });
  },

  nextRedemptionSlide: () => {
    const { redemptionQueue, redemptionIndex } = get();
    if (redemptionQueue.length === 0) {
      set({
        isPartCompleted: true,
        isRedemptionMode: false,
        showRedemptionInterstitial: false,
      });
      return;
    }
    const nextIdx = (redemptionIndex + 1) % redemptionQueue.length;
    set({ redemptionIndex: nextIdx });
  },

  resolveRedemptionSlide: (euId: string) => {
    const { redemptionQueue, redemptionIndex } = get();
    const remaining = redemptionQueue.filter((e) => e.id !== euId);
    if (remaining.length === 0) {
      set({
        redemptionQueue: [],
        redemptionIndex: 0,
        isRedemptionMode: false,
        showRedemptionInterstitial: false,
        isPartCompleted: true,
      });
    } else {
      const nextIdx = redemptionIndex >= remaining.length ? 0 : redemptionIndex;
      set({
        redemptionQueue: remaining,
        redemptionIndex: nextIdx,
      });
    }
  },

  resetPlayer: () => {
    set({
      activePart: null,
      currentSlideIndex: 0,
      euResults: {},
      isPartCompleted: false,
      isRedemptionMode: false,
      redemptionQueue: [],
      redemptionIndex: 0,
      showRedemptionInterstitial: false,
      reviewContext: null,
    });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).courseStore = useCourseStore;
}
