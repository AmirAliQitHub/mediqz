import React, { useState, useEffect } from 'react';
import { EU } from '../../../types';
import { useCourseStore } from '../../../store/useCourseStore';

interface Props {
 eu: EU;
}

export const CorrectIncorrect: React.FC<Props> = ({ eu }) => {
 const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
 const [showExplanation, setShowExplanation] = useState(false);
 const { recordEUResult } = useCourseStore();

 const p = eu.payload || {};

 useEffect(() => {
 setSelectedAnswer(null);
 setShowExplanation(false);
 }, [eu.id]);

 const handleAnswer = (choice: boolean) => {
 setSelectedAnswer(choice);
 setShowExplanation(true);
 const isCorrect = choice === p.is_correct;
 recordEUResult(eu.id, {
  status: isCorrect ? 'correct' : 'wrong',
  user_answer: choice ? 'صحیح' : 'غلط',
  correct_answer: p.is_correct ? 'صحیح' : 'غلط',
 });
 };

 const isUserCorrect = selectedAnswer !== null && selectedAnswer === p.is_correct;

 return (
 <div className="w-full max-w-xl mx-auto p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-liquid eu-surface text-center flex flex-col gap-6 animate-fadeIn">
  <span className="text-xs font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-full self-center border border-blue-200">
  {eu.topic_tag || 'صحیح / غلط'}
  </span>

  <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 shadow-2xs">
  <h3 className="text-lg md:text-xl font-black text-blue-950 leading-relaxed">
   «{p.statement}»
  </h3>
  </div>

  <div className="flex justify-center gap-4">
  <button
   onClick={() => handleAnswer(true)}
   className={`px-8 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer shadow-xs ${
   selectedAnswer === true
    ? p.is_correct
    ? 'bg-emerald-600 text-white shadow-emerald-200'
    : 'bg-red-600 text-white shadow-red-200'
    : 'bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-500'
   }`}
  >
   صحیح
  </button>

  <button
   onClick={() => handleAnswer(false)}
   className={`px-8 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer shadow-xs ${
   selectedAnswer === false
    ? !p.is_correct
    ? 'bg-emerald-600 text-white shadow-emerald-200'
    : 'bg-red-600 text-white shadow-red-200'
    : 'bg-white hover:bg-red-50 text-red-600 border-2 border-red-500'
   }`}
  >
   غلط
  </button>
  </div>

  {showExplanation && (
  <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-md text-right flex flex-col gap-2 animate-fadeIn">
   <div className="flex items-center gap-2">
   <span
    className={`text-xs font-black px-2.5 py-1 rounded-full ${
    isUserCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
    }`}
   >
    {isUserCorrect ? '✓ تشخیص شما درست بود.' : '✕ متاسفانه پاسخ نادرست بود.'}
   </span>
   </div>

   <p className="text-xs text-slate-700 leading-relaxed font-medium mt-1">
   <strong>تحلیل آموزشی:</strong> {p.explanation || 'توضیحی ثبت نشده است.'}
   </p>
  </div>
  )}
 </div>
 );
};
