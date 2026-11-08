import React, { useState, useMemo } from 'react';
import { useTahlilStore } from '../../../store/useTahlilStore';
import { toPersianDigits } from '../../../utils/shamsiCalendar';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BookOpen,
  Clock,
  Layers,
  Save,
  Check,
  Filter,
  BarChart3,
  Edit,
  Sparkles,
} from 'lucide-react';
import {
  ErrorReasonTag,
  OutsideStatusTag,
} from '../../../types/tahlil';

const QUESTION_TYPE_LOCALIZED: Record<string, string> = {
  'Mafhoomi': 'مفهومی',
  'Mohasebati': 'محاسباتی',
  'Tarkibi': 'ترکیبی',
  'Nokat Shekl': 'نکات شکل',
  'Hefzi': 'حفظی',
  'Nemoodari': 'نموداری',
};

const TIME_PROFILE_LOCALIZED: Record<string, string> = {
  'Fast': 'سریع (زیر ۶۰ ثانیه)',
  'Standard': 'استاندارد (۶۰ تا ۹۰ ثانیه)',
  'Long af': 'وقت‌گیر (بالای ۹۰ ثانیه)',
};

const ERROR_REASONS: { id: ErrorReasonTag; label: string; icon: string }[] = [
  { id: 'بی‌دقتی', label: 'بی‌دقتی', icon: '🎯' },
  { id: 'دام آموزشی', label: 'دام آموزشی', icon: '🪤' },
  { id: 'کمبود زمان', label: 'کمبود زمان', icon: '⏳' },
  { id: 'ضعف علمی', label: 'ضعف علمی', icon: '📚' },
  { id: 'استرس', label: 'استرس', icon: '⚡' },
];

const OUTSIDE_STATUSES: { id: OutsideStatusTag; label: string; icon: string; desc: string }[] = [
  {
    id: 'solved_correctly_no_time',
    label: 'حل صحیح بدون زمان',
    icon: '✅',
    desc: 'بدون محدودیت زمانی آزمون با موفقیت حل شد',
  },
  {
    id: 'needed_answer_sheet',
    label: 'نیاز به پاسخنامه',
    icon: '📖',
    desc: 'برای رسیدن به حل، نیاز به دیدن پاسخ تشریحی بود',
  },
  {
    id: 'unsolved',
    label: 'عدم حل',
    icon: '❌',
    desc: 'مبحث تسلط لازم را نداشت و سوال حل نشد',
  },
];

export const QuestionJournalView: React.FC = () => {
  const {
    activeExam,
    questions,
    selectedQuestionIndex,
    keypadAnswers,
    journalEntries,
    setJournalEntry,
    setSelectedQuestionIndex,
    submitJournal,
    setActiveView,
    isLoading,
  } = useTahlilStore();

  const [filterType, setFilterType] = useState<'all' | 'missed' | 'correct'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentQ = questions[selectedQuestionIndex];
  const totalCount = questions.length;

  const availableSubjects = useMemo(() => {
    return ['all', ...Array.from(new Set(questions.map((q) => q.subject)))];
  }, [questions]);

  if (!activeExam || !currentQ) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-slate-600">در حال بارگذاری سوالات ژورنال...</span>
      </div>
    );
  }

  const currentKeypad = keypadAnswers[String(currentQ.q_num)];
  const inExamStatus = currentKeypad?.status || 'blank';
  const isCorrectInExam = inExamStatus === 'correct';
  const currentJournal = journalEntries[String(currentQ.q_num)] || {};

  // Filtering questions for the selector sidebar
  const filteredQuestions = questions.filter((q) => {
    const stat = keypadAnswers[String(q.q_num)]?.status || 'blank';
    if (filterType === 'missed' && stat === 'correct') return false;
    if (filterType === 'correct' && stat !== 'correct') return false;
    if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false;
    return true;
  });

  const handleSave = async () => {
    await submitJournal();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 pb-32 animate-fadeIn" dir="rtl">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-md mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="مشاهده داشبورد آماری"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">{activeExam.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                ژورنال تفصیلی {toPersianDigits(totalCount)} سوال
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              ثبت بازخورد خارج از شرایط آزمون، تکنیک‌های حل سریع‌تر و ایرادات زیرمباحث
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveView('keypad')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>ویرایش کلید سریع</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('swot')}
            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="ویرایش تحلیل SWOT عملکرد دوهفته"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>ویرایش SWOT دوهفته</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/25"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>ذخیره شد!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره ژورنال و محاسبه آمارها</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right / Main: Active Question Detail Form (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-2xl border border-blue-100 shadow-xl shadow-blue-500/5">
            {/* Question Header & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-mono font-black text-lg shadow-md shadow-blue-500/25">
                  {toPersianDigits(currentQ.q_num)}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-slate-500">{currentQ.utid}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">{currentQ.subject}</span>
                    <span className="text-xs font-mono text-slate-500 font-bold whitespace-nowrap">
                      (کلید طراح: گزینه {toPersianDigits(currentQ.correct_opt)})
                    </span>
                  </div>
                </div>
              </div>

              {/* In-Exam Status Badge */}
              <div className="flex items-center gap-2">
                {inExamStatus === 'correct' ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>صحیح در آزمون</span>
                  </span>
                ) : inExamStatus === 'wrong' ? (
                  <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>اشتباه در آزمون</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black flex items-center gap-1.5">
                    <MinusCircle className="w-4 h-4 text-slate-500" />
                    <span>نزده / سفید در آزمون</span>
                  </span>
                )}
              </div>
            </div>

            {/* Badges Strip */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 font-mono">
                {currentQ.topic_id}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">
                {currentQ.topic_title || 'مبحث فصل ۱'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                تیپ: {QUESTION_TYPE_LOCALIZED[currentQ.question_type] || currentQ.question_type_fa || currentQ.question_type}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                زمان: {TIME_PROFILE_LOCALIZED[currentQ.time_taking_profile] || currentQ.time_profile_fa || currentQ.time_taking_profile}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200">
                سختی: {currentQ.difficulty}
              </span>
            </div>

            {/* Journaling Fields Form */}
            <div className="flex flex-col gap-6">
              {isCorrectInExam ? (
                /* ----------------- CASE 1: CORRECT QUESTION (2 Fields) ----------------- */
                <div className="flex flex-col gap-5 p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ژورنال سوالات پاسخ داده شده صحیح (بهینه‌سازی مهارت آزمون)</span>
                  </div>

                  {/* Field 1: چگونه می‌شد این سوال را سریع‌تر حل کرد؟ */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      ۱. چگونه می‌شد این سوال را سریع‌تر حل کرد؟
                    </label>
                    <textarea
                      rows={3}
                      value={currentJournal.solve_faster_note || ''}
                      onChange={(e) =>
                        setJournalEntry(currentQ.q_num, { solve_faster_note: e.target.value })
                      }
                      placeholder="تکنیک حل سریع‌تر، استفاده از گزینه‌ها یا ساده‌سازی محاسبات..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 leading-relaxed outline-hidden transition-all resize-none font-medium"
                    />
                  </div>

                  {/* Field 2: ژورنال و یادداشت شخصی */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      ۲. ژورنال و یادداشت شخصی
                    </label>
                    <textarea
                      rows={3}
                      value={currentJournal.personal_journal || ''}
                      onChange={(e) =>
                        setJournalEntry(currentQ.q_num, { personal_journal: e.target.value })
                      }
                      placeholder="یادداشت‌ها و نکات تکمیلی که باید به خاطر بسپارید..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 leading-relaxed outline-hidden transition-all resize-none font-medium"
                    />
                  </div>
                </div>
              ) : (
                /* ----------------- CASE 2: WRONG OR BLANK QUESTION (5 Fields) ----------------- */
                <div className="flex flex-col gap-6">
                  {/* Field 1: وضعیت حل خارج از شرایط آزمون (Never use 'خانه'!) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-900">
                      ۱. وضعیت حل خارج از شرایط آزمون:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {OUTSIDE_STATUSES.map((stat) => {
                        const isSelected = currentJournal.outside_status === stat.id;
                        return (
                          <button
                            key={stat.id}
                            type="button"
                            onClick={() =>
                              setJournalEntry(currentQ.q_num, { outside_status: stat.id })
                            }
                            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20'
                                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold flex items-center gap-1.5">
                                <span>{stat.icon}</span>
                                <span>{stat.label}</span>
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span
                              className={`text-[10px] leading-tight ${
                                isSelected ? 'text-blue-100' : 'text-slate-500'
                              }`}
                            >
                              {stat.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 2: علت اصلی خطا */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-900">
                      ۲. علت اصلی خطا:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ERROR_REASONS.map((r) => {
                        const isSelected = currentJournal.error_reason === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() =>
                              setJournalEntry(currentQ.q_num, { error_reason: r.id })
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25 ring-2 ring-indigo-500/20'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{r.icon}</span>
                            <span>{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 3: چگونه می‌شد این سوال را سریع‌تر حل کرد؟ */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-900">
                      ۳. چگونه می‌شد این سوال را سریع‌تر حل کرد؟
                    </label>
                    <textarea
                      rows={2}
                      value={currentJournal.solve_faster_note || ''}
                      onChange={(e) =>
                        setJournalEntry(currentQ.q_num, { solve_faster_note: e.target.value })
                      }
                      placeholder="اگر روش تستی سریع، روش مضرب‌ها یا ساده‌سازی محاسباتی وجود داشت بنویسید..."
                      className="w-full p-3 rounded-xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 leading-relaxed outline-hidden transition-all resize-none font-medium"
                    />
                  </div>

                  {/* Field 4: ایراد شما در این زیرمبحث چیست و راهکار رفع آن چیست؟ */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-900">
                      ۴. ایراد شما در این زیرمبحث چیست و راهکار رفع آن چیست؟
                    </label>
                    <textarea
                      rows={3}
                      value={currentJournal.subchapter_bug_note || ''}
                      onChange={(e) =>
                        setJournalEntry(currentQ.q_num, { subchapter_bug_note: e.target.value })
                      }
                      placeholder="ایراد دقیق علمی، فرمول فراموش‌شده، یا نکته کتاب درسی و راهکار عملی برای تثبیت آن..."
                      className="w-full p-3 rounded-xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 leading-relaxed outline-hidden transition-all resize-none font-medium"
                    />
                  </div>

                  {/* Field 5: یادداشت شخصی */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-900">
                      ۵. یادداشت شخصی
                    </label>
                    <textarea
                      rows={2}
                      value={currentJournal.personal_journal || ''}
                      onChange={(e) =>
                        setJournalEntry(currentQ.q_num, { personal_journal: e.target.value })
                      }
                      placeholder="یادداشت‌های اختصاصی خود را در این بخش یادداشت کنید..."
                      className="w-full p-3 rounded-xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 leading-relaxed outline-hidden transition-all resize-none font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Question Switcher */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                disabled={selectedQuestionIndex === 0}
                onClick={() => setSelectedQuestionIndex(selectedQuestionIndex - 1)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedQuestionIndex === 0
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>سوال قبلی</span>
              </button>

              <span className="text-xs font-mono font-bold text-slate-400">
                {toPersianDigits(selectedQuestionIndex + 1)} / {toPersianDigits(totalCount)}
              </span>

              <button
                type="button"
                disabled={selectedQuestionIndex === totalCount - 1}
                onClick={() => setSelectedQuestionIndex(selectedQuestionIndex + 1)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedQuestionIndex === totalCount - 1
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <span>سوال بعدی</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Left Sidebar: Questions List with Status & Filter (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Filter Pills */}
          <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>فیلتر سوالات</span>
              </span>
              <span className="font-mono text-slate-500 font-bold">{toPersianDigits(filteredQuestions.length)} سوال</span>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                همه ({toPersianDigits(totalCount)})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('missed')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterType === 'missed' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                غلط و سفید
              </button>
              <button
                type="button"
                onClick={() => setFilterType('correct')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterType === 'correct' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                صحیح
              </button>
            </div>

            {/* Subject Filter */}
            <div className="flex flex-wrap gap-1">
              {availableSubjects.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSubjectFilter(subj)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                    subjectFilter === subj
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {subj === 'all' ? 'همه دروس' : subj}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Scrollable List */}
          <div className="max-h-[560px] overflow-y-auto space-y-1.5 p-2 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-100 shadow-sm scrollbar-thin">
            {filteredQuestions.map((q) => {
              const qNum = q.q_num;
              const idx = qNum - 1;
              const isSelected = idx === selectedQuestionIndex;
              const stat = keypadAnswers[String(qNum)]?.status || 'blank';
              const jEntry = journalEntries[String(qNum)];
              const hasNotes =
                Boolean(jEntry?.solve_faster_note) ||
                Boolean(jEntry?.personal_journal) ||
                Boolean(jEntry?.subchapter_bug_note);

              return (
                <button
                  key={qNum}
                  type="button"
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`w-full p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white/80 hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                        stat === 'correct'
                          ? 'bg-emerald-100 text-emerald-800'
                          : stat === 'wrong'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {toPersianDigits(qNum)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-900">{q.subject}</span>
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                        {q.topic_id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasNotes && (
                      <span
                        className="w-2 h-2 rounded-full bg-blue-600"
                        title="دارای یادداشت ژورنال"
                      />
                    )}
                    {stat === 'correct' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : stat === 'wrong' ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <MinusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
