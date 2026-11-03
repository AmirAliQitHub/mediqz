import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Shield, ShieldCheck, LogOut, User, ArrowLeft, Send, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { soundEffects } from '../../services/soundEffects';

export const UserProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { user, logout, setActiveTab, unlinkTelegram } = useAuthStore();
  const [muted, setMuted] = useState<boolean>(soundEffects.isMuted());

  // 2-Step Telegram Unlink Modal State (Council Mandate #10)
  const [unlinkModalStep, setUnlinkModalStep] = useState<0 | 1 | 2>(0);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [unlinkSuccess, setUnlinkSuccess] = useState(false);

  useEffect(() => {
    return soundEffects.subscribe((newMuted) => setMuted(newMuted));
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.toggleMute();
    if (muted) {
      setTimeout(() => soundEffects.playSuccessChime(), 50);
    }
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
    };
  }, []);

  if (!user) return null;

  const handleConfirmUnlink = async () => {
    setUnlinkLoading(true);
    setUnlinkError(null);
    try {
      await unlinkTelegram();
      setUnlinkSuccess(true);
      setTimeout(() => {
        setUnlinkSuccess(false);
        setUnlinkModalStep(0);
        setIsOpen(false);
      }, 1000);
    } catch (err: any) {
      setUnlinkError(err.message || 'خطا در قطع اتصال تلگرام.');
    } finally {
      setUnlinkLoading(false);
    }
  };

  return (
    <>
      <div
        dir="rtl"
        className="relative z-50 select-none"
        ref={containerRef}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border shadow-xs backdrop-blur-xl transition-all duration-200 cursor-pointer min-h-[36px] justify-center ${
            isOpen
              ? 'bg-white text-blue-950 border-blue-400 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white/90 hover:bg-white text-blue-950 border-slate-200/80'
          }`}
          aria-expanded={isOpen}
        >
          <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/90">
            {user.display_name.charAt(0) || 'م'}
          </div>
          <span className="text-xs font-bold text-slate-800 truncate max-w-[90px] sm:max-w-[140px]">
            {user.display_name}
          </span>
          <svg
            className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
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
            className="absolute top-full right-0 left-auto mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5 text-right animate-fadeIn z-50 border border-blue-100 bg-white shadow-blue-900/20"
          >
            {/* User Info Header */}
            <div className="p-2.5 border-b border-blue-100/80 flex flex-col gap-2 mb-1 bg-blue-50/60 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {user.display_name.charAt(0) || 'م'}
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong className="block text-xs font-black text-blue-950 truncate">
                      {user.display_name}
                    </strong>
                    {user.is_superuser && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        مدیر
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <small className="text-[10px] text-slate-500 font-mono truncate dir-ltr text-right">
                      @{user.username}
                    </small>
                    {user.grade && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                        {user.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Council Mandate #10: Profile Telegram Connection Capsule */}
              {user.telegram_user_id ? (
                <div className="p-1.5 px-2 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-[10px] font-bold text-emerald-950 flex items-center justify-between gap-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Send className="w-3 h-3 text-emerald-600 shrink-0 rotate-[-15deg]" />
                    <span className="truncate">
                      {user.telegram_username ? `@${user.telegram_username}` : 'متصل به تلگرام'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[9px] text-emerald-700 font-black bg-emerald-100/90 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>فعال</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnlinkError(null);
                        setUnlinkSuccess(false);
                        setUnlinkModalStep(1);
                      }}
                      className="text-[9px] text-slate-400 hover:text-rose-600 underline cursor-pointer p-0.5 transition-colors"
                    >
                      قطع اتصال
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('account');
                    setIsOpen(false);
                  }}
                  className="w-full p-1.5 px-2 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/80 text-[10px] font-bold text-amber-950 flex items-center justify-between gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="flex items-center gap-1">
                    <span>⚠️</span>
                    <span>اتصال به تلگرام فعال نیست</span>
                  </span>
                  <span className="text-[9px] text-amber-700 underline font-medium">
                    کلیک جهت اتصال
                  </span>
                </button>
              )}
            </div>

            {/* Option: User Account & Settings */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('account');
                setIsOpen(false);
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50/80 transition-colors w-full cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-slate-800 font-black">پروفایل و مدیریت حساب</span>
                  <span className="text-[10px] text-slate-400">
                    اتصال تلگرام، رمز عبور وب و تنظیمات
                  </span>
                </div>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* Option: Ambient Sound Feedback Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100/80 transition-colors w-full cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  muted ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-slate-800 font-black">بازخورد صوتی</span>
                  <span className="text-[10px] text-slate-400">
                    {muted ? 'بی‌صدا' : 'صدای کلیک و افکت فعال'}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                muted ? 'bg-slate-200/80 text-slate-600' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {muted ? 'خاموش' : 'روشن'}
              </span>
            </button>

            {/* Option: Superuser Admin Panel (if superuser) */}
            {user.is_superuser && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setIsOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/60 transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-200/70 text-indigo-900">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-right leading-tight">
                    <span className="font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-700" />
                      <span>پنل مدیریت کاربران</span>
                    </span>
                    <span className="text-[10px] text-indigo-700/80">
                      دسترسی ارشد سوپریوزر
                    </span>
                  </div>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            )}

            {/* Option: Log Out */}
            <button
              type="button"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full cursor-pointer mt-0.5"
            >
              <div className="p-1.5 rounded-lg bg-rose-100/70 text-rose-600">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              <span>خروج از حساب</span>
            </button>
          </div>
        )}
      </div>

      {/* 2-Step Telegram Disconnect Modal (Council Mandate #10) */}
      {unlinkModalStep > 0 && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 text-right shadow-2xl relative">
            {/* Step 1: Password Check or Initial Confirmation */}
            {unlinkModalStep === 1 && (
              <>
                {!user.has_password ? (
                  <>
                    <div className="flex items-center gap-2.5 text-amber-600 font-black text-sm border-b border-slate-100 pb-3">
                      <div className="p-2 rounded-xl bg-amber-100">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span>تنظیم رمز عبور الزامی است!</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      حساب شما در حال حاضر رمز عبوری برای ورود مستقیم ندارد. اگر اتصال تلگرام را قطع فرمایید، دسترسی به این حساب مسدود خواهد شد. لطفاً ابتدا در بخش مدیریت حساب، یک رمز عبور تعیین فرمایید.
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUnlinkModalStep(0);
                          setIsOpen(false);
                          setActiveTab('account');
                        }}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-98"
                      >
                        رفتن به تنظیمات و تعیین رمز
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnlinkModalStep(0)}
                        className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 text-amber-600 font-black text-sm border-b border-slate-100 pb-3">
                      <div className="p-2 rounded-xl bg-amber-100">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span>قطع اتصال حساب تلگرام (گام ۱ از ۲)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      آیا مطمئن هستید که قصد قطع اتصال اکانت تلگرام خود را دارید؟ با این کار، امکان ورود سریع و ورود جادویی غیرفعال شده و تنها با رمز عبور می‌توانید وارد شوید.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setUnlinkModalStep(2)}
                        className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20 transition-all active:scale-98"
                      >
                        بله، ادامه
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnlinkModalStep(0)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 2: Final High-Risk Confirmation */}
            {unlinkModalStep === 2 && (
              <>
                <div className="flex items-center gap-2.5 text-rose-600 font-black text-sm border-b border-slate-100 pb-3">
                  <div className="p-2 rounded-xl bg-rose-100">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span>تایید نهایی قطع اتصال (گام ۲ از ۲)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  ⚠️ <strong>هشدار نهایی:</strong> با زدن دکمه زیر، اتصال تلگرام فوراً قطع خواهد شد. برای ورود مجدد به این حساب باید از نام کاربری <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">@{user.username}</code> و رمز عبور خود استفاده نمایید.
                </p>

                {unlinkError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                    {unlinkError}
                  </div>
                )}

                {unlinkSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
                    <Check className="w-4 h-4" />
                    <span>اتصال تلگرام با موفقیت قطع گردید.</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleConfirmUnlink}
                    disabled={unlinkLoading || unlinkSuccess}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md shadow-rose-500/20 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {unlinkLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال قطع اتصال...</span>
                      </>
                    ) : (
                      <span>قطع قطعی اتصال تلگرام</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlinkModalStep(0)}
                    disabled={unlinkLoading}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    انصراف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
