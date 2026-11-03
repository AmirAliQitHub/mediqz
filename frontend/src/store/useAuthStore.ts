import { create } from 'zustand';
import { User } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';
import { useCourseStore } from './useCourseStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  activeTab: 'courses' | 'course-parts' | 'player' | 'routines' | 'account' | 'admin' | 'tahlil';
  setActiveTab: (tab: AuthState['activeTab']) => void;
  initAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  login: (token: string, user: User) => void;
  loginWithTelegram: () => Promise<boolean>;
  loginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithCredentials: (username: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (displayName: string, grade: string, username?: string, password?: string) => Promise<void>;
  setUserPasswordStatus: (hasPassword: boolean) => void;
  unlinkTelegram: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getAuthToken(),
  isLoading: false,
  isInitializing: true,
  activeTab: 'courses',

  setActiveTab: (tab) => {
    const currentTab = get().activeTab;

    if (currentTab === 'player' && tab !== 'player') {
      const courseState = useCourseStore.getState();
      if (courseState.activePart && !courseState.isPartCompleted) {
        const confirmLeave = window.confirm(
          'شما در حال مطالعه این پارت هستید. با خروج زودهنگام، پیشرفت این جلسه ثبت نخواهد شد. آیا خارج می‌شوید؟'
        );
        if (!confirmLeave) return;
        courseState.resetPlayer();
      }
    }

    set({ activeTab: tab });
  },

  initAuth: async () => {
    set({ isInitializing: true });
    try {
      // 1. Priority: Check Telegram WebApp user context
      const tg = (window as any).Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user;

      if (tgUser && tgUser.id) {
        try {
          const res = await api.post<{ token: string; user: User }>('/auth/telegram', {
            id: tgUser.id,
            username: tgUser.username,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            language_code: tgUser.language_code,
          });

          if (res && res.token && res.user) {
            setAuthToken(res.token);
            set({ user: res.user, token: res.token, isInitializing: false, activeTab: 'courses' });
            useCourseStore.getState().fetchCourses();
            return;
          }
        } catch (err) {
          console.error('Telegram WebApp silent auto-login error:', err);
        }
      }

      // 2. Fallback: Standard browser session token in localStorage
      const token = getAuthToken();
      if (token) {
        try {
          const user = await api.get<User>('/auth/me');
          if (user && user.id) {
            set({ user, token, isInitializing: false });
            useCourseStore.getState().fetchCourses();
            return;
          }
        } catch {
          removeAuthToken();
          set({ user: null, token: null, isInitializing: false });
          return;
        }
      }
      set({ user: null, token: null, isInitializing: false });
    } catch (e) {
      console.error('Auth initialization error:', e);
      set({ user: null, token: null, isInitializing: false });
    }
  },

  loginWithTelegram: async () => {
    const tg = (window as any).Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;
    if (!tgUser || !tgUser.id) {
      return false;
    }
    set({ isLoading: true });
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/telegram', {
        id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        language_code: tgUser.language_code,
      });
      if (res && res.token && res.user) {
        setAuthToken(res.token);
        set({ user: res.user, token: res.token, isLoading: false, activeTab: 'courses' });
        useCourseStore.getState().fetchCourses();
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      console.error('loginWithTelegram failed:', err);
      set({ isLoading: false });
      return false;
    }
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

  loginWithCredentials: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        username: username.trim(),
        password: password.trim(),
      });
      if (res && res.token && res.user) {
        setAuthToken(res.token);
        set({ token: res.token, user: res.user, isLoading: false, activeTab: 'courses' });
        useCourseStore.getState().fetchCourses();
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: 'پاسخی از سرور دریافت نشد' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err?.message || 'نام کاربری یا رمز عبور نامعتبر است' };
    }
  },

  registerWithCredentials: async (username: string, password: string, displayName: string) => {
    set({ isLoading: true });
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || undefined;
      const res = await api.post<{ token: string; user: User }>('/auth/register', {
        username: username.trim(),
        password: password.trim(),
        display_name: displayName.trim(),
        ...(initData ? { init_data: initData } : {}),
      });
      if (res && res.token && res.user) {
        setAuthToken(res.token);
        set({ token: res.token, user: res.user, isLoading: false, activeTab: 'courses' });
        useCourseStore.getState().fetchCourses();
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: 'خطا در ثبت نام' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err?.message || 'خطا در ثبت نام' };
    }
  },

  completeOnboarding: async (displayName: string, grade: string, username?: string, password?: string) => {
    set({ isLoading: true });
    try {
      const payload: Record<string, any> = {
        display_name: displayName,
        grade: grade,
      };
      if (username) payload.username = username;
      if (password) payload.password = password;

      const res = await api.post<{ success: boolean; user: User }>('/auth/onboarding', payload);
      if (res && res.user) {
        set({ user: res.user, isLoading: false });
        useCourseStore.getState().fetchCourses();
      }
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  setUserPasswordStatus: (hasPassword: boolean) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, has_password: hasPassword } });
    }
  },

  unlinkTelegram: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/unlink-telegram');
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, telegram_user_id: null, telegram_username: null }, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return true;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    removeAuthToken();
    set({ user: null, token: null, activeTab: 'courses' });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).authStore = useAuthStore;
}
