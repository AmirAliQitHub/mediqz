# گزارش رسمی استقرار ۲۴/۷ کلاد ورسل و یکپارچه‌سازی وب‌اپ تلگرام
## Alqualite CourseBox & @MediqzBot (نسخه v2.7.0-vercel)

**تاریخ استقرار و تایید شورا:** ۱ نوامبر ۲۰۲۶  
**دامنه زنده و اختصاصی:** [https://mediqz.vercel.app](https://mediqz.vercel.app)  
**ربات تلگرام متصل:** [@MediqzBot](https://t.me/MediqzBot)  
**وضعیت عملیاتی:** ۱۰۰٪ فعال، مستقل از سخت‌افزار محلی، ۲۴ ساعته آنلاین روی سرورلس Edge ورسل  

---

## ۱. معماری چندسرویسی ورسل (Multi-Service Architecture)

سیستم به صورت کاملاً یکپارچه و به عنوان یک پروژه واحد با دو سرویس مستقل روی Vercel پیکربندی شده است:

```mermaid
flowchart TD
    subgraph VercelEdge ["Vercel Anycast Global Edge (mediqz.vercel.app)"]
        Router ["Edge Router & Rewrites (vercel.json)"]
        FrontendService ["سرویس فرانت‌اند: React + Vite (Static CDN Edge)"]
        BackendService ["سرویس بک‌اند: FastAPI Serverless Python (AWS Lambda)"]
        EnvVault ["پایگاه متغیرهای رمزنگاری‌شده ورسل (Encrypted Vault)"]
        TmpDB [("حافظه موقت SQLite WAL (/tmp/userdata.db)")]

        Router -->|"GET /(.*)"| FrontendService
        Router -->|"ALL /api/(.*)"| BackendService
        EnvVault -.->|"تزریق هنگام اجرا"| BackendService
        BackendService <--> TmpDB
    end

    TelegramServer ["سرورهای تلگرام (Telegram Cloud Webhook)"] <-->|"HTTPS POST با توکن امنیتی"| BackendService
    StudentPhone ["دانش‌آموز (Telegram Mini App / Browser)"] <-->|"HTTPS"| Router
```

### مسیریابی عمومی ورسل (`vercel.json`):
- مسیرهای اصلی `GET /(.*)` مستقیماً از حافظه موقت CDN لبه (Edge CDN) با کش استاتیک و سرعت پاسخگویی زیر ۱۰۰ میلی‌ثانیه تحویل داده می‌شوند.
- مسیرهای وب سرویس `ALL /api/(.*)` مستقیماً به سرویس پایتون FastAPI هدایت می‌شوند.
- دسترسی به پایگاه داده دوره‌ها به صورت فایل‌های پیش‌ساخته درون ریپو بارگذاری می‌شود و نیاز به دیتابیس خارجی سنگین ندارد.

---

## ۲. مشخصات و متغیرهای پیکربندی‌شده روی ورسل

متغیرهای زیر مستقیماً از طریق Vercel MCP در پروژه `prj_K8f8Q2e29vmiw5B32K96tGhPmkiG` تزریق و تایید شدند:

| متغیر | نوع | محیط | کاربرد |
| :--- | :---: | :---: | :--- |
| `TELEGRAM_BOT_TOKEN` | Encrypted | Prod, Prev, Dev | احراز هویت با Telegram Bot API |
| `TELEGRAM_BOT_USERNAME` | Plain | Prod, Prev, Dev | شناسه کاربری ربات (`MediqzBot`) |
| `WEB_APP_URL` | Plain | Prod, Prev, Dev | آدرس ریشه وب‌اپ (`https://mediqz.vercel.app`) |
| `SECRET_KEY` | Encrypted | Prod, Prev, Dev | رمزنگاری توکن‌های امضاشده JWT جلسات |
| `TELEGRAM_SECRET_TOKEN` | Encrypted | Prod, Prev, Dev | توکن اعتبارسنجی هدر `X-Telegram-Bot-Api-Secret-Token` |

---

## ۳. بهینه‌سازی‌های اعمال‌شده برای محیط سرورلس (Serverless)

1. **حذف ریزش پیام‌ها (Zero Message Drops):**
   - تغییر `drop_pending_updates=True` به `drop_pending_updates=False` در چرخه حیات تا پیام‌های ارسالی دانش‌آموزان حین آماده‌سازی سرورلس هرگز نادیده گرفته نشود.
2. **پیشگیری از محدودیت نرخ تلگرام (Rate-Limit Defense):**
   - بررسی خودکار وضعیت وب‌هوک جاری قبل از ارسال دستور `set_webhook`، که مانع از خطای ۴۲۹ تلگرام در Cold Startهای مکرر می‌شود.
3. **راه‌اندازی تنبل ربات (Lazy Fallback Initialization):**
   - ایجاد متد `get_or_create_bot` در اندپوینت‌های وب‌هوک جهت جلوگیری قطعی از خطای ۵۰۳ در اولین درخواست سرورلس.
4. **تطبیق مسیر پایگاه‌داده موقت:**
   - تشخیص خودکار متغیر `VERCEL` در تنظیمات سیستم و ارجاع خودکار مسیر داده‌ها به پوشه مجاز `/tmp/userdata.db`.

---

## ۴. نتایج آزمون‌های جامع صحه‌گذاری خودکار (E2E Verification)

اسکریپت اعتبارسنجی [scripts/verify_vercel_production.py](file:///Users/amiralirakhshani/Projects/Alqualite%20CourseBox/scripts/verify_vercel_production.py) تمامی مراحل را به صورت لایو با موفقیت ۱۰۰٪ پشت سر گذاشت:

```
======================================================================
🚀 Running Alqualite CourseBox & MediqzBot Vercel Live Verification
Target URL: https://mediqz.vercel.app
======================================================================
[✅ PASSED] 1. Frontend React SPA Edge Root
    └── HTTP 200, Content-Type: text/html; charset=utf-8, Length: 1721 bytes
[✅ PASSED] 2. FastAPI Serverless Health Probe
    └── Status: healthy, Persian Name: آلکالیت اینتراکتیو
[✅ PASSED] 3. Course Catalog API
    └── Total Courses: 12, Sample IDs: ['builtin-arabic10_vocab', 'builtin-arabic11_vocab', 'builtin-arabic12_vocab']
[✅ PASSED] 4. Telegram Bot Live Connectivity & Webhook Status
    └── Bot: @MediqzBot, Webhook: https://mediqz.vercel.app/api/telegram/webhook, Pending: 0
[✅ PASSED] 5. Webhook HMAC Security Rejection (Forged Token)
    └── Successfully rejected with HTTP 403 (Forbidden)
[✅ PASSED] 6. Webhook Processing of Authorized /start Payload
    └── HTTP 200, Response: {'ok': True}
[✅ PASSED] 7. Telegram WebApp Zero-Touch Silent Authentication
    └── User ID: 3, Telegram ID: 987654321, Token: f1f6132a7d56...
======================================================================
🎉 ALL 7 LIVE CLOUD VERIFICATION GATES PASSED 100%!
======================================================================
```

---

## ۵. دستورالعمل تست نهایی توسط کاربر (Live User Walkthrough)

اکنون سیستم کاملاً ۲۴ ساعته و بدون نیاز به لپ‌تاپ یا سیستم شخصی شما کار می‌کند:

1. وارد تلگرام شده و به ربات **[@MediqzBot](https://t.me/MediqzBot)** بروید.
2. دستور `/start` را ارسال کنید؛ پیام خوش‌آمدگویی فوری ظاهر می‌شود.
3. دکمه پیوست‌شده کنار ورودی پیام یا داخل چت تحت عنوان **«ورود به مدیاز 🚀»** را لمس کنید.
4. مینی‌اپ بدون درخواست نام کاربری و پسورد و بدون هیچ‌گونه معطلی باز شده و تمام دوره‌های کنکور و لایتنر را در اختیار شما قرار می‌دهد.
