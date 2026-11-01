import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { AdminUser } from '../../types';

export const AdminUserManagement: React.FC = () => {
  const { user, setActiveTab } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get<any>('/admin/users');
      const list = Array.isArray(res) ? res : (res?.users || []);
      setUsers(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در دریافت لیست کاربران.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.grade && u.grade.toLowerCase().includes(q))
    );
  });

  const totalUsers = users.length;
  const telegramUsers = users.filter((u) => u.telegram_id).length;
  const onboardedUsers = users.filter((u) => u.is_onboarded).length;
  const superusers = users.filter((u) => u.is_superuser).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-28 animate-fadeIn flex flex-col gap-6">
      {/* Header bar */}
      <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25">
            👑
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              مدیریت دانش‌آموزان و دسترسی‌ها
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              پنل مدیریت ادمین ارشد (سوپریوزر: {user?.display_name || user?.username})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('courses')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>← بازگشت به دوره‌ها</span>
          </button>
          <button
            onClick={fetchUsers}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <span>🔄 بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-bold text-slate-400">کل کاربران ثبت‌نامی</span>
          <span className="text-2xl font-black text-slate-900">{totalUsers}</span>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-bold text-blue-500">کاربران تلگرامی</span>
          <span className="text-2xl font-black text-blue-600">{telegramUsers}</span>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-bold text-emerald-500">تکمیل پروفایل و پایه</span>
          <span className="text-2xl font-black text-emerald-600">{onboardedUsers}</span>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-bold text-amber-500">ادمین و سوپریوزر</span>
          <span className="text-2xl font-black text-amber-600">{superusers}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-3 shadow-sm flex items-center gap-3">
        <span className="text-slate-400 pr-2">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو بر اساس نام، نام کاربری یا مقطع تحصیلی..."
          className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold pl-2 cursor-pointer"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* Users List */}
      {errorMsg ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center font-bold text-sm">
          {errorMsg}
        </div>
      ) : isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-xs font-bold">در حال فراخوانی اطلاعات دانش‌آموزان...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 font-bold text-sm bg-white/60 rounded-3xl border border-dashed border-slate-200">
          کاربری با این مشخصات یافت نشد.
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-xl border border-white/90 rounded-3xl overflow-hidden shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">شناسه</th>
                  <th className="py-4 px-6">نام کاربر</th>
                  <th className="py-4 px-6">نام کاربری</th>
                  <th className="py-4 px-6">پایه تحصیلی</th>
                  <th className="py-4 px-6">وضعیت تلگرام</th>
                  <th className="py-4 px-6">نقش کاربری</th>
                  <th className="py-4 px-6">تاریخ ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-400 text-xs">#{u.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{u.display_name || 'بدون نام'}</span>
                        {u.is_superuser && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black border border-amber-200">
                            👑 مدیر
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{u.username}</td>
                    <td className="py-4 px-6">
                      {u.grade ? (
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
                          {u.grade}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">تعیین نشده</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {u.telegram_id ? (
                        <span className="inline-flex items-center gap-1 text-sky-600 font-mono text-xs bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                          <span>✈️</span>
                          <span>{u.telegram_id}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">وب مستقیم</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          u.is_superuser
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.is_superuser ? 'Superuser' : 'دانش‌آموز'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fa-IR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100 p-2">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      {u.display_name || 'بدون نام'}
                    </span>
                    {u.is_superuser && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">
                        👑 مدیر
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-slate-400">#{u.id}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">@{u.username}</span>
                  {u.grade && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                      {u.grade}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                  <span>{u.telegram_id ? `تلگرام: ${u.telegram_id}` : 'وب مستقیم'}</span>
                  <span className="font-mono">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('fa-IR') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
