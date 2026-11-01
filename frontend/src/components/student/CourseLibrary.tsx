import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Search, X, BookOpen, FlaskConical, Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

const SUBJECT_FILTERS = [
  { id: 'all', label: 'همه دوره‌ها' },
  { id: 'farsi', label: 'ادبیات فارسی', keywords: ['فارسی', 'املا', 'آرایه', 'لغت', 'اعلام', 'واژه', 'fa_emla', 'fa_araye', 'fa10', 'fa11', 'fa12'] },
  { id: 'arabic', label: 'عربی کنکور و نهایی', keywords: ['عربی', 'arabic', 'ترجمه', 'قواعد', 'ar_rules', 'ar10', 'ar11', 'ar12'] },
  { id: 'chemistry', label: 'شیمی تخصصی', keywords: ['شیمی', 'chem', 'کاتالیزور', 'شعله', 'عاملی', 'جدول', 'عنصر', 'ch_catalysts', 'ch_groups', 'ch_pt'] },
  { id: 'physics', label: 'فیزیک و یکاها', keywords: ['فیزیک', 'physics', 'یکا', 'si', 'دیمانسیون', 'ph_units'] },
  { id: 'biology', label: 'زیست‌شناسی', keywords: ['زیست', 'bio', 'قید', 'اصطلاح', 'نورولوژی', 'bi_ghayd'] },
  { id: 'general', label: 'دینی و سلامت', keywords: ['دین', 'دینی', 'قرآن', 'آیات', 'سلامت', 'بهداشت', 'di12', 'he12'] },
  { id: 'grade10', label: 'پایه دهم', keywords: ['دهم', 'fa10', 'ar10', '10'] },
  { id: 'grade11', label: 'پایه یازدهم', keywords: ['یازدهم', 'fa11', 'ar11', '11'] },
  { id: 'grade12', label: 'پایه دوازدهم', keywords: ['دوازدهم', 'fa12', 'ar12', 'di12', 'he12', '12'] },
];

export const CourseLibrary: React.FC = () => {
  const { courses, fetchCourses, selectCourse } = useCourseStore();
  const { user, setActiveTab } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeDev, setIncludeDev] = useState<boolean>(false);

  useEffect(() => {
    fetchCourses(includeDev);
  }, [includeDev]);

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
        await fetchCourses(includeDev);
      } catch (err: any) {
        alert(err.message || 'خطا در ایمپورت فایل.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const visibleFilters = useMemo(() => {
    if (user?.is_superuser || includeDev) {
      return SUBJECT_FILTERS;
    }
    // Stable filters only for standard users
    return SUBJECT_FILTERS.filter(
      (f) => ['all', 'farsi', 'arabic', 'grade10', 'grade11', 'grade12'].includes(f.id)
    );
  }, [user, includeDev]);

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
    <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-[calc(4.25rem+var(--sat,0px))] sm:pt-20 md:pt-24 pb-[calc(8rem+var(--sab,0px))] flex flex-col gap-4 sm:gap-5 text-right animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="liquid-glass-card p-4 sm:p-7 md:p-8 flex justify-between items-center flex-wrap gap-4 shadow-liquid border border-white/90">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/90 text-blue-950 text-xs font-black mb-2 border border-blue-200/80">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>مدیاز • سامانه یادگیری هوشمند</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-950">
            کتابخانه دوره‌های آموزشی اینتراکتیو
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-xl leading-relaxed">
            واژه‌نامه‌های هوشمند تفکیک فصل، اعلام و تاریخ ادبیات ۴ بعدی، و کارگاه‌های تسلط تعاملی شناختی
          </p>
        </div>

        {user?.is_superuser && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIncludeDev(!includeDev)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 shadow-xs ${
                includeDev
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/25'
                  : 'bg-white/90 text-amber-900 border-amber-300/80 hover:bg-amber-50'
              }`}
              title="نمایش دوره‌های در حال توسعه و آزمایشی"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{includeDev ? 'مخفی‌سازی دوره‌های تستی' : 'دوره‌های تستی'}</span>
            </button>

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
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/90 hover:bg-white border border-blue-900/15 text-blue-900 text-xs font-black shadow-xs cursor-pointer transition-all hover:border-blue-400 active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ایمپورت دوره</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-xl border border-blue-900/10 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto -mx-1 px-1 sm:mx-0 sm:px-0 pb-1.5 sm:pb-0 scrollbar-none touch-pan-x">
          {visibleFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveSubject(f.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
        <div className="w-full sm:w-64 relative flex items-center">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی عنوان یا مبحث..."
            className="w-full min-h-[40px] py-2 pr-9 pl-8 rounded-xl bg-white/90 border border-blue-200/80 text-xs text-blue-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-5 h-5 flex items-center justify-center cursor-pointer rounded-full hover:bg-slate-100"
              aria-label="پاک کردن متن جستجو"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="liquid-glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-blue-950">محتوایی در این دسته‌بندی یافت نشد</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              می‌توانید فیلترها را تغییر دهید یا واژه دیگری را جستجو نمایید.
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveSubject('all'); }}
              className="text-xs font-black text-blue-600 hover:underline cursor-pointer"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCourses.map((c) => {
            const isBuiltin = c.type === 'builtin';
            return (
              <div
                key={c.id}
                onClick={() => handleOpenCourse(c.id)}
                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] cursor-pointer flex flex-col justify-between gap-4 sm:gap-5 group relative overflow-hidden ${
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
                      {c.topic_code === 'fa10_emla' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          املای دهم • ۸ فصل نهایی
                        </span>
                      ) : c.topic_code === 'fa11_emla' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          املای یازدهم • ۸ فصل نهایی
                        </span>
                      ) : c.topic_code === 'fa12_emla' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          املای دوازدهم • ۸ فصل نهایی
                        </span>
                      ) : c.topic_code === 'fa_emla' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          املای دام‌دار و واژه‌گزینی
                        </span>
                      ) : c.topic_code === 'fa_araye' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-400/20 text-pink-300 border border-pink-400/30">
                          کارگاه آرایه‌های ادبی
                        </span>
                      ) : c.topic_code === 'ar_rules' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                          فنون ترجمه و تعریب
                        </span>
                      ) : c.topic_code === 'ch_catalysts' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-400/20 text-violet-300 border border-violet-400/30">
                          کاتالیزورها و رنگ‌های شیمی
                        </span>
                      ) : c.topic_code === 'ch_groups' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30">
                          گروه‌های عاملی شیمی آلی
                        </span>
                      ) : c.topic_code === 'ph_units' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                          یکاهای SI و دیمانسیون
                        </span>
                      ) : c.topic_code === 'ch_pt' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                          جدول تناوبی عناصر
                        </span>
                      ) : c.topic_code === 'bi_ghayd' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                          قیود سرنوشت‌ساز زیست
                        </span>
                      ) : c.topic_code === 'di12_ayat' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                          پیام آیات و روایات
                        </span>
                      ) : c.topic_code === 'he12' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300 border border-rose-400/30">
                          سلامت و بهداشت
                        </span>
                      ) : c.title.includes('اعلام') ? (
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
                    <ArrowLeft className="w-3.5 h-3.5" />
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
