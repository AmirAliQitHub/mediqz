import React, { useEffect, useState, useMemo } from 'react';
import { useCourseStore } from '../../store/useCourseStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { Part, EU, EUStatus, Course } from '../../types';

const fibDaysMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 8, 6: 13, 7: 21 };

export const CoursePartsView: React.FC = () => {
  const { selectedCourse, startPartPlayer, startReviewSession } = useCourseStore();
  const { userPartReviews, fetchReviews, reviewToday } = useReviewStore();
  const { setActiveTab } = useAuthStore();

  // Review Setup Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeReviewPart, setActiveReviewPart] = useState<Part | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'mistakes'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

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

  const getPartReviewRecord = (partId: string) => {
    return userPartReviews.find(
      (r) =>
        (r.course_id === selectedCourse.course_id && r.part_id === partId) ||
        r.part_id === partId ||
        r.part_id === `rev-${partId}`
    );
  };

  const handleStartStudy = (partId: string) => {
    startPartPlayer(partId);
    setActiveTab('player');
  };

  const handleOpenReviewSetup = (part: Part) => {
    setActiveReviewPart(part);
    setReviewFilter('all');
    setIsReviewModalOpen(true);
  };

  const handleLaunchReview = async () => {
    if (!activeReviewPart || !selectedCourse) return;
    setReviewLoading(true);

    try {
      // If mistakes only, filter EUs that have recent incorrect status
      let eusToReview = activeReviewPart.eus;
      if (reviewFilter === 'mistakes') {
        const res = await api.get<any>(
          `/reviews/part-details?course_id=${encodeURIComponent(selectedCourse.course_id)}&part_id=${encodeURIComponent(activeReviewPart.part_id)}`
        );
        const detailedPart = res?.part || activeReviewPart;
        const mistakes = detailedPart.eus.filter((e: any) => {
          const st = e.status;
          if (typeof st === 'object' && st !== null) {
            const vals = Object.values(st);
            return vals.length > 0 && vals[vals.length - 1] === 'incorrect';
          }
          return false;
        });

        if (mistakes.length > 0) {
          eusToReview = mistakes;
        } else {
          alert('اشتباه ثبت‌شده‌ای در این پارت وجود ندارد. همه واحدها بارگیری می‌شوند.');
        }
      }

      const reviewSessionPart: Part = {
        ...activeReviewPart,
        part_id: `rev-${activeReviewPart.part_id}`,
        title: `مرور: ${activeReviewPart.title}`,
        eus: eusToReview,
      };

      startReviewSession(reviewSessionPart, selectedCourse, {
        isReviewSession: true,
        reviewCourseId: selectedCourse.course_id,
        reviewPartId: activeReviewPart.part_id,
        allEUs: eusToReview,
        absentEuIds: [],
      });

      setIsReviewModalOpen(false);
      setActiveTab('player');
    } catch (e: any) {
      alert(e.message || 'خطا در بارگیری جلسه مرور');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <main className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-32 flex flex-col gap-6 text-right animate-fadeIn select-none">
      {/* Course Header Banner */}
      <div className="liquid-glass-card p-6 md:p-8 flex justify-between items-center flex-wrap gap-4 shadow-liquid border border-white/90">
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
            <h1 className="text-2xl md:text-3xl font-black text-blue-950">
              {selectedCourse.title}
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-200">
              {selectedCourse.topic_code}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium max-w-2xl">
            {selectedCourse.description || 'واحدهای یادگیری فعال، واژه‌نامه هوشمند و تمرین شناختی'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-blue-900 bg-white/80 border border-blue-100 px-3.5 py-2 rounded-xl shadow-2xs">
            {selectedCourse.parts.length} پارت آموزشی
          </span>
        </div>
      </div>

      {/* Parts List */}
      <div className="flex flex-col gap-4">
        {selectedCourse.parts.map((part, idx) => {
          const partReview = getPartReviewRecord(part.part_id);
          const currentStep = partReview?.review_step || 1;
          const fDays = fibDaysMap[currentStep] || 1;
          const isDue = partReview?.is_due;

          return (
            <div
              key={part.part_id}
              className="liquid-glass-card p-5 md:p-6 flex flex-col gap-4 shadow-md hover:shadow-lg transition-all border border-white/90"
            >
              {/* Top Row: Part Title, Meta & Primary Action Buttons */}
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-blue-950">
                      {part.title}
                    </h3>
                    <span className="text-xs text-slate-400 font-bold">
                      {part.eus.length} اسلاید یادگیری تعاملی
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleStartStudy(part.part_id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-black cursor-pointer shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
                  >
                    <span>شروع مطالعه</span>
                    <span>←</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReviewSetup(part)}
                    className="px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-blue-900 border border-slate-200 text-xs font-black cursor-pointer shadow-2xs transition-all"
                  >
                    مرور این پارت
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await reviewToday(selectedCourse.course_id, part.part_id);
                      alert('این پارت برای مرور امروز در صف قرار گرفت.');
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black cursor-pointer shadow-2xs transition-all"
                    title="موعد مرور را به امروز تغییر دهید"
                  >
                    مرور امروز
                  </button>
                </div>
              </div>

              {/* Bottom Row: Fibonacci Spaced Repetition Meta (Without Importance Sliders!) */}
              <div className="bg-white/60 border border-blue-100/60 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-indigo-950">گام تکرار فاصله‌دار (لایتنر):</span>
                  <span className="font-black px-2.5 py-0.5 rounded-full bg-indigo-100/80 text-indigo-900 border border-indigo-200">
                    گام {currentStep} از ۷ ({fDays} روزه)
                  </span>
                  {isDue && (
                    <span className="font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      موعد مرور فرارسیده
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  {partReview?.last_reviewed_at && (
                    <span>
                      آخرین مرور:{' '}
                      <strong className="text-slate-800">
                        {new Date(partReview.last_reviewed_at).toLocaleDateString('fa-IR')}
                      </strong>
                    </span>
                  )}
                  {partReview?.next_due_at && (
                    <span>
                      موعد مرور بعدی:{' '}
                      <strong className="text-blue-900">
                        {new Date(partReview.next_due_at).toLocaleDateString('fa-IR')}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Setup Modal */}
      {isReviewModalOpen && activeReviewPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-white p-6 shadow-2xl flex flex-col gap-4 text-right">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-blue-950">
                تنظیم جلسه مرور: {activeReviewPart.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              نوع واحدهای آموزشی که مایلید در این جلسه مرور شوند را انتخاب کنید:
            </p>

            <div className="flex flex-col gap-2">
              <label
                onClick={() => setReviewFilter('all')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  reviewFilter === 'all'
                    ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-black'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-blue-600">
                    {reviewFilter === 'all' && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </span>
                  <span className="text-xs">مرور تمامی واحدهای این پارت ({activeReviewPart.eus.length})</span>
                </div>
              </label>

              <label
                onClick={() => setReviewFilter('mistakes')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  reviewFilter === 'mistakes'
                    ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-black'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-blue-600">
                    {reviewFilter === 'mistakes' && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </span>
                  <span className="text-xs">فقط سوالات و واحدهایی که قبلاً اشتباه پاسخ داده‌ام</span>
                </div>
              </label>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black cursor-pointer transition-all"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleLaunchReview}
                disabled={reviewLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer transition-all shadow-md disabled:opacity-50"
              >
                {reviewLoading ? 'در حال بارگیری...' : 'شروع جلسه مرور'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
