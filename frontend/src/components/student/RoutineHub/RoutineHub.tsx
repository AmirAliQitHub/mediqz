import React, { useState } from 'react';
import { useRoutineStore } from '../../../store/useRoutineStore';
import { useCourseStore } from '../../../store/useCourseStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AddPartToRoutineModal } from './AddPartToRoutineModal';
import {
  Calendar,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Zap,
  BookOpen,
  RotateCcw,
  Clock,
} from 'lucide-react';

export const RoutineHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'mistakes'>('schedule');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    days,
    currentDayNumber,
    setCurrentDay,
    removeItemFromDay,
    toggleItemCompleted,
    generateLinearRoutine,
    startAutomaticRoutine,
    mistakes,
    startMistakesCourse,
    clearMistakes,
  } = useRoutineStore();

  const { courses, fetchCourseById, startPartPlayer } = useCourseStore();
  const { setActiveTab } = useAuthStore();

  const selectedDay = days.find((d) => d.day_number === currentDayNumber) || days[0];
  const completedCount = selectedDay?.items.filter((i) => i.completed).length || 0;
  const totalCount = selectedDay?.items.length || 0;

  const handleStartDirectPart = async (courseId: string, partId: string) => {
    await fetchCourseById(courseId);
    startPartPlayer(partId);
    setActiveTab('player');
  };

  const handleAutoStart = async () => {
    if (!selectedDay || selectedDay.items.length === 0) {
      alert('ابتدا پارت‌هایی را به این روز اختصاص دهید.');
      return;
    }
    await startAutomaticRoutine(currentDayNumber);
  };

  const handleAutoGenerate = async () => {
    if (courses.length === 0) {
      alert('دوره‌ای یافت نشد.');
      return;
    }
    const confirmGen = window.confirm(
      'آیا مایلید تمام دوره‌های فعال به‌صورت روتین روزانه خطی (۲ پارت در هر روز) چیده شوند؟'
    );
    if (!confirmGen) return;
    await generateLinearRoutine(courses, 2);
  };

  return (
    <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-16 sm:pt-20 pb-32 flex flex-col gap-5 text-right animate-fadeIn select-none">
      {/* Hero Header */}
      <div className="liquid-glass-card p-5 sm:p-7 md:p-8 flex justify-between items-center flex-wrap gap-4 shadow-liquid border border-white/90">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black mb-2 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>مدیاز • مرکز روتین هوشمند و تسلط روزانه</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-950">
            RoutineHub • روتین خطی و شکارگاه اشتباهات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-xl leading-relaxed">
            تنظیم برنامه‌های روزانه از پارت‌های دوره‌های مختلف، شروع خودکار پیوسته و مرور اختصاصی واحدهای به خطا رفته.
          </p>
        </div>

        {/* Sub-Tabs Switcher: Schedule vs Mistakes */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('schedule')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-blue-950 hover:bg-white/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>برنامه روتین</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mistakes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'mistakes'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-600 hover:text-rose-950 hover:bg-white/60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>شکارگاه اشتباهات ({mistakes.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'schedule' ? (
        <>
          {/* Day Selector Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {days.map((d) => {
              const isSelected = d.day_number === currentDayNumber;
              const dayCompleted = d.items.length > 0 && d.items.every((i) => i.completed);

              return (
                <button
                  key={d.day_number}
                  type="button"
                  onClick={() => setCurrentDay(d.day_number)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap cursor-pointer transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-800 shadow-md shadow-blue-600/25 ring-2 ring-blue-400/30'
                      : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{d.title}</span>
                  {dayCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {d.items.length > 0 && !dayCompleted && (
                    <span className="text-[10px] px-1.5 rounded-full bg-blue-100 text-blue-900 font-bold">
                      {d.items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Day Schedule Card */}
          <div className="liquid-glass-card p-5 sm:p-7 flex flex-col gap-5 border border-white/90 shadow-md">
            <div className="flex justify-between items-center flex-wrap gap-3 pb-3 border-b border-blue-100/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 text-sm">
                  {selectedDay?.day_number || 1}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-blue-950">
                    {selectedDay?.title || 'برنامه روتین'}
                  </h2>
                  <span className="text-xs text-slate-400 font-bold">
                    {totalCount > 0
                      ? `${completedCount} از ${totalCount} پارت تکمیل شده`
                      : 'هنوز پارتی برای این روز تعریف نشده است'}
                  </span>
                </div>
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ افزودن پارت</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="چینش خودکار تمام دوره‌ها در روتین خطی روزانه"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">چینش خودکار روتین</span>
                  <span className="sm:hidden">چینش</span>
                </button>
              </div>
            </div>

            {/* Prominent Automatic Start Banner */}
            {totalCount > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                    ▶️
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black">
                      شروع خودکار روتین {selectedDay?.title}
                    </h3>
                    <p className="text-xs text-blue-100 font-medium">
                      پارت‌های این روز به‌صورت زنجیره‌ای و پیوسته یکی پس از دیگری پخش می‌شوند.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoStart}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all active:scale-97 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-blue-900" />
                  <span>اجرای خودکار روتین امروز</span>
                  <span>←</span>
                </button>
              </div>
            )}

            {/* Scheduled Parts List */}
            <div className="flex flex-col gap-3">
              {totalCount === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-2.5">
                  <BookOpen className="w-10 h-10 text-slate-300" />
                  <p className="text-sm text-slate-500 font-bold">
                    هیچ پارتی برای این روز در روتین ثبت نشده است.
                  </p>
                  <p className="text-xs text-slate-400">
                    روی «+ افزودن پارت» کلیک کنید یا از گزینه «چینش خودکار» استفاده فرمایید.
                  </p>
                </div>
              ) : (
                selectedDay?.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      item.completed
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white/90 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleItemCompleted(currentDayNumber, item.id)}
                        className="cursor-pointer text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                        title={item.completed ? 'علامت به عنوان تکمیل‌نشده' : 'علامت به عنوان تکمیل‌شده'}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            {item.course_title}
                          </span>
                          {item.completed && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              ✓ مطالعه شده
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                          {item.part_title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.slide_count} اسلاید یادگیری
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartDirectPart(item.course_id, item.part_id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer shadow-xs transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span className="hidden sm:inline">شروع</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeItemFromDay(currentDayNumber, item.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                        title="حذف از برنامه این روز"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Mistakes Hub Tab */
        <div className="liquid-glass-card p-5 sm:p-7 flex flex-col gap-5 border border-white/90 shadow-md">
          <div className="flex justify-between items-center flex-wrap gap-3 pb-3 border-b border-rose-100/80">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black shadow-md shadow-rose-500/20 text-lg">
                🎯
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-rose-950">
                  شکارگاه اشتباهات (بانک خطاهای روتین)
                </h2>
                <span className="text-xs text-slate-400 font-bold">
                  {mistakes.length} واحد به خطا رفته برای تثبیت و مرور نهایی
                </span>
              </div>
            </div>

            {mistakes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('آیا مایلید تمام اشتباهات ثبت‌شده پاک شوند؟')) {
                    clearMistakes();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پاکسازی لیست</span>
              </button>
            )}
          </div>

          {/* Practice Mistakes Hero Banner */}
          {mistakes.length > 0 ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-pink-700 text-white shadow-lg shadow-rose-600/25 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    شروع دوره اختصاصی رفع اشکال
                  </h3>
                  <p className="text-xs text-rose-100 font-medium">
                    یک دوره پویا از تمام {mistakes.length} واحدی که در روتین غلط زده‌اید ساخته می‌شود تا آن‌ها را ۱۰۰٪ مسلط شوید.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => startMistakesCourse()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-rose-50 text-rose-900 font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all active:scale-97 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-rose-900" />
                <span>شروع دوره اشتباهات</span>
                <span>←</span>
              </button>
            </div>
          ) : (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <h3 className="text-sm font-black text-slate-800">
                هیچ خطایی ثبت نشده است!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                هر زمان در روتین یا تمرینات کلمه‌ای را نادرست بنویسید، خودکار در این بخش ذخیره می‌شود تا بتوانید دوباره از آن آزمون بدهید.
              </p>
            </div>
          )}

          {/* Mistakes Cards */}
          <div className="flex flex-col gap-3">
            {mistakes.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                      {m.course_title}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(m.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    سوال / واژه: «{m.question}»
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-medium">
                      پاسخ شما: <strong>{m.user_answer || '(خالی)'}</strong>
                    </span>
                    <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                      پاسخ صحیح: <strong>{m.correct_answer}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Part to Routine Modal */}
      <AddPartToRoutineModal
        dayNumber={currentDayNumber}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </main>
  );
};
