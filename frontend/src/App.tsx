import React, { useEffect, Suspense, lazy } from 'react';
import { useAuthStore, isLegacyUser } from './store/useAuthStore';
import { CourseBoxTopBar } from './components/layout/CourseBoxTopBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { LegacyMigrationModal } from './components/auth/LegacyMigrationModal';
import { LoginPad } from './components/auth/LoginPad';
import { CourseLibrary } from './components/student/CourseLibrary';
import { CoursePartsView } from './components/student/CoursePartsView';
import { CoursePlayer } from './components/student/CoursePlayer/CoursePlayer';
import { UserAccountTab } from './components/student/UserAccountTab';
import { FluidBackground } from './components/common/FluidBackground';
import { MediazLogo } from './components/common/MediazLogo';

const RoutineHub = lazy(() => import('./components/student/RoutineHub/RoutineHub').then((m) => ({ default: m.RoutineHub })));
const AdminUserManagement = lazy(() => import('./components/admin/AdminUserManagement').then((m) => ({ default: m.AdminUserManagement })));
const TahlilHub = lazy(() => import('./components/student/TahlilHub/TahlilHub').then((m) => ({ default: m.TahlilHub })));

const ViewLoader: React.FC = () => (
  <div className="w-full flex-1 flex flex-col items-center justify-center p-28 animate-fadeIn">
    <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-xl border border-blue-200/80 shadow-md flex items-center justify-center text-blue-600 animate-spin text-xl">
      ✦
    </div>
    <span className="text-xs font-black text-blue-900 mt-4 font-mono">در حال آماده‌سازی سامانه...</span>
  </div>
);

const MediazSplash: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f4f8fd] animate-fadeIn select-none p-6">
    <FluidBackground />
    <div className="relative z-10 flex flex-col items-center gap-4 text-center">
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-500/15 animate-pulse">
        <MediazLogo size="xl" showText={false} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-lg font-black text-slate-900 tracking-tight">
          مدیاز • سامانه یادگیری هوشمند
        </h1>
        <p className="text-xs text-blue-600 font-bold animate-pulse">
          در حال بارگذاری و همگام‌سازی...
        </p>
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { user, isInitializing, activeTab, initAuth } = useAuthStore();

  useEffect(() => {
    // Initialize Telegram WebApp viewport & chrome
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.('#1e3a8a');
        tg.setBackgroundColor?.('#f4f8fd');
        tg.enableClosingConfirmation?.();
      } catch (e) {
        console.warn('Telegram WebApp lifecycle error:', e);
      }
    }

    initAuth();
  }, [initAuth]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'courses':
        return <CourseLibrary />;
      case 'course-parts':
        return <CoursePartsView />;
      case 'player':
        return <CoursePlayer />;
      case 'routines':
        return <RoutineHub />;
      case 'tahlil':
        return <TahlilHub />;
      case 'admin':
        return <AdminUserManagement />;
      case 'account':
        return <UserAccountTab />;
      default:
        return <CourseLibrary />;
    }
  };

  if (isInitializing) {
    return <MediazSplash />;
  }

  // When unauthenticated, render the Login Pad
  if (!user) {
    return (
      <div className="min-h-screen relative flex flex-col font-sans text-slate-900 bg-[#f4f8fd] select-none selection:bg-blue-200">
        <FluidBackground />
        <LoginPad />
      </div>
    );
  }

  // DOM Anti-Bypass Guard: Force migration modal exclusively for legacy users
  if (isLegacyUser(user)) {
    return (
      <div className="min-h-screen relative flex flex-col font-sans text-slate-900 bg-[#0f172a] select-none">
        <FluidBackground />
        <LegacyMigrationModal isForced={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-900 bg-[#f4f8fd] select-none selection:bg-blue-200">
      {/* Dynamic Chromatic Caustics Aura Background */}
      <FluidBackground />

      {/* Top Navigation Bar */}
      {activeTab !== 'player' && <CourseBoxTopBar />}

      {/* Dynamic View Mount with Mobile Bottom Dock Clearance */}
      <div className="relative z-10 w-full flex-1 flex flex-col pb-24 sm:pb-8">
        <Suspense fallback={<ViewLoader />}>
          {renderActiveView()}
        </Suspense>
      </div>

      {/* Mobile Floating Bottom Dock (Thumb Zone) */}
      {activeTab !== 'player' && <MobileBottomNav />}

      {/* Onboarding Modal for authenticated users who haven't selected grade */}
      <OnboardingModal />

      {/* Guard fallback for legacy migration */}
      <LegacyMigrationModal />
    </div>
  );
};

export default App;
