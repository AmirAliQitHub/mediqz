import { create } from 'zustand';
import { User } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';
import { useCourseStore } from './useCourseStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activeTab: 'courses' | 'course-parts' | 'player' | 'reviews' | 'account';
  setActiveTab: (tab: AuthState['activeTab']) => void;
  fetchUser: () => Promise<void>;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getAuthToken(),
  isLoading: false,
  activeTab: 'courses',

  setActiveTab: (tab) => {
    const currentTab = get().activeTab;

    if (currentTab === 'player' && tab !== 'player') {
      const courseState = useCourseStore.getState();
      if (courseState.activePart && !courseState.isPartCompleted) {
        const confirmLeave = window.confirm('شما در حال مطالعه این پارت هستید. با خروج زودهنگام، پیشرفت این جلسه ثبت نخواهد شد. آیا خارج می‌شوید؟');
        if (!confirmLeave) return;
        courseState.resetPlayer();
      }
    }

    set({ activeTab: tab });
  },

  fetchUser: async () => {
    const token = getAuthToken();
    if (!token) return;
    set({ isLoading: true });
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, token, isLoading: false });
    } catch {
      removeAuthToken();
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: (token, user) => {
    setAuthToken(token);
    set({ token, user, activeTab: 'courses' });
    useCourseStore.getState().fetchCourses();
  },

  logout: () => {
    try {
      void api.post('/auth/logout');
    } catch {
      // ignore
    }
    removeAuthToken();
    set({ user: null, token: null, activeTab: 'courses' });
  },
}));
