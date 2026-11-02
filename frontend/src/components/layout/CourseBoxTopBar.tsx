import React from 'react';
import { CalendarCheck, BarChart3, BookOpen, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoutineStore } from '../../store/useRoutineStore';
import { UserProfileMenu } from './UserProfileMenu';
import { MediazLogo } from '../common/MediazLogo';

export const CourseBoxTopBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAuthStore();
  const { days, currentDayNumber } = useRoutineStore();

  const currentDay = days.find((d) => d.day_number === currentDayNumber);
  const dueCount = currentDay ? currentDay.items.filter((i) => !i.completed).length : 0;

  const isRoutineActive = activeTab === 'routines';
  const isTahlilActive = activeTab === 'tahlil';
  const isCourseActive = activeTab === 'courses' || activeTab === 'course-parts' || activeTab === 'player';

  return (
    <header
      dir="rtl"
      style={{ paddingTop: 'var(--sat, 0px)' }}
      className="fixed top-0 left-0 right-0 z-50 select-none bg-white/80 backdrop-blur-2xl border-b border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]"
    >
      <div className="relative h-12 sm:h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between">
        
        {/* 1. RIGHT SIDE (in RTL): User Profile Menu (Avatar & Identity Anchor) */}
        <div className="flex items-center shrink-0">
          <UserProfileMenu />
        </div>

        {/* 2. CENTER DESKTOP ONLY: Mathematically Centered Institutional Segmented Control */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap active:scale-97 flex items-center gap-1.5 ${
              isCourseActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>دوره‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-97 ${
              isRoutineActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>روتین‌های مرور</span>
            {dueCount > 0 && (
              <span className="min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {dueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tahlil')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-97 ${
              isTahlilActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>تحلیل کارنامه</span>
          </button>
        </div>

        {/* 3. LEFT SIDE (in RTL): Brand Emblem, Persian Title & Ferdowsi Epigraph */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Ferdowsi Epigraph (Widescreen only, hidden on mobile/tablet) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/30 text-amber-900/80 text-[11px] font-medium tracking-tight">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="font-serif">«توانا بود هر که دانا بود»</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center gap-1.5 p-1 rounded-xl transition-all hover:opacity-85 active:scale-95 cursor-pointer"
            title="بازگشت به خانه • مدیاز"
          >
            <span className="text-xs font-black text-slate-900 tracking-tight">مدیاز</span>
            <MediazLogo size="sm" showText={false} className="sm:hidden" />
            <MediazLogo size="md" showText={false} className="hidden sm:inline-flex" />
          </button>
        </div>

      </div>
    </header>
  );
};
