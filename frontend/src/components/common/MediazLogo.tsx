import React from 'react';

interface MediazLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const MediazLogo: React.FC<MediazLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { imgClass: 'h-8 sm:h-9', textClass: 'text-sm' },
    md: { imgClass: 'h-9 sm:h-10', textClass: 'text-base' },
    lg: { imgClass: 'h-11 sm:h-13', textClass: 'text-lg' },
    xl: { imgClass: 'h-16 sm:h-20', textClass: 'text-2xl' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
      <img
        src="/mediaz-emblem-transparent.png"
        alt="Mediaz Emblem"
        className={`${dim.imgClass} w-auto object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105`}
        loading="eager"
      />
      {showText && (
        <div className="flex flex-col text-right leading-tight">
          <span className={`${dim.textClass} font-black text-slate-900 tracking-tight`}>
            مدیاز
          </span>
          <span className="text-[10px] text-blue-600 font-bold">
            یادگیری هوشمند
          </span>
        </div>
      )}
    </div>
  );
};
