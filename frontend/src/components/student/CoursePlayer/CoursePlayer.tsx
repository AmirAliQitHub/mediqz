import React, { useEffect, useState } from 'react';
import { AlignLeft, Type, ArrowRight, LogOut, Sparkles } from 'lucide-react';
import { useCourseStore } from '../../../store/useCourseStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { FillInTheBlank } from './FillInTheBlank';
import { TreeDiagram } from './TreeDiagram';
import { CorrectIncorrect } from './CorrectIncorrect';
import { LearnBox } from './LearnBox';
import { LiteraryMatrix } from './LiteraryMatrix';
import { CongratsView } from '../CongratsView';
import { api } from '../../../services/api';

const toFa = (num: number | string): string => {
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (w) => faDigits[parseInt(w, 10)]);
};

export const CoursePlayer: React.FC = () => {
  const {
    activePart,
    currentSlideIndex,
    nextSlide,
    prevSlide,
    isPartCompleted,
    selectedCourse,
    reviewContext,
    euResults,
    autoReviewActive,
    clearAutomaticReview,
    showContextSentence,
    toggleContextSentence,
    isRedemptionMode,
    redemptionQueue,
    redemptionIndex,
    showRedemptionInterstitial,
    dismissRedemptionInterstitial,
  } = useCourseStore();
  const { setActiveTab } = useAuthStore();

  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);

  // Dynamic visualViewport listener for mobile virtual keyboard offset
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const offset = Math.max(
          0,
          window.innerHeight - (window.visualViewport.offsetTop + window.visualViewport.height)
        );
        setKeyboardOffset(offset);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  // Map Enter key globally to next control for frictionless progression
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (showRedemptionInterstitial) {
          dismissRedemptionInterstitial();
        } else {
          nextSlide();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, showRedemptionInterstitial, dismissRedemptionInterstitial]);

  if (!activePart) {
    return (
      <div className="p-16 text-center">
        <p className="text-slate-500 text-sm font-bold">پارتی برای پخش انتخاب نشده است.</p>
        <button
          onClick={() => setActiveTab('courses')}
          className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
        >
          بازگشت به کتابخانه
        </button>
      </div>
    );
  }

  // Intercept completion with the Duolingo Redemption Interstitial
  if (showRedemptionInterstitial) {
    return (
      <main className="w-full min-h-[100dvh] pt-[calc(1.5rem+var(--sat,0px))] pb-20 px-4 flex items-center justify-center animate-fadeIn select-none bg-slate-900/10 backdrop-blur-xs">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-2xl border border-amber-200/90 shadow-2xl text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-600 flex items-center justify-center text-3xl shadow-md border border-amber-300/40">
            🎯
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">دور اول تکمیل شد!</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1">
              حالا نوبت تثبیت ۱۰۰٪ مطالب است. <strong className="text-amber-700 font-bold">{toFa(redemptionQueue.length)} اسلاید</strong> در این پارت نیاز به مرور طلایی دارند.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold w-full text-right leading-relaxed flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>با پاسخ صحیح به این اسلایدها، پارت را با تسلط کامل ثبت کنید.</span>
          </div>
          <button
            type="button"
            onClick={dismissRedemptionInterstitial}
            className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/25 active:scale-97 transition-all mt-1"
          >
            شروع مرور طلایی و تثبیت ✦
          </button>
        </div>
      </main>
    );
  }

  if (isPartCompleted) {
    return (
      <main className="w-full px-4 md:px-6 pt-24 md:pt-28 pb-32">
        <CongratsView />
      </main>
    );
  }

  const currentEU = isRedemptionMode && redemptionQueue.length > 0
    ? redemptionQueue[redemptionIndex]
    : activePart.eus[currentSlideIndex];
  const totalSlides = activePart.eus.length;
  const isLastSlide = isRedemptionMode
    ? redemptionQueue.length === 1
    : currentSlideIndex === totalSlides - 1;

  const renderEUSlide = () => {
    if (!currentEU) return null;
    switch (currentEU.type) {
      case 'fill_in_the_blank':
        return <FillInTheBlank eu={currentEU} />;
      case 'tree_diagram':
        return <TreeDiagram eu={currentEU} />;
      case 'correct_incorrect':
        return <CorrectIncorrect eu={currentEU} />;
      case 'literary_matrix':
        return <LiteraryMatrix eu={currentEU} />;
      case 'learn_box':
      default:
        return <LearnBox eu={currentEU} />;
    }
  };

  const isTree = currentEU?.type === 'tree_diagram';

  return (
    <main className="w-full h-[100dvh] max-h-[100dvh] pt-[calc(0.75rem+var(--sat,0px))] sm:pt-6 md:pt-8 pb-4 overflow-hidden flex flex-col items-center justify-between px-2 sm:px-4 animate-fadeIn select-none">
      {/* Top Breadcrumb & Return */}
      <div className={`w-full ${isTree ? 'max-w-[96vw]' : 'max-w-4xl'} flex justify-between items-center mb-2 flex-shrink-0 transition-all duration-300 gap-1.5 sm:gap-2`}>
        <div className="flex items-center gap-1.5">
          {autoReviewActive && reviewContext?.isAutomaticReview && (
            <button
              onClick={async () => {
                if (!activePart || !selectedCourse || !reviewContext || !reviewContext.isReviewSession) return;
                const shouldExit = window.confirm('مرور خودکار متوقف می‌شود. آیا بازمی‌گردید؟');
                if (!shouldExit) return;

                const reachedEUs = activePart.eus.slice(0, currentSlideIndex + 1).filter((eu) => eu.id !== 'rev-summary-intro');
                const includedResults: Record<string, 'correct' | 'incorrect' | 'null'> = {};
                reachedEUs.forEach((eu) => {
                  const result = euResults[eu.id];
                  if (result?.status === 'correct') includedResults[eu.id] = 'correct';
                  else if (result?.status === 'wrong') includedResults[eu.id] = 'incorrect';
                  else includedResults[eu.id] = 'null';
                });

                const correct = reachedEUs.filter((eu) => euResults[eu.id]?.status === 'correct').length;
                const wrong = reachedEUs.filter((eu) => euResults[eu.id]?.status === 'wrong').length;
                const answered = reachedEUs.length;

                try {
                  await api.post('/reviews/submit-review-session', {
                    course_id: reviewContext.reviewCourseId,
                    part_id: reviewContext.reviewPartId,
                    included_results: includedResults,
                    absent_eu_ids: [],
                    summary: {
                      title: activePart.title,
                      correct,
                      wrong,
                      null: Math.max(0, answered - correct - wrong),
                      total: reviewContext.allEUs.length,
                      percentage: answered ? Math.round((correct / answered) * 100) : 0,
                      date: new Date().toLocaleDateString('fa-IR'),
                    },
                  });
                  clearAutomaticReview();
                  setActiveTab('course-parts');
                } catch (error: any) {
                  alert(error?.message || 'ذخیره وضعیت مرور جاری انجام نشد.');
                }
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] sm:text-xs font-black border border-rose-200 cursor-pointer shadow-2xs transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          )}
          {!autoReviewActive && (
            <button
              onClick={() => setActiveTab('course-parts')}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-700 text-[11px] sm:text-xs font-bold border border-slate-200 cursor-pointer shadow-2xs transition-all flex items-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">بازگشت به سرفصل‌ها</span>
              <span className="sm:hidden">بازگشت</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dual-Mode Toggle: Context Sentence vs Isolated Word */}
          <button
            type="button"
            onClick={toggleContextSentence}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
              showContextSentence
                ? 'bg-blue-50/90 text-blue-700 border-blue-200/80 hover:bg-blue-100'
                : 'bg-amber-50/90 text-amber-800 border-amber-300/80 hover:bg-amber-100'
            }`}
            title="تغییر حالت نمایش جمله کمکی (مشابه سوالات نهایی)"
          >
            {showContextSentence ? (
              <>
                <AlignLeft className="w-3.5 h-3.5" />
                <span>با جمله</span>
              </>
            ) : (
              <>
                <Type className="w-3.5 h-3.5" />
                <span>فقط واژه</span>
              </>
            )}
          </button>

          <span className="text-[11px] sm:text-xs font-black text-blue-950 bg-white/70 backdrop-blur-md px-2.5 sm:px-3.5 py-1 rounded-full border border-blue-100 shadow-2xs truncate max-w-[85px] sm:max-w-[200px]">
            {activePart.title}
          </span>

          {isRedemptionMode ? (
            <span className="text-[10px] sm:text-xs font-black text-amber-950 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full animate-pulse shadow-xs shrink-0">
              ⚡ مرور طلایی ({toFa(redemptionIndex + 1)} از {toFa(redemptionQueue.length)})
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-white/60 px-2 sm:px-2.5 py-1 rounded-full border border-slate-200 shrink-0">
              {toFa(currentSlideIndex + 1)}/{toFa(totalSlides)}
            </span>
          )}
        </div>
      </div>

      {/* Main Slide Content Area */}
      <div
        className={`w-full ${isTree ? 'max-w-[96vw]' : 'max-w-4xl'} flex-1 min-h-0 overflow-y-auto py-1 sm:py-2 transition-all duration-300`}
        style={{
          paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 76}px` : '10rem'
        }}
      >
        <div className="eu-stage w-full min-h-full flex items-start justify-center pt-2 sm:pt-6 px-1 sm:px-2">
          {renderEUSlide()}
        </div>
      </div>

      {/* Floating Bottom Navigation Pill */}
      <div
        style={{
          bottom: `calc(0.75rem + var(--sab, 0px) + ${keyboardOffset}px)`
        }}
        className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-2 rounded-full bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl z-40 max-w-[96vw] transition-[bottom] duration-150 ease-out"
      >
        <button
          onClick={prevSlide}
          disabled={!isRedemptionMode && currentSlideIndex === 0}
          className="min-h-[40px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95"
        >
          قبلی
        </button>

        {/* Progress Bar inside pill */}
        <div className="w-16 sm:w-28 md:w-36 h-2 rounded-full bg-slate-200/80 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isRedemptionMode
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 w-full animate-pulse'
                : 'bg-gradient-to-r from-cyan-400 to-blue-600'
            }`}
            style={{
              width: isRedemptionMode
                ? '100%'
                : `${Math.round(((currentSlideIndex + 1) / totalSlides) * 100)}%`,
            }}
          />
        </div>

        <button
          onClick={nextSlide}
          className={`min-h-[40px] px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black transition-all cursor-pointer text-white shadow-md whitespace-nowrap active:scale-95 flex items-center gap-1 ${
            isRedemptionMode
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-500/20'
          }`}
        >
          {isRedemptionMode ? (
            <span>اسلاید بعدی ✦</span>
          ) : isLastSlide ? (
            'پایان و ثبت'
          ) : (
            <>
              <span>بعدی</span>
              <span className="hidden sm:inline"> (Enter)</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
};
