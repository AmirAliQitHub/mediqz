import { create } from 'zustand';
import {
  ExamSummary,
  ExamQuestion,
  InExamAnswerStatus,
  KeypadAnswerValue,
  QuestionJournalEntry,
  ExamMetricsResponse,
} from '../types/tahlil';
import { tahlilService } from '../services/tahlilService';

export type TahlilView = 'catalog' | 'dashboard' | 'keypad' | 'journal';
export type EvaluationMode = 'in_exam' | 'outside_exam';

interface TahlilState {
  exams: ExamSummary[];
  activeExam: (ExamSummary & { questions: ExamQuestion[] }) | null;
  questions: ExamQuestion[];
  activeView: TahlilView;
  selectedQuestionIndex: number;
  
  // Data
  keypadAnswers: Record<string, KeypadAnswerValue>;
  journalEntries: Record<string, QuestionJournalEntry>;
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
  metrics: null,
  activeMode: 'in_exam',
  isLoading: false,
  error: null,

  // Compatibility proxies
  get activePhase() {
    const v = get().activeView;
    if (v === 'keypad') return 'phase1';
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

      let targetView: TahlilView = 'dashboard';
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

      const hasKeypad = Object.keys(existingKeypad).length > 0;
      if (!hasKeypad) {
        targetView = 'keypad';
      } else {
        targetView = 'dashboard';
        // Auto-load metrics
        get().loadMetrics(examId);
      }

      set({
        activeExam: details,
        questions: details.questions || [],
        activeView: targetView,
        selectedQuestionIndex: 0,
        keypadAnswers: existingKeypad,
        journalEntries: existingJournal,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'خطا در بارگذاری آزمون', isLoading: false });
    }
  },

  setKeypadAnswer: (qNum: number, option: number) => {
    const { questions, keypadAnswers, selectedQuestionIndex } = get();
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
    const { questions, keypadAnswers } = get();
    const updated = { ...keypadAnswers };
    for (const q of questions) {
      const key = String(q.q_num);
      if (!updated[key]) {
        updated[key] = { option: 0, status: 'blank' };
      }
    }
    set({ keypadAnswers: updated });
  },

  submitKeypad: async () => {
    const { activeExam, keypadAnswers } = get();
    if (!activeExam) return;

    set({ isLoading: true, error: null });
    try {
      await tahlilService.submitKeypad(activeExam.id, keypadAnswers);
      await get().loadMetrics(activeExam.id);
      set({ activeView: 'journal', isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'خطا در ثبت پاسخ‌برگ', isLoading: false });
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
      set({ activeView: 'dashboard', isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'خطا در ثبت ژورنال', isLoading: false });
    }
  },

  loadMetrics: async (examId: string) => {
    set({ isLoading: true, error: null });
    try {
      const metrics = await tahlilService.getMetrics(examId);
      set({ metrics, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'خطا در دریافت آمار آزمون', isLoading: false });
    }
  },

  resetActiveExam: async () => {
    const { activeExam } = get();
    if (!activeExam) return;

    set({ isLoading: true, error: null });
    try {
      await tahlilService.resetAnalysis(activeExam.id);
      set({
        keypadAnswers: {},
        journalEntries: {},
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
