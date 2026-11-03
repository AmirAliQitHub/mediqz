import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { MediazLogo } from '../common/MediazLogo';
import { api } from '../../services/api';

const GRADES = [
  { id: 'دهم', label: 'پایه دهم', desc: 'متوسطه دوم - سال اول', icon: '🌱' },
  { id: 'یازدهم', label: 'پایه یازدهم', desc: 'متوسطه دوم - سال دوم', icon: '🌿' },
  { id: 'دوازدهم', label: 'پایه دوازدهم', desc: 'نهایی و کنکور سراسری', icon: '🎓' },
  { id: 'کنکور', label: 'کنکور / فارغ‌التحصیل', desc: 'جمع‌بندی و مرور جامع', icon: '⚡' },
];

export const OnboardingModal: React.FC = () => {
  const { user, completeOnboarding } = useAuthStore();

  const [displayName, setDisplayName] = useState(
    user?.display_name && !user.display_name.startsWith('tg_') ? user.display_name : ''
  );
  const [selectedGrade, setSelectedGrade] = useState('دوازدهم');

  const needsCredentials = !user?.has_password;

  const initialUsername = (
    user?.telegram_username ||
    (user?.username && !user.username.startsWith('tg_') ? user.username : '')
  ).toLowerCase();

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Debounced real-time username checker (Council Mandate #9: 400ms debounce)
  useEffect(() => {
    if (!needsCredentials) return;

    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('۳ تا ۳۰ کاراکتر انگلیسی کوچک، عدد یا _');
      return;
    }

    if (user?.username && clean === user.username.toLowerCase()) {
      setUsernameStatus('available');
      setUsernameFeedback('نام کاربری فعلی شما');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean; reason?: string }>(
          `/auth/check-username?username=${encodeURIComponent(clean)}`
        );
        if (res.available) {
          setUsernameStatus('available');
          setUsernameFeedback('آزاد است');
        } else {
          setUsernameStatus('unavailable');
          setUsernameFeedback(res.reason || 'قبلاً ثبت شده است');
        }
      } catch {
        setUsernameStatus('unavailable');
        setUsernameFeedback('خطا در استعلام نام کاربری');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, needsCredentials, user?.username]);

  // Only show if user is authenticated but not yet onboarded
  if (!user || user.is_onboarded) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('لطفاً نام خود را وارد فرمایید.');
      return;
    }
    if (!selectedGrade) {
      setErrorMsg('لطفاً پایه تحصیلی خود را مشخص کنید.');
      return;
    }

    if (needsCredentials) {
      const cleanUser = username.trim().toLowerCase();
      if (!cleanUser) {
        setErrorMsg('لطفاً نام کاربری دلخواه خود را وارد فرمایید.');
        return;
      }
      if (usernameStatus !== 'available') {
        setErrorMsg('نام کاربری انتخابی در دسترس یا معتبر نیست.');
        return;
      }
      if (!password.trim() || password.length < 4) {
        setErrorMsg('رمز عبور باید حداقل ۴ کاراکتر باشد.');
        return;
      }
    }

    setErrorMsg('');
    setIsLoading(true);
    try {
      await completeOnboarding(
        displayName.trim(),
        selectedGrade,
        needsCredentials ? username.trim().toLowerCase() : undefined,
        needsCredentials ? password.trim() : undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت اطلاعات.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl flex flex-col gap-4 text-right relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center flex flex-col items-center gap-1.5">
          <div className="p-2 rounded-2xl bg-white/80 border border-blue-100 shadow-md">
            <MediazLogo size="md" showText={false} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            به مدیاز خوش آمدید!
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
            جهت شخصی‌سازی محتوا و ورود بدون تلگرام در کامپیوتر، مشخصات زیر را تکمیل فرمایید.
          </p>
        </div>

        {/* Calming Guidance Banner (Council Mandate #9) */}
        <div className="p-3 rounded-2xl bg-indigo-50/90 border border-indigo-100 text-indigo-900 text-[11px] sm:text-xs font-medium leading-relaxed flex items-start gap-2.5 text-right shadow-sm">
          <span className="text-base shrink-0">💡</span>
          <p>
            با داشتن نام کاربری و رمز، در آینده می‌توانید بدون نیاز به تلگرام، با کامپیوتر یا لپ‌تاپ خود نیز وارد مدیاز شوید.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Full Display Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              نام و نام خانوادگی:
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="مثال: امیرعلی رخشانی"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner transition-all"
            />
          </div>

          {/* 2. Educational Grade */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">
              پایه تحصیلی شما:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GRADES.map((g) => {
                const isSelected = selectedGrade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrade(g.id)}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-400/40 shadow-sm'
                        : 'border-slate-200 bg-white/70 hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">{g.icon}</span>
                      <span className="font-black text-xs">{g.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {g.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Credentials Setup for Desktop (Council Mandate #9) */}
          {needsCredentials && (
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              {/* Username Input with Debounced Live Status */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold text-xs">
                    نام کاربری برای ورود به لپ‌تاپ:
                  </label>
                  {usernameStatus === 'checking' && (
                    <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      در حال بررسی...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {usernameFeedback}
                    </span>
                  )}
                  {usernameStatus === 'unavailable' && (
                    <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {usernameFeedback}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username (انگلیسی)"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner transition-all text-left"
                />
              </div>

              {/* Single Password Field with 44px Eye Toggle (Zero Confirm Field) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  رمز عبور ورود با لپ‌تاپ:
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    required
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner transition-all text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-0 top-0 bottom-0 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                    title={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                    aria-label="تغییر وضعیت نمایش رمز عبور"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (needsCredentials && (usernameStatus !== 'available' || password.length < 4))}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg shadow-blue-500/30 cursor-pointer transition-all active:scale-98 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-pulse">در حال ذخیره اطلاعات...</span>
            ) : (
              <>
                <span>تکمیل و ورود به مدیاز</span>
                <span className="text-xs">←</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
