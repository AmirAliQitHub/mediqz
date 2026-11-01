import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { MediazLogo } from '../common/MediazLogo';

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

    setErrorMsg('');
    setIsLoading(true);
    try {
      await completeOnboarding(displayName.trim(), selectedGrade);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت اطلاعات.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 text-right relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center flex flex-col items-center gap-2">
          <div className="p-2 rounded-2xl bg-white/80 border border-blue-100 shadow-md">
            <MediazLogo size="md" showText={false} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            به مدیاز خوش آمدید!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs leading-relaxed">
            جهت شخصی‌سازی محتوا و تنظیم برنامه مرورها، نام و مقطع تحصیلی خود را مشخص کنید.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs text-center">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">
              نام و نام خانوادگی:
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="مثال: امیرعلی رخشانی"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-2 text-xs">
              پایه تحصیلی شما:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {GRADES.map((g) => {
                const isSelected = selectedGrade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrade(g.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-400/40 shadow-sm'
                        : 'border-slate-200 bg-white/70 hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">{g.icon}</span>
                      <span className="font-black text-xs sm:text-sm">{g.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {g.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg shadow-blue-500/30 cursor-pointer transition-all active:scale-98 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2"
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
