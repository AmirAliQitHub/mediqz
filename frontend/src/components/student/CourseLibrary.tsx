import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

const SUBJECT_FILTERS = [
  { id: 'all', label: 'همه محتواها' },
  { id: 'farsi', label: 'فارسی و ادبیات', keywords: ['فارسی', 'لغت', 'اعلام', 'واژه'] },
  { id: 'grade10', label: 'پایه دهم', keywords: ['دهم', 'fa10', '10'] },
  { id: 'grade11', label: 'پایه یازدهم', keywords: ['یازدهم', 'fa11', '11'] },
  { id: 'grade12', label: 'پایه دوازدهم', keywords: ['دوازدهم', 'fa12', '12'] },
  { id: 'arabic', label: 'عربی', keywords: ['عربی', 'arabic'] },
  { id: 'biology', label: 'زیست‌شناسی', keywords: ['زیست', 'bio', 'نورولوژی', 'عصب'] },
];

export const CourseLibrary: React.FC = () => {
  const { courses, fetchCourses, selectCourse } = useCourseStore();
  const { setActiveTab } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenCourse = async (courseId: string) => {
    try {
      await selectCourse(courseId);
      setActiveTab('course-parts');
    } catch (e: any) {
      alert(e.message || 'خطا در بارگیری محتوا');
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        await api.post('/courses/import', parsed);
        alert('دوره آموزشی جدید با موفقیت افزوده شد.');
        await fetchCourses();
      } catch (err: any) {
        alert(err.message || 'خطا در ایمپورت فایل.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredCourses = useMemo(() => {
    let list = [...courses];

    if (activeSubject !== 'all') {
      const activeObj = SUBJECT_FILTERS.find((s) => s.id === activeSubject);
      if (activeObj?.keywords) {
        list = list.filter((c) => {
          const text = `${c.title} ${c.topic_code || ''} ${c.description || ''} ${c.subject || ''} ${c.grade || ''}`.toLowerCase();
          return activeObj.keywords!.some((k) => text.includes(k.toLowerCase()));
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.topic_code && c.topic_code.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [courses, activeSubject, searchQuery]);

  return (
    <main className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-32 flex flex-col gap-6 text-right animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="liquid-glass-card p-6 md:p-8 flex justify-between items-center flex-wrap gap-4 shadow-liquid border border-white/90">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/90 text-blue-950 text-xs font-black mb-2 border border-blue-200/80">
            <span>✦</span> Alqualite CourseBox • آلکالیت اینتراکتیو
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-blue-950">
            کتابخانه دوره‌های آموزشی اینتراکتیو
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium max-w-xl">
            واژه‌نامه‌های هوشمند تفکیک فصل، اعلام و تاریخ ادبیات ۴ بعدی، و کارگاه‌های تسلط تعاملی شناختی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-white/90 hover:bg-white border border-blue-900/15 text-blue-900 text-xs font-black shadow-xs cursor-pointer transition-all hover:border-blue-400 active:scale-95 flex items-center gap-1.5"
          >
            <span>+</span>
            <span>ایمپورت دوره (.json)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-xl border border-blue-900/10 p-2.5 rounded-2xl shadow-xs">
        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {SUBJECT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveSubject(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSubject === f.id
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25 font-black'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-blue-950 border border-transparent hover:border-blue-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی عنوان یا مبحث..."
            className="w-full px-3.5 py-1.5 pr-8 rounded-xl bg-white/90 border border-blue-200/80 text-xs text-blue-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="liquid-glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl">
            📚
          </span>
          <div>
            <h3 className="text-base font-black text-blue-950">محتوایی در این دسته‌بندی یافت نشد</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              می‌توانید فیلترها را تغییر دهید یا یک فایل دوره با ساختار CourseBox ایمپورت کنید.
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveSubject('all'); }}
              className="text-xs font-black text-blue-600 hover:underline"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredCourses.map((c) => {
            const isBuiltin = c.type === 'builtin';
            return (
              <div
                key={c.id}
                onClick={() => handleOpenCourse(c.id)}
                className={`p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between gap-5 group relative overflow-hidden ${
                  isBuiltin
                    ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white border border-blue-500/30 shadow-xl hover:border-blue-400/70 hover:shadow-2xl'
                    : 'liquid-glass-card hover:border-blue-400/60 shadow-md hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isBuiltin
                            ? 'bg-blue-500/25 text-blue-200 border border-blue-400/30'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {isBuiltin ? 'دوره رسمی' : 'سفارشی'}
                      </span>
                      {c.title.includes('اعلام') ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                          ماتریس ۴ بعدی اعلام
                        </span>
                      ) : c.title.includes('واژه') || c.title.includes('لغت') ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                          واژه‌نامه هوشمند
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`text-xs font-mono font-bold ${
                        isBuiltin ? 'text-blue-300/80' : 'text-slate-400'
                      }`}
                    >
                      {c.topic_code}
                    </span>
                  </div>

                  <h3
                    className={`text-lg font-black mb-2 transition-colors ${
                      isBuiltin
                        ? 'text-white group-hover:text-blue-200'
                        : 'text-blue-950 group-hover:text-blue-700'
                    }`}
                  >
                    {c.title}
                  </h3>

                  <p
                    className={`text-xs font-medium line-clamp-2 leading-relaxed ${
                      isBuiltin ? 'text-blue-100/80' : 'text-slate-500'
                    }`}
                  >
                    {c.description || 'واحدهای یادگیری تعاملی و تمرین شناختی'}
                  </p>
                </div>

                <div
                  className={`pt-3.5 border-t flex items-center justify-between text-xs font-bold ${
                    isBuiltin
                      ? 'border-white/10 text-blue-200/90'
                      : 'border-blue-900/10 text-slate-500'
                  }`}
                >
                  <span className="font-medium text-[11px]">
                    ✦ {c.parts_count || 1} پارت | {c.slides_count} اسلاید
                  </span>
                  <span
                    className={`font-black flex items-center gap-1 group-hover:-translate-x-1 transition-transform ${
                      isBuiltin ? 'text-cyan-300' : 'text-blue-700'
                    }`}
                  >
                    <span>ورود به دوره</span>
                    <span>←</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};
