import { create } from 'zustand';
import {
  ExamSummary,
  ExamQuestion,
  InExamAnswerStatus,
  KeypadAnswerValue,
  QuestionJournalEntry,
  ExamMetricsResponse,
  SwotData,
  TahlilStage,
  TahlilView,
} from '../types/tahlil';
import { tahlilService } from '../services/tahlilService';

export type { TahlilView };
export type EvaluationMode = 'in_exam' | 'outside_exam';

const getDraftStorageKey = (examId: string) => `mediqz_tahlil_draft_${examId}`;
const getSwotDraftStorageKey = (examId: string) => `mediqz_tahlil_swot_draft_${examId}`;

const initialSwotData: SwotData = {
  strengths: [],
  weaknesses: [],
  opportunities: [],
  threats: [],
  last_substep: 1,
  is_completed: false,
  is_skipped: false,
};

interface TahlilState {
  exams: ExamSummary[];
  activeExam: (ExamSummary & { questions: ExamQuestion[] }) | null;
  questions: ExamQuestion[];
  activeView: TahlilView;
  selectedQuestionIndex: number;
  
  // Data
  keypadAnswers: Record<string, KeypadAnswerValue>;
  journalEntries: Record<string, QuestionJournalEntry>;
  swotData: SwotData;
  swotSubstep: 1 | 2 | 3 | 4;
  currentStage: TahlilStage;
  maxUnlockedStage: TahlilStage;
  maxUnlockedSwotSubstep: number;
  metrics: ExamMetricsResponse | null;
  activeMode: EvaluationMode;
  
  // UI States
  isLoading: boolean;
  error: string | null;

  // Actions
  loadExamsCatalog: () => Promise<void>;
  selectExam: (examId: string) => Promise<void>;
  setKeypadAnswer: (qNum: number, option: number) => void;
  markRemainingBlank: () => void;
  submitKeypad: () => Promise<void>;
  setSwotList: (dimension: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', list: string[]) => void;
  setSwotSubstep: (step: 1 | 2 | 3 | 4) => void;
  saveSwotDraft: () => Promise<void>;
  submitSwot: (advanceToJournal?: boolean) => Promise<void>;
  skipSwot: () => Promise<void>;
  setJournalEntry: (qNum: number, partial: Partial<QuestionJournalEntry>) => void;
  submitJournal: () => Promise<void>;
  loadMetrics: (examId: string) => Promise<void>;
  resetActiveExam: () => Promise<void>;
  setActiveView: (view: TahlilView) => void;
  setSelectedQuestionIndex: (idx: number) => void;
  setActiveMode: (mode: EvaluationMode) => void;

  // Compatibility aliases
  activePhase?: any;
  setActivePhase?: any;
  phase1Answers?: any;
  phase2Resolves?: any;
  report?: any;
  setPhase1Answer?: any;
  submitPhase1?: any;
  setPhase2Resolve?: any;
  submitPhase2?: any;
  loadReport?: any;
  setActiveQuestionIndex?: any;
  activeQuestionIndex?: number;
}

export const useTahlilStore = create<TahlilState>((set, get) => ({
  exams: [],
  activeExam: null,
  questions: [],
  activeView: 'catalog',
  selectedQuestionIndex: 0,
  keypadAnswers: {},
  journalEntries: {},
  swotData: { ...initialSwotData },
  swotSubstep: 1,
  currentStage: 'keypad',
  maxUnlockedStage: 'keypad',
  maxUnlockedSwotSubstep: 1,
  metrics: null,
  activeMode: 'in_exam',
  isLoading: false,
  error: null,

  // Compatibility proxies
  get activePhase() {
    const v = get().activeView;
    if (v === 'keypad') return 'phase1';
    if (v === 'swot') return 'phase1';
    if (v === 'journal') return 'phase2';
    if (v === 'dashboard') return 'report';
    return 'catalog';
  },
  get activeQuestionIndex() {
    return get().selectedQuestionIndex;
  },
  get phase1Answers() {
    const ka = get().keypadAnswers;
    const res: Record<string, InExamAnswerStatus> = {};
    for (const [k, v] of Object.entries(ka)) {
      res[k] = v.status;
    }
    return res;
  },
  get phase2Resolves() {
    return get().journalEntries;
  },
  get report() {
    return get().metrics;
  },

  loadExamsCatalog: async () => {
    set({ isLoading: true, error: null });
    try {
      const exams = await tahlilService.getExamsCatalog();
      set({ exams, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'خطا در دریافت لیست آزمون‌ها', isLoading: false });
    }
  },

  selectExam: async (examId: string) => {
    set({ isLoading: true, error: null });
    try {
      const details = await tahlilService.getExamDetails(examId);
      const userAnalysis = await tahlilService.getUserAnalysis(examId).catch(() => null);

      const existingKeypad: Record<string, KeypadAnswerValue> = {};
      const existingJournal: Record<string, QuestionJournalEntry> = {};

      if (userAnalysis && userAnalysis.phase1_answers) {
        for (const [k, v] of Object.entries(userAnalysis.phase1_answers)) {
          if (typeof v === 'object' && v !== null && 'status' in v) {
            existingKeypad[k] = v as KeypadAnswerValue;
          } else if (typeof v === 'string') {
            existingKeypad[k] = { status: v as InExamAnswerStatus };
          }
        }
      }

      if (userAnalysis && userAnalysis.phase2_resolves) {
        for (const [k, v] of Object.entries(userAnalysis.phase2_resolves)) {
          existingJournal[k] = v as QuestionJournalEntry;
        }
      }

      // Restore local keypad draft if exists and not already submitted
      try {
        const localDraft = localStorage.getItem(getDraftStorageKey(examId));
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          if (parsed && typeof parsed === 'object') {
            for (const [k, v] of Object.entries(parsed)) {
              if (!existingKeypad[k]) {
                existingKeypad[k] = v as KeypadAnswerValue;
              }
            }
          }
        }
      } catch {}

      // Rehydrate SWOT analysis
      let initialSwot: SwotData = { ...initialSwotData };
      if (userAnalysis && userAnalysis.swot_analysis && typeof userAnalysis.swot_analysis === 'object') {
        const sw = userAnalysis.swot_analysis;
        initialSwot = {
          strengths: Array.isArray(sw.strengths) ? sw.strengths : [],
          weaknesses: Array.isArray(sw.weaknesses) ? sw.weaknesses : [],
          opportunities: Array.isArray(sw.opportunities) ? sw.opportunities : [],
          threats: Array.isArray(sw.threats) ? sw.threats : [],
          last_substep: (sw.last_substep as 1 | 2 | 3 | 4) || 1,
          is_completed: Boolean(sw.is_completed),
          is_skipped: Boolean(sw.is_skipped),
        };
      }

      // Restore local SWOT draft if exists and not completed/skipped
      try {
        const localSwotDraft = localStorage.getItem(getSwotDraftStorageKey(examId));
        if (localSwotDraft) {
          const parsed = JSON.parse(localSwotDraft);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.strengths) && initialSwot.strengths.length === 0) initialSwot.strengths = parsed.strengths;
            if (Array.isArray(parsed.weaknesses) && initialSwot.weaknesses.length === 0) initialSwot.weaknesses = parsed.weaknesses;
            if (Array.isArray(parsed.opportunities) && initialSwot.opportunities.length === 0) initialSwot.opportunities = parsed.opportunities;
            if (Array.isArray(parsed.threats) && initialSwot.threats.length === 0) initialSwot.threats = parsed.threats;
            if (parsed.last_substep && !initialSwot.is_completed && !initialSwot.is_skipped) {
              initialSwot.last_substep = parsed.last_substep;
            }
          }
        }
      } catch {}

      // Calculate max unlocked substep in SWOT
      let unlockedSubstep = Math.max(1, initialSwot.last_substep || 1);
      if (initialSwot.is_completed || initialSwot.is_skipped) {
        unlockedSubstep = 4;
      }

      // Check if keypad was actually submitted to backend
      const isKeypadSubmitted = Boolean(
        userAnalysis &&
        userAnalysis.status &&
        userAnalysis.status !== 'not_started' &&
        userAnalysis.phase1_answers &&
        Object.keys(userAnalysis.phase1_answers).length > 0
      );

      let targetView: TahlilView = 'keypad';
      let stage: TahlilStage = 'keypad';
      let maxStage: TahlilStage = 'keypad';

      if (!isKeypadSubmitted) {
        targetView = 'keypad';
        stage = 'keypad';
        maxStage = 'keypad';
      } else if (userAnalysis.status === 'completed' || userAnalysis.current_stage === 'dashboard') {
        targetView = 'dashboard';
        stage = 'dashboard';
        maxStage = 'dashboard';
        get().loadMetrics(examId).catch(() => {});
      } else if (
        userAnalysis.current_stage === 'journal' ||
        userAnalysis.status === 'journaling' ||
        initialSwot.is_completed ||
        initialSwot.is_skipped
      ) {
        targetView = 'journal';
        stage = 'journal';
        maxStage = 'journal';
        get().loadMetrics(examId).catch(() => {});
      } else {
        // Keypad submitted, SWOT in progress
        targetView = 'swot';
        stage = 'swot';
        maxStage = 'swot';
      }

      set({
        activeExam: details,
        questions: details.questions || [],
        activeView: targetView,
        currentStage: stage,
        maxUnlockedStage: maxStage,
        selectedQuestionIndex: 0,
        keypadAnswers: existingKeypad,
        journalEntries: existingJournal,
        swotData: initialSwot,
        swotSubstep: initialSwot.last_substep || 1,
        maxUnlockedSwotSubstep: unlockedSubstep,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'خطا در بارگذاری آزمون', isLoading: false });
    }
  },

  setKeypadAnswer: (qNum: number, option: number) => {
    const { questions, keypadAnswers, selectedQuestionIndex, activeExam } = get();
    const q = questions.find((item) => item.q_num === qNum);
    const correctOpt = q ? q.correct_opt : 0;

    let status: InExamAnswerStatus = 'blank';
    if (option === 0) {
      status = 'blank';
    } else if (option === correctOpt) {
      status = 'correct';
    } else {
      status = 'wrong';
    }

    const updated = {
      ...keypadAnswers,
      [String(qNum)]: { option, status },
    };

    if (activeExam) {
      try {
        localStorage.setItem(getDraftStorageKey(activeExam.id), JSON.stringify(updated));
      } catch {}
    }

    let nextIndex = selectedQuestionIndex;
    if (selectedQuestionIndex < questions.length - 1) {
      nextIndex = selectedQuestionIndex + 1;
    }

    set({
      keypadAnswers: updated,
      selectedQuestionIndex: nextIndex,
    });
  },

  markRemainingBlank: () => {
    const { questions, keypadAnswers, activeExam } = get();
    const updated = { ...keypadAnswers };
    for (const q of questions) {
      const key = String(q.q_num);
      if (!updated[key]) {
        updated[key] = { option: 0, status: 'blank' };
      }
    }
    if (activeExam) {
      try {
        localStorage.setItem(getDraftStorageKey(activeExam.id), JSON.stringify(updated));
      } catch {}
    }
    set({ keypadAnswers: updated });
  },

  submitKeypad: async () => {
    const { activeExam, keypadAnswers, swotData } = get();
    if (!activeExam) return;

    set({ isLoading: true, error: null });
    try {
      await tahlilService.submitKeypad(activeExam.id, keypadAnswers);
      try {
        localStorage.removeItem(getDraftStorageKey(activeExam.id));
      } catch {}
      await get().loadMetrics(activeExam.id);

      const isSwotDone = Boolean(swotData.is_completed || swotData.is_skipped);
      const nextView: TahlilView = isSwotDone ? 'journal' : 'swot';
      const nextStage: TahlilStage = isSwotDone ? 'journal' : 'swot';

      set({
        activeView: nextView,
        currentStage: nextStage,
        maxUnlockedStage: nextStage,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'خطا در ثبت پاسخ‌برگ', isLoading: false });
    }
  },

  setSwotList: (dimension, list) => {
    const { swotData, activeExam } = get();
    const updated: SwotData = {
      ...swotData,
      [dimension]: list,
    };
    if (activeExam) {
      try {
        localStorage.setItem(getSwotDraftStorageKey(activeExam.id), JSON.stringify(updated));
      } catch {}
    }
    set({ swotData: updated });
  },

  setSwotSubstep: (step) => {
    const { maxUnlockedSwotSubstep, swotData, activeExam } = get();
    // Guard: student cannot jump forward past unlocked substeps
    if (step > maxUnlockedSwotSubstep) return;

    const updated = { ...swotData, last_substep: step };
    if (activeExam) {
      try {
        localStorage.setItem(getSwotDraftStorageKey(activeExam.id), JSON.stringify(updated));
      } catch {}
    }
    set({ swotSubstep: step, swotData: updated });
  },

  saveSwotDraft: async () => {
    const { activeExam, swotData, swotSubstep } = get();
    if (!activeExam) return;
    try {
      await tahlilService.submitSwot(activeExam.id, {
        swot: swotData,
        current_substep: swotSubstep,
        advance_stage: false,
      });
    } catch (err) {
      console.warn('Background SWOT save failed:', err);
    }
  },

  submitSwot: async (advanceToJournal = false) => {
    const { activeExam, swotData, swotSubstep, maxUnlockedSwotSubstep } = get();
    if (!activeExam) return;

    set({ isLoading: true, error: null });
    try {
      const nextSubstep = Math.min(4, swotSubstep + 1) as 1 | 2 | 3 | 4;
      const willComplete = advanceToJournal || swotSubstep === 4;

      const payloadSwot: SwotData = {
        ...swotData,
        last_substep: willComplete ? 4 : nextSubstep,
        is_completed: willComplete ? true : swotData.is_completed,
      };

      const res = await tahlilService.submitSwot(activeExam.id, {
        swot: payloadSwot,
        current_substep: willComplete ? 4 : nextSubstep,
        advance_stage: willComplete,
      });

      const updatedSwot: SwotData = {
        ...payloadSwot,
        ...(res && res.swot_analysis ? res.swot_analysis : {}),
      };

      if (willComplete) {
        try {
          localStorage.removeItem(getSwotDraftStorageKey(activeExam.id));
        } catch {}
        set({
          swotData: updatedSwot,
          activeView: 'journal',
          currentStage: 'journal',
          maxUnlockedStage: 'journal',
          isLoading: false,
        });
      } else {
        const newMax = Math.max(maxUnlockedSwotSubstep, nextSubstep);
        set({
          swotData: updatedSwot,
          swotSubstep: nextSubstep,
          maxUnlockedSwotSubstep: newMax,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'خطا در ثبت اطلاعات سوات', isLoading: false });
    }
  },

  skipSwot: async () => {
    const { activeExam, swotData, swotSubstep } = get();
    if (!activeExam) return;

    set({ isLoading: true, error: null });
    try {
      const skippedSwot: SwotData = {
        ...swotData,
        is_skipped: true,
      };
      const res = await tahlilService.submitSwot(activeExam.id, {
        swot: skippedSwot,
        current_substep: swotSubstep,
        advance_stage: true,
      });
      try {
        localStorage.removeItem(getSwotDraftStorageKey(activeExam.id));
      } catch {}
      set({
        swotData: {
          ...skippedSwot,
          ...(res && res.swot_analysis ? res.swot_analysis : {}),
        },
        activeView: 'journal',
        currentStage: 'journal',
        maxUnlockedStage: 'journal',
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'خطا در رد شدن از مرحله سوات', isLoading: false });
    }
  },

  setJournalEntry: (qNum: number, partial: Partial<QuestionJournalEntry>) => {
    const { journalEntries } = get();
    const key = String(qNum);
    const current = journalEntries[key] || {};
    const updated = {
      ...journalEntries,
      [key]: { ...current, ...partial },
    };
    set({ journalEntries: updated });
  },

  submitJournal: async () => {
    const { activeExam, journalEntries } = get();
    if (!activeExam) return;

    set({ isLoading: true, error: null });
    try {
      await tahlilService.submitJournal(activeExam.id, journalEntries);
      await get().loadMetrics(activeExam.id);
      set({ activeView: 'dashboard', currentStage: 'dashboard', maxUnlockedStage: 'dashboard', isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'خطا در ثبت ژورنال', isLoading: false });
    }
  },

  loadMetrics: async (examId: string) => {
    set({ isLoading: true, error: null });
    try {
      const metrics = await tahlilService.getMetrics(examId);
      set({ metrics, isLoading: false, error: null });
    } catch (err: any) {
      // Gracefully handle not_started or uncalculated metrics without trapping the user
      set({ error: null, isLoading: false });
    }
  },

  resetActiveExam: async () => {
    const { activeExam } = get();
    if (!activeExam) return;

    set({ isLoading: true, error: null });
    try {
      await tahlilService.resetAnalysis(activeExam.id);
      try {
        localStorage.removeItem(getDraftStorageKey(activeExam.id));
        localStorage.removeItem(getSwotDraftStorageKey(activeExam.id));
      } catch {}
      set({
        keypadAnswers: {},
        journalEntries: {},
        swotData: { ...initialSwotData },
        swotSubstep: 1,
        currentStage: 'keypad',
        maxUnlockedStage: 'keypad',
        maxUnlockedSwotSubstep: 1,
        metrics: null,
        activeView: 'keypad',
        selectedQuestionIndex: 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'خطا در ریست کردن تحلیل آزمون', isLoading: false });
    }
  },

  setActiveView: (view) => set({ activeView: view }),
  setSelectedQuestionIndex: (idx) => set({ selectedQuestionIndex: idx }),
  setActiveMode: (mode) => set({ activeMode: mode }),

  // Aliases for compatibility
  setActivePhase: (phase: string) => {
    if (phase === 'phase1') set({ activeView: 'keypad' });
    else if (phase === 'phase2') set({ activeView: 'journal' });
    else if (phase === 'report') set({ activeView: 'dashboard' });
    else set({ activeView: 'catalog' });
  },
  setActiveQuestionIndex: (idx: number) => set({ selectedQuestionIndex: idx }),
  setPhase1Answer: (qNum: number, status: InExamAnswerStatus) => {
    const { questions } = get();
    const q = questions.find((item) => item.q_num === qNum);
    let opt = 0;
    if (status === 'correct' && q) opt = q.correct_opt;
    else if (status === 'wrong' && q) opt = q.correct_opt === 1 ? 2 : 1;
    get().setKeypadAnswer(qNum, opt);
  },
  submitPhase1: () => get().submitKeypad(),
  setPhase2Resolve: (qNum: number, item: any) => get().setJournalEntry(qNum, item),
  submitPhase2: () => get().submitJournal(),
  loadReport: (examId: string) => get().loadMetrics(examId),
}));
