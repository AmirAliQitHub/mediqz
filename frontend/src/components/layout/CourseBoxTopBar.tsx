import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useCourseStore } from '../../store/useCourseStore';
import { UserProfileMenu } from './UserProfileMenu';
import { AlqualiteLogo } from '../common/AlqualiteLogo';

export const CourseBoxTopBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAuthStore();
  const { urgentNotifications } = useReviewStore();
  const { reviewContext } = useCourseStore();

  const isReviewActive =
    activeTab === 'reviews' ||
    (activeTab === 'player' && !!reviewContext?.isReviewSession);

  const isCourseActive =
    activeTab === 'courses' ||
    activeTab === 'course-parts' ||
    (activeTab === 'player' && !reviewContext?.isReviewSession);

  return (
    <header dir="ltr" className="fixed top-0 left-0 right-0 h-16 px-6 md:px-10 flex items-center justify-between z-50 topbar-transparent select-none bg-white/40 backdrop-blur-md border-b border-white/60">
      {/* Left: Brand Logo */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className="inline-flex items-center p-1 transition-transform hover:scale-102 cursor-pointer"
          title="Alqualite CourseBox • آلکالیت اینتراکتیو"
        >
          <AlqualiteLogo size="md" showText={true} showSubtitle={true} />
        </button>
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

      {/* Right: User Profile Menu */}
      <div dir="rtl" className="flex items-center gap-3">
        <UserProfileMenu />
      </div>
    </header>
  );
};
