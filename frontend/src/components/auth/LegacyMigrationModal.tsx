import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Sparkles,
  Lock,
  User as UserIcon,
  AtSign,
  Check,
} from 'lucide-react';
import { useAuthStore, isLegacyUser } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { MediazLogo } from '../common/MediazLogo';

interface LegacyMigrationModalProps {
  isForced?: boolean;
}

export const LegacyMigrationModal: React.FC<LegacyMigrationModalProps> = ({ isForced = false }) => {
  const { user, changeUsername, logout, isLoading } = useAuthStore();

  // If not forced and user does not meet legacy conditions, do not render
  if (!user || (!isForced && !isLegacyUser(user))) {
    return null;
  }

  // Determine which credentials are missing or legacy
  const isUsernameLegacy = (() => {
    const u = (user.username || '').trim().toLowerCase();
    if (!u || u.startsWith('tg_') || /^\d+$/.test(u)) return true;
    return !/^(?=.*[a-z0-9])[a-z0-9_]{3,30}$/.test(u);
  })();

  const needsPassword = !user.has_password;

  const needsDisplayName = (() => {
    const d = (user.display_name || '').trim();
    if (!d || d.startsWith('tg_') || /^\d+$/.test(d)) return true;
    return false;
  })();

  // Form State
  const [username, setUsername] = useState(isUsernameLegacy ? '' : user.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(
    needsDisplayName ? '' : user.display_name
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username validation & live availability status
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string>('');
  const checkSeqRef = useRef<number>(0);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 400ms Debounced live checker for username availability (Council Mandate & Module 9)
  useEffect(() => {
    if (!isUsernameLegacy) {
      setUsernameStatus('available');
      setUsernameFeedback('نام کاربری تایید شده شما');
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
      setUsernameFeedback('حداقل ۳ کاراکتر الزامی است.');
      return;
    }

    if (clean.length > 30) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('حداکثر ۳۰ کاراکتر مجاز است.');
      return;
    }

    if (clean.startsWith('tg_')) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('پیشوند tg_ مجاز نیست.');
      return;
    }

    if (/^\d+$/.test(clean)) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('نام کاربری نمی‌تواند صرفاً عدد باشد.');
      return;
    }

    if (!/^(?=.*[a-z0-9])[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameStatus('unavailable');
      setUsernameFeedback('فقط حروف انگلیسی کوچک، عدد و _ مجاز است.');
      return;
    }

    const thisSeq = ++checkSeqRef.current;
    setUsernameStatus('checking');
    setUsernameFeedback('در حال بررسی دسترسی...');

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean; reason?: string }>(
          `/auth/check-username?username=${encodeURIComponent(clean)}&exclude_user_id=${user.id}`
        );

        if (thisSeq !== checkSeqRef.current) return;

        if (res && res.available) {
          setUsernameStatus('available');
          setUsernameFeedback('آیدی آزاد است و برای شما ثبت می‌شود.');
        } else {
          setUsernameStatus('unavailable');
          setUsernameFeedback(res?.reason || 'این نام کاربری قبلاً انتخاب شده است.');
        }
      } catch {
        if (thisSeq !== checkSeqRef.current) return;
        setUsernameStatus('unavailable');
        setUsernameFeedback('خطا در بررسی دسترسی به نام کاربری.');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, isUsernameLegacy, user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Username Validation
    const cleanUsername = isUsernameLegacy
      ? username.trim().toLowerCase()
      : user.username.trim().toLowerCase();

    if (!cleanUsername) {
      setFormError('لطفاً یک نام کاربری (آیدی مدیاز) وارد فرمایید.');
      return;
    }

    if (isUsernameLegacy && usernameStatus !== 'available') {
      setFormError('لطفاً یک نام کاربری معتبر و آزاد انتخاب فرمایید.');
      return;
    }

    // 2. Password Validation
    if (needsPassword) {
      if (!password || password.length < 4) {
        setFormError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('رمز عبور و تکرار آن یکسان نیستند.');
        return;
      }
    }

    // 3. Display Name Validation
    const cleanDisplayName = needsDisplayName ? displayName.trim() : (user.display_name || '').trim();
    if (needsDisplayName && !cleanDisplayName) {
      setFormError('لطفاً نام و نام خانوادگی خود را به زبان فارسی وارد فرمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changeUsername(
        cleanUsername,
        needsPassword ? password : undefined,
        needsDisplayName ? cleanDisplayName : undefined
      );

      if (!res.success) {
        setFormError(res.error || 'خطا در ارتقای حساب کاربری.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn select-none">
      <div className="w-full sm:max-w-md max-h-[88dvh] sm:max-h-[90vh] bg-[#0f172a]/95 text-white backdrop-blur-2xl border border-blue-500/30 rounded-t-[2.25rem] sm:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col text-right relative overflow-y-auto pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

        {/* Ambient background glows */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Shield Icon & Mediaz Branding */}
        <div className="flex flex-col items-center text-center gap-2 mb-2 relative z-10">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/20 border border-blue-500/40 shadow-lg text-blue-400">
              <ShieldCheck className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
              <span>ارتقای امنیت و دسترسی به نسخه لپ‌تاپ</span>
            </h2>
            <p className="text-xs text-blue-200/80 font-medium">
              سامانه هوشمند مدیاز • هماهنگی حساب کاربری
            </p>
          </div>
        </div>

        {/* Empathetic Student Reassurance Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-400/20 text-slate-200 text-xs leading-relaxed flex items-start gap-2.5 text-right shadow-inner mb-2 relative z-10">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="font-black text-white">
              دانش‌آموز عزیز؛ سوابق و پیشرفت‌های درسی شما کاملاً محفوظ است ✨
            </p>
            <p className="text-[11px] text-slate-300 leading-normal">
              تمامی دوره‌ها، کارت‌های جعبه لایتنر و روتین‌های مطالعاتی شما دست‌نخورده باقی مانده‌اند. جهت فراهم شدن ورود مستقیم در لپ‌تاپ و وب، لطفاً شناسه اختصاصی و رمز عبور خود را تعیین فرمایید.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {formError && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn mb-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Interactive Adaptive Migration Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 relative z-10 text-xs sm:text-sm">
          {/* Field 1: Persian Display Name (if needed) */}
          {needsDisplayName && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>نام و نام خانوادگی به فارسی:</span>
                </span>
                <span className="text-[10px] text-slate-400">نمایش در سامانه</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.replace(/ي/g, 'ی').replace(/ك/g, 'ک'))}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                placeholder="مثال: امیرعلی رخشانی"
                autoComplete="name"
                disabled={isSubmitting}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-white font-bold text-xs transition-all shadow-inner outline-none"
              />
            </div>
          )}

          {/* Field 2: Mediqz ID (Username) */}
          {isUsernameLegacy ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <label className="flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                  <span>نام کاربری جدید (آیدی مدیاز):</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">حروف انگلیسی</span>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder="e.g. amirali_rakhshani"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-cyan-300 font-mono font-bold text-xs transition-all shadow-inner outline-none text-left"
                />
                <div className="absolute right-3 text-slate-500 font-mono font-bold text-sm pointer-events-none">
                  @
                </div>
              </div>

              {/* CLS Guard: Fixed height 24px container for status feedback */}
              <div className="h-6 min-h-[24px] flex items-center justify-end px-1">
                {usernameStatus === 'checking' && (
                  <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال استعلام دسترسی...</span>
                  </span>
                )}
                {usernameStatus === 'available' && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" />
                    <span>{usernameFeedback}</span>
                  </span>
                )}
                {usernameStatus === 'unavailable' && (
                  <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{usernameFeedback}</span>
                  </span>
                )}
                {usernameStatus === 'idle' && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    حروف کوچک انگلیسی، اعداد و _ (۳ تا ۳۰ کاراکتر)
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Valid Mediqz ID Badge (Read-only) */
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between">
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400 font-bold">آیدی مدیاز ثبت شده:</span>
                <span dir="ltr" className="text-xs font-mono font-black text-cyan-300">
                  @{user.username}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>معتبر</span>
              </div>
            </div>
          )}

          {/* Field 3: Password & Confirm Password (if needed) */}
          {needsPassword && (
            <>
              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>رمز عبور برای ورود به لپ‌تاپ:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">حداقل ۴ کاراکتر</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 text-white font-mono text-xs transition-all shadow-inner outline-none text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-0 top-0 bottom-0 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تکرار رمز عبور:</span>
                  </span>
                  {confirmPassword && password === confirmPassword && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>مطابقت دارد</span>
                    </span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 text-white font-mono text-xs transition-all shadow-inner outline-none text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-0 top-0 bottom-0 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? 'مخفی‌سازی تکرار رمز' : 'نمایش تکرار رمز'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (isUsernameLegacy && usernameStatus !== 'available') ||
                (needsPassword && (!password || password.length < 4 || password !== confirmPassword))
              }
              className="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-blue-600/30 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره و همگام‌سازی...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تکمیل حساب و ورود به دوره‌ها</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Safety Escape Hatch: Sign Out button */}
        <div className="pt-3 border-t border-slate-800/80 mt-2 relative z-10">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full min-h-[44px] py-2 text-xs text-slate-400 hover:text-rose-400 font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از حساب کاربری</span>
          </button>
        </div>
      </div>
    </div>
  );
};
