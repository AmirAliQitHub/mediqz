import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

export const UserProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, logout } = useAuthStore();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!user) return null;

  return (
    <div
      dir="rtl"
      className="relative z-50 select-none"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-xs backdrop-blur-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-white text-blue-950 border-blue-400 shadow-md ring-2 ring-blue-500/20'
            : 'bg-white/80 hover:bg-white text-blue-950 border-blue-900/15'
        }`}
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
          {user.display_name.charAt(0) || 'U'}
        </div>
        <span className="text-xs font-black text-blue-950 truncate max-w-[120px]">
          {user.display_name}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-blue-600 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          dir="rtl"
          className="absolute top-full left-0 mt-2 w-56 liquid-glass-card rounded-2xl shadow-2xl p-2 flex flex-col gap-1 text-right animate-fadeIn z-50 border border-blue-900/15 backdrop-blur-2xl bg-white/95"
        >
          <div className="p-2.5 border-b border-blue-100/80 flex items-center gap-2.5 mb-1 bg-blue-50/50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
              {user.display_name.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden min-w-0">
              <strong className="block text-xs font-black text-blue-950 truncate">
                {user.display_name}
              </strong>
              <small className="text-[11px] text-slate-500 font-mono block truncate">
                @{user.username}
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-right w-full cursor-pointer"
          >
            <span>🚪</span>
            <span>خروج از حساب</span>
          </button>
        </div>
      )}
    </div>
  );
};
