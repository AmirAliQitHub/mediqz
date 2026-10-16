import React, { useEffect, useMemo, useState } from 'react';
import { useReviewStore } from '../../store/useReviewStore';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { PartReviewRecord, Course, Part } from '../../types';

const fibDaysMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 8, 6: 13, 7: 21 };

export const ReviewHub: React.FC = () => {
  const { userPartReviews, fetchReviews, isLoading } = useReviewStore();
  const { selectCourse, startReviewSession, startAutomaticReviewSession } = useCourseStore();
  const { setActiveTab } = useAuthStore();

  const [activeTabFilter, setActiveTabFilter] = useState<'due' | 'all' | 'mastered'>('due');

  useEffect(() => {
    fetchReviews();
  }, []);

  const dueReviews = useMemo(() => {
    return userPartReviews.filter((r) => r.is_due);
  }, [userPartReviews]);

  const masteredReviews = useMemo(() => {
    return userPartReviews.filter((r) => r.review_step >= 7);
  }, [userPartReviews]);

  const displayList = useMemo(() => {
    if (activeTabFilter === 'due') return dueReviews;
    if (activeTabFilter === 'mastered') return masteredReviews;
    return userPartReviews;
  }, [activeTabFilter, dueReviews, masteredReviews, userPartReviews]);

  const handleLaunchSingleReview = async (review: PartReviewRecord) => {
    try {
      const details = await api.get<any>(
        `/reviews/part-details?course_id=${encodeURIComponent(review.course_id)}&part_id=${encodeURIComponent(review.part_id)}`
      );

      const course: Course = details.course;
      const part: Part = details.part;

      startReviewSession(part, course, {
        isReviewSession: true,
        reviewCourseId: review.course_id,
        reviewPartId: review.part_id,
        allEUs: part.eus,
        absentEuIds: [],
      });

      setActiveTab('player');
    } catch (e: any) {
      alert(e.message || 'خطا در بارگیری پارت مرور');
    }
  };

  const handleLaunchAllDue = () => {
    if (dueReviews.length === 0) {
      alert('پارتی در صف مرور امروز قرار ندارد.');
      return;
    }

    startAutomaticReviewSession(
      dueReviews.map((r) => ({
        course_id: r.course_id,
        part_id: r.part_id,
        title: r.title,
        next_due_at: r.next_due_at,
      }))
    );

    // Launch first item
    void handleLaunchSingleReview(dueReviews[0]);
  };

  return (
    <main className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-32 flex flex-col gap-6 text-right animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="liquid-glass-card p-6 md:p-8 flex justify-between items-center flex-wrap gap-4 shadow-liquid border border-white/90">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black mb-2 border border-blue-200">
            <span>✦</span> مرکز مرور و تسلط • آلکالیت اینتراکتیو
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-blue-950">
            مرکز مرور پیوسته و تثبیت آموخته‌ها
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium max-w-xl">
            مرور هوشمند بر اساس منحنی ابینگهاوس و فواصل لایتنر شبه‌فیبوناچی (۱، ۲، ۳، ۵، ۸، ۱۳ و ۲۱ روزه)
          </p>
        </div>

        {dueReviews.length > 0 && (
          <button
            type="button"
            onClick={handleLaunchAllDue}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black shadow-md shadow-blue-500/25 cursor-pointer transition-all flex items-center gap-2"
          >
            <span>شروع مرور صف امروز ({dueReviews.length})</span>
            <span>←</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-card p-5 flex items-center justify-between border border-white/90 shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500">نیازمند مرور امروز</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{dueReviews.length} پارت</h3>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-xl font-black">
            ⏱
          </span>
        </div>

        <div className="liquid-glass-card p-5 flex items-center justify-between border border-white/90 shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500">کل پارت‌ها در چرخه مرور</span>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{userPartReviews.length} پارت</h3>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-xl font-black">
            📚
          </span>
        </div>

        <div className="liquid-glass-card p-5 flex items-center justify-between border border-white/90 shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500">پارت‌های به تسلط رسیده (گام ۷)</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{masteredReviews.length} پارت</h3>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xl font-black">
            ✓
          </span>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-blue-100/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTabFilter('due')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTabFilter === 'due'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white/80 text-slate-600 hover:text-blue-900'
          }`}
        >
          نیازمند مرور امروز ({dueReviews.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTabFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTabFilter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white/80 text-slate-600 hover:text-blue-900'
          }`}
        >
          همه پارت‌ها ({userPartReviews.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTabFilter('mastered')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTabFilter === 'mastered'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white/80 text-slate-600 hover:text-blue-900'
          }`}
        >
          تسلط‌یافته ({masteredReviews.length})
        </button>
      </div>

      {/* Review Items List */}
      {displayList.length === 0 ? (
        <div className="liquid-glass-card p-12 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-xl">
            ✦
          </span>
          <h3 className="text-base font-black text-blue-950">
            {activeTabFilter === 'due'
              ? 'امروز هیچ پارتی در صف مرور وجود ندارد. عالی پیش رفته‌اید!'
              : 'هیچ پارتی در این لیست یافت نشد.'}
          </h3>
          <p className="text-xs text-slate-500">
            با تکمیل پارت‌های جدید از کتابخانه، آن‌ها به چرخه مرور فاصله‌دار اضافه می‌شوند.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayList.map((review) => {
            const fDays = fibDaysMap[review.review_step] || 1;
            return (
              <div
                key={review.id}
                className="liquid-glass-card p-4 md:p-5 flex items-center justify-between flex-wrap gap-4 border border-white/90 hover:border-blue-300 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">
                    {review.review_step}
                  </span>
                  <div>
                    <h4 className="text-sm md:text-base font-black text-blue-950">{review.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-bold">
                      <span>دوره: {review.course_title || review.course_id}</span>
                      <span>•</span>
                      <span>گام {review.review_step} از ۷ ({fDays} روزه)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {review.next_due_at && (
                    <span className="text-xs text-slate-500 font-medium">
                      موعد:{' '}
                      <strong className={review.is_due ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {new Date(review.next_due_at).toLocaleDateString('fa-IR')}
                      </strong>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLaunchSingleReview(review)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer shadow-sm transition-all"
                  >
                    مرور این پارت ←
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};
