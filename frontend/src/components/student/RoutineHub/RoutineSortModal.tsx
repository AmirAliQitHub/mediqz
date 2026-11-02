import React, { useState } from 'react';
import { X, Zap, Calendar, Sliders, CheckCircle2, Shield, Flame, BookOpen, Layers } from 'lucide-react';
import { useCourseStore } from '../../../store/useCourseStore';
import { useRoutineStore, RoutineItem, RoutineDay } from '../../../store/useRoutineStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../services/api';
import { getEffectiveStudyDate, getShamsiDateInfo } from '../../../utils/shamsiCalendar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SortMode = 'even' | 'leitner' | 'cram' | 'friday_buffer';

export const RoutineSortModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { courses, fetchCourseById } = useCourseStore();
  const { days, currentDayNumber } = useRoutineStore();
  const { user } = useAuthStore();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [sortMode, setSortMode] = useState<SortMode>('friday_buffer');
  const [partsPerDay, setPartsPerDay] = useState<number>(2);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  if (!isOpen) return null;

  const modeDescriptions: Record<SortMode, { title: string; subtitle: string; icon: React.ReactNode }> = {
    friday_buffer: {
      title: 'جمعه‌های جبرانی و تثبیت',
      subtitle: 'توزیع متوازن در طول هفته و خالی نگه داشتن آدینه برای آزمون و جبران عقب‌افتادگی‌ها',
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
      subtitle: 'تراکم ۷۰٪ حجم در روزهای اول و اختصاص روزهای پایانی به آزمون‌های جامع',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
    },
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      // 1. Fetch full course parts if not loaded
      const targetCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
      if (!targetCourse) {
        alert('لطفاً یک دوره را انتخاب کنید.');
        return;
      }

      const fullCourse = await fetchCourseById(targetCourse.id);
      const parts = fullCourse?.parts || [];
      if (parts.length === 0) {
        alert('این دوره پارتی برای چینش ندارد.');
        return;
      }

      // 2. Compute distribution according to mode
      const startStudyDate = getEffectiveStudyDate();
      const newDays: RoutineDay[] = [];

      for (let dayOffset = 0; dayOffset < durationDays; dayOffset++) {
        const d = new Date(startStudyDate);
        d.setDate(startStudyDate.getDate() + dayOffset);
        const sInfo = getShamsiDateInfo(d, dayOffset + 1);

        newDays.push({
          day_number: dayOffset + 1,
          title: sInfo.title,
          shamsi_date: sInfo.shamsi_date,
          weekday_name: sInfo.weekday_name,
          day_str: sInfo.day_str,
          month_name: sInfo.month_name,
          is_today: sInfo.is_today,
          is_friday: sInfo.is_friday,
          is_future: sInfo.is_future,
          items: [],
        });
      }

      let partIndex = 0;

      for (let dayIdx = 0; dayIdx < newDays.length; dayIdx++) {
        const curDay = newDays[dayIdx];

        // Mode-specific distribution logic
        let partsForToday = partsPerDay;

        if (sortMode === 'friday_buffer') {
          // Leave Friday empty for buffer
          if (curDay.is_friday) {
            partsForToday = 0;
          }
        } else if (sortMode === 'leitner') {
          // Even days have reduced new parts, more review
          if (dayIdx % 2 === 1) {
            partsForToday = Math.max(1, Math.floor(partsPerDay / 2));
          }
        } else if (sortMode === 'cram') {
          // First half gets 1.5x parts, second half gets 0.5x
          if (dayIdx < Math.floor(newDays.length / 2)) {
            partsForToday = partsPerDay + 1;
          } else {
            partsForToday = Math.max(1, partsPerDay - 1);
          }
        }

        while (partsForToday > 0 && partIndex < parts.length) {
          const pt = parts[partIndex];
          curDay.items.push({
            id: `rt_${Date.now()}_${dayIdx}_${partIndex}`,
            course_id: targetCourse.id,
            course_title: targetCourse.title,
            part_id: pt.part_id,
            part_title: pt.title,
            slide_count: pt.eus?.length || 0,
            completed: false,
          });
          partIndex++;
          partsForToday--;
        }
      }

      // 3. Update Zustand store
      useRoutineStore.setState({
        days: newDays,
        currentDayNumber: 1,
      });

      // 4. Persist to localStorage
      try {
        localStorage.setItem('mediaz_routine_days_v1', JSON.stringify(newDays));
        localStorage.setItem('mediaz_routine_current_day_v1', '1');
      } catch {}

      // 5. Cloud sync with userdata.db if authenticated
      if (user?.id) {
        try {
          const syncRoutines = [];
          for (const d of newDays) {
            for (let idx = 0; idx < d.items.length; idx++) {
              const it = d.items[idx];
              syncRoutines.push({
                shamsi_date: d.shamsi_date,
                course_id: it.course_id,
                course_title: it.course_title,
                part_id: it.part_id,
                part_title: it.part_title,
                slide_count: it.slide_count,
                completed: it.completed,
                order_idx: idx,
              });
            }
          }
          await api.post('/reviews/routines', { routines: syncRoutines });
        } catch (syncErr) {
          console.warn('Background routine cloud sync:', syncErr);
        }
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-fadeIn select-none"
    >
      <div
        className="w-full max-w-lg bg-slate-950/92 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 pb-[calc(1.25rem+var(--sab,0px))] flex flex-col gap-4 text-white max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black">چینش هوشمند روتین مطالعاتی</h3>
              <p className="text-[11px] text-slate-400">توزیع علمی پارت‌ها در تقویم شمسی</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Course Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>انتخاب دوره برای چینش:</span>
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Mode Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300">الگوی توزیع روزانه:</label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(modeDescriptions) as SortMode[]).map((mode) => {
              const info = modeDescriptions[mode];
              const isSelected = sortMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500/80 shadow-md ring-1 ring-blue-400/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{info.icon}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black block text-white">{info.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-relaxed block mt-0.5">
                      {info.subtitle}
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 self-center" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Controls: Parts per day & Duration */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300">پارت در هر روز:</span>
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPartsPerDay(num)}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    partsPerDay === num
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300">طول دوره تقویمی:</span>
            <div className="flex items-center justify-between">
              {[7, 14, 21, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDurationDays(num)}
                  className={`px-2 h-8 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    durationDays === num
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {num} روز
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply CTA */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={isApplying}
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs cursor-pointer shadow-lg shadow-blue-500/25 transition-all active:scale-97 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isApplying ? 'در حال اعمال چینش...' : 'اعمال چینش در تقویم'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
