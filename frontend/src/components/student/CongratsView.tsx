import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { EU } from '../../types';
import { soundEffects } from '../../services/soundEffects';

export const CongratsView: React.FC = () => {
  const {
    activePart,
    selectedCourse,
    euResults,
    startPartPlayer,
    startReviewSession,
    autoReviewActive,
    autoReviewQueue,
    autoReviewIndex,
    advanceAutomaticReview,
    clearAutomaticReview,
  } = useCourseStore();
  const { setActiveTab } = useAuthStore();

  const [isSaved, setIsSaved] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'wrong' | 'correct'>('all');

  const nextReviewItem =
    autoReviewActive && autoReviewIndex + 1 < autoReviewQueue.length
      ? autoReviewQueue[autoReviewIndex + 1]
      : null;

  const euList = Object.values(euResults).filter((e) => e.eu_id !== 'rev-summary-intro');
  const interactiveEUs = euList.filter((e) => e.is_interactive);
  const correctCount = interactiveEUs.filter((e) => e.status === 'correct').length;
  const wrongCount = interactiveEUs.filter((e) => e.status === 'wrong').length;
  const totalInteractive = interactiveEUs.length;
  const scorePercentage = totalInteractive > 0 ? Math.round((correctCount / totalInteractive) * 100) : 100;

  // Trigger celebration confetti and triumphant fanfare
  useEffect(() => {
    try {
      soundEffects.playFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#38bdf8', '#60a5fa', '#10b981', '#fbbf24']
      });
    } catch {
      // ignore
    }
  }, []);

  // Save completion history to backend
  useEffect(() => {
    const saveCompletion = async () => {
      if (!activePart || !selectedCourse || isSaved) return;
      try {
        await api.post('/courses/complete', {
          course_id: selectedCourse.course_id,
          part_id: activePart.part_id,
          title: `${selectedCourse.title} - ${activePart.title}`,
          topic_code: selectedCourse.topic_code,
          total_slides: activePart.eus.length,
          correct_count: correctCount,
          wrong_count: wrongCount,
          score_percentage: scorePercentage,
          details_payload: JSON.stringify(euList),
        });
        setIsSaved(true);
      } catch (e) {
        console.error('Failed to save completion:', e);
      }
    };

    saveCompletion();
  }, [activePart, selectedCourse]);

  const filteredEUs = euList.filter((e) => {
    if (activeFilter === 'wrong') return e.status === 'wrong';
    if (activeFilter === 'correct') return e.status === 'correct';
    return true;
  });

  const handleRetryMistakes = () => {
    if (!activePart || !selectedCourse) return;
    const wrongEUs = activePart.eus.filter((eu) => euResults[eu.id]?.status === 'wrong');
    if (wrongEUs.length === 0) {
      alert('شما در این پارت اشتباهی نداشته‌اید!');
      return;
    }
    const reviewPart = {
      ...activePart,
      part_id: `retry-${activePart.part_id}`,
      title: `مرور اشتباهات: ${activePart.title}`,
      eus: wrongEUs,
    };
    startReviewSession(reviewPart, selectedCourse, {
      isReviewSession: true,
      reviewCourseId: selectedCourse.course_id,
      reviewPartId: activePart.part_id,
      allEUs: wrongEUs,
      absentEuIds: [],
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 text-right animate-fadeIn select-none">
      {/* Top Victory Hero Banner */}
      <div className="liquid-glass-card p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden shadow-liquid border border-white/90">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-blue-500/25 mb-4">
          ✦
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-blue-950 mb-2">
          آفرین! پارت آموزشی با موفقیت تکمیل شد
        </h1>
        <p className="text-xs md:text-sm text-slate-600 font-medium max-w-md">
          {selectedCourse?.title} • {activePart?.title}
        </p>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-xl mt-6">
          <div className="p-4 rounded-2xl bg-white/70 border border-blue-100 shadow-2xs flex flex-col items-center">
            <span className="text-2xl font-black text-blue-600">{scorePercentage}٪</span>
            <span className="text-[11px] font-bold text-slate-500 mt-1">درصد پاسخگویی</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-2xs flex flex-col items-center">
            <span className="text-2xl font-black text-emerald-600">{correctCount}</span>
            <span className="text-[11px] font-bold text-emerald-800 mt-1">پاسخ درست</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 shadow-2xs flex flex-col items-center">
            <span className="text-2xl font-black text-rose-600">{wrongCount}</span>
            <span className="text-[11px] font-bold text-rose-800 mt-1">پاسخ نادرست</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 shadow-2xs flex flex-col items-center">
            <span className="text-2xl font-black text-indigo-600">{activePart?.eus.length || 0}</span>
            <span className="text-[11px] font-bold text-indigo-800 mt-1">کل واحدهای پارت</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setActiveTab('course-parts')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black cursor-pointer shadow-md shadow-blue-500/25 transition-all"
          >
            ادامه سرفصل‌ها
          </button>

          {wrongCount > 0 && (
            <button
              onClick={handleRetryMistakes}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black cursor-pointer shadow-md shadow-amber-500/25 transition-all"
            >
              مرور سریع اشتباهات ({wrongCount})
            </button>
          )}

          <button
            onClick={() => setActiveTab('reviews')}
            className="px-5 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200 text-xs font-black cursor-pointer shadow-2xs transition-all"
          >
            رفتن به مرکز مرور
          </button>
        </div>
      </div>

      {/* Answer Recap & History Section */}
      <div className="liquid-glass-card p-6 shadow-liquid border border-white/90">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-black text-blue-950">
            کارنامه تفصیلی واحدهای یادگیری این پارت
          </h2>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'all' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              همه ({euList.length})
            </button>
            <button
              onClick={() => setActiveFilter('correct')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'correct' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              درست ({correctCount})
            </button>
            <button
              onClick={() => setActiveFilter('wrong')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'wrong' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              نادرست ({wrongCount})
            </button>
          </div>
        </div>

        {/* EUs List */}
        <div className="flex flex-col gap-2.5">
          {filteredEUs.map((eu, idx) => (
            <div
              key={eu.eu_id}
              className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs md:text-sm font-black text-blue-950">{eu.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold">{eu.topic_tag}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {eu.user_answer && (
                  <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    پاسخ شما: {eu.user_answer}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-black ${
                    eu.status === 'correct'
                      ? 'bg-emerald-100 text-emerald-800'
                      : eu.status === 'wrong'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {eu.status === 'correct'
                    ? '✓ درست'
                    : eu.status === 'wrong'
                    ? '✕ نادرست'
                    : 'مطالعه شد'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
