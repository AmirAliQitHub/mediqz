import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Zap,
  Sliders,
  CheckCircle2,
  Shield,
  Flame,
  BookOpen,
  Layers,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useCourseStore } from '../../../store/useCourseStore';
import {
  useRoutineStore,
  RoutineSortMode,
  RoutineApplyStrategy,
  previewCourseDistribution,
} from '../../../store/useRoutineStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const toFa = (num: number | string): string => {
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (w) => faDigits[parseInt(w, 10)]);
};

export const RoutineSortModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { courses, fetchCourseById } = useCourseStore();
  const { distributeCourseParts } = useRoutineStore();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [sortMode, setSortMode] = useState<RoutineSortMode>('friday_buffer');
  const [partsPerDay, setPartsPerDay] = useState<number>(2);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [strategy, setStrategy] = useState<RoutineApplyStrategy>('merge');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [loadedParts, setLoadedParts] = useState<any[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState<boolean>(false);

  // Auto-populate course selection when courses arrive
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Auto-fetch selected course parts for live telemetry
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

  // Reactive preview calculation
  const preview = useMemo(() => {
    return previewCourseDistribution(loadedParts.length, sortMode, partsPerDay, durationDays);
  }, [loadedParts.length, sortMode, partsPerDay, durationDays]);

  if (!isOpen) return null;

  const modeDescriptions: Record<RoutineSortMode, { title: string; subtitle: string; icon: React.ReactNode }> = {
    friday_buffer: {
      title: 'جمعه‌های جبرانی و تثبیت',
      subtitle: 'توزیع متوازن در روزهای هفته و آزاد نگه داشتن آدینه برای آزمون و تثبیت',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
    },
    even: {
      title: 'تقسیم متوازن روزانه',
      subtitle: 'توزیع یکنواخت و مساوی پارت‌ها در تمام روزهای دوره با بار ذهنی یکدست',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
    },
    leitner: {
      title: 'توالی مرور فاصله‌دار لایتنر',
      subtitle: 'پارت‌های جدید در روزهای فرد و مرور جعبه‌های گذشته در روزهای زوج',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    cram: {
      title: 'تراکم سریع نزدیک آزمون',
      subtitle: 'تراکم ۶۵٪ حجم در روزهای اول و اختصاص روزهای پایانی به جمع‌بندی',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
    },
  };

  const strategyDescriptions: Record<
    RoutineApplyStrategy,
    { title: string; subtitle: string; badge: string; icon: React.ReactNode; color: string }
  > = {
    merge: {
      title: 'ادغام در برنامه فعلی (پیش‌فرض امن)',
      subtitle: 'پارت‌های جدید بدون دستکاری سایر دروس، به خانه‌های خالی تقویم افزوده می‌شوند.',
      badge: 'پیشنهادی',
      icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300',
    },
    replace_course: {
      title: 'جایگزینی پارت‌های همین دوره',
      subtitle: 'فقط پارت‌های قبلی این درس پاک می‌شوند و سایر دروس دست‌نخورده می‌مانند.',
      badge: 'هدفمند',
      icon: <RefreshCw className="w-3.5 h-3.5 text-amber-400" />,
      color: 'border-amber-500/60 bg-amber-950/20 text-amber-300',
    },
    replace_all: {
      title: 'پاکسازی و بازنویسی کل روزها',
      subtitle: 'تمام روتین‌های قبلی تقویم پاک شده و یک جدول زمان‌بندی تازه ایجاد می‌شود.',
      badge: 'هشدار بازنویسی',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
      color: 'border-rose-500/60 bg-rose-950/20 text-rose-300',
    },
  };

  const handleApply = async () => {
    if (strategy === 'replace_all') {
      const confirmed = window.confirm(
        'توجه: با انتخاب این گزینه، کل روتین‌های قبلی شما در تقویم پاک و بازنویسی خواهد شد. آیا مطمئن هستید؟'
      );
      if (!confirmed) return;
    }

    setIsApplying(true);
    try {
      const targetCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
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

      await distributeCourseParts({
        courseId: targetCourse.id,
        courseTitle: targetCourse.title,
        parts,
        sortMode,
        partsPerDay,
        durationDays,
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

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4 animate-fadeIn select-none"
    >
      <div
        className="w-full max-w-lg bg-slate-950/95 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 pb-[calc(1.5rem+var(--sab,0px))] flex flex-col gap-3.5 text-white max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">چینش هوشمند روتین مطالعاتی</h3>
              <p className="text-[11px] text-slate-400 font-medium">توزیع علمی پارت‌ها در تقویم شمسی</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Course Selection */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>انتخاب دوره برای چینش:</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {isLoadingParts ? 'در حال دریافت...' : `${toFa(loadedParts.length)} پارت موجود`}
            </span>
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full min-h-[44px] bg-slate-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Glass Telemetry Bar (3-Metric Live Breakdown) */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-center gap-2 shrink-0">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">کل پارت‌ها</span>
            <span className="text-xs sm:text-sm font-black text-blue-400 mt-0.5">
              {isLoadingParts ? '...' : `${toFa(preview.totalParts)} پارت`}
            </span>
          </div>
          <div className="w-px h-8 bg-white/10 shrink-0" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">روزهای فعال</span>
            <span className="text-xs sm:text-sm font-black text-amber-400 mt-0.5">
              {toFa(preview.activeDaysCount)} روز
            </span>
          </div>
          <div className="w-px h-8 bg-white/10 shrink-0" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">سقف روزانه</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">
              {preview.baseQuota > 0 ? `روزی ${toFa(preview.baseQuota)} پارت` : 'توزیع پویا'}
            </span>
          </div>
        </div>

        {/* 3. Distribution Mode Selector */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-xs font-bold text-slate-300">الگوی توزیع روزانه:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(modeDescriptions) as RoutineSortMode[]).map((mode) => {
              const info = modeDescriptions[mode];
              const isSelected = sortMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  className={`p-2.5 rounded-2xl border text-right transition-all flex items-start gap-2.5 cursor-pointer min-h-[52px] ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500/80 shadow-md ring-1 ring-blue-400/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{info.icon}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black block text-white truncate">{info.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight block mt-0.5 line-clamp-1">
                      {info.subtitle}
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 self-center" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Controls: Parts per day & Duration */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5 shrink-0">
          <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300">پارت در هر روز:</span>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPartsPerDay(num)}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-black transition-all cursor-pointer ${
                    partsPerDay === num
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {toFa(num)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300">طول دوره تقویمی:</span>
            <div className="flex items-center justify-between gap-1">
              {[7, 14, 21, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDurationDays(num)}
                  className={`flex-1 min-h-[44px] rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    durationDays === num
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {toFa(num)} روز
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Strategy Selector (Merge vs Replace Course vs Replace All) */}
        <div className="flex flex-col gap-1.5 shrink-0 pt-1">
          <label className="text-xs font-bold text-slate-300">نحوه اعمال در تقویم فعلی:</label>
          <div className="grid grid-cols-1 gap-1.5">
            {(Object.keys(strategyDescriptions) as RoutineApplyStrategy[]).map((strat) => {
              const info = strategyDescriptions[strat];
              const isSelected = strategy === strat;
              return (
                <button
                  key={strat}
                  type="button"
                  onClick={() => setStrategy(strat)}
                  className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer min-h-[44px] ${
                    isSelected ? info.color : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0">{info.icon}</div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{info.title}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 shrink-0">
                    {info.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Primary Action CTA */}
        <div className="pt-2 shrink-0">
          <button
            type="button"
            disabled={isApplying || isLoadingParts}
            onClick={handleApply}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-blue-500/25 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isApplying ? 'در حال اعمال چینش...' : 'ثبت و اعمال چینش در تقویم روتین'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
