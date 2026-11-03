export type Role = 'S0' | 'S1' | 'S2' | 'S8';

export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  access_level: Role | string;
  grade?: string | null;
  is_onboarded?: boolean;
  is_superuser?: boolean;
  telegram_user_id?: number | null;
  telegram_username?: string | null;
  has_password?: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  display_name: string;
  grade?: string | null;
  is_onboarded: boolean;
  is_superuser: boolean;
  telegram_id?: number | null;
  created_at: string;
}

export type EUType =
  | 'learn_box'
  | 'fill_in_the_blank'
  | 'tree_diagram'
  | 'correct_incorrect'
  | 'literary_matrix';

export type EUStatus = 'correct' | 'incorrect' | 'null' | 'absent';

export interface EU {
  id: string;
  type: EUType;
  order?: number;
  topic_tag?: string;
  status?: Record<string, EUStatus> | EUStatus[];
  payload: any;
}

export interface Part {
  part_id: string;
  title: string;
  description?: string;
  order?: number;
  eus: EU[];
}

export interface Course {
  course_id: string;
  title: string;
  topic_code: string;
  subject?: string;
  grade?: string;
  description?: string;
  is_review?: boolean;
  source_course_id?: string;
  source_part_id?: string;
  latest_summary?: {
    correct: number;
    wrong: number;
    null?: number;
    absent?: number;
    total: number;
    percentage: number;
    date: string;
  };
  parts: Part[];
}

export interface CourseSummary {
  id: string;
  title: string;
  topic_code: string;
  subject: string;
  grade: string;
  description: string;
  parts_count: number;
  slides_count: number;
  type: 'builtin' | 'custom';
  is_review?: boolean;
  is_development?: boolean;
}

export interface PartReviewRecord {
  id: number;
  course_id: string;
  part_id: string;
  title: string;
  topic_code: string;
  review_step: number; // 1 to 7 Fibonacci step
  last_reviewed_at?: string;
  next_due_at?: string;
  is_delayed: number; // 0 or 1
  latest_status?: EUStatus | null;
  latest_status_at?: string | null;
  is_due?: boolean;
  manual_review_date?: string | null;
  created_at?: string;
  course_title?: string;
  part_title?: string;
}

export interface UrgentNotification {
  id: number;
  course_id: string;
  part_id: string;
  title: string;
  topic_code: string;
  review_step: number;
  next_due_at?: string;
  is_delayed: number;
}
