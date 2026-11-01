import React, { useState } from 'react';
import { useCourseStore } from '../../../store/useCourseStore';
import { useRoutineStore } from '../../../store/useRoutineStore';
import { Course, Part } from '../../../types';
import { X, Plus, Check } from 'lucide-react';

interface Props {
  dayNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPartToRoutineModal: React.FC<Props> = ({ dayNumber, isOpen, onClose }) => {
  const { courses, fetchCourseById } = useCourseStore();
  const { addItemToDay, days } = useRoutineStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [loadedCourse, setLoadedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addedPartIds, setAddedPartIds] = useState<Set<string>>(new Set());

  const day = days.find((d) => d.day_number === dayNumber);

  const handleSelectCourse = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsLoading(true);
    try {
      const course = await fetchCourseById(courseId);
      setLoadedCourse(course);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && courses.length > 0) {
      void handleSelectCourse(courses[0].id);
    }
  }, [isOpen, courses]);

  if (!isOpen) return null;

  const handleAddPart = (part: Part) => {
    if (!loadedCourse) return;
    addItemToDay(dayNumber, {
      course_id: loadedCourse.course_id,
      course_title: loadedCourse.title,
      part_id: part.part_id,
      part_title: part.title,
      slide_count: part.eus.length,
    });
    setAddedPartIds((prev) => new Set(prev).add(part.part_id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl flex flex-col gap-4 text-right max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-800 text-sm font-black">
              📅 روز {dayNumber}
            </span>
            <h2 className="text-base sm:text-lg font-black text-blue-950">
              افزودن پارت به روتین
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course Picker Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {courses.map((c) => {
            const isSelected = selectedCourseId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCourse(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                }`}
              >
                {c.title}
              </button>
            );
          })}
        </div>

        {/* Parts List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-[50vh] pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-blue-600 font-bold animate-pulse">
              در حال بارگذاری پارت‌های دوره...
            </div>
          ) : loadedCourse ? (
            loadedCourse.parts.map((p, idx) => {
              const alreadyInDay = day?.items.some(
                (i) => i.course_id === loadedCourse.course_id && i.part_id === p.part_id
              );
              const isJustAdded = addedPartIds.has(p.part_id);

              return (
                <div
                  key={p.part_id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {p.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {p.eus.length} اسلاید
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddPart(p)}
                    disabled={alreadyInDay || isJustAdded}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      alreadyInDay || isJustAdded
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {alreadyInDay || isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>افزوده شد</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              دوره‌ای انتخاب نشده است.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-md cursor-pointer"
          >
            بستن و مشاهده روتین
          </button>
        </div>
      </div>
    </div>
  );
};
