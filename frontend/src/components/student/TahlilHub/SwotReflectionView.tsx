import React, { useEffect } from 'react';
import { useTahlilStore } from '../../../store/useTahlilStore';
import { DynamicListInput } from './DynamicListInput';
import { toPersianDigits } from '../../../utils/shamsiCalendar';
import {
  Zap,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
    badgeBgColor: 'bg-emerald-50',
    badgeTextColor: 'text-emerald-700',
    badgeBorderColor: 'border-emerald-200',
    icon: Zap,
    accentColor: 'text-emerald-600',
    accentBorder: 'border-emerald-200',
    accentBg: 'bg-emerald-50',
  },
  {
    id: 'weaknesses',
    stepNum: 2,
    title: 'نقاط ضعف مطالعاتی',
    question: 'نقاط ضعف عملکرد مطالعاتیت برای آزمون چیا بودن؟',
    subtitle: 'عوامل علمی، مهارتی یا زمانی که باعث از دست رفتن نمره شدند را بنویس.',
    placeholderActive: 'مثلاً: بی‌دقتی در محاسبات شیمی، کند بودن در تست‌های مفهومی فیزیک...',
    placeholderNext: 'افزودن نقطه ضعف بعدی...',
    badgeBgColor: 'bg-rose-50',
    badgeTextColor: 'text-rose-700',
    badgeBorderColor: 'border-rose-200',
    icon: AlertTriangle,
    accentColor: 'text-rose-600',
    accentBorder: 'border-rose-200',
    accentBg: 'bg-rose-50',
  },
  {
    id: 'opportunities',
    stepNum: 3,
    title: 'ایده‌ها و راهبردهای پیشرفت',
    question: 'ایده‌هایی برای بهتر شدن عملکرد مطالعت',
    subtitle: 'چه راهکارها و تکنیک‌هایی می‌تواند تراز آزمون بعدیت را جهش دهد؟',
    placeholderActive: 'مثلاً: افزایش تست‌های دوره‌ای در آخر هفته، خلاصه‌نویسی نکات شکل‌ها...',
    placeholderNext: 'افزودن ایده بعدی...',
    badgeBgColor: 'bg-amber-50',
    badgeTextColor: 'text-amber-700',
    badgeBorderColor: 'border-amber-200',
    icon: Lightbulb,
    accentColor: 'text-amber-600',
    accentBorder: 'border-amber-200',
    accentBg: 'bg-amber-50',
  },
  {
    id: 'threats',
    stepNum: 4,
    title: 'تهدیدات و پیش‌بینی چالش‌ها',
    question: 'تهدیداتی که توی بازه مطالعه این آزمون حس کردی (پیش‌بینی مشکلات آینده) چیا بودن؟',
    subtitle: 'موانع محیطی، درسی یا روانی آینده که نیازمند پیشگیری هوشمندانه هستند.',
    placeholderActive: 'مثلاً: فشرده شدن امتحانات مدرسه، افت انرژی در اواسط هفته...',
    placeholderNext: 'افزودن تهدید بعدی...',
    badgeBgColor: 'bg-blue-50',
    badgeTextColor: 'text-blue-700',
    badgeBorderColor: 'border-blue-200',
    icon: ShieldAlert,
    accentColor: 'text-blue-600',
    accentBorder: 'border-blue-200',
    accentBg: 'bg-blue-50',
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
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 pb-12 space-y-4 sm:space-y-6" dir="rtl">
      {/* Top Macro Stage Progress Breadcrumb - Light Theme */}
      <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-1 sm:gap-2 text-[11px] sm:text-xs">
          {/* Step 1: Keypad */}
          <button
            type="button"
            onClick={() => setActiveView('keypad')}
            className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors py-1 px-2 rounded-lg hover:bg-emerald-50 cursor-pointer font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>۱. پاسخ‌برگ</span>
          </button>

          <ChevronLeft className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />

          {/* Step 2: SWOT (Active) */}
          <div className="flex items-center gap-1.5 text-blue-700 font-extrabold bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-xl shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>۲. تحلیل سوات دوهفته</span>
          </div>

          <ChevronLeft className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />

          {/* Step 3: Journal */}
          <div className="flex items-center gap-1.5 text-slate-400 py-1 px-2 select-none">
            <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">۳</span>
            <span className="hidden sm:inline">ژورنال سوالات</span>
            <span className="sm:hidden">ژورنال</span>
          </div>

          <ChevronLeft className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />

          {/* Step 4: Dashboard */}
          <div className="flex items-center gap-1.5 text-slate-400 py-1 px-2 select-none">
            <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">۴</span>
            <span className="hidden sm:inline">کارنامه بالینی</span>
            <span className="sm:hidden">کارنامه</span>
          </div>
        </div>
      </div>

      {/* Main Light Reflection Card */}
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-4 sm:p-7 shadow-xl shadow-slate-200/40 relative overflow-hidden space-y-6">
        {/* Subtle Ambient Light Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-slate-100/70 to-blue-50/50 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Header & Micro Sub-stepper */}
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border ${currentDimension.accentBorder} ${currentDimension.accentBg} shadow-sm`}
              >
                <IconComponent className={`w-6 h-6 ${currentDimension.accentColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {currentDimension.title}
                  </h2>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    بخش {toPersianDigits(currentDimension.stepNum)} از ۴
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {currentDimension.subtitle}
                </p>
              </div>
            </div>

            {/* Compact 4-Pill Numbered Stepper (Ergonomic for 375x812 Mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2 self-center sm:self-auto bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
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
                        ? 'bg-slate-900 text-white shadow-md scale-105 border border-slate-900'
                        : isUnlocked
                        ? hasData
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs'
                        : 'bg-slate-100 text-slate-300 border border-slate-200/40 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {hasData && !isActive ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      toPersianDigits(dim.stepNum)
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension Diagnostic Question Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/90 text-slate-800 flex items-start gap-3 shadow-xs">
            <span className="text-xl select-none leading-none pt-0.5">💬</span>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-blue-600/80 uppercase tracking-wider block">
                سوال تشخیصی دوهفته
              </span>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
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

        {/* Integrated In-Card Bottom Navigation (NO BLACK FIXED BAR) */}
        <div className="relative z-10 border-t border-slate-100 pt-5 mt-6 space-y-3">
          <div className="w-full flex items-center justify-between gap-3">
            {/* Previous Step CTA */}
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-2 px-3.5 sm:px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-700 text-xs sm:text-sm font-bold active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
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
                className="flex-1 sm:flex-initial min-w-[140px] sm:min-w-[170px] min-h-[48px] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
              >
                <span>مرحله بعدی</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextOrSubmit}
                disabled={isLoading}
                className="flex-1 sm:flex-initial min-w-[180px] sm:min-w-[210px] min-h-[48px] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ثبت و ورود به ژورنال</span>
              </button>
            )}
          </div>

          {/* Discreet Centered Skip Link (Zero Data Loss) */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={skipSwot}
              disabled={isLoading}
              className="text-xs text-slate-400 hover:text-slate-700 hover:underline transition-colors py-1 px-3 rounded cursor-pointer touch-manipulation"
            >
              رد شدن از تحلیل SWOT و ورود به ژورنال سوالات ←
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
