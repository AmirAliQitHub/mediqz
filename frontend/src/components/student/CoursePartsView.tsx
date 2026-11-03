import React, { useState, useEffect } from 'react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoutineStore } from '../../store/useRoutineStore';
import { Part } from '../../types';
import { CalendarPlus, Check, Play, Target, Sparkles, AlertCircle } from 'lucide-react';
import { CourseMistakesModal } from './CourseMistakesModal';
import { api } from '../../services/api';
import { toPersianDigits } from '../../utils/shamsiCalendar';

export const CoursePartsView: React.FC = () => {
  const { selectedCourse, startPartPlayer, showContextSentence, setShowContextSentence } = useCourseStore();
  const { setActiveTab } = useAuthStore();
  const { addItemToDay, currentDayNumber } = useRoutineStore();
  const [addedPartId, setAddedPartId] = useState<string | null>(null);
  const [isMistakesModalOpen, setIsMistakesModalOpen] = useState<boolean>(false);
  const [backendMistakesCount, setBackendMistakesCount] = useState<number>(0);

  const localMistakes = useRoutineStore((s) => s.mistakes);

  useEffect(() => {
    if (!selectedCourse?.course_id) return;
    let active = true;

    api
      .get<{ total_count: number }>(
        `/reviews/course-mistakes?course_id=${encodeURIComponent(selectedCourse.course_id)}`
      )
      .then((data) => {
        if (active && typeof data.total_count === 'number') {
          setBackendMistakesCount(data.total_count);
        }
      })
      .catch(() => {
        // fail-silent fallback to local
      });

    return () => {
      active = false;
    };
  }, [selectedCourse?.course_id]);

  const courseLocalMistakes = localMistakes.filter(
    (m) => m.course_id === selectedCourse?.course_id || m.course_title === selectedCourse?.title
  );
  const totalMistakesCount = Math.max(backendMistakesCount, courseLocalMistakes.length);

  if (!selectedCourse) {
    return (
      <div className="p-16 text-center">
        <p className="text-slate-500 text-sm font-bold">دوره‌ای انتخاب نشده است.</p>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
        >
          بازگشت به کتابخانه دوره‌ها
        </button>
      </div>
    );
  }

  const handleStartStudy = (partId: string) => {
    startPartPlayer(partId);
    setActiveTab('player');
  };

  const handleAddToRoutine = (part: Part) => {
    addItemToDay(currentDayNumber, {
      course_id: selectedCourse.course_id,
      course_title: selectedCourse.title,
      part_id: part.part_id,
      part_title: part.title,
      slide_count: part.eus.length,
    });
    setAddedPartId(part.part_id);
    setTimeout(() => setAddedPartId(null), 1500);
  };

  const isSpellingCourse = Boolean(
    selectedCourse &&
      (selectedCourse.course_id.includes('emla') ||
        selectedCourse.topic_code?.includes('املا') ||
        selectedCourse.title?.includes('املا'))
  );

  return (
    <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-16 sm:pt-20 pb-32 flex flex-col gap-5 text-right animate-fadeIn select-none">
      {/* Course Header Banner */}
      <div className="liquid-glass-card p-5 sm:p-7 md:p-8 flex justify-between items-center flex-wrap gap-4 shadow-liquid border border-white/90">
        <div>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mb-2 cursor-pointer transition-colors"
          >
            <span>→</span>
            <span>بازگشت به کتابخانه دوره‌ها</span>
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-950">
              {selectedCourse.title}
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-200">
              {selectedCourse.topic_code}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-2xl leading-relaxed">
            {selectedCourse.description || 'واحدهای یادگیری فعال، واژه‌نامه هوشمند و تمرین شناختی'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-blue-900 bg-white/80 border border-blue-100 px-3.5 py-2 rounded-xl shadow-2xs">
            {selectedCourse.parts.length} پارت آموزشی
          </span>
        </div>
      </div>

      {/* Generic Course "Incorrects & Skipped Hub" Entry Card */}
      <div className="liquid-glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-black shadow-md border border-amber-400/40 text-lg shrink-0">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                مرور غلط‌ها و نزده‌های این دوره
              </h2>
              {totalMistakesCount > 0 ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>{toPersianDigits(totalMistakesCount)} واحد نیازمند مرور</span>
                </span>
              ) : (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <span>۱۰۰٪ مسلط بر دوره 🏆</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
              {totalMistakesCount > 0
                ? 'واحدهایی که در دوره‌های قبل غلط یا نزده رها شده‌اند را هدفمند دوره کنید تا تثبیت شوند.'
                : 'در حال حاضر هیچ سوال به خطا رفته‌ای برای این دوره ثبت نشده است.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMistakesModalOpen(true)}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-black cursor-pointer shadow-md shadow-amber-500/20 active:scale-97 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>بررسی و کارگاه رفع اشکال</span>
          <span>←</span>
        </button>
      </div>

      {/* Spelling Mode Selector (if spelling course) */}
      {isSpellingCourse && (
        <div className="liquid-glass-card p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 border border-indigo-100/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/60 to-purple-50/70 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20 text-lg shrink-0">
              🎯
            </div>
            <div>
              <div className="text-sm font-black text-indigo-950 flex items-center gap-2 flex-wrap">
                <span>انتخاب شیوه مطالعه واژگان املایی</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-900 font-bold">
                  ویژه امتحانات نهایی
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                در آزمون نهایی سوالات املا هم در قالب متن و جمله داده می‌شوند و هم به‌صورت تک‌واژه.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowContextSentence(true)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                showContextSentence
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              👁️ نمایش با جمله کمکی
            </button>
            <button
              type="button"
              onClick={() => setShowContextSentence(false)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                !showContextSentence
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/40'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              🎯 فقط واژه (مستقل)
            </button>
          </div>
        </div>
      )}

      {/* Parts List */}
      <div className="flex flex-col gap-3.5">
        {selectedCourse.parts.map((part, idx) => {
          const isAdded = addedPartId === part.part_id;

          return (
            <div
              key={part.part_id}
              className="liquid-glass-card p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-all border border-white/90"
            >
              {/* Part Title & Slide Count */}
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-blue-950">
                    {part.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-bold">
                    {part.eus.length} اسلاید یادگیری تعاملی
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleAddToRoutine(part)}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    isAdded
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white/90 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border-slate-200'
                  }`}
                  title="افزودن این پارت به روتین مطالعه روزانه"
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>افزوده شد ✓</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                      <span>+ افزودن به روتین</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleStartStudy(part.part_id)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black cursor-pointer shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>شروع مطالعه</span>
                  <span>←</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CourseMistakesModal
        isOpen={isMistakesModalOpen}
        onClose={() => setIsMistakesModalOpen(false)}
        course={selectedCourse}
      />
    </main>
  );
};
