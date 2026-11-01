import React, { useEffect } from 'react';
import { useTahlilStore } from '../../../store/useTahlilStore';
import { Sparkles, Calendar, BookOpen, CheckCircle, ArrowLeft, BarChart3, Edit3 } from 'lucide-react';

export const ExamCatalogView: React.FC = () => {
  const { exams, loadExamsCatalog, selectExam, isLoading } = useTahlilStore();

  useEffect(() => {
    loadExamsCatalog();
  }, [loadExamsCatalog]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fadeIn" dir="rtl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-blue-500/5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                سامانه ژورنال و تحلیل آزمون • TahlilHub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black border border-blue-200">
                پایش داده‌محور
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              ژورنال‌نویسی سوال‌به‌سوال، تفکیک شرایط آزمون از خارج آزمون و مرتب‌سازی آماری دقیق بر مبنای سرفصل‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>آزمون‌های ثبت‌شده جهت تحلیل</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium font-mono">
            {exams.length} آزمون موجود
          </span>
        </div>

        {isLoading && exams.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-slate-600">در حال دریافت کاتالوگ آزمون‌ها...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const statusObj = exam.analysis_status || { status: 'not_started' };
              const isCompleted = statusObj.status === 'completed';
              const isInProgress = statusObj.status === 'journaling' || statusObj.status === 'phase1' || statusObj.status === 'phase2';

              return (
                <div
                  key={exam.id}
                  className="flex flex-col justify-between p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100/90 shadow-md hover:shadow-xl hover:border-blue-300/80 transition-all duration-300 group"
                >
                  <div className="flex flex-col gap-4">
                    {/* Top Row: Provider & Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-xs">
                          {exam.provider}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                          پایه {exam.grade} {exam.major}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.held_date}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        کد آزمون: {exam.id} • {exam.total_questions} سوال در ۴ درس
                      </p>
                    </div>

                    {/* Sections Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {exam.sections.map((sec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-blue-50/80 text-blue-900 text-[11px] font-bold border border-blue-100"
                        >
                          {sec.subject}: {sec.total_questions} سوال
                        </span>
                      ))}
                    </div>

                    {/* Progress Badge if analyzed */}
                    {isCompleted && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black">تحلیل و ژورنال تکمیل شده</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono font-black">
                          <span>آزمون: {statusObj.exam_score_pct}%</span>
                          <span className="text-emerald-700 font-bold">◄ خارج از آزمون: {statusObj.potential_score_pct}%</span>
                        </div>
                      </div>
                    )}

                    {isInProgress && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-amber-600" />
                          <span>در حال تکمیل ژورنال و پاسخ‌برگ</span>
                        </div>
                        <span className="font-mono">{statusObj.exam_score_pct}%</span>
                      </div>
                    )}
                  </div>

                  {/* Action CTA */}
                  <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => selectExam(exam.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer group-hover:scale-[1.01]"
                    >
                      {isCompleted ? (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          <span>مشاهده آمار و ژورنال آزمون</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4" />
                          <span>ورود به پاسخ‌برگ و ژورنال</span>
                        </>
                      )}
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
