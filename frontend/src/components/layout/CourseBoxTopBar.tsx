import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useCourseStore } from '../../store/useCourseStore';
import { UserProfileMenu } from './UserProfileMenu';
import { AlqualiteLogo } from '../common/AlqualiteLogo';
import { soundEffects } from '../../services/soundEffects';

export const CourseBoxTopBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAuthStore();
  const { urgentNotifications } = useReviewStore();
  const { reviewContext } = useCourseStore();
  const [muted, setMuted] = useState<boolean>(soundEffects.isMuted());

  useEffect(() => {
    return soundEffects.subscribe((newMuted) => setMuted(newMuted));
  }, []);

  const handleToggleSound = () => {
    soundEffects.toggleMute();
    if (muted) {
      // Unmuting, play a gentle preview chime
      setTimeout(() => soundEffects.playSuccessChime(), 50);
    }
  };

  const isReviewActive =
    activeTab === 'reviews' ||
    (activeTab === 'player' && !!reviewContext?.isReviewSession);

  const isCourseActive =
    activeTab === 'courses' ||
    activeTab === 'course-parts' ||
    (activeTab === 'player' && !reviewContext?.isReviewSession);

  return (
    <header dir="ltr" className="fixed top-0 left-0 right-0 h-16 px-4 md:px-8 flex items-center justify-between z-50 topbar-transparent select-none bg-white/40 backdrop-blur-md border-b border-white/60">
      {/* Left: Brand Logo & Epigraph */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className="inline-flex items-center p-1 transition-transform hover:scale-102 cursor-pointer"
          title="Alqualite CourseBox • آلکالیت اینتراکتیو"
        >
          <AlqualiteLogo size="md" showText={true} showSubtitle={true} />
        </button>

        {/* Poetic Persian Epigraph (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/30 text-amber-900/80 text-[11px] font-medium tracking-tight">
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          <span className="font-serif">«توانا بود هر که دانا بود»</span>
        </div>
      </div>

      {/* Center: 2-Button Centered Capsule Switcher */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-2xl bg-white/70 backdrop-blur-2xl border border-blue-900/10 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isCourseActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/25 border border-blue-800/40'
              : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/60'
          }`}
        >
          دوره‌های آموزشی
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            isReviewActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/25 border border-blue-800/40'
              : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/60'
          }`}
        >
          <span>مرور و تسلط</span>
          {urgentNotifications.length > 0 && (
            <span
              className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-xs"
              title={`${urgentNotifications.length} پارت نیازمند مرور امروز`}
            />
          )}
        </button>
      </div>

      {/* Right: Audio Toggle & User Profile Menu */}
      <div dir="rtl" className="flex items-center gap-2 md:gap-3">
        {/* Ambient Acoustic Toggle */}
        <button
          type="button"
          onClick={handleToggleSound}
          className={`p-2 rounded-xl transition-all cursor-pointer border ${
            muted
              ? 'bg-slate-100/80 text-slate-400 border-slate-200 hover:text-slate-600'
              : 'bg-amber-50/90 text-amber-700 border-amber-200/80 hover:bg-amber-100 shadow-2xs'
          }`}
          title={muted ? 'روشن کردن بازخورد صوتی' : 'بی‌صدا کردن بازخورد صوتی'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <UserProfileMenu />
      </div>
    </header>
  );
};
