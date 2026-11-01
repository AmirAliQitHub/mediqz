export interface ExamSection {
  subject: string;
  start_q: number;
  end_q: number;
  total_questions: number;
  prefix?: string;
}

export interface ExamSummary {
  id: string;
  title: string;
  provider: string;
  grade: string;
  major: string;
  held_date: string;
  total_questions: number;
  sections: ExamSection[];
  analysis_status?: {
    status: 'not_started' | 'journaling' | 'completed' | 'phase1' | 'phase2';
    exam_score_pct?: number;
    potential_score_pct?: number;
    anxiety_tax_pct?: number;
  };
}

export interface ExamQuestion {
  id?: number;
  utid: string;
  exam_id: string;
  q_num: number;
  subject: string;
  correct_opt: number;
  topic_id: string;
  topic_title?: string;
  time_taking_profile: 'Fast' | 'Standard' | 'Long af';
  time_profile_fa?: string;
  question_type: string;
  question_type_fa?: string;
  difficulty: 'آسان' | 'متوسط' | 'دشوار';
  question_text?: string;
  options_json?: string;
  page_number?: number;
  explanation_summary?: string;
}

export type InExamAnswerStatus = 'correct' | 'wrong' | 'blank';

export interface KeypadAnswerValue {
  option?: number | null; // 1, 2, 3, 4, or 0 (blank)
  status: InExamAnswerStatus;
}

export type ErrorReasonTag = 'بی‌دقتی' | 'دام آموزشی' | 'کمبود زمان' | 'ضعف علمی' | 'استرس';

export type OutsideStatusTag = 'solved_correctly_no_time' | 'needed_answer_sheet' | 'unsolved';

export interface QuestionJournalEntry {
  // Common / Correct
  solve_faster_note?: string;
  personal_journal?: string;
  
  // Wrong / Blank
  outside_status?: OutsideStatusTag;
  error_reason?: ErrorReasonTag;
  subchapter_bug_note?: string;
}

export interface SubjectMetricItem {
  subject: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  score_pct: number;
  correct_pct: number;
}

export interface DifficultyMetricItem {
  difficulty: 'آسان' | 'متوسط' | 'دشوار';
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  score_pct: number;
  correct_pct: number;
}

export interface QuestionTypeMetricItem {
  type: string;
  type_fa: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  score_pct: number;
  correct_pct: number;
}

export interface TimeProfileMetricItem {
  profile: 'Fast' | 'Standard' | 'Long af';
  profile_fa: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  score_pct: number;
  correct_pct: number;
}

export interface TopicMetricItem {
  topic_id: string;
  topic_title: string;
  subject: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  score_pct: number;
  correct_pct: number;
}

export interface DatasetMetrics {
  score_pct: number;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  total_questions: number;
  subjects: SubjectMetricItem[];
  difficulties: DifficultyMetricItem[];
  question_types: QuestionTypeMetricItem[];
  time_profiles: TimeProfileMetricItem[];
  topics: TopicMetricItem[];
}

export interface ErrorReasonItem {
  reason: ErrorReasonTag;
  count: number;
}

export interface OutsideStatusCounts {
  solved_correctly_no_time: number;
  needed_answer_sheet: number;
  unsolved: number;
  not_attempted: number;
}

export interface QuestionJournalSummaryItem {
  q_num: number;
  utid: string;
  subject: string;
  correct_opt: number;
  topic_id: string;
  topic_title: string;
  question_type: string;
  question_type_fa: string;
  time_taking_profile: string;
  time_profile_fa: string;
  difficulty: string;
  in_exam_status: InExamAnswerStatus;
  outside_status?: OutsideStatusTag;
  error_reason?: ErrorReasonTag;
  solve_faster_note?: string;
  subchapter_bug_note?: string;
  personal_journal?: string;
}

export interface ExamMetricsResponse {
  exam_id: string;
  exam_title: string;
  provider: string;
  held_date: string;
  total_questions: number;
  in_exam: DatasetMetrics;
  outside_exam: DatasetMetrics;
  error_reasons: ErrorReasonItem[];
  outside_status_counts: OutsideStatusCounts;
  questions_journal_summary: QuestionJournalSummaryItem[];
}

// Aliases for compatibility
export type Phase1AnswerStatus = InExamAnswerStatus;
export interface Phase2ResolveItem extends QuestionJournalEntry {
  home_status?: any;
}
export type ClinicalReport = ExamMetricsResponse;
