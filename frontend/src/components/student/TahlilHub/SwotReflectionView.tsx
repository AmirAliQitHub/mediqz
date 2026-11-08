import React, { useEffect } from 'react';
import { useTahlilStore } from '../../../store/useTahlilStore';
import { DynamicListInput } from './DynamicListInput';
import { toPersianDigits } from '../../../utils/shamsiCalendar';
import {
  Zap,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SwotDimensionConfig {
  id: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  stepNum: 1 | 2 | 3 | 4;
  title: string;
  question: string;
  subtitle: string;
  placeholderActive: string;
  placeholderNext: string;
  badgeBgColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
}

const SWOT_DIMENSIONS: SwotDimensionConfig[] = [
  {
    id: 'strengths',
    stepNum: 1,
    title: 'نقاط قوت مطالعاتی',
    question: 'نقاط قوت عملکرد مطالعاتیت برای آزمون چیا بودن؟',
    subtitle: 'روش‌ها، مباحث یا عاداتی که در این بازه دوهفته‌ای نتیجه مثبت دادند.',
    placeholderActive: 'مثلاً: تسلط عالی روی تست‌های زمان‌دار زیست، استمرار در مطالعه...',
    placeholderNext: 'افزودن نقطه قوت بعدی...',
    badgeBgColor: 'bg-emerald-500/20',
    badgeTextColor: 'text-emerald-300',
    badgeBorderColor: 'border-emerald-500/30',
    icon: Zap,
    accentColor: 'text-emerald-400',
    accentBorder: 'border-emerald-500/40',
    accentBg: 'bg-emerald-500/10',
  },
  {
    id: 'weaknesses',
    stepNum: 2,
    title: 'نقاط ضعف مطالعاتی',
    question: 'نقاط ضعف عملکرد مطالعاتیت برای آزمون چیا بودن؟',
    subtitle: 'عوامل علمی، مهارتی یا زمانی که باعث از دست رفتن نمره شدند را بنویس.',
    placeholderActive: 'مثلاً: بی‌دقتی در محاسبات شیمی، کند بودن در تست‌های مفهومی فیزیک...',
    placeholderNext: 'افزودن نقطه ضعف بعدی...',
    badgeBgColor: 'bg-rose-500/20',
    badgeTextColor: 'text-rose-300',
    badgeBorderColor: 'border-rose-500/30',
    icon: AlertTriangle,
    accentColor: 'text-rose-400',
    accentBorder: 'border-rose-500/40',
    accentBg: 'bg-rose-500/10',
  },
  {
    id: 'opportunities',
    stepNum: 3,
    title: 'ایده‌ها و راهبردهای پیشرفت',
    question: 'ایده‌هایی برای بهتر شدن عملکرد مطالعت',
    subtitle: 'چه راهکارها و تکنیک‌هایی می‌تواند تراز آزمون بعدیت را جهش دهد؟',
    placeholderActive: 'مثلاً: افزایش تست‌های دوره‌ای در آخر هفته، خلاصه‌نویسی نکات شکل‌ها...',
    placeholderNext: 'افزودن ایده بعدی...',
    badgeBgColor: 'bg-amber-500/20',
    badgeTextColor: 'text-amber-300',
    badgeBorderColor: 'border-amber-500/30',
    icon: Lightbulb,
    accentColor: 'text-amber-400',
    accentBorder: 'border-amber-500/40',
    accentBg: 'bg-amber-500/10',
  },
  {
    id: 'threats',
    stepNum: 4,
    title: 'تهدیدات و پیش‌بینی چالش‌ها',
    question: 'تهدیداتی که توی بازه مطالعه این آزمون حس کردی (پیش‌بینی مشکلات آینده) چیا بودن؟',
    subtitle: 'موانع محیطی، درسی یا روانی آینده که نیازمند پیشگیری هوشمندانه هستند.',
    placeholderActive: 'مثلاً: فشرده شدن امتحانات مدرسه، افت انرژی در اواسط هفته...',
    placeholderNext: 'افزودن تهدید بعدی...',
    badgeBgColor: 'bg-purple-500/20',
    badgeTextColor: 'text-purple-300',
    badgeBorderColor: 'border-purple-500/30',
    icon: ShieldAlert,
    accentColor: 'text-purple-400',
    accentBorder: 'border-purple-500/40',
    accentBg: 'bg-purple-500/10',
  },
];

export const SwotReflectionView: React.FC = () => {
  const {
    activeExam,
    swotData,
    swotSubstep,
    maxUnlockedSwotSubstep,
    setSwotList,
    setSwotSubstep,
    submitSwot,
    skipSwot,
    setActiveView,
    isLoading,
  } = useTahlilStore();

  const currentDimension =
    SWOT_DIMENSIONS.find((d) => d.stepNum === swotSubstep) || SWOT_DIMENSIONS[0];
  const IconComponent = currentDimension.icon;

  // Background auto-save on dimension switch or view unmount
  useEffect(() => {
    return () => {
      useTahlilStore.getState().saveSwotDraft();
    };
  }, [swotSubstep]);

  const handlePrevStep = () => {
    if (swotSubstep === 1) {
      setActiveView('keypad');
    } else {
      setSwotSubstep((swotSubstep - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleNextOrSubmit = async () => {
    if (swotSubstep === 4) {
      // Final submission: advance directly to question journal
      await submitSwot(true);
    } else {
      // Advance to next SWOT dimension
      await submitSwot(false);
    }
  };

  const handlePillClick = (stepNum: 1 | 2 | 3 | 4) => {
    if (stepNum <= maxUnlockedSwotSubstep) {
      setSwotSubstep(stepNum);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 pb-28 sm:pb-32 space-y-4 sm:space-y-6" dir="rtl">
      {/* Top Macro Stage Progress Breadcrumb */}
      <div className="bg-[#120D28]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between gap-1 sm:gap-2 text-[11px] sm:text-xs">
          {/* Step 1: Keypad */}
          <button
            type="button"
            onClick={() => setActiveView('keypad')}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors py-1 px-2 rounded-lg hover:bg-emerald-500/10 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">۱. پاسخ‌برگ</span>
          </button>

          <ChevronLeft className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" />

          {/* Step 2: SWOT (Active) */}
          <div className="flex items-center gap-1.5 text-purple-200 font-bold bg-purple-500/20 border border-purple-400/40 px-2.5 py-1 rounded-xl shadow-inner">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>۲. تحلیل سوات دوهفته</span>
          </div>

          <ChevronLeft className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" />

          {/* Step 3: Journal */}
          <div className="flex items-center gap-1.5 text-purple-400/50 py-1 px-2 select-none">
            <span className="w-4 h-4 rounded-full border border-purple-400/30 flex items-center justify-center text-[10px]">۳</span>
            <span className="hidden sm:inline">ژورنال سوالات</span>
            <span className="sm:hidden">ژورنال</span>
          </div>

          <ChevronLeft className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" />

          {/* Step 4: Dashboard */}
          <div className="flex items-center gap-1.5 text-purple-400/50 py-1 px-2 select-none">
            <span className="w-4 h-4 rounded-full border border-purple-400/30 flex items-center justify-center text-[10px]">۴</span>
            <span className="hidden sm:inline">کارنامه بالینی</span>
            <span className="sm:hidden">کارنامه</span>
          </div>
        </div>
      </div>

      {/* Main Liquid Glass Reflection Card */}
      <div className="bg-[#120D28]/95 backdrop-blur-2xl border border-purple-500/25 rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
        {/* Subtle Ambient Light Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Header & Micro Sub-stepper */}
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border ${currentDimension.accentBorder} ${currentDimension.accentBg} shadow-lg`}
              >
                <IconComponent className={`w-6 h-6 ${currentDimension.accentColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {currentDimension.title}
                  </h2>
                  <span className="text-[11px] font-bold text-purple-300/70 bg-purple-900/40 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    بخش {toPersianDigits(currentDimension.stepNum)} از ۴
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
                  {currentDimension.subtitle}
                </p>
              </div>
            </div>

            {/* Compact 4-Pill Numbered Stepper (Ergonomic for 375x812 Mobile) */}
            <div className="flex items-center gap-2 self-center sm:self-auto bg-purple-950/60 p-1.5 rounded-2xl border border-purple-500/25 shadow-inner">
              {SWOT_DIMENSIONS.map((dim) => {
                const isActive = dim.stepNum === swotSubstep;
                const isUnlocked = dim.stepNum <= maxUnlockedSwotSubstep;
                const hasData = swotData[dim.id].some((it) => it && it.trim());

                return (
                  <button
                    key={dim.id}
                    type="button"
                    onClick={() => handlePillClick(dim.stepNum)}
                    disabled={!isUnlocked}
                    title={dim.title}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-200 select-none ${
                      isActive
                        ? `${dim.accentBg} ${dim.accentColor} border-2 ${dim.accentBorder} shadow-lg scale-105`
                        : isUnlocked
                        ? hasData
                          ? 'bg-purple-900/40 text-purple-200 border border-purple-400/40 hover:bg-purple-800/40 cursor-pointer'
                          : 'bg-purple-900/20 text-purple-300/70 border border-purple-500/20 hover:bg-purple-800/30 cursor-pointer'
                        : 'bg-purple-950/20 text-purple-500/30 border border-purple-800/20 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {hasData && !isActive ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      toPersianDigits(dim.stepNum)
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension Diagnostic Question Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-900/25 border border-purple-400/25 text-purple-100 flex items-start gap-3 shadow-inner">
            <span className="text-xl select-none leading-none pt-0.5">💬</span>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-purple-300/60 uppercase tracking-wider block">
                سوال تشخیصی دوهفته
              </span>
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {currentDimension.question}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Growing Grayed-Out Textarea List */}
        <div className="relative z-10 pt-1">
          <DynamicListInput
            key={currentDimension.id}
            items={swotData[currentDimension.id]}
            onChange={(newItems) => setSwotList(currentDimension.id, newItems)}
            placeholderActive={currentDimension.placeholderActive}
            placeholderNext={currentDimension.placeholderNext}
            badgeBgColor={currentDimension.badgeBgColor}
            badgeTextColor={currentDimension.badgeTextColor}
            badgeBorderColor={currentDimension.badgeBorderColor}
            dimensionLabel={currentDimension.title}
          />
        </div>
      </div>

      {/* Sticky Bottom Ergonomic Navigation Capsule (Mobile 375x812 Thumb Dominant) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d081f]/95 backdrop-blur-2xl border-t border-purple-500/25 px-3 py-3 sm:py-4 shadow-2xl safe-area-pb">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2.5">
          <div className="w-full flex items-center justify-between gap-3">
            {/* Previous Step CTA */}
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-2 px-3.5 sm:px-5 py-3 rounded-2xl bg-purple-950/70 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-bold hover:bg-purple-900/60 active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-purple-300" />
              <span>
                {swotSubstep === 1 ? 'بازگشت به پاسخ‌برگ' : 'مرحله قبلی'}
              </span>
            </button>

            {/* Next / Submit CTA */}
            {swotSubstep < 4 ? (
              <button
                type="button"
                onClick={handleNextOrSubmit}
                disabled={isLoading}
                className="flex-1 sm:flex-initial min-w-[140px] sm:min-w-[170px] min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-900/40 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
              >
                <span>مرحله بعدی</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextOrSubmit}
                disabled={isLoading}
                className="flex-1 sm:flex-initial min-w-[180px] sm:min-w-[210px] min-h-[48px] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ثبت و ورود به ژورنال</span>
              </button>
            )}
          </div>

          {/* Discreet Centered Skip Link (Zero Data Loss) */}
          <button
            type="button"
            onClick={skipSwot}
            disabled={isLoading}
            className="text-[11px] sm:text-xs text-purple-300/60 hover:text-purple-100 hover:underline transition-colors py-0.5 px-2 rounded cursor-pointer touch-manipulation"
          >
            رد شدن از تحلیل SWOT و ورود به ژورنال سوالات ←
          </button>
        </div>
      </div>
    </div>
  );
};
