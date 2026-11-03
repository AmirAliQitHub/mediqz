import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Zap,
  Sliders,
  BookOpen,
  Layers,
  Calendar,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { useCourseStore } from '../../../store/useCourseStore';
import {
  useRoutineStore,
  RoutineApplyStrategy,
  calculateSmartRoutinePreview,
} from '../../../store/useRoutineStore';
import {
  toPersianDigits,
  getCurrentShamsiDateString,
  addDaysToShamsi,
  formatShamsiSummary,
} from '../../../utils/shamsiCalendar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RoutineSortModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { courses, fetchCourseById } = useCourseStore();
  const { days, applySmartRoutineSchedule } = useRoutineStore();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [startDateShamsi, setStartDateShamsi] = useState<string>(getCurrentShamsiDateString());
  const [partsPerDay, setPartsPerDay] = useState<number>(2);
  const [isContinuousRepetition, setIsContinuousRepetition] = useState<boolean>(false);
  const [repeatDays, setRepeatDays] = useState<number>(2);
  const [startFromUncompleted, setStartFromUncompleted] = useState<boolean>(true);
  const [strategy, setStrategy] = useState<RoutineApplyStrategy>('replace_course');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [loadedParts, setLoadedParts] = useState<any[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState<boolean>(false);

  // Auto-populate course selection when courses arrive
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Keep startDateShamsi updated with today if unopened
  useEffect(() => {
    if (isOpen) {
      setStartDateShamsi(getCurrentShamsiDateString());
    }
  }, [isOpen]);

  // Auto-fetch selected course parts
  useEffect(() => {
    if (!selectedCourseId) return;
    let active = true;
    setIsLoadingParts(true);

    fetchCourseById(selectedCourseId)
      .then((c) => {
        if (active) {
          setLoadedParts(c?.parts || []);
        }
      })
      .catch(() => {
        if (active) setLoadedParts([]);
      })
      .finally(() => {
        if (active) setIsLoadingParts(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCourseId, fetchCourseById]);

  // Lock body scroll and register escape key while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Calculate completed parts for the selected course
  const completedPartIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of days) {
      for (const it of d.items) {
        if (it.course_id === selectedCourseId && it.completed) {
          ids.add(it.part_id);
        }
      }
    }
    return ids;
  }, [days, selectedCourseId]);

  // Filter parts for preview based on startFromUncompleted
  const activeParts = useMemo(() => {
    if (!startFromUncompleted) return loadedParts;
    const firstUncompleted = loadedParts.findIndex((p) => !completedPartIds.has(p.part_id));
    if (firstUncompleted > 0) {
      return loadedParts.slice(firstUncompleted);
    }
    return loadedParts;
  }, [loadedParts, startFromUncompleted, completedPartIds]);

  // Generate selectable start date options (Today + next 7 days)
  const startDateOptions = useMemo(() => {
    const todayStr = getCurrentShamsiDateString();
    const options: Array<{ date: string; label: string }> = [];
    for (let offset = 0; offset <= 7; offset++) {
      const dStr = addDaysToShamsi(todayStr, offset);
      let label = formatShamsiSummary(dStr);
      if (offset === 0) label = `امروز (${label})`;
      else if (offset === 1) label = `فردا (${label})`;
      options.push({ date: dStr, label });
    }
    return options;
  }, [isOpen]);

  // Reactive preview calculation
  const preview = useMemo(() => {
    const effectiveRepeat = isContinuousRepetition ? repeatDays : 0;
    return calculateSmartRoutinePreview(activeParts, partsPerDay, effectiveRepeat, startDateShamsi);
  }, [activeParts, partsPerDay, isContinuousRepetition, repeatDays, startDateShamsi]);

  const targetCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      if (!targetCourse) {
        alert('لطفاً یک دوره را انتخاب کنید.');
        return;
      }

      let parts = loadedParts;
      if (parts.length === 0) {
        const full = await fetchCourseById(targetCourse.id);
        parts = full?.parts || [];
      }

      if (parts.length === 0) {
        alert('این دوره پارتی برای چینش ندارد.');
        return;
      }

      await applySmartRoutineSchedule({
        courseId: targetCourse.id,
        courseTitle: targetCourse.title,
        parts,
        startDateShamsi,
        partsPerDay,
        repeatDays: isContinuousRepetition ? repeatDays : 0,
        startFromUncompleted,
        strategy,
      });

      // Telegram Haptic Feedback on successful application
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        try {
          (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        } catch {}
      }

      onClose();
    } catch (err: any) {
      alert(`خطا در چینش روتین: ${err?.message || err}`);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      dir="rtl"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-md p-0 sm:p-4 animate-fadeIn select-none"
    >
      <div
        className="w-full max-w-lg bg-[#0e0a22]/95 backdrop-blur-xl border-t sm:border border-purple-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 flex flex-col text-white max-h-[min(88dvh,calc(100%-env(safe-area-inset-top,0px)-0.75rem))] sm:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden shrink-0 min-h-[28px]">
          <div className="w-12 h-1.5 rounded-full bg-purple-400/30" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pb-3 pt-1 sm:pt-4 border-b border-purple-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">چینش هوشمند روتین مطالعاتی</h3>
              <p className="text-[11px] text-purple-200/80 font-medium">الگوریتم پیشروی و تکرار پیوسته پارت‌ها</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-purple-500/20 text-purple-200 hover:text-white border border-white/10 transition-colors cursor-pointer flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-5 sm:px-6 py-4 flex flex-col gap-4">
          {/* Step 1: Course Selection */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>۱. انتخاب دوره برای چینش:</span>
              </span>
              <span className="text-[11px] font-medium text-purple-300/80">
                {isLoadingParts
                  ? 'در حال شمارش...'
                  : `${toPersianDigits(loadedParts.length || targetCourse?.parts_count || 0)} پارت موجود`}
              </span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full min-h-[44px] bg-[#160f33]/90 border border-purple-400/30 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 transition-colors"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.title}
                </option>
              ))}
            </select>

            {/* Progress-awareness indicator */}
            {completedPartIds.size > 0 && (
              <label className="flex items-center gap-2 mt-1 cursor-pointer text-[11px] font-medium text-purple-300/90 select-none">
                <input
                  type="checkbox"
                  checked={startFromUncompleted}
                  onChange={(e) => setStartFromUncompleted(e.target.checked)}
                  className="rounded border-purple-400/40 text-purple-600 focus:ring-purple-400 bg-white/5 w-3.5 h-3.5 cursor-pointer"
                />
                <span>
                  شروع از اولین پارت نخوانده‌شده ({toPersianDigits(completedPartIds.size)} پارت قبلاً خوانده شده)
                </span>
              </label>
            )}
          </div>

          {/* Step 2: Start Date & Live Calculated End Date */}
          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>۲. تاریخ شروع و محاسبه تاریخ پایان:</span>
            </label>

            <select
              value={startDateShamsi}
              onChange={(e) => setStartDateShamsi(e.target.value)}
              className="w-full min-h-[44px] bg-[#160f33]/90 border border-purple-400/30 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 transition-colors"
            >
              {startDateOptions.map((opt) => (
                <option key={opt.date} value={opt.date} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs">
              <span className="text-purple-300/90 font-medium">تاریخ اتمام محاسبه‌شده:</span>
              <span className="font-black text-emerald-300">
                {preview.endDateShamsi ? formatShamsiSummary(preview.endDateShamsi) : '...'}
              </span>
            </div>
          </div>

          {/* Step 3: Daily Part Quota (P) */}
          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>۳. تعداد پارت در روز (سقف هر نوبت):</span>
              </span>
              <span className="text-[11px] font-medium text-purple-300/80">
                {toPersianDigits(preview.totalBatches)} نوبت پیشروی
              </span>
            </label>
            <div className="flex items-center justify-between gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPartsPerDay(num)}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-black transition-all cursor-pointer ${
                    partsPerDay === num
                      ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-300/50'
                      : 'bg-white/5 border border-white/10 text-purple-200/90 hover:bg-white/15'
                  }`}
                >
                  {toPersianDigits(num)} پارت
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Continuous Repetition Mode (R) */}
          <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-white/5 border border-purple-500/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-purple-400" />
                  <span>تکرار پیوسته (Continuous Repetition)</span>
                </span>
                <span className="text-[10px] text-purple-200/70 font-medium mt-0.5">
                  تکرار چندروزه هر دسته پارت قبل از پیشروی به پارت‌های بعدی
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isContinuousRepetition}
                  onChange={(e) => setIsContinuousRepetition(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isContinuousRepetition && (
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2 animate-fadeIn">
                <span className="text-[11px] font-bold text-purple-200">
                  تعداد روزهای تکرار هر دسته:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRepeatDays(num)}
                      className={`min-h-[44px] rounded-xl text-[11px] font-black transition-all cursor-pointer flex flex-col items-center justify-center ${
                        repeatDays === num
                          ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-300/50'
                          : 'bg-white/5 border border-white/10 text-purple-200/90 hover:bg-white/15'
                      }`}
                    >
                      <span>{toPersianDigits(num)} روز</span>
                      <span className="text-[9px] text-purple-300/80 font-normal">
                        ({toPersianDigits(num + 1)} نوبت)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Strategy: Replace or Merge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-purple-500/20 text-xs shrink-0">
            <span className="text-purple-200 font-bold">نحوه اعمال در تقویم:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStrategy('replace_course')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  strategy === 'replace_course'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-transparent text-purple-300/70 hover:text-white'
                }`}
              >
                جایگزینی پارت‌های این درس
              </button>
              <button
                type="button"
                onClick={() => setStrategy('merge')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  strategy === 'merge'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-transparent text-purple-300/70 hover:text-white'
                }`}
              >
                ادغام با برنامه فعلی
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-[#0e0a22]/95 backdrop-blur-md px-5 sm:px-6 py-3 border-t border-purple-500/20 shrink-0 flex flex-col gap-2.5 shadow-2xl pb-[calc(env(safe-area-inset-bottom,16px)+0.75rem)]">
          {/* Live Telemetry Pill */}
          <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-center shadow-inner">
            <span className="text-xs sm:text-sm font-black text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>
                [ {toPersianDigits(preview.totalParts)} پارت • {toPersianDigits(preview.totalStudyDays)} روز مطالعه • اتمام: {preview.endDateShamsi ? formatShamsiSummary(preview.endDateShamsi) : '...'} ]
              </span>
            </span>
          </div>

          {/* CTA Action Button */}
          <button
            type="button"
            disabled={isApplying || isLoadingParts || preview.totalParts === 0}
            onClick={handleApply}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-purple-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isApplying ? 'در حال اعمال چینش هوشمند...' : 'ثبت روتین و شروع هوشمند'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
