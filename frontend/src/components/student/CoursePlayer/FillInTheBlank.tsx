import React, { useState, useEffect } from 'react';
import { EU } from '../../../types';
import { useCourseStore } from '../../../store/useCourseStore';

interface Props {
 eu: EU;
}

function normalizeText(txt: string): string {
 if (!txt) return '';
 return txt
 .toString()
 .trim()
 .toLowerCase()
 .replace(/[أإآ]/g, 'ا')
 .replace(/ة/g, 'ه')
 .replace(/[يى]/g, 'ی')
 .replace(/ك/g, 'ک')
 .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic tashkeel/harakat
 .replace(/\u200c/g, ' ') // ZWNJ to space
 .replace(/[\(\)\[\]،,؛;:\-—\.]/g, ' ')
 .replace(/\s+/g, ' ');
}

export const FillInTheBlank: React.FC<Props> = ({ eu }) => {
 const [userInput, setUserInput] = useState('');
 const [showDrawer, setShowDrawer] = useState(false);
 const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
 const [matchedKeyword, setMatchedKeyword] = useState<string | null>(null);
 const { recordEUResult, nextSlide } = useCourseStore();

 const p = eu.payload || {};

 useEffect(() => {
 setUserInput('');
 setShowDrawer(false);
 setIsCorrect(null);
 setMatchedKeyword(null);
 }, [eu.id]);

 const handleEvaluate = () => {
 const trimmed = userInput.trim();
 if (!trimmed) {
  alert('لطفاً ابتدا معنی یا کلیدواژه‌ای را وارد کنید.');
  return;
 }

 const normalizedUser = normalizeText(trimmed);
 const rawKeywords = p.keywords || [];
 const normalizedKeywords = rawKeywords.map((k: string) => normalizeText(k));

 if (normalizedUser.length < 2) {
  setIsCorrect(false);
  setMatchedKeyword(null);
  setShowDrawer(true);
  recordEUResult(eu.id, {
   status: 'wrong',
   user_answer: userInput,
   correct_answer: p.full_meaning,
  });
  return;
 }

 let matched: string | null = null;
 for (let i = 0; i < normalizedKeywords.length; i++) {
  const kw = normalizedKeywords[i];
  if (!kw) continue;
  if (normalizedUser === kw) {
   matched = rawKeywords[i] || kw;
   break;
  }
  if (kw.length >= 2 && normalizedUser.includes(kw)) {
   matched = rawKeywords[i] || kw;
   break;
  }
  if (normalizedUser.length >= 3 && kw.length >= 3 && kw.includes(normalizedUser)) {
   if (normalizedUser.length / kw.length >= 0.7) {
    matched = rawKeywords[i] || kw;
    break;
   }
  }
 }

 const correct = matched !== null;
 setIsCorrect(correct);
 setMatchedKeyword(matched);
 setShowDrawer(true);

 recordEUResult(eu.id, {
  status: correct ? 'correct' : 'wrong',
  user_answer: userInput,
  correct_answer: p.full_meaning,
 });
 };

 const handleRevealAnswer = () => {
 setShowDrawer(true);
 setIsCorrect(false);
 recordEUResult(eu.id, {
  status: 'wrong',
  user_answer: 'مشاهده پاسخ',
  correct_answer: p.full_meaning,
 });
 };

 return (
 <div className="w-full max-w-xl mx-auto p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-liquid eu-surface text-center flex flex-col gap-6 animate-fadeIn">
  <span className="text-xs font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-full self-center border border-blue-200">
  {eu.topic_tag || 'لغت‌نامه هوشمند'}
  </span>

  {/* Word Box */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border border-blue-200/80 shadow-2xs">
  <small className="block text-xs text-slate-400 font-bold mb-1">واژه مورد نظر:</small>
  <h2 className="text-4xl font-black text-blue-950">{p.word}</h2>
  {p.sentence && (
   <p className="text-sm text-slate-600 italic mt-3 leading-relaxed">
   «{p.sentence}»
   </p>
  )}
  </div>

  {/* Input Section */}
  <div className="flex flex-col gap-2 text-right">
  <label className="text-xs font-black text-blue-900">
   {p.prompt || 'معنی یا کلیدواژه‌های اصلی این واژه را بنویسید:'}
  </label>
  <div className="flex gap-2">
   <input
   type="text"
   value={userInput}
   onChange={(e) => setUserInput(e.target.value)}
   onKeyDown={(e) => {
    if (e.key === 'Enter') {
    if (showDrawer) {
     nextSlide();
    } else {
     handleEvaluate();
    }
    }
   }}
   placeholder="معنی یا کلیدواژه را اینجا بنویسید..."
   autoFocus
   className="flex-1 px-4 py-3 rounded-xl border border-blue-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
   />
   <button
   onClick={handleEvaluate}
   className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-950 text-white text-xs font-black cursor-pointer shadow-xs transition-all hover:scale-102"
   >
   بررسی ✓
   </button>
  </div>
  </div>

  <div className="flex justify-center">
  <button
   onClick={handleRevealAnswer}
   className="text-xs font-bold text-slate-500 hover:text-blue-900 underline cursor-pointer"
  >
   نمایش معنی کامل کتاب درسی ✦ 
  </button>
  </div>

  {/* Feedback Drawer */}
  {showDrawer && (
  <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-md text-right flex flex-col gap-3 animate-fadeIn">
   {isCorrect !== null && (
   <div
    className={`p-3 rounded-xl text-xs font-black flex items-center justify-between ${
    isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}
   >
    <span>{isCorrect ? ` آفرین! پاسخ شما درست است.` : `نیاز به دقت بیشتر!`}</span>
    {matchedKeyword && (
    <span className="text-[11px] font-normal">کلیدواژه منطبق: «{matchedKeyword}»</span>
    )}
   </div>
   )}

   <div>
   <strong className="block text-xs font-black text-blue-950 mb-1">معنی کامل کتاب درسی:</strong>
   <p className="text-sm text-slate-800 leading-relaxed font-medium">{p.full_meaning}</p>
   </div>

   {p.keywords && p.keywords.length > 0 && (
   <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
    <span className="text-[11px] text-slate-400 font-bold">کلیدواژه‌های معتبر:</span>
    {p.keywords.map((k: string, idx: number) => (
    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
     {k}
    </span>
    ))}
   </div>
   )}
  </div>
  )}
 </div>
 );
};
