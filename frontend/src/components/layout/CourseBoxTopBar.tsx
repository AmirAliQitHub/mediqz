import React from 'react';
import { Sparkles, CalendarCheck, BarChart3, Zap, Flame } from 'lucide-react';
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
      className="fixed top-0 left-0 right-0 z-50 select-none bg-white/85 backdrop-blur-xl border-b border-white/80 shadow-xs"
    >
      <div className="relative h-13 sm:h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2">
        {/* Right side (in RTL): Brand Logo + Persian Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center gap-1.5 p-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="مدیاز • سامانه یادگیری هوشمند"
          >
            <MediazLogo size="sm" showText={false} className="sm:hidden" />
            <MediazLogo size="md" showText={false} className="hidden sm:inline-flex" />
            <span className="sm:hidden text-xs font-black text-blue-950 tracking-tight">مدیاز</span>
          </button>

          {/* Epigraph (Hidden on mobile) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/30 text-amber-900/80 text-[11px] font-medium tracking-tight">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="font-serif">«توانا بود هر که دانا بود»</span>
          </div>
        </div>

        {/* Center Mobile Only: Cognitive Telemetry HUD (🔥 Streak + ⚡ Leitner Due Badge) */}
        <div className="sm:hidden flex items-center gap-1.5 shrink-0 overflow-hidden">
          {/* Active Streak Badge */}
          <div
            title="روزهای استمرار مطالعه متوالی"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-900 text-[10px] font-black tracking-tight"
          >
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            <span>۳ روز</span>
          </div>

          {/* Leitner Due Badge (Clickable Quick Jump) */}
          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            title="مرورهای آماده امروز در جعبه لایتنر"
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight transition-all active:scale-95 cursor-pointer border ${
              dueCount > 0
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs shadow-blue-600/30'
                : 'bg-emerald-500/10 text-emerald-800 border-emerald-400/30'
            }`}
          >
            <Zap className={`w-3 h-3 shrink-0 ${dueCount > 0 ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-emerald-600'}`} />
            <span>{dueCount > 0 ? `${dueCount} مرور` : 'تکمیل ✓'}</span>
          </button>
        </div>

        {/* Center Desktop Only: Mathematically Centered 3-Button Capsule Switcher */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-2xl border border-blue-200/80 shadow-[0_4px_20px_-3px_rgba(37,99,235,0.18)] ring-1 ring-blue-500/10">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-97 flex items-center justify-center ${
              isCourseActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            دوره‌ها
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-97 ${
              isRoutineActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span>روتین‌های مرور</span>
            {dueCount > 0 && (
              <span className="min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {dueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tahlil')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-97 ${
              isTahlilActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>تحلیل کارنامه</span>
          </button>
        </div>

        {/* Left side (in RTL): User Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
};
