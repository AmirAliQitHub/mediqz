import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Send,
  GraduationCap,
  Sparkles,
  Smartphone,
  Globe,
  AtSign,
  Check,
  Loader2,
  Edit3,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export const UserAccountTab: React.FC = () => {
  const { user, setActiveTab, logout, changeUsername } = useAuthStore();
  const setUserPasswordStatus = (hasPassword: boolean) => {
    if (user) {
      useAuthStore.setState({ user: { ...user, has_password: hasPassword } });
    }
  };

  // Mediqz ID (Username) Editing State (Council Mandate & Module 9)
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsernameVal, setEditUsernameVal] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'current'>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string>('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const checkSeqRef = useRef<number>(0);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Debounced real-time username availability checker with self-collision exemption
  useEffect(() => {
    if (!isEditingUsername) return;

    const clean = editUsernameVal.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      return;
    }

    if (user && clean === user.username.toLowerCase()) {
      setUsernameStatus('current');
      setUsernameFeedback('نام کاربری فعلی شما');
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
          `/auth/check-username?username=${encodeURIComponent(clean)}${user ? `&exclude_user_id=${user.id}` : ''}`
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
  }, [editUsernameVal, isEditingUsername, user]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    const clean = editUsernameVal.trim().toLowerCase();
    if (user && clean === user.username.toLowerCase()) {
      setIsEditingUsername(false);
      return;
    }
    if (usernameStatus !== 'available') {
      setUsernameError(usernameFeedback || 'لطفاً نام کاربری معتبر و آزادی وارد فرمایید.');
      return;
    }

    setUsernameLoading(true);
    try {
      const res = await changeUsername(clean);
      if (res.success) {
        setUsernameSuccess('نام کاربری (آیدی مدیاز) با موفقیت تغییر یافت.');
        setTimeout(() => {
          setIsEditingUsername(false);
          setUsernameSuccess(null);
        }, 2000);
      } else {
        setUsernameError(res.error || 'خطا در تغییر نام کاربری.');
      }
    } catch (err: any) {
      setUsernameError(err?.message || 'خطا در تغییر نام کاربری.');
    } finally {
      setUsernameLoading(false);
    }
  };

  // Detect Telegram WebApp
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      setPasswordError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (trimmed !== confirmPassword.trim()) {
      setPasswordError('تکرار رمز عبور با رمز عبور وارد شده مطابقت ندارد.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/set-password', { password: trimmed });
      setUserPasswordStatus(true);
      setPasswordSuccess('رمز عبور وب با موفقیت ذخیره شد. اکنون می‌توانید در مرورگرها نیز وارد شوید.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess(null);
      }, 2500);
    } catch (err: any) {
      setPasswordError(err?.message || 'خطا در ثبت رمز عبور. لطفاً مجدداً تلاش کنید.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const gradePersianMap: Record<string, string> = {
    g10: 'پایه دهم تجربی',
    g11: 'پایه یازدهم تجربی',
    g12: 'پایه دوازدهم تجربی',
    konkur: 'داوطلب کنکور سراسری',
  };

  const gradeTitle = user.grade ? (gradePersianMap[user.grade] || user.grade) : 'تعیین نشده';
  const hasTelegramLinked = Boolean(user.telegram_user_id);
  const hasWebPassword = Boolean(user.has_password);

  return (
    <div className="w-full min-h-screen bg-transparent text-right dir-rtl pb-[calc(var(--sab)+7rem)] pt-2 sm:pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
        
        {/* Navigation Bar / Return to Course Library */}
        <div className="flex items-center justify-between pb-2">
          <button
            onClick={() => setActiveTab('courses')}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 font-bold text-xs shadow-2xs border border-white/80 transition-all cursor-pointer active:scale-95"
            aria-label="بازگشت به دوره‌ها"
          >
            <ArrowRight className="w-4 h-4 text-blue-600" />
            <span>بازگشت به دوره‌ها</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <span>حساب کاربری</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl border border-white/85 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
              {user.display_name ? user.display_name.charAt(0) : user.username.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                  {user.display_name || user.username}
                </h2>
                {user.is_superuser && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    مدیر سیستم
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-0.5 truncate text-right">
                <span dir="ltr" className="font-mono">@{user.username}</span>
              </p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-800 text-[11px] font-bold flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  {gradeTitle}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-mono font-bold">
                  سطح دسترسی: {user.access_level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mediqz ID (Username) Management Card (Council Mandate & Module 9) */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl border border-white/85 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                <AtSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">شناسه اختصاصی ورود (آیدی مدیاز)</h3>
                <p className="text-[11px] text-slate-500">نام کاربری اختصاصی برای ورود در لپ‌تاپ، وب و لاگین جادویی</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-mono font-bold flex items-center gap-1">
              <span dir="ltr">@{user.username}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>توجه:</strong> با تغییر آیدی، برای ورود به وب و لپ‌تاپ از این پس باید از آیدی جدید استفاده کنید.
            </p>
          </div>

          {!isEditingUsername ? (
            <button
              onClick={() => {
                setEditUsernameVal(user.username);
                setIsEditingUsername(true);
                setUsernameError(null);
                setUsernameSuccess(null);
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Edit3 className="w-4 h-4 text-violet-600" />
              <span>ویرایش نام کاربری (آیدی مدیاز)</span>
            </button>
          ) : (
            <form onSubmit={handleUsernameSubmit} className="space-y-3 pt-2">
              {usernameError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{usernameError}</span>
                </div>
              )}

              {usernameSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{usernameSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-1">
                    <bdi>آیدی مدیاز جدید (انگلیسی):</bdi>
                  </label>
                  <span className="text-[10px] text-blue-600 font-medium">حروف کوچک، عدد و _</span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={editUsernameVal}
                    onChange={(e) => setEditUsernameVal(e.target.value)}
                    placeholder="new_username"
                    disabled={usernameLoading}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 dir-ltr text-left"
                  />
                </div>

                {/* Fixed-Height Feedback Container (CLS Elimination) */}
                <div className="h-6 min-h-[24px] flex items-center justify-between px-1 text-[11px] font-bold">
                  {usernameStatus === 'checking' && (
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال استعلام دسترسی...</span>
                    </div>
                  )}
                  {usernameStatus === 'current' && (
                    <span className="text-slate-500 font-normal">نام کاربری فعلی شما</span>
                  )}
                  {usernameStatus === 'available' && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                      <span>نام کاربری آزاد و قابل استفاده است</span>
                    </div>
                  )}
                  {usernameStatus === 'unavailable' && (
                    <div className="flex items-center gap-1.5 text-rose-600 truncate">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{usernameFeedback}</span>
                    </div>
                  )}
                  {usernameStatus === 'idle' && (
                    <span className="text-[10px] text-slate-400 font-normal">۳ تا ۳۰ کاراکتر انگلیسی کوچک، عدد یا _</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={
                    usernameLoading ||
                    usernameStatus === 'checking' ||
                    usernameStatus === 'unavailable' ||
                    usernameStatus === 'current' ||
                    !editUsernameVal.trim()
                  }
                  className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {usernameLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ذخیره نام کاربری جدید</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={usernameLoading}
                  onClick={() => {
                    setIsEditingUsername(false);
                    setUsernameError(null);
                    setUsernameSuccess(null);
                  }}
                  className="px-4 min-h-[44px] py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Telegram Synchronization Card */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl border border-white/85 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">همگام‌سازی ربات تلگرام</h3>
                <p className="text-[11px] text-slate-500">اتصال یکپارچه حساب کاربری با ربات @MediqzBot</p>
              </div>
            </div>

            {hasTelegramLinked ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                متصل و فعال
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                عدم اتصال
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">وضعیت اتصال به تلگرام:</span>
              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {user.telegram_username ? `@${user.telegram_username}` : (user.telegram_user_id ? 'متصل و فعال' : 'ثبت نشده')}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-normal pt-1 border-t border-slate-200/40">
              {hasTelegramLinked ? (
                <span>
                  اکانت تلگرام شما متصل است. هنگام باز کردن سامانه درون ربات تلگرام، به طور خودکار و بدون نیاز به رمز عبور وارد می‌شوید.
                </span>
              ) : (
                <span>
                  برای اتصال تلگرام، کافیست یک‌بار با نام کاربری و رمز عبور خود در وب‌اپ تلگرام وارد شوید تا اکانت شما خودکار متصل گردد.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Web Password Management Card (Bi-directional Auth) */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl border border-white/85 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">رمز عبور ورود به سامانه وب</h3>
                <p className="text-[11px] text-slate-500">برای ورود از مرورگرهای Safari ،Chrome و کامپیوتر</p>
              </div>
            </div>

            {hasWebPassword ? (
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                دارای رمز عبور
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                تنظیم نشده
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/70 text-xs text-slate-600 leading-relaxed">
            <p>
              با تعریف رمز عبور، می‌توانید در هر دستگاهی خارج از تلگرام، با وارد کردن نام کاربری و این رمز وارد حساب خود شوید.
            </p>
          </div>

          {!isChangingPassword ? (
            <button
              onClick={() => {
                setIsChangingPassword(true);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>{hasWebPassword ? 'تغییر رمز عبور ورود وب' : 'تنظیم رمز عبور جدید برای وب'}</span>
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">رمز عبور جدید (حداقل ۶ کاراکتر):</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={passwordLoading}
                    className="w-full min-h-[44px] px-3.5 py-2 pl-10 rounded-2xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dir-ltr text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">تکرار رمز عبور جدید:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={passwordLoading}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dir-ltr text-left"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ذخیره رمز عبور</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={passwordLoading}
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 min-h-[44px] py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}
        </div>

        {/* System & Session Diagnostics Card */}
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl border border-white/85 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">محیط اجرایی فعال:</span>
            <div className="flex items-center gap-1.5 font-bold">
              {isTelegramWebApp ? (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Telegram WebApp
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  وب مستقل (Browser)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-600 font-medium">نسخه سامانه یادگیری مدیاز:</span>
            <div className="font-mono text-xs text-slate-500 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>v3.5.0-identities (موتور تفکیک هویت سه‌گانه)</span>
            </div>
          </div>
        </div>

        {/* Logout Action Area */}
        <div className="pt-2">
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>خروج از حساب کاربری</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 text-center">
              <p className="text-xs font-bold text-rose-800">
                آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => logout()}
                  className="px-5 min-h-[40px] py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  بله، خروج قطعی
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-5 min-h-[40px] py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs shadow-2xs cursor-pointer transition-all active:scale-95"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
