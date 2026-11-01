import React from 'react';
import { Sparkles, CalendarCheck, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserProfileMenu } from './UserProfileMenu';
import { MediazLogo } from '../common/MediazLogo';

export const CourseBoxTopBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAuthStore();

  const isRoutineActive = activeTab === 'routines';
  const isTahlilActive = activeTab === 'tahlil';
  const isCourseActive = activeTab === 'courses' || activeTab === 'course-parts' || activeTab === 'player';

  return (
    <header
      dir="ltr"
      style={{ paddingTop: 'var(--sat, 0px)' }}
      className="fixed top-0 left-0 right-0 z-50 select-none bg-white/85 backdrop-blur-xl border-b border-white/80 shadow-xs"
    >
      <div className="relative h-13 sm:h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between">
        {/* Left: Brand Logo (Mediaz Transparent Emblem) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center p-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="مدیاز • سامانه یادگیری هوشمند"
          >
            <MediazLogo size="sm" showText={false} className="sm:hidden" />
            <MediazLogo size="md" showText={false} className="hidden sm:inline-flex" />
          </button>

          {/* Epigraph (Hidden on compact screens) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/30 text-amber-900/80 text-[11px] font-medium tracking-tight">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="font-serif">«توانا بود هر که دانا بود»</span>
          </div>
        </div>

        {/* Center: Mathematically Centered 3-Button Capsule Switcher with Responsive Persian Labels */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-2xl border border-blue-200/80 shadow-[0_4px_20px_-3px_rgba(37,99,235,0.18)] ring-1 ring-blue-500/10">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-97 flex items-center justify-center ${
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
            className={`min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap active:scale-97 ${
              isRoutineActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">روتین‌های مرور</span>
            <span className="sm:hidden">روتین‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tahlil')}
            className={`min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap active:scale-97 ${
              isTahlilActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">تحلیل کارنامه</span>
            <span className="sm:hidden">تحلیل</span>
          </button>
        </div>

        {/* Right: User Profile Menu only */}
        <div dir="rtl" className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
};
