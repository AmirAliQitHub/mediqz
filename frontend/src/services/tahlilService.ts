import { api } from './api';
import {
  ExamSummary,
  ExamQuestion,
  QuestionJournalEntry,
  ExamMetricsResponse,
  InExamAnswerStatus,
  KeypadAnswerValue,
} from '../types/tahlil';

export const tahlilService = {
  async getExamsCatalog(): Promise<ExamSummary[]> {
    return api.get<ExamSummary[]>('/exams');
  },

  async getExamDetails(examId: string): Promise<ExamSummary & { questions: ExamQuestion[] }> {
    return api.get<ExamSummary & { questions: ExamQuestion[] }>(`/exams/${examId}`);
  },

  async getUserAnalysis(examId: string): Promise<any> {
    return api.get<any>(`/exams/${examId}/analysis`);
  },

  async submitKeypad(
    examId: string,
    answers: Record<string, KeypadAnswerValue | number | InExamAnswerStatus>
  ): Promise<any> {
    return api.post<any>(`/exams/${examId}/analysis/keypad`, { answers });
  },

  // Compatibility alias
  async submitPhase1(
    examId: string,
    answers: Record<string, any>
  ): Promise<any> {
    return this.submitKeypad(examId, answers);
  },

  async submitJournal(
    examId: string,
    entries: Record<string, QuestionJournalEntry>
  ): Promise<any> {
    return api.post<any>(`/exams/${examId}/analysis/journal`, { entries });
  },

  // Compatibility alias
  async submitPhase2(
    examId: string,
    resolves: Record<string, any>
  ): Promise<any> {
    return this.submitJournal(examId, resolves);
  },

  async getMetrics(examId: string): Promise<ExamMetricsResponse> {
    return api.get<ExamMetricsResponse>(`/exams/${examId}/analysis/metrics`);
  },

  // Compatibility alias
  async getClinicalReport(examId: string): Promise<ExamMetricsResponse> {
    return this.getMetrics(examId);
  },

  async resetAnalysis(examId: string): Promise<any> {
    return api.post<any>(`/exams/${examId}/analysis/reset`);
  },
};
