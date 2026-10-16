import React from 'react';

interface AlqualiteLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const AlqualiteLogo: React.FC<AlqualiteLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  className = '',
}) => {
  const pixelMap = {
    sm: { box: 28, icon: 14, textClass: 'text-sm', badgeClass: 'text-[9px]' },
    md: { box: 34, icon: 18, textClass: 'text-lg', badgeClass: 'text-[10px]' },
    lg: { box: 44, icon: 24, textClass: 'text-xl', badgeClass: 'text-xs' },
    xl: { box: 64, icon: 34, textClass: 'text-3xl', badgeClass: 'text-sm' },
  };

  const dim = pixelMap[size] || pixelMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none flex-shrink-0 ${className}`}>
      {/* Liquid Gemstone Capsule */}
      <div
        style={{
          width: dim.box,
          height: dim.box,
          minWidth: dim.box,
          minHeight: dim.box,
          maxWidth: dim.box,
          maxHeight: dim.box,
        }}
        className="relative rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-900 p-[1px] shadow-md shadow-sky-500/25 border border-white/50 flex-shrink-0 flex items-center justify-center transition-transform duration-200 group hover:scale-105 overflow-hidden"
      >
        <div className="w-full h-full rounded-[11px] bg-gradient-to-br from-sky-500/90 via-blue-700/95 to-indigo-950 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 bg-white/40 blur-[1px] rounded-full pointer-events-none" />
          <svg
            style={{ width: dim.icon, height: dim.icon }}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:rotate-6 flex-shrink-0"
          >
            <path
              d="M12 2L18.5 7L12 11L5.5 7L12 2Z"
              fill="#E0F2FE"
              fillOpacity="0.95"
              stroke="white"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 7L12 11V22L4 14.5L5.5 7Z"
              fill="#38BDF8"
              fillOpacity="0.8"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 7L12 11V22L20 14.5L18.5 7Z"
              fill="#0284C7"
              fillOpacity="0.9"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="11" r="1.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`${dim.textClass} font-black tracking-tight bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 bg-clip-text text-transparent font-sans`}
            >
              Alqualite
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[10px] tracking-tight shadow-xs">
              CourseBox
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[10px] font-bold text-slate-500 tracking-wider font-sans mt-0.5">
              آلکالیت اینتراکتیو
            </span>
          )}
        </div>
      )}
    </div>
  );
};
