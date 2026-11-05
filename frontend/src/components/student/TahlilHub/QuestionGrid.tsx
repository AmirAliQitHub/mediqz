import React from 'react';
import { useTahlilStore } from '../../../store/useTahlilStore';
import { ExamQuestion } from '../../../types/tahlil';
import { toPersianDigits } from '../../../utils/shamsiCalendar';

interface QuestionGridProps {
  questions: ExamQuestion[];
  onSelectQuestion: (index: number) => void;
  currentIndex: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  'زیست‌شناسی': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'ریاضی': 'text-blue-700 bg-blue-50 border-blue-200',
  'فیزیک': 'text-purple-700 bg-purple-50 border-purple-200',
  'شیمی': 'text-amber-700 bg-amber-50 border-amber-200',
};

export const QuestionGrid: React.FC<QuestionGridProps> = ({
  questions,
  onSelectQuestion,
  currentIndex,
}) => {
  const { activeExam, phase1Answers } = useTahlilStore();

  // Dynamic sections: use activeExam.sections or derive from questions
  const sections = React.useMemo(() => {
    if (activeExam?.sections && activeExam.sections.length > 0) {
      return activeExam.sections.map((sec) => ({
        title: sec.subject,
        start: sec.start_q,
        end: sec.end_q,
        color: SUBJECT_COLORS[sec.subject] || 'text-indigo-700 bg-indigo-50 border-indigo-200',
      }));
    }

    // Fallback: group contiguous subjects from questions
    const groups: { title: string; start: number; end: number; color: string }[] = [];
    questions.forEach((q) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.title === q.subject) {
        lastGroup.end = q.q_num;
      } else {
        groups.push({
          title: q.subject,
          start: q.q_num,
          end: q.q_num,
          color: SUBJECT_COLORS[q.subject] || 'text-indigo-700 bg-indigo-50 border-indigo-200',
        });
      }
    });
    return groups;
  }, [activeExam?.sections, questions]);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm" dir="rtl">
      {sections.map((sec) => {
        const secQuestions = questions.filter(
          (q) => q.q_num >= sec.start && q.q_num <= sec.end
        );

        const answeredInSec = secQuestions.filter((q) => phase1Answers[String(q.q_num)]).length;

        return (
          <div key={`${sec.title}-${sec.start}`} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black border ${sec.color}`}>
                {sec.title} (سوال {toPersianDigits(sec.start)} تا {toPersianDigits(sec.end)})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {toPersianDigits(answeredInSec)} / {toPersianDigits(secQuestions.length)}
              </span>
            </div>

            <div className="grid grid-cols-10 sm:grid-cols-10 gap-1 sm:gap-1.5">
              {secQuestions.map((q) => {
                const qNum = q.q_num;
                const index = qNum - 1;
                const status = phase1Answers[String(qNum)];
                const isActive = index === currentIndex;

                let btnStyle = 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100';
                if (status === 'correct') {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-xs shadow-emerald-500/30';
                } else if (status === 'wrong') {
                  btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-xs shadow-rose-500/30';
                } else if (status === 'blank') {
                  btnStyle = 'bg-slate-400 text-white border-slate-500';
                }

                return (
                  <button
                    key={qNum}
                    type="button"
                    onClick={() => onSelectQuestion(index)}
                    className={`h-7 sm:h-8 rounded-xl text-[10.5px] sm:text-xs font-mono font-black border transition-all duration-150 flex items-center justify-center cursor-pointer ${btnStyle} ${
                      isActive
                        ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 z-10 font-bold'
                        : 'opacity-95 hover:opacity-100'
                    }`}
                    title={`سوال ${toPersianDigits(qNum)}: ${status || 'ثبت نشده'}`}
                  >
                    {toPersianDigits(qNum)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
