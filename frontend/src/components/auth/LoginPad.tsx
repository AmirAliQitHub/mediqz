import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Send, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { MediazLogo } from '../common/MediazLogo';

export const LoginPad: React.FC = () => {
  const { loginWithCredentials, registerWithCredentials, loginWithTelegram, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Check if running inside Telegram WebApp
  const tg = (window as any).Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;

  useEffect(() => {
    usernameRef.current?.focus();
  }, [mode]);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      triggerError('لطفاً شناسه تلگرام یا نام کاربری را وارد کنید.');
      usernameRef.current?.focus();
      return;
    }
    if (!trimmedPass) {
      triggerError('لطفاً رمز عبور را وارد کنید.');
      passwordRef.current?.focus();
      return;
    }

    if (mode === 'register') {
      const trimmedName = displayName.trim();
      if (!trimmedName) {
        triggerError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
        return;
      }
      const res = await registerWithCredentials(trimmedUser, trimmedPass, trimmedName);
      if (!res.success) {
        triggerError(res.error || 'خطا در ثبت‌نام حساب جدید.');
      }
    } else {
      const res = await loginWithCredentials(trimmedUser, trimmedPass);
      if (!res.success) {
        triggerError(res.error || 'شناسه کاربری یا رمز عبور اشتباه است.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 py-8 overflow-y-auto">
      <div
        className={`w-full max-w-sm sm:max-w-md liquid-glass-card p-6 sm:p-8 rounded-3xl flex flex-col gap-5 text-right shadow-2xl border border-white/90 relative z-10 transition-transform ${
          shake ? 'animate-shake' : 'animate-fadeIn'
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-blue-100 shadow-md">
            <MediazLogo size="lg" showText={false} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              سامانه هوشمند مدیاز
            </h1>
            <p className="text-xs text-blue-600 font-bold mt-0.5">
              موتور یادگیری شناختی و مرور لایتنر کنکور
            </p>
          </div>
        </div>

        {/* Telegram WebApp Auto-Detected Banner */}
        {tgUser && tgUser.id && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-200/80 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">ورود شناسایی‌شده با تلگرام:</span>
              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                ID: {tgUser.id}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                {tgUser.first_name?.charAt(0) || 'ت'}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <span className="block text-xs font-black text-slate-900 truncate">
                  {tgUser.first_name} {tgUser.last_name || ''}
                </span>
                {tgUser.username && (
                  <span className="block text-[11px] font-mono text-slate-500 truncate">
                    @{tgUser.username}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => loginWithTelegram()}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-97"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ورود مستقیم بدون رمز عبور</span>
            </button>
          </div>
        )}

        {/* Mode Switcher Tabs (Login / Register) */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60 select-none">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`flex-1 min-h-[38px] py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-blue-900 shadow-xs border border-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ورود به حساب</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`flex-1 min-h-[38px] py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white text-blue-900 shadow-xs border border-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ثبت‌نام جدید</span>
          </button>
        </div>

        {/* Error Alert with Lucide Icon */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between animate-fadeIn gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-700">نام و نام خانوادگی:</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: علی رضایی"
                  autoComplete="name"
                  disabled={isLoading}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white/90 border border-slate-200/80 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <label>شناسه تلگرام یا نام کاربری:</label>
              <span className="text-[10px] text-blue-600 font-medium">عددی یا متنی</span>
            </div>
            <div className="relative flex items-center">
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: 99887766 یا نام کاربری"
                autoComplete="username"
                disabled={isLoading}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white/90 border border-slate-200/80 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs text-left dir-ltr"
              />
              <UserIcon className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <label>رمز عبور:</label>
              {mode === 'login' && (
                <span className="text-[10px] text-slate-500 font-normal">حداقل ۴ کاراکتر</span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={isLoading}
                className="w-full min-h-[44px] px-3.5 py-2.5 pl-10 rounded-2xl bg-white/90 border border-slate-200/80 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs text-left dir-ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                className="absolute left-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Educational Guidance Micro-copy */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100/80 text-[11px] text-slate-600 leading-relaxed font-medium">
            <p>
              💡 <strong className="text-blue-900">ورود با اکانت تلگرام:</strong> کاربران ربات تلگرام می‌توانند با وارد کردن 
              شناسه عددی تلگرام (Telegram ID) و رمز عبور خود در این صفحه وارد شوند.
            </p>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[46px] mt-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 cursor-pointer transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال اعتبارسنجی...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>ورود به سامانه مدیاز</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>تکمیل ثبت‌نام و ورود</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Minimalist Version & Engine Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">v2.5.0-pro</span>
          <span className="text-slate-300">•</span>
          <span className="font-sans text-[10px]">سامانه هوشمند مدیاز</span>
        </div>
      </div>
    </div>
  );
};
