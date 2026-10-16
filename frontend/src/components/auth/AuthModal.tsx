import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { user, login } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }
    if (isRegister && !displayName.trim()) {
      alert('لطفاً نام نمایشی خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload: any = { username: username.trim(), password: password.trim() };
      if (isRegister) payload.display_name = displayName.trim();

      const res = await api.post<{ token: string; user: any }>(endpoint, payload);
      login(res.token, res.user);
    } catch (err: any) {
      alert(err.message || 'خطا در ورود به سامانه.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col gap-5 text-right">
        <div className="text-center flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-white flex items-center justify-center text-xl mb-1 shadow-md shadow-blue-500/20">
            ✦
          </div>
          <h2 className="text-xl font-black text-blue-950">
            {isRegister ? 'ثبت‌نام در آلکالیت اینتراکتیو' : 'ورود به Alqualite CourseBox'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">موتور یادگیری تعاملی و شناختی</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {isRegister && (
            <div>
              <label className="block text-slate-600 font-bold mb-1">نام و نام خانوادگی:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثال: امیرعلی رخشانی"
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-600 font-bold mb-1">نام کاربری:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">رمز عبور:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black shadow-md shadow-blue-500/25 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            {isLoading ? 'در حال برقراری ارتباط...' : isRegister ? 'ایجاد حساب کاربری' : 'ورود به حساب'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
          >
            {isRegister ? 'قبلاً ثبت‌نام کرده‌اید؟ ورود' : 'حساب کاربری ندارید؟ ثبت‌نام جدید'}
          </button>
        </div>
      </div>
    </div>
  );
};
