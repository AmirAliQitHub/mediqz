import logging
from datetime import datetime
from aiogram import Dispatcher, F, types
from aiogram.filters import Command, CommandStart
from aiogram.types import CallbackQuery

from app.core.config import TELEGRAM_BOT_NAME, TELEGRAM_BOT_USERNAME
from app.core.database import get_user_db
from app.bot.data_loader import data_loader
from app.bot.database import (
    register_user,
    add_to_leitner,
    get_due_leitner_cards,
    record_leitner_review,
    get_user_stats,
    FIBONACCI_INTERVALS,
)
from app.bot.keyboards import (
    get_main_reply_keyboard,
    get_grades_keyboard,
    get_chapters_keyboard,
    get_word_card_keyboard,
    get_quiz_keyboard,
    get_leitner_show_meaning_keyboard,
    get_leitner_grade_keyboard,
)

logger = logging.getLogger("MediazBotDispatcher")

dp = Dispatcher()


def get_user_greeting(message_or_user) -> str:
    user = message_or_user.from_user if hasattr(message_or_user, "from_user") else message_or_user
    name = user.first_name if user and user.first_name else "دوست عزیز"
    return f"سلام {name} جان! 👋"


@dp.message(CommandStart())
async def cmd_start_handler(message: types.Message, web_app_url: str = ""):
    if not message.from_user:
        return
    full_name = f"{message.from_user.first_name or ''} {message.from_user.last_name or ''}".strip() or message.from_user.first_name
    try:
        register_user(message.from_user.id, full_name, message.from_user.username)
    except Exception as e:
        logger.error(f"Error registering user in cmd_start_handler: {e}")

    greeting = get_user_greeting(message)
    welcome_text = (
        f"{greeting}\n\n"
        f"به **{TELEGRAM_BOT_NAME}** خوش آمدی! 🤖✨ (@{TELEGRAM_BOT_USERNAME})\n\n"
        f"من ربات یادگیری و واژه‌نامهٔ هوشمند مدیاز هستم. هر آنچه برای تسلط بر کتب درسی و روتین هوشمند نیاز داری اینجاست:\n\n"
        f"📚 **واژه‌نامه‌های سه پایه:** دهم، یازدهم و دوازدهم به تفکیک تمام ۸ فصل\n"
        f"🧠 **روتین لایتنر و تسلط:** مرور فاصله دار کلمات با فواصل هوشمند\n"
        f"🎯 **آزمون و کوئیز:** تست‌های ۴ گزینه‌ای سریع و چالشی\n"
        f"🚀 **مینی‌اپ مدیاز:** وب‌اپلیکیشن تعاملی و کامل مدیاز (Mediaz)\n\n"
        f"از دکمه منو یا دکمه‌های زیر شروع کن 👇"
    )
    await message.answer(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=get_main_reply_keyboard(web_app_url if web_app_url else None),
    )


@dp.message(F.text == "📚 واژه‌نامه‌های سه پایه")
@dp.message(Command("vocab"))
async def vocab_menu_handler(message: types.Message):
    await message.answer(
        "📚 **کتابخانه واژه‌نامه‌های زبان و ادبیات فارسی**\n\n"
        "پایه تحصیلی مورد نظر خود را برای مشاهده سرفصل‌ها و واژگان انتخاب کنید:",
        parse_mode="Markdown",
        reply_markup=get_grades_keyboard("vocab"),
    )


@dp.message(F.text == "🧠 روتین مرور لایتنر")
@dp.message(Command("review"))
async def leitner_routine_handler(message: types.Message):
    if not message.from_user:
        return
    user_id = message.from_user.id
    try:
        due_cards = get_due_leitner_cards(user_id)
    except Exception as e:
        logger.error(f"Error fetching due cards: {e}")
        await message.answer("⚠️ خطا در دسترسی به جعبه لایتنر. لطفاً مجدداً امتحان کنید.")
        return

    if not due_cards:
        try:
            stats = get_user_stats(user_id)
        except Exception as e:
            logger.error(f"Error fetching stats: {e}")
            stats = {"total_cards": 0, "mastered": 0}
        msg = (
            "🧠 **جعبه لایتنر هوشمند شما**\n\n"
            "🎉 آفرین! در حال حاضر هیچ واژه‌ای برای مرور امروز باقی نمانده است.\n\n"
            f"📊 **آمار فعلی شما:**\n"
            f"• کل کلمات در لایتنر: **{stats['total_cards']} واژه**\n"
            f"• لغات تسلط‌یافته (گام ۶ و ۷): **{stats['mastered']} واژه**\n\n"
            "💡 برای افزودن کلمات جدید، وارد بخش «📚 واژه‌نامه‌های سه پایه» شوید و روی دکمهٔ «➕ افزودن به لایتنر» کلیک کنید."
        )
        await message.answer(msg, parse_mode="Markdown")
        return

    first_card = due_cards[0]
    total_due = len(due_cards)
    step = first_card["step"]
    days = FIBONACCI_INTERVALS.get(step, 1)

    card_text = (
        f"🧠 **جلسه مرور لایتنر امروز** (۱ از {total_due})\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"📖 سرسفصل: {first_card.get('chapter_title') or 'کتاب درسی'}\n"
        f"📈 وضعیت: **گام {step} از ۷** (فاصله مرور: {days} روز)\n\n"
        f"واژه:\n"
        f"💎 **« {first_card['word']} »**\n\n"
        f"معنی این واژه را در ذهن خود مرور کنید، سپس روی دکمه زیر بزنید:"
    )
    await message.answer(
        card_text,
        parse_mode="Markdown",
        reply_markup=get_leitner_show_meaning_keyboard(first_card["id"]),
    )


@dp.message(F.text == "🎯 آزمون و کوئیز کلمات")
@dp.message(Command("quiz"))
async def quiz_menu_handler(message: types.Message):
    await message.answer(
        "🎯 **کارگاه آزمون و کوئیز واژگان**\n\n"
        "پایه تحصیلی مورد نظر برای آزمون ۴ گزینه‌ای را انتخاب کنید:",
        reply_markup=get_grades_keyboard("quiz"),
    )


@dp.message(F.text == "📊 کارنامه و آمار تسلط")
@dp.message(Command("stats"))
async def stats_handler(message: types.Message):
    if not message.from_user:
        return
    user_id = message.from_user.id
    try:
        stats = get_user_stats(user_id)
    except Exception as e:
        logger.error(f"Error getting stats for user {user_id}: {e}")
        await message.answer("⚠️ خطا در دریافت آمار. لطفاً دوباره تلاش کنید.")
        return

    step_bars = ""
    for s in range(1, 8):
        count = stats["step_counts"].get(s, 0)
        days = FIBONACCI_INTERVALS.get(s, 1)
        bar = "🟩" * min(count, 5) if count > 0 else "▫️"
        step_bars += f"• گام {s} ({days} روزه): {bar} **{count} واژه**\n"

    msg = (
        f"📊 **کارنامه یادگیری و جعبه لایتنر شما**\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"📚 کل لغات در جعبه لایتنر: **{stats['total_cards']}**\n"
        f"⏰ لغات آماده مرور امروز: **{stats['due_today']}**\n"
        f"🏆 لغات به حافظه دائم سپرده شده: **{stats['mastered']}**\n\n"
        f"📈 **تفکیک مراحل ۷ گانه لایتنر:**\n"
        f"{step_bars}\n"
        f"استمرار روزانه رمز تسلط ۱۰۰ درصدی در امتحانات نهایی است! 💪✨"
    )
    await message.answer(msg, parse_mode="Markdown")


@dp.callback_query(F.data.startswith("vocab_grade:"))
async def vocab_grade_callback(query: CallbackQuery):
    grade = int(query.data.split(":")[1])
    chapters = data_loader.get_chapters(grade)
    grade_title = data_loader.get_grade_title(grade)

    await query.message.edit_text(
        f"📚 **{grade_title}**\n\n"
        "سرفصل مورد نظر خود را برای مطالعه لغات انتخاب کنید:",
        parse_mode="Markdown",
        reply_markup=get_chapters_keyboard(grade, chapters, "vocab"),
    )
    await query.answer()


@dp.callback_query(F.data.startswith("vocab_chapter:"))
async def vocab_chapter_callback(query: CallbackQuery):
    parts = query.data.split(":")
    grade = int(parts[1])
    chapter_idx = int(parts[2])
    word_idx = int(parts[3])

    word_data = data_loader.get_word_at(grade, chapter_idx, word_idx)
    if not word_data:
        await query.answer("واژه‌ای یافت نشد.", show_alert=True)
        return

    chapters = data_loader.get_chapters(grade)
    ch_title = chapters[chapter_idx]["title"] if chapter_idx < len(chapters) else "فصل"

    msg = (
        f"📖 **{data_loader.get_grade_title(grade)} • {ch_title}**\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"💎 **واژه:** {word_data['word']}\n\n"
        f"📝 **معنی و شرح:**\n{word_data['meaning']}\n"
    )
    if word_data.get("sentence"):
        msg += f"\n💡 **شاهد مثال:**\n_{word_data['sentence']}_\n"

    await query.message.edit_text(
        msg,
        parse_mode="Markdown",
        reply_markup=get_word_card_keyboard(grade, chapter_idx, word_idx, word_data["total_in_chapter"], word_data["word"]),
    )
    await query.answer()


@dp.callback_query(F.data.startswith("leitner_add:"))
async def leitner_add_callback(query: CallbackQuery):
    if not query.from_user:
        return
    parts = query.data.split(":")
    grade = int(parts[1])
    chapter_idx = int(parts[2])
    word_idx = int(parts[3])

    word_data = data_loader.get_word_at(grade, chapter_idx, word_idx)
    if not word_data:
        await query.answer("خطا در یافتن واژه.", show_alert=True)
        return

    chapters = data_loader.get_chapters(grade)
    ch_title = chapters[chapter_idx]["title"] if chapter_idx < len(chapters) else "فصل"

    ok = add_to_leitner(query.from_user.id, word_data["word"], word_data["meaning"], grade, ch_title)
    if ok:
        await query.answer(f"✅ واژه «{word_data['word']}» به جعبه لایتنر شما اضافه شد!", show_alert=True)
    else:
        await query.answer("این واژه قبلاً در جعبه لایتنر شما قرار گرفته است.", show_alert=True)


@dp.callback_query(F.data.startswith("leitner_reveal:"))
async def leitner_reveal_callback(query: CallbackQuery):
    card_id = int(query.data.split(":")[1])
    if not query.from_user:
        return

    cards = get_due_leitner_cards(query.from_user.id)
    target = next((c for c in cards if c["id"] == card_id), None)
    if not target:
        await query.answer("کارت مورد نظر یافت نشد یا قبلاً مرور شده است.", show_alert=True)
        return

    text = (
        f"🧠 **مرور واژه:**\n"
        f"💎 **« {target['word']} »**\n\n"
        f"📝 **معنی و شرح واژه:**\n"
        f"{target['meaning']}\n\n"
        f"━━━━━━━━━━━━━━━\n"
        f"آیا این واژه را به خاطر داشتید؟"
    )
    await query.message.edit_text(
        text,
        parse_mode="Markdown",
        reply_markup=get_leitner_grade_keyboard(card_id),
    )
    await query.answer()


@dp.callback_query(F.data.startswith("leitner_rate:"))
async def leitner_rate_callback(query: CallbackQuery):
    if not query.from_user:
        return
    parts = query.data.split(":")
    card_id = int(parts[1])
    is_correct = bool(int(parts[2]))

    res = record_leitner_review(card_id, query.from_user.id, is_correct)
    if not res:
        await query.answer("خطا در ثبت نتیجه.", show_alert=True)
        return

    if is_correct:
        status_msg = f"🎉 عالی بود! کارت «{res['word']}» به گام {res['new_step']} ارتقا یافت."
    else:
        status_msg = f"🔁 اشکالی نداره، کارت «{res['word']}» برای فردا مجدداً مرور می‌شود."

    await query.answer(status_msg, show_alert=False)

    remaining_due = get_due_leitner_cards(query.from_user.id)
    if not remaining_due:
        stats = get_user_stats(query.from_user.id)
        msg = (
            "🎉 **پایان جلسه مرور امروز!**\n\n"
            f"{status_msg}\n\n"
            "همه واژه‌های موعد امروز با موفقیت مرور شدند.\n"
            f"🏆 لغات تسلط‌یافته نهایی: **{stats['mastered']}**"
        )
        await query.message.edit_text(msg, parse_mode="Markdown")
        return

    next_card = remaining_due[0]
    total_due = len(remaining_due)
    step = next_card["step"]
    days = FIBONACCI_INTERVALS.get(step, 1)

    card_text = (
        f"🧠 **جلسه مرور لایتنر امروز** (باقی‌مانده: {total_due})\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"📖 سرسفصل: {next_card.get('chapter_title') or 'کتاب درسی'}\n"
        f"📈 وضعیت: **گام {step} از ۷** (فاصله: {days} روز)\n\n"
        f"واژه:\n"
        f"💎 **« {next_card['word']} »**\n\n"
        f"معنی این واژه را در ذهن مرور کنید، سپس بزنید:"
    )
    await query.message.edit_text(
        card_text,
        parse_mode="Markdown",
        reply_markup=get_leitner_show_meaning_keyboard(next_card["id"]),
    )


@dp.callback_query(F.data.startswith("quiz_grade:"))
async def quiz_grade_callback(query: CallbackQuery):
    grade = int(query.data.split(":")[1])
    q = data_loader.generate_quiz_question(grade)
    if not q:
        await query.answer("تعداد واژگان این پایه برای آزمون کافی نیست.", show_alert=True)
        return

    text = (
        f"🎯 **آزمون واژگان • {data_loader.get_grade_title(grade)}**\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"معنی صحیح واژهٔ زیر کدام است؟\n\n"
        f"💎 **« {q['word']} »**"
    )
    await query.message.edit_text(
        text,
        parse_mode="Markdown",
        reply_markup=get_quiz_keyboard(grade, q["correct_idx"], q["options"]),
    )
    await query.answer()


@dp.callback_query(F.data.startswith("start_quiz:"))
async def start_quiz_callback(query: CallbackQuery):
    parts = query.data.split(":")
    grade = int(parts[1])
    ch_param = parts[2]
    ch_idx = int(ch_param) if ch_param != "all" else None

    q = data_loader.generate_quiz_question(grade, ch_idx)
    if not q:
        await query.answer("واژگان کافی برای کوئیز یافت نشد.", show_alert=True)
        return

    text = (
        f"🎯 **کوئیز سریع واژگان**\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"معنی صحیح واژهٔ زیر کدام است؟\n\n"
        f"💎 **« {q['word']} »**"
    )
    await query.message.edit_text(
        text,
        parse_mode="Markdown",
        reply_markup=get_quiz_keyboard(grade, q["correct_idx"], q["options"], ch_idx),
    )
    await query.answer()


@dp.callback_query(F.data.startswith("quiz_ans:"))
async def quiz_answer_callback(query: CallbackQuery):
    parts = query.data.split(":")
    grade = int(parts[1])
    ch_param = parts[2]
    correct_idx = int(parts[3])
    selected_idx = int(parts[4])

    is_correct = (selected_idx == correct_idx)
    if is_correct:
        result_text = "🎉 **کاملاً درست پاسخ دادید!** آفرین 👏"
    else:
        result_text = f"❌ **پاسخ اشتباه بود.** گزینه {correct_idx + 1} صحیح بود."

    await query.answer("پاسخ شما ثبت شد!")
    await query.message.answer(
        f"{result_text}\n\nبرای ادامه سوال بعدی را انتخاب کنید:",
        parse_mode="Markdown",
        reply_markup=get_quiz_keyboard(grade, correct_idx, [], int(ch_param) if ch_param != "all" else None),
    )


@dp.callback_query(F.data == "back_to_main")
async def back_to_main_callback(query: CallbackQuery):
    await query.message.delete()
    await query.answer()


@dp.callback_query(F.data.startswith("magic_login:approve:"))
async def magic_login_approve_callback(query: CallbackQuery):
    if not query.from_user or not query.data:
        return
    parts = query.data.split(":", 2)
    if len(parts) < 3:
        return
    nonce = parts[2].strip()
    with get_user_db() as conn:
        req_row = conn.execute("SELECT * FROM magic_login_requests WHERE nonce = ?", (nonce,)).fetchone()
        if not req_row:
            await query.answer("⚠️ این درخواست ورود منقضی یا نامعتبر شده است.", show_alert=True)
            if query.message:
                try:
                    await query.message.edit_text("⏳ درخواست ورود به نسخه وب نامعتبر یا منقضی شده است.")
                except Exception:
                    pass
            return

        # Strict ownership verification
        if query.from_user.id != req_row["telegram_user_id"]:
            await query.answer("⛔️ شما مجاز به تایید این درخواست نیستید.", show_alert=True)
            return

        now_str = datetime.now().isoformat()
        if req_row["expires_at"] < now_str or req_row["status"] == "expired":
            conn.execute("UPDATE magic_login_requests SET status = 'expired' WHERE nonce = ?", (nonce,))
            conn.commit()
            await query.answer("⚠️ مهلت ۲ دقیقه‌ای این درخواست به پایان رسیده است.", show_alert=True)
            if query.message:
                try:
                    await query.message.edit_text("⏳ مهلت ۲ دقیقه‌ای ورود به نسخه وب به پایان رسید.")
                except Exception:
                    pass
            return

        if req_row["status"] != "pending":
            await query.answer("این درخواست قبلاً تعیین تکلیف شده است.", show_alert=False)
            return

        conn.execute("UPDATE magic_login_requests SET status = 'approved' WHERE nonce = ?", (nonce,))
        conn.commit()

        await query.answer("🎉 ورود تایید شد! لپ‌تاپ شما وارد سامانه شد.", show_alert=True)
        if query.message:
            try:
                await query.message.edit_text(
                    "✅ **ورود به نسخه وب با موفقیت تایید شد.**\n\n"
                    "لپ‌تاپ یا کامپیوتر شما هم‌اکنون به صورت خودکار وارد سامانه مدیاز شد. مطالعه پرباری داشته باشید! 🚀"
                )
            except Exception:
                pass


@dp.callback_query(F.data.startswith("magic_login:reject:"))
async def magic_login_reject_callback(query: CallbackQuery):
    if not query.from_user or not query.data:
        return
    parts = query.data.split(":", 2)
    if len(parts) < 3:
        return
    nonce = parts[2].strip()
    with get_user_db() as conn:
        req_row = conn.execute("SELECT * FROM magic_login_requests WHERE nonce = ?", (nonce,)).fetchone()
        if not req_row:
            await query.answer("درخواست منقضی شده است.", show_alert=False)
            return

        if query.from_user.id != req_row["telegram_user_id"]:
            await query.answer("⛔️ شما مجاز به پاسخ به این درخواست نیستید.", show_alert=True)
            return

        conn.execute("UPDATE magic_login_requests SET status = 'rejected' WHERE nonce = ?", (nonce,))
        conn.commit()

        await query.answer("درخواست ورود رد شد.", show_alert=False)
        if query.message:
            try:
                await query.message.edit_text("❌ **درخواست ورود به نسخه وب لغو گردید.**")
            except Exception:
                pass


@dp.message()
async def generic_fallback_handler(message: types.Message):
    greeting = get_user_greeting(message)
    await message.reply(f"{greeting}\n\n✨ سلام به این پیام ارسالی! از منوی پایین استفاده کنید. 🎈")


def setup_bot_dispatcher() -> Dispatcher:
    return dp
