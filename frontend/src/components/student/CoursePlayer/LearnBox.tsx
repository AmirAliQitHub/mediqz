import React from 'react';
import { EU } from '../../../types';

interface Props {
 eu: EU;
}

export const LearnBox: React.FC<Props> = ({ eu }) => {
  const p = eu.payload || {};

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-liquid eu-surface text-right flex flex-col gap-3 sm:gap-4 animate-fadeIn">
      <span className="text-[11px] sm:text-xs font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-full self-start border border-blue-200">
        {eu.topic_tag || 'درسنامه آموزشی'}
      </span>

      <h2 className="text-lg sm:text-2xl font-black text-blue-950 mt-0.5 leading-snug">{p.title}</h2>

      <div className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-blue-50/50 border border-blue-100/80">
        <p className="text-xs sm:text-base text-slate-800 leading-relaxed sm:leading-loose whitespace-pre-wrap font-medium">
          {p.content}
        </p>
      </div>
    </div>
  );
};
