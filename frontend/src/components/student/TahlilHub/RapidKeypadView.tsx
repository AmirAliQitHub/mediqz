import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTahlilStore } from '../../../store/useTahlilStore';
import { QuestionGrid } from './QuestionGrid';
import { toPersianDigits } from '../../../utils/shamsiCalendar';
import {
  ArrowRight,
  ArrowLeft,
  FastForward,
  Keyboard,
  Sparkles,
  BookOpen,
  Clock,
  Layers,
  Award,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

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

export const RapidKeypadView: React.FC = () => {
  const {
    activeExam,
    questions,
    selectedQuestionIndex,
    keypadAnswers,
    setKeypadAnswer,
    setSelectedQuestionIndex,
    markRemainingBlank,
    submitKeypad,
    setActiveView,
    isLoading,
  } = useTahlilStore();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentQ = questions[selectedQuestionIndex];
  const totalCount = questions.length;
  const answeredCount = Object.keys(keypadAnswers).length;
  const currentAnswer = currentQ ? keypadAnswers[String(currentQ.q_num)] : undefined;

  // Dynamic subject completion stats
  const subjectStats = useMemo(() => {
    if (!activeExam?.sections) return [];
    return activeExam.sections.map((sec) => {
      const secQs = questions.filter((q) => q.q_num >= sec.start_q && q.q_num <= sec.end_q);
      const answeredInSec = secQs.filter((q) => keypadAnswers[String(q.q_num)]).length;
      return {
        subject: sec.subject,
        start_q: sec.start_q,
        end_q: sec.end_q,
        total: secQs.length,
        answered: answeredInSec,
      };
    });
  }, [activeExam?.sections, questions, keypadAnswers]);

  const handleInitiateSubmit = () => {
    if (answeredCount < totalCount) {
      setShowConfirmModal(true);
    } else {
      submitKeypad();
    }
  };

  const handleConfirmSubmitWithBlanks = () => {
    markRemainingBlank();
    submitKeypad();
    setShowConfirmModal(false);
  };

  // Keyboard shortcut handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (!currentQ) return;
      const key = e.key;

      if (key === '1' || key === '۱') {
        e.preventDefault();
        setKeypadAnswer(currentQ.q_num, 1);
      } else if (key === '2' || key === '۲') {
        e.preventDefault();
        setKeypadAnswer(currentQ.q_num, 2);
      } else if (key === '3' || key === '۳') {
        e.preventDefault();
        setKeypadAnswer(currentQ.q_num, 3);
      } else if (key === '4' || key === '۴') {
        e.preventDefault();
        setKeypadAnswer(currentQ.q_num, 4);
      } else if (key === '0' || key === '۰' || key === ' ' || key.toLowerCase() === 's') {
        e.preventDefault();
        setKeypadAnswer(currentQ.q_num, 0); // blank
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (selectedQuestionIndex < totalCount - 1) {
          setSelectedQuestionIndex(selectedQuestionIndex + 1);
        }
      } else if (key === 'ArrowRight' || key === 'Backspace') {
        e.preventDefault();
        if (selectedQuestionIndex > 0) {
          setSelectedQuestionIndex(selectedQuestionIndex - 1);
        }
      }
    },
    [currentQ, selectedQuestionIndex, totalCount, setKeypadAnswer, setSelectedQuestionIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!activeExam || !currentQ) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-slate-600">در حال بارگذاری آزمون...</span>
      </div>
    );
  }

  const isCompleted = answeredCount === totalCount;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 pb-32 animate-fadeIn" dir="rtl">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-md mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="بازگشت به کاتالوگ آزمون‌ها"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">{activeExam.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                کلید سریع
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              ثبت گزینه‌های پاسخ‌برگ • {toPersianDigits(answeredCount)} از {toPersianDigits(totalCount)} سوال تکمیل شده
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={markRemainingBlank}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="ثبت گزینه سفید برای بقیه سوالات پاسخ نداده"
          >
            <FastForward className="w-3.5 h-3.5 text-slate-500" />
            <span>علامت‌گذاری باقی‌مانده به عنوان سفید</span>
          </button>

          <button
            type="button"
            onClick={handleInitiateSubmit}
            disabled={isLoading || answeredCount === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
              answeredCount > 0
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isLoading ? (
              <span>در حال ثبت...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت و ورود به ژورنال تفصیلی</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sticky Subject Navigation Bar with Live Progress Counters */}
      {subjectStats.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none sticky top-2 z-20">
          {subjectStats.map((sec) => {
            const isCurrentSec = currentQ.subject === sec.subject;
            const isSecDone = sec.answered === sec.total;
            return (
              <button
                key={sec.subject}
                type="button"
                onClick={() => setSelectedQuestionIndex(sec.start_q - 1)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border shadow-xs ${
                  isCurrentSec
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                    : 'bg-white/90 backdrop-blur-md hover:bg-slate-50 text-slate-700 border-slate-200/80'
                }`}
              >
                <span>{sec.subject}</span>
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-lg ${
                    isCurrentSec
                      ? 'bg-white/20 text-white'
                      : isSecDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {toPersianDigits(sec.answered)}/{toPersianDigits(sec.total)}
                  {isSecDone ? ' ✅' : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Work Area: Keypad + Question Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Keypad Focus Card) - 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-2xl border border-blue-100 shadow-xl shadow-blue-500/5 relative overflow-hidden">
            {/* Top Question Indicators */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-mono font-black text-lg shadow-md shadow-blue-500/25">
                  {toPersianDigits(currentQ.q_num)}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-slate-500">{currentQ.utid}</span>
                  <span className="text-base font-black text-slate-900">{currentQ.subject}</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                  {QUESTION_TYPE_LOCALIZED[currentQ.question_type] || currentQ.question_type_fa || currentQ.question_type}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100">
                  {TIME_PROFILE_LOCALIZED[currentQ.time_taking_profile] || currentQ.time_profile_fa || currentQ.time_taking_profile}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                    currentQ.difficulty === 'آسان'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : currentQ.difficulty === 'دشوار'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}
                >
                  {currentQ.difficulty}
                </span>
              </div>
            </div>

            {/* Topic Information */}
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-mono font-black text-blue-800">{currentQ.topic_id}</span>
                <span className="text-xs font-bold text-slate-800">{currentQ.topic_title || 'مبحث فصل ۱'}</span>
              </div>
            </div>

            {/* The Rapid Keypad Options Grid */}
            <div className="flex flex-col gap-3">
              <div className="text-center text-xs font-bold text-slate-500 mb-1">
                گزینه انتخابی خود در جلسه آزمون را انتخاب کنید:
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((optNum) => {
                  const isSelected = currentAnswer?.option === optNum;
                  return (
                    <button
                      key={optNum}
                      type="button"
                      onClick={() => setKeypadAnswer(currentQ.q_num, optNum)}
                      className={`h-16 sm:h-20 rounded-2xl border-2 text-lg sm:text-xl font-mono font-black transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/20'
                          : 'bg-white hover:bg-blue-50/70 text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <span>گزینه {toPersianDigits(optNum)}</span>
                      {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Blank Option Button */}
              <button
                type="button"
                onClick={() => setKeypadAnswer(currentQ.q_num, 0)}
                className={`w-full h-14 rounded-2xl border-2 text-sm sm:text-base font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-95 mt-1 ${
                  currentAnswer?.option === 0
                    ? 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                <span>سفید / بدون پاسخ</span>
                {currentAnswer?.option === 0 && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            </div>

            {/* Navigation Arrows */}
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

              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Keyboard className="w-3.5 h-3.5" />
                <span>کلیدهای ۱ تا ۴ یا فاصله برای سفید</span>
              </div>

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

        {/* Right Column: Question Overview Grid - 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black text-slate-700">پاسخ‌برگ جامع {toPersianDigits(totalCount)} سوال</span>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                صحیح
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                غلط
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                سفید
              </span>
            </div>
          </div>

          <QuestionGrid
            questions={questions}
            onSelectQuestion={(idx) => setSelectedQuestionIndex(idx)}
            currentIndex={selectedQuestionIndex}
          />
        </div>
      </div>

      {/* Premature Submission Guard Confirmation Modal (Mandate #11) */}
      {showConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 text-right relative">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-black text-slate-900">آیا از ثبت نهایی اطمینان دارید؟</h3>
                  <span className="text-xs text-slate-500 font-medium">بررسی سوالات بی‌پاسخ</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                شما به <strong className="text-blue-700 font-bold">{toPersianDigits(answeredCount)}</strong> سوال از{' '}
                <strong className="text-slate-900 font-bold">{toPersianDigits(totalCount)}</strong> سوال پاسخ داده‌اید (
                <strong className="text-amber-700 font-bold">{toPersianDigits(totalCount - answeredCount)}</strong> سوال بی‌پاسخ مانده است). با تایید ثبت، سوالات باقی‌مانده سفید تلقی شده و وارد ژورنال تفصیلی خواهید شد.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSubmitWithBlanks}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  تأیید ثبت با سوالات بی‌پاسخ
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  ادامه پاسخ‌گویی
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
