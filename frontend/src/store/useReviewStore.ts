import { create } from 'zustand';
import { PartReviewRecord, UrgentNotification } from '../types';
import { api } from '../services/api';

interface ReviewState {
  userPartReviews: PartReviewRecord[];
  urgentNotifications: UrgentNotification[];
  isLoading: boolean;

  fetchReviews: () => Promise<void>;
  fetchUrgentNotifications: () => Promise<void>;
  reviewToday: (courseId: string, partId: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  userPartReviews: [],
  urgentNotifications: [],
  isLoading: false,

  fetchReviews: async () => {
    set({ isLoading: true });
    try {
      const list = await api.get<PartReviewRecord[]>('/reviews/user-parts');
      set({ userPartReviews: list || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUrgentNotifications: async () => {
    try {
      const urgent = await api.get<UrgentNotification[]>('/reviews/urgent-notifications');
      set({ urgentNotifications: urgent || [] });
    } catch {
      set({ urgentNotifications: [] });
    }
  },

  reviewToday: async (courseId, partId) => {
    await api.post('/reviews/review-today', { course_id: courseId, part_id: partId });
    set({
      userPartReviews: get().userPartReviews.map((r) =>
        r.course_id === courseId && r.part_id === partId
          ? { ...r, manual_review_date: new Date().toISOString().slice(0, 10), is_due: true }
          : r
      ),
    });
    await get().fetchUrgentNotifications();
  },
}));
