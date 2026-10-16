import React, { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useReviewStore } from './store/useReviewStore';
import { CourseBoxTopBar } from './components/layout/CourseBoxTopBar';
import { AuthModal } from './components/auth/AuthModal';
import { CourseLibrary } from './components/student/CourseLibrary';
import { CoursePartsView } from './components/student/CoursePartsView';
import { CoursePlayer } from './components/student/CoursePlayer/CoursePlayer';
import { FluidBackground } from './components/common/FluidBackground';

const ReviewHub = lazy(() => import('./components/student/ReviewHub').then((m) => ({ default: m.ReviewHub })));

const ViewLoader: React.FC = () => (
  <div className="w-full flex-1 flex flex-col items-center justify-center p-28 animate-fadeIn">
    <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-xl border border-blue-200/80 shadow-md flex items-center justify-center text-blue-600 animate-spin text-xl">
      ✦
    </div>
    <span className="text-xs font-black text-blue-900 mt-4 font-mono">در حال آماده‌سازی دوره...</span>
  </div>
);

export const App: React.FC = () => {
  const { user, activeTab, fetchUser } = useAuthStore();
  const { fetchUrgentNotifications } = useReviewStore();

  useEffect(() => {
    fetchUser();
    fetchUrgentNotifications();
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'courses':
        return <CourseLibrary />;
      case 'course-parts':
        return <CoursePartsView />;
      case 'player':
        return <CoursePlayer />;
      case 'reviews':
        return <ReviewHub />;
      default:
        return <CourseLibrary />;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-900 bg-[#f4f8fd] select-none selection:bg-blue-200">
      {/* Dynamic Chromatic Caustics Aura Background */}
      <FluidBackground />

      {/* Top Navigation Bar */}
      {user && activeTab !== 'player' && <CourseBoxTopBar />}

      {/* Dynamic View Mount */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        <Suspense fallback={<ViewLoader />}>
          {renderActiveView()}
        </Suspense>
      </div>

      {/* Auth Modal if unauthenticated */}
      <AuthModal />
    </div>
  );
};

export default App;
