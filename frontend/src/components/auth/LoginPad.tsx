import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, Send, Lock, User as UserIcon, ArrowLeft, Check, Loader2, Link2, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { MediazLogo } from '../common/MediazLogo';
import { api } from '../../services/api';

const toPersianDigits = (input: string | number): string => {
  const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/[0-9]/g, (w) => pDigits[parseInt(w, 10)]);
};

const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${toPersianDigits(mm)}:${toPersianDigits(ss)}`;
};

export const LoginPad: React.FC = () => {
  const { loginWithCredentials, registerWithCredentials, loginWithTelegram, login, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Magic Login State (Council Mandate #8)
  const [magicModalOpen, setMagicModalOpen] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicNonce, setMagicNonce] = useState<string | null>(null);
  const [magicTimeLeft, setMagicTimeLeft] = useState(120);
  const [magicStep, setMagicStep] = useState<1 | 2 | 3>(1);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [magicIsApproved, setMagicIsApproved] = useState(false);

  // Live username availability state for registration mode (Council Mandate & Module 9)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string>('');
  const checkSeqRef = useRef<number>(0);

  // TWA Dual Start & Account Linking State (Council Mandate #10)
  const [twaLinkingMode, setTwaLinkingMode] = useState(false);
  const [twaConfirmLinkOpen, setTwaConfirmLinkOpen] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ username: string; password: string } | null>(null);
  const [linkUsername, setLinkUsername] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkShowPassword, setLinkShowPassword] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const countdownTimerRef = useRef<any>(null);
  const pollTimerRef = useRef<any>(null);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Check if running inside Telegram WebApp
  const tg = (window as any).Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;

  useEffect(() => {
    usernameRef.current?.focus();
  }, [mode]);

  // Debounced real-time username availability checker for registration
  useEffect(() => {
    if (mode !== 'register') {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      return;
    }

    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('حداقل ۳ کاراکتر الزامی است');
      return;
    }

    if (/^\d+$/.test(clean)) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('نام کاربری نمی‌تواند صرفاً عدد باشد');
      return;
    }

    if (clean.startsWith('tg_')) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('استفاده از پیشوند tg_ مجاز نیست');
      return;
    }

    if (!/^(?=.*[a-z0-9])[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('۳ تا ۳۰ کاراکتر انگلیسی کوچک، عدد یا _');
      return;
    }

    setUsernameStatus('checking');
    setUsernameFeedback('در حال استعلام...');
    const currentSeq = ++checkSeqRef.current;

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean; reason?: string }>(
          `/auth/check-username?username=${encodeURIComponent(clean)}`
        );
        if (checkSeqRef.current === currentSeq) {
          if (res.available) {
            setUsernameStatus('available');
            setUsernameFeedback('نام کاربری آزاد است');
          } else {
            setUsernameStatus('unavailable');
            setUsernameFeedback(res.reason || 'این نام کاربری قبلاً ثبت شده است');
          }
        }
      } catch {
        if (checkSeqRef.current === currentSeq) {
          setUsernameStatus('unavailable');
          setUsernameFeedback('خطا در استعلام نام کاربری');
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, mode]);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Clean up magic login timers on unmount
  const stopMagicTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopMagicTimers();
  }, [stopMagicTimers]);

  const handleCancelMagic = () => {
    stopMagicTimers();
    setMagicModalOpen(false);
    setMagicNonce(null);
    setMagicError(null);
    setMagicIsApproved(false);
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 100);
  };

  // Council Mandate #10: Link TWA session to existing desktop account
  const handleLinkTelegramAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanU = linkUsername.trim().toLowerCase();
    const cleanP = linkPassword.trim();
    if (!cleanU || !cleanP) {
      setLinkError('لطفاً نام کاربری و رمز عبور لپ‌تاپ را وارد فرمایید.');
      return;
    }
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await api.post<{ success: boolean; token: string; user: any }>('/auth/link-telegram', {
        username: cleanU,
        password: cleanP,
        init_data: tg?.initData || '',
      });
      if (res && res.token && res.user) {
        login(res.token, res.user);
      } else {
        setLinkError('پاسخی از سرور دریافت نشد.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'خطا در اتصال به حساب کاربری لپ‌تاپ.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleConfirmTwaLink = async () => {
    if (!pendingCredentials) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await api.post<{ success: boolean; token: string; user: any }>('/auth/link-telegram', {
        username: pendingCredentials.username,
        password: pendingCredentials.password,
        init_data: tg?.initData || '',
      });
      if (res && res.token && res.user) {
        login(res.token, res.user);
        setTwaConfirmLinkOpen(false);
      } else {
        setLinkError('پاسخی از سرور دریافت نشد.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'خطا در اتصال حساب به تلگرام.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSkipTwaLink = async () => {
    if (!pendingCredentials) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await loginWithCredentials(pendingCredentials.username, pendingCredentials.password);
      if (res.success) {
        setTwaConfirmLinkOpen(false);
      } else {
        setLinkError(res.error || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'خطا در ورود.');
    } finally {
      setLinkLoading(false);
    }
  };

  // Initiate Magic Telegram Login
  const handleMagicLoginRequest = async () => {
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      triggerError('لطفاً ابتدا نام کاربری خود را وارد فرمایید.');
      usernameRef.current?.focus();
      return;
    }

    setErrorMessage(null);
    setMagicLoading(true);
    try {
      const res = await api.post<{ success: boolean; nonce: string; expires_in: number; telegram_user_id: number }>(
        '/auth/magic-login/request',
        { identifier: trimmedUser }
      );

      if (res && res.nonce) {
        setMagicNonce(res.nonce);
        setMagicTimeLeft(120);
        setMagicStep(2);
        setMagicError(null);
        setMagicIsApproved(false);
        setMagicModalOpen(true);
        startMagicPolling(res.nonce);
      }
    } catch (err: any) {
      triggerError(err.message || 'خطا در ارسال پیام تایید ورود به تلگرام.');
    } finally {
      setMagicLoading(false);
    }
  };

  // Start countdown and status polling
  const startMagicPolling = (nonce: string) => {
    stopMagicTimers();

    // 1-second countdown timer
    let remaining = 120;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setMagicTimeLeft(remaining);
      if (remaining <= 0) {
        stopMagicTimers();
        setMagicError('مهلت تایید درخواست به پایان رسید. لطفاً مجدداً تلاش فرمایید.');
      }
    }, 1000);

    // 1.5-second polling loop
    pollTimerRef.current = setInterval(async () => {
      try {
        const pollRes = await api.get<{ status: string; token?: string; user?: any; detail?: string }>(
          `/auth/magic-login/poll?nonce=${encodeURIComponent(nonce)}`
        );

        if (pollRes.status === 'approved' && pollRes.token && pollRes.user) {
          stopMagicTimers();
          setMagicStep(3);
          setMagicIsApproved(true);

          if (navigator.vibrate) {
            try {
              navigator.vibrate([40, 60, 40]);
            } catch {
              // ignore
            }
          }

          // 700ms emerald success badge before transition
          setTimeout(() => {
            login(pollRes.token!, pollRes.user);
            setMagicModalOpen(false);
          }, 700);
        } else if (pollRes.status === 'rejected') {
          stopMagicTimers();
          setMagicError('درخواست ورود توسط شما در تلگرام رد شد.');
        } else if (pollRes.status === 'expired') {
          stopMagicTimers();
          setMagicError('مهلت ۲ دقیقه‌ای تایید این درخواست به پایان رسیده است.');
        }
      } catch {
        // network jitter during polling is ignored until timeout
      }
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      triggerError('لطفاً نام کاربری خود را وارد کنید.');
      usernameRef.current?.focus();
      return;
    }
    if (!trimmedPass) {
      triggerError('لطفاً رمز عبور را وارد کنید.');
      passwordRef.current?.focus();
      return;
    }

    if (mode === 'register') {
      const trimmedName = displayName.trim().replace(/ي/g, 'ی').replace(/ك/g, 'ک');
      if (!trimmedName) {
        triggerError('لطفاً نام و نام خانوادگی خود را به فارسی وارد کنید.');
        return;
      }
      if (usernameStatus !== 'available') {
        triggerError(usernameFeedback || 'لطفاً یک نام کاربری معتبر و آزاد انتخاب فرمایید.');
        usernameRef.current?.focus();
        return;
      }
      if (trimmedPass.length < 4) {
        triggerError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
        passwordRef.current?.focus();
        return;
      }
      const res = await registerWithCredentials(trimmedUser, trimmedPass, trimmedName);
      if (!res.success) {
        triggerError(res.error || 'خطا در ثبت‌نام حساب جدید.');
      }
    } else {
      // If user enters pure digits in login, alert with helpful Persian guidance
      if (/^\d+$/.test(trimmedUser)) {
        triggerError('ورود با شناسه عددی تلگرام پشتیبانی نمی‌شود. لطفاً از آیدی مدیاز یا ورود مستقیم تلگرام استفاده فرمایید.');
        return;
      }

      // If user is inside Telegram WebApp, prompt with confirmation popup to bind Telegram account
      if (tgUser && tgUser.id) {
        setPendingCredentials({ username: trimmedUser, password: trimmedPass });
        setTwaConfirmLinkOpen(true);
        setLinkError(null);
        return;
      }

      const res = await loginWithCredentials(trimmedUser, trimmedPass);
      if (!res.success) {
        triggerError(res.error || 'نام کاربری یا رمز عبور اشتباه است.');
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

        {/* Telegram WebApp Auto-Detected Dual Start Cards (Council Mandate #10) */}
        {tgUser && tgUser.id && (
          <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-200/80 flex flex-col gap-3.5 shadow-sm">
            {/* Telegram User Identity Capsule */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-blue-200/50">
              <span className="font-bold text-slate-600">ورود با اکانت تلگرام:</span>
              <span className="font-bold text-blue-700 bg-blue-100/90 px-2.5 py-0.5 rounded-full shadow-2xs text-[11px]">
                {tgUser.username ? `@${tgUser.username}` : tgUser.first_name}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                {tgUser.first_name?.charAt(0) || 'ت'}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <span className="block text-xs font-black text-slate-900 truncate">
                  {tgUser.first_name} {tgUser.last_name || ''}
                </span>
                {tgUser.username && (
                  <span className="block text-[11px] font-mono text-slate-500 truncate dir-ltr text-right">
                    @{tgUser.username}
                  </span>
                )}
              </div>
            </div>

            {!twaLinkingMode ? (
              /* Dual Cards: Quick Start vs Link Laptop Account */
              <div className="flex flex-col gap-2.5 pt-1">
                {/* Card 1: Fast Start as New Student */}
                <button
                  type="button"
                  onClick={() => loginWithTelegram()}
                  disabled={isLoading}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 flex items-center justify-between cursor-pointer transition-all active:scale-98 text-right group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-base shrink-0">
                      ✨
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black">
                        شروع سریع به عنوان داوطلب جدید
                      </span>
                      <span className="text-[10px] text-blue-100 font-medium">
                        ورود مستقیم و ثبت‌نام سریع با تلگرام
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-blue-200 group-hover:translate-x-[-2px] transition-transform shrink-0" />
                </button>

                {/* Card 2: Link to Existing Laptop Account */}
                <button
                  type="button"
                  onClick={() => { setTwaLinkingMode(true); setLinkError(null); }}
                  className="w-full p-3 rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 hover:border-blue-300 text-slate-800 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-98 text-right group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">
                        قبلاً با لپ‌تاپ ثبت‌نام کرده‌ام
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        اتصال به حساب کاربری موجود در لپ‌تاپ
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-[-2px] transition-all shrink-0" />
                </button>
              </div>
            ) : (
              /* Inline Linking Form */
              <form onSubmit={handleLinkTelegramAccount} className="flex flex-col gap-3 pt-1 border-t border-blue-200/50">
                <div className="flex items-center justify-between text-xs font-black text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>اتصال حساب لپ‌تاپ به تلگرام</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setTwaLinkingMode(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  نام کاربری و رمز عبوری که در لپ‌تاپ ثبت کرده‌اید را وارد کنید تا پیشرفت شما یکپارچه شود:
                </p>

                {linkError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                    {linkError}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    dir="ltr"
                    value={linkUsername}
                    onChange={(e) => setLinkUsername(e.target.value)}
                    placeholder="نام کاربری لپ‌تاپ (username)"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs text-left"
                  />
                </div>

                <div className="relative flex items-center">
                  <input
                    type={linkShowPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="رمز عبور لپ‌تاپ"
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setLinkShowPassword(!linkShowPassword)}
                    className="absolute left-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {linkShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={linkLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {linkLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال بررسی و اتصال...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        <span>تایید و اتصال اکانت</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwaLinkingMode(false)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    بازگشت
                  </button>
                </div>
              </form>
            )}
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
                  onChange={(e) => setDisplayName(e.target.value.replace(/ي/g, 'ی').replace(/ك/g, 'ک'))}
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
              <label className="flex items-center gap-1.5">
                <bdi>{mode === 'register' ? 'نام کاربری (آیدی مدیاز):' : 'نام کاربری:'}</bdi>
              </label>
              <span className="text-[10px] text-blue-600 font-medium">حروف انگلیسی</span>
            </div>
            <div className="relative flex items-center">
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ali_rezaei"
                autoComplete="username"
                disabled={isLoading}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white/90 border border-slate-200/80 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs text-left dir-ltr"
              />
              <UserIcon className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Fixed-Height Real-Time Feedback Container (CLS Elimination) */}
            {mode === 'register' && (
              <div className="h-6 min-h-[24px] flex items-center justify-between px-1 text-[11px] font-bold">
                {usernameStatus === 'checking' && (
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال بررسی دسترسی...</span>
                  </div>
                )}
                {usernameStatus === 'available' && (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                    <span>نام کاربری آزاد است</span>
                  </div>
                )}
                {usernameStatus === 'unavailable' && (
                  <div className="flex items-center gap-1.5 text-rose-600 truncate">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{usernameFeedback}</span>
                  </div>
                )}
                {usernameStatus === 'idle' && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    ۳ تا ۳۰ کاراکتر انگلیسی کوچک، عدد یا _
                  </span>
                )}
              </div>
            )}

            {mode === 'login' && /^\d+$/.test(username.trim()) && (
              <div className="h-6 min-h-[24px] flex items-center gap-1.5 px-1 text-[10px] font-bold text-amber-600 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">ورود با شناسه عددی تلگرام پشتیبانی نمی‌شود. لطفاً آیدی مدیاز را وارد کنید.</span>
              </div>
            )}
          </div>

          {/* Desktop Magic Telegram Login Button (Council Mandate #8) */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={handleMagicLoginRequest}
              disabled={magicLoading || isLoading}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-purple-500/15 hover:from-sky-500/25 hover:via-indigo-500/20 hover:to-purple-500/25 border border-sky-300/60 hover:border-sky-400/80 text-sky-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              {magicLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                  <span>در حال ارسال پیام تایید به تلگرام...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-sky-600 rotate-[-20deg]" />
                  <span>✈️ ورود با تایید تلگرام (بدون رمز)</span>
                </>
              )}
            </button>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <label>رمز عبور:</label>
              <span className="text-[10px] text-slate-500 font-normal">حداقل ۴ کاراکتر</span>
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
                className="w-full min-h-[44px] px-3.5 py-2.5 pl-12 rounded-2xl bg-white/90 border border-slate-200/80 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs text-left dir-ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                className="absolute left-1 text-slate-400 hover:text-slate-600 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer active:scale-95"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Context-Aware Educational Micro-Copy */}
          {mode === 'login' ? (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100/80 text-[11px] text-slate-600 leading-relaxed font-medium">
              <p>
                💡 <strong className="text-blue-900">ورود دوگانه و هوشمند:</strong> می‌توانید با وارد کردن نام کاربری و رمز عبور وارد شوید، یا با فشردن دکمه «ورود با تایید تلگرام»، تاییدیه ورود را به سادگی روی گوشی خود لمس فرمایید.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100/80 text-[11px] text-slate-600 leading-relaxed font-medium">
              <p>
                💡 <strong className="text-indigo-900">توجه:</strong> آیدی مدیاز همان شناسه اختصاصی شما برای ورود به سامانه در لپ‌تاپ و وب است. لطفاً آن را به خاطر بسپارید.
              </p>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={
              isLoading ||
              usernameStatus === 'checking' ||
              (mode === 'register' && (usernameStatus !== 'available' || !displayName.trim() || password.length < 4))
            }
            className="w-full min-h-[48px] mt-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 cursor-pointer transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <span className="font-bold">v3.5.0-identities</span>
          <span className="text-slate-300">•</span>
          <span className="font-sans text-[10px]">سامانه هوشمند مدیاز</span>
        </div>
      </div>

      {/* Anti-Panic Telegram Magic Login Modal (Council Mandate #8) */}
      {magicModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <div className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 sm:p-7 flex flex-col items-center gap-4 text-center shadow-2xl relative overflow-hidden">
            {/* Soft decorative background glows */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Pulsing Neon Telegram Paper Plane Icon */}
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 animate-pulse">
                <Send className="w-8 h-8 rotate-[-20deg] translate-x-0.5 -translate-y-0.5" />
              </div>
              <div className="absolute -inset-1 rounded-3xl bg-sky-400/25 blur-md -z-10 animate-ping opacity-60" />
            </div>

            {/* Title & Explanatory Subtitle */}
            <div className="flex flex-col gap-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                ارسال پیام تایید به تلگرام
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
                پیامی به ربات مدیاز در تلگرام شما ارسال شد. لطفاً دکمه «تایید ورود» را در گوشی خود لمس فرمایید.
              </p>
            </div>

            {/* Anti-Panic Circular SVG Countdown Timer (Council Mandate #8) */}
            <div className="relative w-28 h-28 flex items-center justify-center my-1">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 88 88">
                {/* Background Track */}
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  className="stroke-slate-100"
                  strokeWidth="5.5"
                  fill="transparent"
                />
                {/* Dynamic Calm Circular Stroke */}
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  className={`transition-all duration-1000 ease-linear ${
                    magicIsApproved
                      ? 'stroke-emerald-500'
                      : magicTimeLeft <= 15
                      ? 'stroke-amber-400'
                      : 'stroke-purple-400'
                  }`}
                  strokeWidth="5.5"
                  strokeDasharray={238.76}
                  strokeDashoffset={238.76 * (1 - magicTimeLeft / 120)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {magicIsApproved ? (
                  <div className="flex flex-col items-center gap-1 animate-scaleUp">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-black">تایید شد!</span>
                  </div>
                ) : (
                  <>
                    <span
                      className={`text-lg font-black font-mono tracking-wider ${
                        magicTimeLeft <= 15 ? 'text-amber-500' : 'text-purple-600'
                      }`}
                    >
                      {formatCountdown(magicTimeLeft)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">زمان باقیمانده</span>
                  </>
                )}
              </div>
            </div>

            {/* Error Message within Modal */}
            {magicError && (
              <div className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{magicError}</span>
              </div>
            )}

            {/* 3-Step Live Status Checklist (Council Mandate #8) */}
            <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs text-right">
              {/* Step 1 */}
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>ارسال درخواست به تلگرام</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                  انجام شد
                </span>
              </div>

              {/* Step 2 */}
              <div
                className={`flex items-center justify-between font-bold ${
                  magicIsApproved
                    ? 'text-emerald-700'
                    : magicStep >= 2
                    ? 'text-blue-700'
                    : 'text-slate-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {magicIsApproved ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    </span>
                  )}
                  <span>در انتظار تایید در گوشی...</span>
                </span>
                <span className="text-[10px] font-mono">
                  {magicIsApproved ? 'تایید شد' : 'در حال انتظار'}
                </span>
              </div>

              {/* Step 3 */}
              <div
                className={`flex items-center justify-between font-bold ${
                  magicIsApproved ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {magicIsApproved ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-slate-300">○</span>
                  )}
                  <span>ورود خودکار به برنامه</span>
                </span>
                <span className="text-[10px] font-mono">
                  {magicIsApproved ? 'آماده ورود' : 'مرحله نهایی'}
                </span>
              </div>
            </div>

            {/* Cancel Action Button (Council Mandate #8) */}
            <button
              type="button"
              onClick={handleCancelMagic}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition-all active:scale-98 shadow-2xs mt-1"
            >
              ورود سنتی با نام کاربری و رمز عبور
            </button>
          </div>
        </div>
      )}

      {/* Telegram WebApp Account Linking Confirmation Modal */}
      {twaConfirmLinkOpen && pendingCredentials && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 flex flex-col gap-4 text-right shadow-2xl relative">
            <div className="flex items-center gap-2.5 text-blue-900 font-black text-sm border-b border-slate-100 pb-3">
              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600">
                <Link2 className="w-5 h-5" />
              </div>
              <span>اتصال حساب مدیاز به تلگرام</span>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-600 leading-relaxed font-medium">
              <p>
                سلام <strong className="text-slate-900">{tgUser?.first_name || 'کاربر گرامی'}</strong> جان! 👋
              </p>
              <p>
                آیا مایلید اکانت تلگرام شما به حساب کاربری <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">@{pendingCredentials.username}</code> متصل شود؟
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5 mt-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>ورود خودکار و بدون نیاز به رمز در دفعات بعدی باز کردن تلگرام</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>امکان ورود به لپ‌تاپ تنها با فشردن دکمه تایید در تلگرام</span>
                </div>
              </div>
            </div>

            {linkError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {linkError}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-1">
              <button
                type="button"
                onClick={handleConfirmTwaLink}
                disabled={linkLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs cursor-pointer shadow-md shadow-blue-500/25 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {linkLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال اتصال اکانت به تلگرام...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>بله، این اکانت تلگرام را متصل کن</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipTwaLink}
                disabled={linkLoading}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all active:scale-98"
              >
                ورود موقت بدون اتصال به تلگرام
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
