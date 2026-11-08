import React, { useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toPersianDigits } from '../../../utils/shamsiCalendar';

interface DynamicListInputProps {
  items: string[];
  onChange: (newItems: string[]) => void;
  placeholderActive: string;
  placeholderNext?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  dimensionLabel?: string;
}

export const DynamicListInput: React.FC<DynamicListInputProps> = ({
  items,
  onChange,
  placeholderActive,
  placeholderNext = 'افزودن مورد بعدی...',
  badgeBgColor = 'bg-purple-500/20',
  badgeTextColor = 'text-purple-300',
  badgeBorderColor = 'border-purple-500/30',
  dimensionLabel,
}) => {
  // Ensure there is always at least 1 editable item visible
  const displayItems = items.length === 0 ? [''] : items;
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const lastAddedIndexRef = useRef<number | null>(null);

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(48, el.scrollHeight)}px`;
  };

  useEffect(() => {
    // Resize all active textareas when items change or mount
    textareaRefs.current.forEach((el) => {
      if (el) autoResize(el);
    });
  }, [displayItems]);

  useEffect(() => {
    // If a new item was dynamically added via grayed-out card, focus and scroll to it
    if (lastAddedIndexRef.current !== null) {
      const idx = lastAddedIndexRef.current;
      const targetEl = textareaRefs.current[idx];
      if (targetEl) {
        targetEl.focus();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      lastAddedIndexRef.current = null;
    }
  }, [displayItems.length]);

  const handleTextChange = (idx: number, value: string) => {
    const updated = [...displayItems];
    updated[idx] = value;
    onChange(updated);
  };

  const handleDeleteItem = (idx: number) => {
    if (displayItems.length <= 1) {
      // Clear the single row
      onChange(['']);
    } else {
      const updated = displayItems.filter((_, i) => i !== idx);
      onChange(updated);
    }
  };

  const handleActivateNext = () => {
    const updated = [...displayItems, ''];
    lastAddedIndexRef.current = updated.length - 1;
    onChange(updated);
  };

  return (
    <div className="space-y-3.5 w-full" dir="rtl">
      {displayItems.map((item, idx) => {
        const itemNumber = toPersianDigits(idx + 1);
        return (
          <div
            key={idx}
            className="group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-purple-950/40 border border-purple-500/25 backdrop-blur-xl shadow-lg shadow-purple-950/20 transition-all duration-200 focus-within:border-purple-400/60 focus-within:bg-purple-950/60 focus-within:shadow-purple-500/10"
          >
            {/* Persian Number Badge (RTL Right side) */}
            <div
              className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base border ${badgeBgColor} ${badgeTextColor} ${badgeBorderColor} shadow-inner select-none`}
            >
              {itemNumber}
            </div>

            {/* Auto-growing Textarea */}
            <textarea
              ref={(el) => (textareaRefs.current[idx] = el)}
              value={item}
              onChange={(e) => {
                autoResize(e.target);
                handleTextChange(idx, e.target.value);
              }}
              placeholder={idx === 0 ? placeholderActive : `${dimensionLabel || 'مورد'} ${itemNumber}...`}
              rows={1}
              className="flex-1 bg-transparent text-purple-100 placeholder-purple-400/40 text-sm sm:text-base leading-relaxed resize-none outline-none focus:outline-none min-h-[44px] py-1 px-1 transition-colors"
            />

            {/* Explicit 40x40px Touch Target Trash Button (Physical Left in RTL) */}
            <button
              type="button"
              onClick={() => handleDeleteItem(idx)}
              title="حذف این مورد"
              aria-label={`حذف مورد ${itemNumber}`}
              className="flex-shrink-0 w-10 h-10 -ml-1 -mt-1 rounded-xl flex items-center justify-center text-purple-400/50 hover:text-rose-400 hover:bg-rose-500/15 active:bg-rose-500/25 transition-all touch-manipulation cursor-pointer"
            >
              <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        );
      })}

      {/* Grayed-Out "Next Item" Card */}
      <div
        role="button"
        tabIndex={0}
        data-testid="add-swot-item-btn"
        onClick={handleActivateNext}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleActivateNext();
          }
        }}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 border-dashed border-purple-400/35 bg-purple-900/15 hover:border-purple-400/60 hover:bg-purple-900/30 text-purple-300/70 hover:text-purple-100 transition-all duration-200 cursor-pointer group active:scale-[0.99] select-none touch-manipulation"
      >
        <div className="flex items-center gap-3">
          {/* Grayed-out Number Badge with Next Persian Digit */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base border border-dashed border-purple-400/40 bg-purple-900/30 text-purple-300/60 group-hover:border-purple-300 group-hover:text-purple-100 group-hover:bg-purple-800/40 transition-colors">
            {toPersianDigits(displayItems.length + 1)}
          </div>
          <span className="text-xs sm:text-sm font-medium tracking-wide">
            {placeholderNext}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-purple-400/60 group-hover:text-purple-200 transition-colors pl-1">
          <span className="hidden sm:inline">کلیک برای افزودن</span>
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
};
