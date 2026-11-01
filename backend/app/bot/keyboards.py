from typing import List, Optional
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)


def get_main_reply_keyboard(web_app_url: Optional[str] = None) -> ReplyKeyboardMarkup:
    buttons = [
        [
            KeyboardButton(text="📚 واژه‌نامه‌های سه پایه"),
            KeyboardButton(text="🧠 روتین مرور لایتنر"),
        ],
        [
            KeyboardButton(text="🎯 آزمون و کوئیز کلمات"),
            KeyboardButton(text="📊 کارنامه و آمار تسلط"),
        ],
    ]

    if web_app_url:
        buttons.append([
            KeyboardButton(
                text="🚀 ورود به مینی‌اپ هوشمند مدیاز",
                web_app=WebAppInfo(url=web_app_url),
            )
        ])
    else:
        buttons.append([
            KeyboardButton(text="🚀 ورود به مینی‌اپ مدیاز (راهنما)")
        ])

    return ReplyKeyboardMarkup(
        keyboard=buttons,
        resize_keyboard=True,
        input_field_placeholder="یکی از گزینه‌های بالا را انتخاب کنید...",
    )


def get_grades_keyboard(action: str = "vocab") -> InlineKeyboardMarkup:
    keyboard = [
        [
            InlineKeyboardButton(text="📘 پایه دهم (۳۳۶ واژه)", callback_data=f"{action}_grade:10"),
            InlineKeyboardButton(text="📗 پایه یازدهم (۴۰۸ واژه)", callback_data=f"{action}_grade:11"),
        ],
        [
            InlineKeyboardButton(text="📙 پایه دوازدهم (۴۲۹ واژه)", callback_data=f"{action}_grade:12"),
        ],
        [
            InlineKeyboardButton(text="🔙 بازگشت به منوی اصلی", callback_data="back_to_main"),
        ],
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_chapters_keyboard(grade: int, chapters: List[dict], action: str = "vocab") -> InlineKeyboardMarkup:
    keyboard = []
    row = []
    for ch in chapters:
        idx = ch["index"]
        title = ch["title"].split(":", 1)[0].strip()
        count = ch["words_count"]
        btn = InlineKeyboardButton(
            text=f"{title} ({count})",
            callback_data=f"{action}_chapter:{grade}:{idx}:0"
        )
        row.append(btn)
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)

    keyboard.append([
        InlineKeyboardButton(text="🎯 آزمون کل این پایه", callback_data=f"start_quiz:{grade}:all"),
    ])
    keyboard.append([
        InlineKeyboardButton(text="🔙 بازگشت به انتخاب پایه", callback_data=f"back_to_grades:{action}"),
    ])
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_word_card_keyboard(grade: int, chapter_idx: int, word_idx: int, total_words: int, word: str) -> InlineKeyboardMarkup:
    keyboard = []

    keyboard.append([
        InlineKeyboardButton(
            text="➕ افزودن این واژه به جعبه لایتنر",
            callback_data=f"leitner_add:{grade}:{chapter_idx}:{word_idx}"
        )
    ])

    nav_row = []
    if word_idx > 0:
        nav_row.append(InlineKeyboardButton(text="⬅️ قبلی", callback_data=f"vocab_chapter:{grade}:{chapter_idx}:{word_idx-1}"))
    else:
        nav_row.append(InlineKeyboardButton(text="🚫 ابتدا", callback_data="noop"))

    nav_row.append(InlineKeyboardButton(text=f"📌 {word_idx+1} از {total_words}", callback_data="noop"))

    if word_idx < total_words - 1:
        nav_row.append(InlineKeyboardButton(text="بعدی ➡️", callback_data=f"vocab_chapter:{grade}:{chapter_idx}:{word_idx+1}"))
    else:
        nav_row.append(InlineKeyboardButton(text="🏁 پایان", callback_data="noop"))

    keyboard.append(nav_row)

    keyboard.append([
        InlineKeyboardButton(text="🎯 کوئیز از این فصل", callback_data=f"start_quiz:{grade}:{chapter_idx}"),
        InlineKeyboardButton(text="🔙 سرفصل‌ها", callback_data=f"vocab_grade:{grade}"),
    ])

    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_quiz_keyboard(grade: int, correct_idx: int, options: List[str], chapter_idx: Optional[int] = None) -> InlineKeyboardMarkup:
    keyboard = []
    ch_param = str(chapter_idx) if chapter_idx is not None else "all"

    for idx, opt in enumerate(options):
        display_opt = opt if len(opt) <= 45 else opt[:42] + "..."
        keyboard.append([
            InlineKeyboardButton(
                text=f"{idx+1}. {display_opt}",
                callback_data=f"quiz_ans:{grade}:{ch_param}:{correct_idx}:{idx}"
            )
        ])

    keyboard.append([
        InlineKeyboardButton(text="🔄 سوال بعدی", callback_data=f"start_quiz:{grade}:{ch_param}"),
        InlineKeyboardButton(text="🔙 بازگشت", callback_data="back_to_main"),
    ])
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_leitner_show_meaning_keyboard(card_id: int) -> InlineKeyboardMarkup:
    keyboard = [
        [
            InlineKeyboardButton(text="👁️ نمایش معنی و پاسخ", callback_data=f"leitner_reveal:{card_id}"),
        ],
        [
            InlineKeyboardButton(text="🔙 بازگشت به منوی اصلی", callback_data="back_to_main"),
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_leitner_grade_keyboard(card_id: int) -> InlineKeyboardMarkup:
    keyboard = [
        [
            InlineKeyboardButton(text="✅ بلد بودم (ارتقا گام 🚀)", callback_data=f"leitner_rate:{card_id}:1"),
            InlineKeyboardButton(text="❌ بلد نبودم (شروع مجدد 🔁)", callback_data=f"leitner_rate:{card_id}:0"),
        ],
        [
            InlineKeyboardButton(text="⏭️ کلمه بعدی", callback_data="leitner_next"),
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)
