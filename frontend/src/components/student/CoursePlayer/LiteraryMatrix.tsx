import React, { useState, useEffect } from 'react';
import { EU } from '../../../types';
import { useCourseStore } from '../../../store/useCourseStore';

interface Props {
  eu: EU;
}

export const LiteraryMatrix: React.FC<Props> = ({ eu }) => {
  const p = eu.payload || {};
  const { recordEUResult, nextSlide } = useCourseStore();

  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<'نظم' | 'نثر' | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isAllCorrect, setIsAllCorrect] = useState<boolean | null>(null);

  // Reset when slide changes
  useEffect(() => {
    setSelectedAuthor(null);
    setSelectedGenre(null);
    setSelectedStyle(null);
    setIsEvaluated(false);
    setIsAllCorrect(null);
  }, [eu.id]);

  const authorOptions: string[] = p.author_options || [p.author];
  const styleOptions: string[] = p.style_options || [p.poetic_form || p.prose_type];
  const targetAuthor = p.author;
  const targetGenre = p.genre; // 'نظم' | 'نثر'
  const targetStyle = targetGenre === 'نظم' ? p.poetic_form : p.prose_type;

  const handleEvaluate = () => {
    if (!selectedAuthor || !selectedGenre || !selectedStyle) {
      alert('لطفاً پیش از ارزیابی، پدیدآورنده، ساختار (نظم یا نثر) و قالب/سبک را انتخاب نمایید.');
      return;
    }

    const authorCorrect = selectedAuthor.trim() === targetAuthor.trim() || selectedAuthor.includes(targetAuthor) || targetAuthor.includes(selectedAuthor);
    const genreCorrect = selectedGenre === targetGenre;
    const styleCorrect = selectedStyle.trim() === targetStyle?.trim() || (targetStyle && selectedStyle.includes(targetStyle)) || (targetStyle && targetStyle.includes(selectedStyle));

    const correct = authorCorrect && genreCorrect && Boolean(styleCorrect);
    setIsAllCorrect(correct);
    setIsEvaluated(true);

    recordEUResult(eu.id, {
      status: correct ? 'correct' : 'wrong',
      user_answer: `${selectedAuthor} | ${selectedGenre} | ${selectedStyle}`,
      correct_answer: `${targetAuthor} | ${targetGenre} | ${targetStyle}`,
    });
  };

  const handleReveal = () => {
    setSelectedAuthor(targetAuthor);
    setSelectedGenre(targetGenre);
    setSelectedStyle(targetStyle);
    setIsAllCorrect(false);
    setIsEvaluated(true);

    recordEUResult(eu.id, {
      status: 'wrong',
      user_answer: 'مشاهده مستقیم پاسخ',
      correct_answer: `${targetAuthor} | ${targetGenre} | ${targetStyle}`,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3.5 text-right select-none animate-fadeIn pb-36">
      {/* Top Main Work Card */}
      <div className="liquid-glass-card p-5 md:p-6 relative overflow-hidden shadow-liquid border border-white/90">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-black text-blue-900 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
              ماتریس اعلام و تاریخ ادبیات
            </span>
          </div>
          {p.century && (
            <span className="text-xs font-bold text-slate-500 bg-white/70 px-3 py-1 rounded-full border border-slate-200/60">
              دوره: {p.century}
            </span>
          )}
        </div>

        {/* Work Title */}
        <h2 className="text-xl md:text-2xl font-black text-blue-950 mb-2 tracking-tight">
          «{p.work_title}»
        </h2>

        {/* Excerpt or Verse Quote */}
        {p.excerpt && (
          <div className="p-3 md:p-3.5 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50/60 border border-blue-200/50 my-1.5">
            <p className="text-[11px] text-slate-400 font-bold mb-0.5">بیت یا متن شاخص کتاب درسی:</p>
            <p className="text-xs md:text-sm font-bold text-blue-950 leading-relaxed font-serif">
              «{p.excerpt}»
            </p>
          </div>
        )}

        <p className="text-[11px] font-medium text-slate-500 mt-1">
          نام پدیدآورنده، ساختار ادبی (نظم یا نثر) و نوع قالب یا سبک نگارش این اثر را تعیین کنید:
        </p>
      </div>

      {/* 3 Interactive Matrix Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Dimension 1: Author */}
        <div className="liquid-glass-card p-4 flex flex-col justify-between gap-2.5 shadow-sm border border-white/80">
          <div className="flex items-center justify-between border-b border-blue-900/10 pb-1.5">
            <span className="text-xs font-black text-blue-950">۱. پدیدآورنده / شاعر</span>
            <span className="text-[10px] text-slate-400 font-bold">نویسنده یا سراینده</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {authorOptions.map((authorName) => {
              const isSelected = selectedAuthor === authorName;
              const isTarget = isEvaluated && (authorName === targetAuthor || authorName.includes(targetAuthor) || targetAuthor.includes(authorName));
              const isWrong = isEvaluated && isSelected && !isTarget;

              let btnClass = 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/70';
              if (isSelected && !isEvaluated) {
                btnClass = 'bg-blue-600 text-white font-black border-blue-600 shadow-md shadow-blue-500/25';
              } else if (isEvaluated) {
                if (isTarget) {
                  btnClass = 'bg-emerald-600 text-white font-black border-emerald-600 shadow-md shadow-emerald-500/25';
                } else if (isWrong) {
                  btnClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold line-through';
                } else {
                  btnClass = 'bg-slate-50/50 text-slate-400 border-slate-200/40 opacity-60';
                }
              }

              return (
                <button
                  key={authorName}
                  type="button"
                  disabled={isEvaluated}
                  onClick={() => setSelectedAuthor(authorName)}
                  className={`w-full py-2 px-2.5 rounded-lg text-xs font-bold transition-all duration-200 text-right border cursor-pointer active:scale-98 ${btnClass}`}
                >
                  {authorName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimension 2: Genre (نظم یا نثر) */}
        <div className="liquid-glass-card p-4 flex flex-col justify-between gap-2.5 shadow-sm border border-white/80">
          <div className="flex items-center justify-between border-b border-blue-900/10 pb-1.5">
            <span className="text-xs font-black text-blue-950">۲. ساختار اثر</span>
            <span className="text-[10px] text-slate-400 font-bold">نظم یا نثر</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {(['نظم', 'نثر'] as const).map((g) => {
              const isSelected = selectedGenre === g;
              const isTarget = isEvaluated && targetGenre === g;
              const isWrong = isEvaluated && isSelected && !isTarget;

              let btnClass = 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/70';
              if (isSelected && !isEvaluated) {
                btnClass = 'bg-blue-600 text-white font-black border-blue-600 shadow-md shadow-blue-500/25';
              } else if (isEvaluated) {
                if (isTarget) {
                  btnClass = 'bg-emerald-600 text-white font-black border-emerald-600 shadow-md shadow-emerald-500/25';
                } else if (isWrong) {
                  btnClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold line-through';
                } else {
                  btnClass = 'bg-slate-50/50 text-slate-400 border-slate-200/40 opacity-60';
                }
              }

              return (
                <button
                  key={g}
                  type="button"
                  disabled={isEvaluated}
                  onClick={() => setSelectedGenre(g)}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 text-center border cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${btnClass}`}
                >
                  <span>{g === 'نظم' ? '📜 نظم (شعر)' : '📖 نثر (نوشته)'}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-slate-400 font-medium text-center">
            {selectedGenre ? `انتخاب شده: ${selectedGenre}` : 'نوع نوشته را مشخص کنید'}
          </div>
        </div>

        {/* Dimension 3: Form / Style */}
        <div className="liquid-glass-card p-4 flex flex-col justify-between gap-2.5 shadow-sm border border-white/80">
          <div className="flex items-center justify-between border-b border-blue-900/10 pb-1.5">
            <span className="text-xs font-black text-blue-950">۳. قالب یا نوع سبک</span>
            <span className="text-[10px] text-slate-400 font-bold">قالب نظم / سبک نثر</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {styleOptions.map((styleName) => {
              const isSelected = selectedStyle === styleName;
              const isTarget = isEvaluated && (styleName === targetStyle || styleName.includes(targetStyle || '') || (targetStyle && targetStyle.includes(styleName)));
              const isWrong = isEvaluated && isSelected && !isTarget;

              let btnClass = 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/70';
              if (isSelected && !isEvaluated) {
                btnClass = 'bg-blue-600 text-white font-black border-blue-600 shadow-md shadow-blue-500/25';
              } else if (isEvaluated) {
                if (isTarget) {
                  btnClass = 'bg-emerald-600 text-white font-black border-emerald-600 shadow-md shadow-emerald-500/25';
                } else if (isWrong) {
                  btnClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold line-through';
                } else {
                  btnClass = 'bg-slate-50/50 text-slate-400 border-slate-200/40 opacity-60';
                }
              }

              return (
                <button
                  key={styleName}
                  type="button"
                  disabled={isEvaluated}
                  onClick={() => setSelectedStyle(styleName)}
                  className={`w-full py-2 px-2.5 rounded-lg text-xs font-bold transition-all duration-200 text-right border cursor-pointer active:scale-98 ${btnClass}`}
                >
                  {styleName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Evaluation Feedback and Literary Insight Drawer */}
      {isEvaluated && (
        <div
          className={`p-5 rounded-2xl border transition-all duration-300 animate-slideUp ${
            isAllCorrect
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-md shadow-emerald-500/10'
              : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-md shadow-amber-500/10'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black flex items-center gap-2">
              <span>{isAllCorrect ? '✓' : '⚠️'}</span>
              <span>{isAllCorrect ? 'پاسخ کاملاً صحیح و هوشمندانه!' : 'تحلیل تطبیقی پاسخ و نکات کتاب درسی:'}</span>
            </span>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full ${
                isAllCorrect ? 'bg-emerald-200/70 text-emerald-900' : 'bg-amber-200/70 text-amber-900'
              }`}
            >
              {isAllCorrect ? '۱۰۰٪ تسلط' : 'نیازمند مرور'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-bold my-2 bg-white/70 p-3.5 rounded-xl border border-black/5">
            <div>
              <span className="text-slate-400 block mb-0.5">پدیدآورنده:</span>
              <span className="text-blue-950 font-black">{targetAuthor}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">ساختار اثر:</span>
              <span className="text-blue-950 font-black">{targetGenre === 'نظم' ? 'نظم (شعر)' : 'نثر (نوشته)'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">قالب / سبک نگارش:</span>
              <span className="text-blue-950 font-black">{targetStyle}</span>
            </div>
          </div>

          {p.theme && (
            <div className="mt-3 text-xs leading-relaxed text-slate-700 bg-white/60 p-3 rounded-xl border border-black/5">
              <span className="font-black text-blue-950 ml-1">مضمون و جایگاه ادبی:</span>
              {p.theme}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={nextSlide}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>ادامه به اثر بعد</span>
              <span>←</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isEvaluated && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReveal}
            className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer transition-all active:scale-95"
          >
            مشاهده مستقیم پاسخ و تحلیل
          </button>

          <button
            type="button"
            onClick={handleEvaluate}
            className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <span>بررسی و ارزیابی ماتریس</span>
            <span>✓</span>
          </button>
        </div>
      )}
    </div>
  );
};
