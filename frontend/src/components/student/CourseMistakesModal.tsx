import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Target,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Filter,
} from 'lucide-react';
import { Course, EU, Part } from '../../types';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoutineStore } from '../../store/useRoutineStore';
import { api } from '../../services/api';
import { toPersianDigits, getEffectiveStudyDate } from '../../utils/shamsiCalendar';

interface CourseMistakesModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

type TimeFilter = 'all' | 'today' | '3days';
type StatusFilter = 'all' | 'incorrect' | 'null';

interface UnifiedMistakeItem {
  id: string;
  course_id: string;
  part_id: string;
  part_title?: string;
  eu_id: string;
  status: 'incorrect' | 'null';
  question: string;
  correct_answer: string;
  user_answer?: string;
  shamsi_date?: string;
  created_at?: string;
  timestamp: number;
  raw_eu?: EU;
}

const toFa = (num: number | string): string => toPersianDigits(num);

export const CourseMistakesModal: React.FC<CourseMistakesModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [backendMistakes, setBackendMistakes] = useState<UnifiedMistakeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const localMistakes = useRoutineStore((s) => s.mistakes);

  // Fetch backend mistakes whenever modal opens for this course
  useEffect(() => {
    if (!isOpen || !course?.course_id) return;

    let active = true;
    setIsLoading(true);

    api
      .get<{ mistakes: any[]; total_count: number }>(
        `/reviews/course-mistakes?course_id=${encodeURIComponent(course.course_id)}`
      )
      .then((data) => {
        if (!active) return;
        const mapped: UnifiedMistakeItem[] = (data.mistakes || []).map((m: any, idx: number) => {
          // Look up part title and real EU if possible
          const part = course.parts?.find((p) => p.part_id === m.part_id);
          const realEu = part?.eus?.find((e) => e.id === m.eu_id);

          const qText =
            realEu?.payload?.word ||
            realEu?.payload?.sentence ||
            realEu?.payload?.statement ||
            realEu?.payload?.prompt ||
            'پرسش تعاملی';

          const aText =
            realEu?.payload?.full_meaning ||
            realEu?.payload?.meaning ||
            (Array.isArray(realEu?.payload?.keywords) ? realEu.payload.keywords[0] : '') ||
            '';

          return {
            id: `be_${m.part_id}_${m.eu_id}_${idx}`,
            course_id: m.course_id,
            part_id: m.part_id,
            part_title: part?.title || `پارت ${m.part_id}`,
            eu_id: m.eu_id,
            status: m.status === 'null' ? 'null' : 'incorrect',
            question: qText,
            correct_answer: aText,
            user_answer: m.user_answer,
            shamsi_date: m.shamsi_date,
            created_at: m.created_at,
            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
            raw_eu: realEu,
          };
        });
        setBackendMistakes(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load backend course mistakes, falling back to local:', err);
        setBackendMistakes([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, course?.course_id]);

  // Combine local and backend mistakes without duplication
  const allMistakes = useMemo(() => {
    const combinedMap = new Map<string, UnifiedMistakeItem>();

    // 1. Add backend mistakes
    backendMistakes.forEach((item) => {
      const key = `${item.part_id}::${item.eu_id}`;
      combinedMap.set(key, item);
    });

    // 2. Add local mistakes for this course
    const courseLocals = localMistakes.filter(
      (m) => m.course_id === course.course_id || m.course_title === course.title
    );

    courseLocals.forEach((m) => {
      const key = `${m.part_id}::${m.unit_id}`;
      const part = course.parts?.find((p) => p.part_id === m.part_id);
      const realEu = m.raw_eu || part?.eus?.find((e) => e.id === m.unit_id);
      const itemTimestamp =
        typeof m.timestamp === 'string'
          ? new Date(m.timestamp).getTime()
          : typeof m.timestamp === 'number'
          ? m.timestamp
          : Date.now();

      combinedMap.set(key, {
        id: m.id,
        course_id: m.course_id,
        part_id: m.part_id,
        part_title: m.part_title || part?.title || `پارت ${m.part_id}`,
        eu_id: m.unit_id,
        status: m.user_answer === 'مشاهده پاسخ' ? 'null' : 'incorrect',
        question: m.question,
        correct_answer: m.correct_answer,
        user_answer: m.user_answer,
        shamsi_date: (m as any).shamsi_date || m.date_str,
        timestamp: Number.isNaN(itemTimestamp) ? Date.now() : itemTimestamp,
        raw_eu: realEu,
      });
    });

    return Array.from(combinedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [backendMistakes, localMistakes, course]);

  // Filter items by time and status
  const filteredMistakes = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return allMistakes.filter((item) => {
      // 1. Time Filter
      if (timeFilter === 'today') {
        const diff = now - item.timestamp;
        if (diff > oneDayMs) return false;
      } else if (timeFilter === '3days') {
        const diff = now - item.timestamp;
        if (diff > 3 * oneDayMs) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'incorrect' && item.status !== 'incorrect') return false;
      if (statusFilter === 'null' && item.status !== 'null') return false;

      return true;
    });
  }, [allMistakes, timeFilter, statusFilter]);

  // Counts for breakdown telemetry
  const incorrectCount = useMemo(
    () => filteredMistakes.filter((m) => m.status === 'incorrect').length,
    [filteredMistakes]
  );
  const nullCount = useMemo(
    () => filteredMistakes.filter((m) => m.status === 'null').length,
    [filteredMistakes]
  );

  if (!isOpen) return null;

  const handleStartReview = () => {
    if (filteredMistakes.length === 0) return;

    // Build dynamic review part and course
    const dynamicEUs: EU[] = filteredMistakes.map((m, idx) => {
      if (m.raw_eu) {
        return {
          ...m.raw_eu,
          id: `mistake_rev_${idx}_${m.eu_id}`,
          topic_tag: `رفع اشکال: ${m.part_title || ''}`,
        };
      }

      return {
        id: `mistake_rev_${idx}_${m.eu_id}`,
        type: 'fill_in_the_blank',
        topic_tag: `رفع اشکال: ${course.title}`,
        payload: {
          word: m.question,
          sentence: m.question,
          full_meaning: m.correct_answer,
          prompt: 'شکل یا معنی صحیح این واژه را بنویسید (مرور اشتباه):',
          keywords: [m.correct_answer],
        },
      };
    });

    const dynamicPart: Part = {
      part_id: `course_mistakes_${course.course_id}_${Date.now()}`,
      title: `رفع اشکال (${timeFilter === 'today' ? 'امروز' : 'جامع'})`,
      eus: dynamicEUs,
    };

    const dynamicCourse: Course = {
      course_id: `review_${course.course_id}`,
      title: `کارگاه رفع اشکال • ${course.title}`,
      description: `شامل ${toFa(dynamicEUs.length)} واحد به خطا رفته برای تثبیت ۱۰۰٪`,
      topic_code: course.topic_code || 'REV',
      parts: [dynamicPart],
    };

    // Telegram Haptic Pulse
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      try {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      } catch {}
    }

    const courseStore = useCourseStore.getState();
    courseStore.setSelectedCourse(dynamicCourse);
    courseStore.startPartPlayer(dynamicPart.part_id);
    useAuthStore.getState().setActiveTab('player');
    onClose();
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
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black flex items-center gap-1.5">
                <span>مرور غلط‌ها و نزده‌ها</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  هدفمند
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[220px] sm:max-w-xs">
                {course.title}
              </p>
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

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* Time Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                timeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              کل دوره
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('3days')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                timeFilter === '3days'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {toFa(3)} روز اخیر
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                timeFilter === 'today'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              امروز
            </button>
          </div>

          {/* Status Sub-filter Chips */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                statusFilter === 'all'
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              همه ({toFa(filteredMistakes.length)})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('incorrect')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                statusFilter === 'incorrect'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-rose-300'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>پاسخ‌های نادرست ({toFa(incorrectCount)})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('null')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                statusFilter === 'null'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-amber-300'
              }`}
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span>نزده / مشاهده پاسخ ({toFa(nullCount)})</span>
            </button>
          </div>
        </div>

        {/* Telemetry Stats Bar */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-center gap-2 shrink-0">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">کل مباحث نیازمند مرور</span>
            <span className="text-xs sm:text-sm font-black text-amber-400 mt-0.5">
              {isLoading ? 'در حال بررسی...' : `${toFa(filteredMistakes.length)} اسلاید`}
            </span>
          </div>
          <div className="w-[1px] h-7 bg-white/10" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">اشتباه مفهومی</span>
            <span className="text-xs sm:text-sm font-black text-rose-400 mt-0.5">
              {isLoading ? '...' : `${toFa(incorrectCount)} مورد`}
            </span>
          </div>
          <div className="w-[1px] h-7 bg-white/10" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">نزده / مشاهده پاسخ</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 mt-0.5">
              {isLoading ? '...' : `${toFa(nullCount)} مورد`}
            </span>
          </div>
        </div>

        {/* Main Content: List or Zero-State */}
        <div className="flex-1 min-h-[160px] max-h-[340px] overflow-y-auto overscroll-contain flex flex-col gap-2.5 pr-0.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
              <RotateCcw className="w-5 h-5 animate-spin text-amber-400" />
              <span className="text-xs font-bold">در حال بازیابی کارنامه یادگیری...</span>
            </div>
          ) : filteredMistakes.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center gap-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/30">
                🏆
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-300">مسلط بر تمام مباحث 🏆</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1 max-w-xs">
                  در این بازه زمانی هیچ واحد یادگیریِ نادرست یا نزده‌ای در این دوره ثبت نشده است. عالی پیش رفتی!
                </p>
              </div>
            </div>
          ) : (
            filteredMistakes.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-start justify-between gap-3 text-right"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {item.part_title}
                    </span>
                    {item.status === 'incorrect' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>پاسخ نادرست</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <HelpCircle className="w-2.5 h-2.5" />
                        <span>مشاهده پاسخ</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-200 truncate mt-0.5">
                    {item.question}
                  </p>

                  {item.correct_answer && (
                    <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                      <span className="text-slate-400 font-normal">پاسخ صحیح:</span>
                      <strong className="font-bold">{item.correct_answer}</strong>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {toFa(idx + 1)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 shrink-0">
          <button
            type="button"
            onClick={handleStartReview}
            disabled={filteredMistakes.length === 0 || isLoading}
            className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {filteredMistakes.length > 0
                ? `شروع کارگاه رفع اشکال (${toFa(filteredMistakes.length)} اسلاید) ✦`
                : 'بدون اسلاید نیازمند مرور'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
