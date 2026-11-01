import React from 'react';
import { BookOpen, CalendarCheck, BarChart3, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoutineStore } from '../../store/useRoutineStore';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAuthStore();
  const { days, currentDayNumber } = useRoutineStore();

  // Calculate pending routine items for today
  const currentDay = days.find((d) => d.day_number === currentDayNumber);
  const dueCount = currentDay ? currentDay.items.filter((i) => !i.completed).length : 0;

  const isCourseActive = activeTab === 'courses' || activeTab === 'course-parts';
  const isRoutineActive = activeTab === 'routines';
  const isTahlilActive = activeTab === 'tahlil';
  const isAccountActive = activeTab === 'account';

  const triggerHaptic = () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.selectionChanged?.() || tg.HapticFeedback.impactOccurred?.('light');
      }
    } catch {
      // Safe fallback for non-TWA browsers
    }
  };

  const handleTabClick = (tab: 'courses' | 'routines' | 'tahlil' | 'account') => {
    triggerHaptic();
    setActiveTab(tab);
  };

  return (
    <nav
      dir="rtl"
      aria-label="ناوبری اصلی موبایل"
      style={{ bottom: 'calc(var(--sab, 0px) + 0.65rem)' }}
      className="sm:hidden fixed left-3 right-3 z-40 max-w-sm mx-auto select-none"
    >
      <div className="bg-white/92 backdrop-blur-2xl border border-white/80 shadow-[0_10px_35px_-4px_rgba(30,58,138,0.22)] rounded-3xl p-1.5 flex items-center justify-between ring-1 ring-blue-500/10">
        {/* 1. دوره‌ها */}
        <button
          type="button"
          onClick={() => handleTabClick('courses')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
            isCourseActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/60'
          }`}
        >
          <BookOpen className={`w-4.5 h-4.5 ${isCourseActive ? 'text-white' : 'text-slate-600'}`} />
          <span className="text-[10px] font-black mt-0.5 tracking-tight">دوره‌ها</span>
        </button>

        {/* 2. روتین‌ها (با نشانگر تسک‌های امروز) */}
        <button
          type="button"
          onClick={() => handleTabClick('routines')}
          className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
            isRoutineActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/60'
          }`}
        >
          <div className="relative">
            <CalendarCheck className={`w-4.5 h-4.5 ${isRoutineActive ? 'text-white' : 'text-slate-600'}`} />
            {dueCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {dueCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black mt-0.5 tracking-tight">روتین‌ها</span>
        </button>

        {/* 3. تحلیل */}
        <button
          type="button"
          onClick={() => handleTabClick('tahlil')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
            isTahlilActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/60'
          }`}
        >
          <BarChart3 className={`w-4.5 h-4.5 ${isTahlilActive ? 'text-white' : 'text-slate-600'}`} />
          <span className="text-[10px] font-black mt-0.5 tracking-tight">تحلیل</span>
        </button>

        {/* 4. حساب من */}
        <button
          type="button"
          onClick={() => handleTabClick('account')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
            isAccountActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/60'
          }`}
        >
          <User className={`w-4.5 h-4.5 ${isAccountActive ? 'text-white' : 'text-slate-600'}`} />
          <span className="text-[10px] font-black mt-0.5 tracking-tight">پروفایل</span>
        </button>
      </div>
    </nav>
  );
};
