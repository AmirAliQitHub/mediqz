import React, { useEffect } from 'react';
import { useTahlilStore, EvaluationMode } from '../../../store/useTahlilStore';
import { toPersianDigits } from '../../../utils/shamsiCalendar';
import {
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  Edit,
  Edit3,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  SlidersHorizontal,
  Zap,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';

export const AnalyticsDashboardView: React.FC = () => {
  const {
    activeExam,
    metrics,
    swotData,
    activeMode,
    setActiveMode,
    loadMetrics,
    setActiveView,
    resetActiveExam,
    isLoading,
  } = useTahlilStore();

  useEffect(() => {
    if (activeExam) {
      loadMetrics(activeExam.id);
    }
  }, [activeExam, loadMetrics]);

  if (!activeExam) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <span className="text-xs font-bold text-slate-600">آزمونی انتخاب نشده است.</span>
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-slate-600">در حال محاسبه و تجمیع آمارهای آزمون...</span>
      </div>
    );
  }

  const currentDataset = activeMode === 'in_exam' ? metrics.in_exam : metrics.outside_exam;
  const inExamScore = metrics.in_exam.score_pct;
  const outsideScore = metrics.outside_exam.score_pct;
  const scoreDelta = Math.max(0, outsideScore - inExamScore);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 pb-32 animate-fadeIn" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-md mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="بازگشت به کاتالوگ"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900">{metrics.exam_title}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10.5px] font-mono font-black">
                {metrics.exam_id}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
              <span>{metrics.provider}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{metrics.held_date}</span>
              </span>
              <span>•</span>
              <span>{metrics.total_questions} سوال</span>
            </div>
          </div>
        </div>

        {/* Sub-nav Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveView('keypad')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>پاسخ‌برگ سریع</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('journal')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ژورنال تفصیلی سوالات</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('آیا از ریست کامل تحلیل این آزمون اطمینان دارید؟')) {
                resetActiveExam();
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="ریست تحلیل"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Toggle (شرایط آزمون vs خارج از شرایط آزمون) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl shadow-blue-950/20 mb-8 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-blue-200">فیلتر حالت محاسبه آمارها:</span>
            <span className="text-sm font-black">
              {activeMode === 'in_exam'
                ? 'نمایش عملکرد واقعی درون جلسه آزمون'
                : 'نمایش عملکرد پس از حل خارج از شرایط آزمون'}
            </span>
          </div>
        </div>

        {/* The Toggle Pills */}
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/15 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveMode('in_exam')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'in_exam'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/40 ring-1 ring-white/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="whitespace-nowrap">⏱️ شرایط آزمون</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/30 font-mono text-[11px] whitespace-nowrap">
              {toPersianDigits(inExamScore)}٪
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('outside_exam')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'outside_exam'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/40 ring-1 ring-white/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="whitespace-nowrap">خارج از آزمون</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/30 font-mono text-[11px] whitespace-nowrap">
              {toPersianDigits(outsideScore)}٪
            </span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
        {/* Big Overall Percentage Card - 5 cols */}
        <div className="md:col-span-5 p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-2xl border border-blue-100 shadow-xl shadow-blue-500/5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-slate-600">
              {activeMode === 'in_exam' ? 'درصد کل (شرایط آزمون)' : 'درصد کل (خارج از شرایط آزمون)'}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
              فرمول نمره منفی ۱/۳
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900">
              {toPersianDigits(currentDataset.score_pct)}
            </span>
            <span className="text-2xl font-black text-slate-500 font-mono">٪</span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono mb-4">
            (۳ × {toPersianDigits(currentDataset.correct_count)} - {toPersianDigits(currentDataset.wrong_count)}) ÷ (۳ ×{' '}
            {toPersianDigits(currentDataset.total_questions)})
          </div>

          {activeMode === 'outside_exam' && scoreDelta > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                رشد +{toPersianDigits(scoreDelta.toFixed(1))}٪ با رفع خطاهای زمان و بی‌دقتی خارج از شرایط آزمون
              </span>
            </div>
          )}
        </div>

        {/* 3 Metric Counters Cards - 7 cols */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Correct Counter */}
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-emerald-100 shadow-md flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600">پاسخ‌های صحیح</span>
            <div className="flex items-baseline gap-1.5 my-3">
              <span className="text-3xl font-black font-mono text-emerald-600">
                {toPersianDigits(currentDataset.correct_count)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {toPersianDigits(currentDataset.total_questions)}</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              {toPersianDigits(((currentDataset.correct_count / currentDataset.total_questions) * 100).toFixed(1))}٪ کل
            </span>
          </div>

          {/* Wrong Counter */}
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-rose-100 shadow-md flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600">پاسخ‌های اشتباه</span>
            <div className="flex items-baseline gap-1.5 my-3">
              <span className="text-3xl font-black font-mono text-rose-600">
                {toPersianDigits(currentDataset.wrong_count)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {toPersianDigits(currentDataset.total_questions)}</span>
            </div>
            <span className="text-xs font-bold text-rose-700 font-mono">
              {toPersianDigits(((currentDataset.wrong_count / currentDataset.total_questions) * 100).toFixed(1))}٪ کل
            </span>
          </div>

          {/* Blank Counter */}
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-md flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600">نزده / سفید</span>
            <div className="flex items-baseline gap-1.5 my-3">
              <span className="text-3xl font-black font-mono text-slate-700">
                {toPersianDigits(currentDataset.blank_count)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {toPersianDigits(currentDataset.total_questions)}</span>
            </div>
            <span className="text-xs font-bold text-slate-600 font-mono">
              {toPersianDigits(((currentDataset.blank_count / currentDataset.total_questions) * 100).toFixed(1))}٪ کل
            </span>
          </div>
        </div>
      </div>

      {/* Subject Breakdown (تفکیک دروس) */}
      <div className="flex flex-col gap-4 mb-8">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 px-1">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>تفکیک عملکرد در ۴ درس تخصصی</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentDataset.subjects.map((s) => (
            <div
              key={s.subject}
              className="p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-50 shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black text-slate-900">{s.subject}</span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-mono font-black">
                  {toPersianDigits(s.total)} سوال
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-black font-mono text-blue-950">{toPersianDigits(s.score_pct)}</span>
                <span className="text-sm font-mono text-slate-500 font-bold">٪</span>
              </div>

              {/* Mini Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, s.score_pct))}%` }}
                />
              </div>

              {/* Counters */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono font-bold pt-2 border-t border-slate-100">
                <span className="text-emerald-700">صحیح: {toPersianDigits(s.correct)}</span>
                <span className="text-rose-700">غلط: {toPersianDigits(s.wrong)}</span>
                <span className="text-slate-500">سفید: {toPersianDigits(s.blank)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row: Difficulties & Time Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Difficulties */}
        <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-100 shadow-md flex flex-col gap-4">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>تفکیک بر مبنای سطح دشواری سوالات</span>
          </h3>

          <div className="flex flex-col gap-3">
            {currentDataset.difficulties.map((d) => (
              <div key={d.difficulty} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        d.difficulty === 'آسان'
                          ? 'bg-emerald-500'
                          : d.difficulty === 'متوسط'
                          ? 'bg-blue-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span>سطح {d.difficulty}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({toPersianDigits(d.total)} سوال)</span>
                  </span>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className="text-slate-500 text-[11px]">
                      {toPersianDigits(d.correct)} صحیح از {toPersianDigits(d.total)}
                    </span>
                    <span className="text-slate-900 font-black">{toPersianDigits(d.score_pct)}٪</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.difficulty === 'آسان'
                        ? 'bg-emerald-500'
                        : d.difficulty === 'متوسط'
                        ? 'bg-blue-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, d.score_pct))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Profiles */}
        <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-100 shadow-md flex flex-col gap-4">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>تفکیک بر مبنای پروفایل زمانی سوالات</span>
          </h3>

          <div className="flex flex-col gap-3">
            {currentDataset.time_profiles.map((tp) => (
              <div key={tp.profile} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                      {tp.profile_fa}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({toPersianDigits(tp.total)} سوال)</span>
                  </span>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className="text-slate-500 text-[11px]">
                      {toPersianDigits(tp.correct)} صحیح از {toPersianDigits(tp.total)}
                    </span>
                    <span className="text-slate-900 font-black">{toPersianDigits(tp.score_pct)}٪</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, tp.score_pct))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question Types Breakdown (تیپ تست‌ها) */}
      <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-100 shadow-md flex flex-col gap-4 mb-8">
        <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>تفکیک تیپ‌های طراحی سوال (مفهومی، محاسباتی، ترکیبی، نکات شکل، حفظی)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {currentDataset.question_types.map((qt) => (
            <div
              key={qt.type}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">{qt.type_fa}</span>
                <span className="text-[10px] font-mono text-slate-400">{toPersianDigits(qt.total)} سوال</span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-black font-mono text-purple-900">{toPersianDigits(qt.score_pct)}</span>
                <span className="text-xs font-mono text-slate-400">٪</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {toPersianDigits(qt.correct)} صحیح / {toPersianDigits(qt.wrong)} غلط
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Reasons Distribution */}
      <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-100 shadow-md flex flex-col gap-4 mb-8">
        <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-600" />
          <span>توزیع علل اصلی خطاهای ثبت‌شده در ژورنال</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {metrics.error_reasons.map((er) => (
            <div
              key={er.reason}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center text-center"
            >
              <span className="text-2xl font-mono font-black text-rose-600 mb-1">{toPersianDigits(er.count)}</span>
              <span className="text-xs font-bold text-slate-700">{er.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Biweekly SWOT Study Reflection Summary Card (Stage 4 Pedagogical Surfacing) */}
      <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-sm text-slate-800 flex flex-col gap-5 mb-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                سوات و بازتاب راهبردهای مطالعاتی دوهفته
              </h3>
              <p className="text-[11px] text-slate-500">
                جمع‌بندی نقاط قوت، ضعف، ایده‌های پیشرفت و چالش‌های آینده ثبت‌شده پیش از ژورنال
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('swot')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>ویرایش SWOT</span>
          </button>
        </div>

        {swotData && (swotData.strengths.length > 0 || swotData.weaknesses.length > 0 || swotData.opportunities.length > 0 || swotData.threats.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>نقاط قوت عملکرد مطالعاتی</span>
              </div>
              <ul className="space-y-1.5 pr-2">
                {swotData.strengths.filter((s) => s.trim()).length > 0 ? (
                  swotData.strengths.filter((s) => s.trim()).map((s, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">موردی ثبت نشده است</span>
                )}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>نقاط ضعف عملکرد مطالعاتی</span>
              </div>
              <ul className="space-y-1.5 pr-2">
                {swotData.weaknesses.filter((w) => w.trim()).length > 0 ? (
                  swotData.weaknesses.filter((w) => w.trim()).map((w, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">موردی ثبت نشده است</span>
                )}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>ایده‌ها و راهبردهای پیشرفت</span>
              </div>
              <ul className="space-y-1.5 pr-2">
                {swotData.opportunities.filter((o) => o.trim()).length > 0 ? (
                  swotData.opportunities.filter((o) => o.trim()).map((o, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{o}</span>
                    </li>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">موردی ثبت نشده است</span>
                )}
              </ul>
            </div>

            {/* Threats */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>تهدیدات و پیش‌بینی چالش‌های آینده</span>
              </div>
              <ul className="space-y-1.5 pr-2">
                {swotData.threats.filter((t) => t.trim()).length > 0 ? (
                  swotData.threats.filter((t) => t.trim()).map((t, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">موردی ثبت نشده است</span>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500">
              تحلیل SWOT برای این آزمون رد شده یا هنوز پاسخی ثبت نشده است.
            </p>
            <button
              type="button"
              onClick={() => setActiveView('swot')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <span>تکمیل بازتاب SWOT اکنون</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Detailed Topic Taxonomy Breakdown (سرفصل‌های رسمی topics.txt) */}
      <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-100 shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>مرتب‌سازی سوالات بر مبنای سرفصل‌های دیتابیس (TopicID Taxonomy)</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500 font-bold">
            {toPersianDigits(currentDataset.topics.length)} زیرمبحث
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500">
                <th className="py-2.5 px-3">کد مبحث</th>
                <th className="py-2.5 px-3">عنوان مبحث</th>
                <th className="py-2.5 px-3">درس</th>
                <th className="py-2.5 px-3 text-center">تعداد سوال</th>
                <th className="py-2.5 px-3 text-center">صحیح</th>
                <th className="py-2.5 px-3 text-center">درصد تراز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {currentDataset.topics.map((t) => (
                <tr key={t.topic_id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700 text-[11px]">
                    {t.topic_id}
                  </td>
                  <td className="py-2.5 px-3 font-bold">{t.topic_title}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-bold">
                      {t.subject}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{toPersianDigits(t.total)}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                    {toPersianDigits(t.correct)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-mono font-black ${
                        t.score_pct >= 50 ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {toPersianDigits(t.score_pct)}٪
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
