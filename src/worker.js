/**
 * بوابة متوسطة الأخوة - إدارة ست ايمان
 * Cloudflare Worker: موقع النتائج + بوت تيليجرام لرفع الدرجات
 *
 * المتطلبات:
 *   - D1 database  (binding: DB)
 *   - Secrets:     BOT_TOKEN , WEBHOOK_SECRET
 *   - Vars:        ADMIN_IDS , GRAMMAR_MAX (30) , LITERATURE_MAX (25) , SUBJECT_NAME  (في wrangler.toml)
 */

const HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>متوسطة الأخوة - منصة نتائج اللغة العربية</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts: Cairo & Tajawal -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        cairo: ['Cairo', 'sans-serif'],
                        tajawal: ['Tajawal', 'sans-serif'],
                    }
                }
            }
        }
    </script>

    <style>
        body {
            font-family: 'Cairo', 'Tajawal', sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            -webkit-tap-highlight-color: transparent;
        }

        /* Black Spinner Loader for the Checkbox */
        .black-spinner {
            border: 2.5px solid #e5e7eb;
            border-top: 2.5px solid #000000;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Fade and slide animation transitions */
        .page-transition {
            transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
        }

        .fade-out {
            opacity: 0;
            transform: scale(0.98);
            pointer-events: none;
        }

        .fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Custom soft card shadows */
        .main-card-shadow {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background-color: #ffffff;
            }
            .print-shadow-none {
                box-shadow: none !important;
            }
        }
    </style>
</head>
<body class="min-h-screen bg-[#f5f6f8] flex flex-col justify-between items-center antialiased select-none p-3 sm:p-6">

    <!-- Main Search View -->
    <main id="searchView" class="w-full max-w-[440px] my-auto page-transition">
        <div class="bg-white rounded-3xl p-6 sm:p-8 main-card-shadow border border-gray-100 flex flex-col items-center text-center">
            
            <!-- Ministry Emblem Logo -->
            <div class="w-20 h-20 sm:w-24 sm:h-24 mb-4 flex items-center justify-center relative">
                <svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-sm">
                    <!-- Outer Gold/Green Emblem Border -->
                    <circle cx="100" cy="100" r="92" fill="#eab308" stroke="#15803d" stroke-width="6" />
                    <circle cx="100" cy="100" r="82" fill="#166534" />
                    <circle cx="100" cy="100" r="74" fill="#fef08a" />
                    
                    <!-- Iraq Eagle Emblem Graphic representation -->
                    <path d="M100 35 L115 65 L145 65 L120 85 L130 115 L100 95 L70 115 L80 85 L55 65 L85 65 Z" fill="#15803d"/>
                    <circle cx="100" cy="100" r="28" fill="#15803d" />
                    
                    <!-- Center Palm & Star icon -->
                    <path d="M100 82 Q100 118 100 118 M100 100 Q88 90 80 92 M100 100 Q112 90 120 92 M100 105 Q85 100 78 106 M100 105 Q115 100 122 106" stroke="#fef08a" stroke-width="3" stroke-linecap="round" fill="none" />
                </svg>
            </div>

            <!-- Header Titles -->
            <h1 class="text-3xl sm:text-4xl font-black mb-2 tracking-tight leading-tight text-gray-900">
                متوسطة الأخوة
            </h1>
            <p class="text-sm sm:text-base font-bold text-gray-800 mb-2">
                للصف الثالث متوسط
            </p>
            <p class="text-sm sm:text-base font-semibold text-gray-400 mb-7">
                منصة نتائج اللغة العربية
            </p>

            <!-- Inputs Form -->
            <form id="resultsForm" onsubmit="handleFormSubmit(event)" class="w-full space-y-5 text-right">
                
                <!-- Student Name Input Only -->
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5 pr-1">
                        اسم الطالب
                    </label>
                    <input 
                        type="text" 
                        id="studentNameInput" 
                        placeholder="اكتب اسم الطالب الثلاثي كاملاً" autocomplete="off" 
                        required
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition text-right shadow-sm"
                    />
                </div>

                <!-- Verification Widget (UR Portal Style) -->
                <div class="pt-2">
                    <div class="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col items-center justify-center space-y-3">
                        
                        <!-- UR Gate Logo -->
                        <div class="flex items-center justify-center space-x-1.5 space-x-reverse opacity-90">
                            <!-- UR Gate Graphic -->
                            <div class="text-[#cf2e2e] flex flex-col items-center">
                                <svg class="w-8 h-8" viewBox="0 0 64 64" fill="currentColor">
                                    <path d="M8 48 h48 v6 H8 z M14 38 h36 v6 H14 z M20 28 h24 v6 H20 z M26 18 h12 v6 H26 z M30 8 h4 v6 H30 z"/>
                                </svg>
                            </div>
                            <div class="text-right">
                                <span class="block text-xs font-black text-[#cf2e2e] leading-tight">بوابة متوسطة الأخوة</span>
                                <span class="block text-[9px] text-gray-400 font-medium leading-none">إدارة ست ايمان</span>
                            </div>
                        </div>

                        <!-- "I Love Iraq" Interactive Box -->
                        <button 
                            type="button" 
                            id="verifyBtn" 
                            onclick="triggerVerification()" 
                            class="w-full bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-center space-x-3 space-x-reverse transition cursor-pointer shadow-sm focus:outline-none"
                        >
                            <span class="text-xs sm:text-sm font-bold text-gray-500">
                                انا احب العراق
                            </span>
                            
                            <!-- Checkbox Container -->
                            <div id="checkboxBox" class="w-5 h-5 border-2 border-gray-300 rounded-md flex items-center justify-center transition-all bg-white">
                                <!-- Default Empty Checkbox Icon -->
                                <span id="checkboxIcon" class="hidden text-black text-xs font-bold">
                                    <i class="fa-solid fa-check"></i>
                                </span>
                                <!-- Black Loader Spinner -->
                                <div id="spinner" class="hidden black-spinner"></div>
                            </div>
                        </button>
                    </div>
                </div>

            </form>

            <!-- Verification Notice Toast / Msg Box -->
            <div id="statusToast" class="mt-4 hidden text-xs font-semibold text-gray-500 flex items-center justify-center space-x-2 space-x-reverse">
                <span id="statusMessage">جاري التحقق من البيانات...</span>
            </div>

        </div>

        </main>

    <!-- Results Screen View (Initially Hidden) -->
    <main id="resultsView" class="w-full max-w-3xl mx-auto my-6 hidden page-transition">

        <!-- Back button -->
        <div class="mb-4 flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <button
                onclick="goBackToSearch()"
                class="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-xl transition"
            >
                <i class="fa-solid fa-arrow-right"></i>
                <span>البحث عن اسم آخر</span>
            </button>
        </div>

        <div class="bg-white rounded-3xl p-6 sm:p-10 main-card-shadow border border-gray-200">

            <!-- Student Name (centered) -->
            <div class="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 mb-6 text-center">
                <span class="block text-gray-400 font-semibold text-xs mb-1">اسم الطالب:</span>
                <span class="font-black text-gray-900 text-lg sm:text-xl" id="displayStudentName">-</span>
            </div>

            <!-- Subject Box -->
            <div class="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div class="text-center mb-6">
                    <span class="block text-xs sm:text-sm text-gray-400 font-bold mb-2">المادة</span>
                    <div class="inline-block px-8 py-3 bg-gray-100 border border-gray-300 rounded-xl shadow-inner">
                        <span id="subjectName" class="font-black text-gray-900 text-lg sm:text-xl">اللغة العربية</span>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                        <span class="font-bold text-gray-800 text-base sm:text-lg">القواعد :</span>
                        <span class="flex items-baseline gap-2" dir="ltr">
                            <span id="grammarValue" class="text-3xl sm:text-4xl font-black text-gray-900 font-mono">0</span>
                            <span id="grammarMax" class="text-base font-bold text-gray-400">/ 30</span>
                        </span>
                    </div>
                    <div class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                        <span class="font-bold text-gray-800 text-base sm:text-lg">الأدب :</span>
                        <span class="flex items-baseline gap-2" dir="ltr">
                            <span id="literatureValue" class="text-3xl sm:text-4xl font-black text-gray-900 font-mono">0</span>
                            <span id="literatureMax" class="text-base font-bold text-gray-400">/ 25</span>
                        </span>
                    </div>
                </div>
            </div>

        </div>
    </main>

    <script>
        var isVerifying = false;
        var IDLE_BOX = 'w-5 h-5 border-2 border-gray-300 rounded-md flex items-center justify-center transition-all bg-white';

        function $(id) { return document.getElementById(id); }

        function showStatus(msg, textClass) {
            $('statusMessage').innerText = msg;
            $('statusMessage').className = 'font-bold ' + textClass;
            $('statusToast').classList.remove('hidden');
        }

        function resetVerifyUI() {
            isVerifying = false;
            $('spinner').classList.add('hidden');
            $('checkboxIcon').classList.add('hidden');
            $('checkboxBox').className = IDLE_BOX;
            $('verifyBtn').classList.remove('opacity-80', 'cursor-not-allowed');
        }

        function fillResult(d) {
            $('displayStudentName').innerText = d.name;
            $('subjectName').innerText = d.subject;
            $('grammarValue').innerText = d.grammar;
            $('grammarMax').innerText = '/ ' + d.grammarMax;
            $('literatureValue').innerText = d.literature;
            $('literatureMax').innerText = '/ ' + d.literatureMax;
        }

        function showResultsView() {
            var searchView = $('searchView');
            var resultsView = $('resultsView');
            searchView.classList.add('fade-out');
            setTimeout(function () {
                searchView.classList.add('hidden');
                resultsView.classList.remove('hidden');
                resultsView.classList.add('fade-in');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 400);
        }

        /**
         * عند الضغط على "انا احب العراق": يتم التحقق ثم البحث الفعلي عن الاسم في قاعدة البيانات
         */
        async function triggerVerification() {
            if (isVerifying) return;

            var input = $('studentNameInput');
            var name = input.value.trim().replace(/\\s+/g, ' ');

            if (!name) {
                input.focus();
                showStatus('يرجى كتابة اسم الطالب أولاً', 'text-rose-500');
                return;
            }
            if (name.split(' ').length < 3) {
                input.focus();
                showStatus('يرجى كتابة الاسم الثلاثي كاملاً', 'text-rose-500');
                return;
            }

            isVerifying = true;
            $('verifyBtn').classList.add('opacity-80', 'cursor-not-allowed');
            $('spinner').classList.remove('hidden');
            $('checkboxIcon').classList.add('hidden');
            $('checkboxBox').classList.remove('border-emerald-500', 'bg-emerald-50');
            $('checkboxBox').classList.add('border-black');
            showStatus('جاري جلب النتيجة...', 'text-gray-600');

            try {
                var wait = new Promise(function (r) { setTimeout(r, 1200); });
                var req = fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name })
                }).then(function (res) { return res.json(); });

                var out = await Promise.all([req, wait]);
                var data = out[0];

                if (data && data.ok) {
                    $('spinner').classList.add('hidden');
                    $('checkboxIcon').classList.remove('hidden');
                    $('checkboxBox').classList.remove('border-black');
                    $('checkboxBox').classList.add('border-emerald-600', 'bg-emerald-50');
                    showStatus('تم التحقق بنجاح! جاري عرض النتيجة...', 'text-emerald-600');
                    fillResult(data);
                    setTimeout(showResultsView, 800);
                } else if (data && data.error === 'not_found') {
                    resetVerifyUI();
                    showStatus('لا توجد نتائج', 'text-rose-500');
                } else if (data && data.error === 'short_name') {
                    resetVerifyUI();
                    showStatus('يرجى كتابة الاسم الثلاثي كاملاً', 'text-rose-500');
                } else {
                    resetVerifyUI();
                    showStatus('حدث خطأ، حاول مرة أخرى', 'text-rose-500');
                }
            } catch (err) {
                resetVerifyUI();
                showStatus('تعذر الاتصال بالخادم، حاول مرة أخرى', 'text-rose-500');
            }
        }

        function handleFormSubmit(e) {
            e.preventDefault();
            triggerVerification();
        }

        function goBackToSearch() {
            resetVerifyUI();
            $('studentNameInput').value = '';
            $('statusToast').classList.add('hidden');

            $('resultsView').classList.add('hidden');
            $('resultsView').classList.remove('fade-in');

            $('searchView').classList.remove('hidden', 'fade-out');
            $('searchView').classList.add('fade-in');
        }
    </script>
</body>
</html>`;

/* ------------------------------------------------------------------ */
/*  أدوات تطبيع الأسماء                                                */
/* ------------------------------------------------------------------ */

function toWesternDigits(s) {
  return String(s)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// تنظيف الاسم للعرض (إزالة التشكيل والتطويل والرموز الخفية وتوحيد المسافات)
function cleanName(s) {
  return toWesternDigits(s)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// مفتاح البحث: يوحّد الهمزات والياء والتاء المربوطة حتى لا يفشل البحث بسبب فرق إملائي بسيط
function nameKey(s) {
  return cleanName(s)
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ی/g, "ي")
    .replace(/ک/g, "ك")
    .replace(/ة/g, "ه");
}

function countWords(s) {
  return s ? s.split(" ").length : 0;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ */
/*  الإعدادات والدرجات                                                 */
/* ------------------------------------------------------------------ */

function cfg(env) {
  return {
    grammarMax: Number(env.GRAMMAR_MAX) || 30,
    literatureMax: Number(env.LITERATURE_MAX) || 25,
    subject: env.SUBJECT_NAME || "اللغة العربية",
    admins: String(env.ADMIN_IDS || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  };
}

function fmtGrade(n) {
  return String(Math.round(Number(n) * 100) / 100);
}

/* ------------------------------------------------------------------ */
/*  قاعدة البيانات                                                     */
/* ------------------------------------------------------------------ */

let schemaReady = false;

async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS results (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "key TEXT NOT NULL UNIQUE," +
        "name TEXT NOT NULL," +
        "grammar REAL NOT NULL," +
        "literature REAL NOT NULL)"
    ),
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS bot_state (chat_id TEXT PRIMARY KEY, mode TEXT)"
    ),
  ]);
  schemaReady = true;
}

async function countStudents(env) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS c FROM results").first();
  return r ? r.c : 0;
}

async function findStudent(env, name) {
  return env.DB.prepare("SELECT id, name, grammar, literature FROM results WHERE key = ?")
    .bind(nameKey(name))
    .first();
}

async function setMode(env, chatId, mode) {
  if (!mode) {
    await env.DB.prepare("DELETE FROM bot_state WHERE chat_id = ?").bind(String(chatId)).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO bot_state (chat_id, mode) VALUES (?, ?) " +
        "ON CONFLICT(chat_id) DO UPDATE SET mode = excluded.mode"
    )
      .bind(String(chatId), mode)
      .run();
  }
}

async function getMode(env, chatId) {
  const r = await env.DB.prepare("SELECT mode FROM bot_state WHERE chat_id = ?")
    .bind(String(chatId))
    .first();
  return r ? r.mode : null;
}

/* ------------------------------------------------------------------ */
/*  البحث من الموقع                                                    */
/* ------------------------------------------------------------------ */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function handleSearch(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const name = cleanName(body && body.name ? body.name : "");
  if (name.length > 120 || countWords(name) < 3) {
    return json({ ok: false, error: "short_name" }, 400);
  }

  await ensureSchema(env);
  const row = await findStudent(env, name);
  if (!row) return json({ ok: false, error: "not_found" }, 404);

  const c = cfg(env);
  return json({
    ok: true,
    name: row.name,
    grammar: fmtGrade(row.grammar),
    literature: fmtGrade(row.literature),
    grammarMax: c.grammarMax,
    literatureMax: c.literatureMax,
    subject: c.subject,
  });
}

/* ------------------------------------------------------------------ */
/*  تيليجرام                                                           */
/* ------------------------------------------------------------------ */

async function tg(env, method, payload) {
  const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok && !/not modified/i.test(data.description || "")) {
    console.error("Telegram error", method, JSON.stringify(data));
  }
  return data;
}

const PAGE_SIZE = 15;

const MAIN_MENU = {
  inline_keyboard: [
    [{ text: "📤 رفع أسماء الطلاب", callback_data: "upload" }],
    [{ text: "📋 قائمة الطلاب", callback_data: "list:0" }],
    [{ text: "🔎 البحث عن طالب", callback_data: "find" }],
    [{ text: "🗑 حذف طالب", callback_data: "del" }],
    [{ text: "⚠️ حذف جميع الطلاب", callback_data: "wipe" }],
  ],
};

const BACK_ROW = [{ text: "🏠 القائمة الرئيسية", callback_data: "menu" }];

// إرسال رسالة جديدة، أو تعديل الرسالة الحالية إذا جاء الطلب من زر
async function show(env, ctx, text, keyboard) {
  const payload = {
    chat_id: ctx.chatId,
    text,
    parse_mode: "HTML",
    reply_markup: keyboard || { inline_keyboard: [BACK_ROW] },
    disable_web_page_preview: true,
  };
  if (ctx.messageId) {
    return tg(env, "editMessageText", Object.assign({ message_id: ctx.messageId }, payload));
  }
  return tg(env, "sendMessage", payload);
}

async function showMenu(env, ctx) {
  await setMode(env, ctx.chatId, null);
  const total = await countStudents(env);
  await show(
    env,
    ctx,
    "<b>بوابة متوسطة الأخوة</b>\nإدارة ست ايمان\n\nعدد الطلاب المرفوعين: <b>" +
      total +
      "</b>\nاختر من القائمة:",
    MAIN_MENU
  );
}

/* ---- رفع الأسماء ---- */

function parseLine(line, grammarMax, literatureMax) {
  const clean = toWesternDigits(line).replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "").trim();
  const num = "(\\d+(?:[.,٫]\\d+)?)";
  const re = new RegExp("^(.*[^\\s\\d.,٫])\\s*[-–—:=|]*\\s*" + num + "[\\s\\-–—|،]+" + num + "\\s*$");
  const m = clean.match(re);
  if (!m) return { error: "يجب أن تكون في آخر السطر درجتان: القواعد ثم الأدب" };

  const name = cleanName(m[1].replace(/[\s\-–—:=|]+$/, ""));
  const grammar = parseFloat(m[2].replace(/[,٫]/, "."));
  const literature = parseFloat(m[3].replace(/[,٫]/, "."));

  if (countWords(name) < 3) return { error: "الاسم أقل من ثلاثة أجزاء" };
  if (!isFinite(grammar) || grammar > grammarMax) return { error: "درجة القواعد أكبر من " + grammarMax };
  if (!isFinite(literature) || literature > literatureMax) return { error: "درجة الأدب أكبر من " + literatureMax };

  return { key: nameKey(name), name, grammar, literature };
}

async function processUpload(env, ctx, text) {
  const c = cfg(env);
  const rows = new Map();
  const bad = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const r = parseLine(line, c.grammarMax, c.literatureMax);
    if (r.error) bad.push({ line, error: r.error });
    else rows.set(r.key, r); // آخر سطر يغلب إذا تكرر الاسم
  }

  const kb = {
    inline_keyboard: [
      [{ text: "📋 عرض القائمة", callback_data: "list:0" }],
      [{ text: "✅ إنهاء الرفع", callback_data: "menu" }],
    ],
  };

  if (rows.size === 0) {
    let msg = "⚠️ لم أجد أي سطر صالح.\nاكتب كل طالب في سطر: الاسم الثلاثي ثم درجة القواعد ثم درجة الأدب، مثال:\n<code>علي حيدر محمد 28 22</code>";
    if (bad.length) msg += "\n\n" + formatBad(bad);
    await show(env, { chatId: ctx.chatId }, msg, kb);
    return;
  }

  const before = await countStudents(env);
  const list = Array.from(rows.values());
  const stmts = [];
  // 4 متغيرات لكل صف، وحد D1 هو 100 متغير في الاستعلام الواحد
  for (let i = 0; i < list.length; i += 20) {
    const chunk = list.slice(i, i + 20);
    const placeholders = chunk.map(() => "(?, ?, ?, ?)").join(", ");
    const params = [];
    for (const r of chunk) params.push(r.key, r.name, r.grammar, r.literature);
    stmts.push(
      env.DB.prepare(
        "INSERT INTO results (key, name, grammar, literature) VALUES " +
          placeholders +
          " ON CONFLICT(key) DO UPDATE SET name = excluded.name, grammar = excluded.grammar, literature = excluded.literature"
      ).bind(...params)
    );
  }
  await env.DB.batch(stmts);
  const after = await countStudents(env);

  const added = after - before;
  const updated = list.length - added;

  let msg =
    "✅ <b>تم رفع " + list.length + " طالب</b>\n" +
    "• جديد: " + added + "\n" +
    "• تم تحديث درجته: " + updated + "\n" +
    "• إجمالي الطلاب الآن: " + after;
  if (bad.length) msg += "\n\n" + formatBad(bad);
  msg += "\n\nيمكنك إرسال دفعة أخرى مباشرة، أو اضغط «إنهاء الرفع».";

  await show(env, { chatId: ctx.chatId }, msg, kb);
}

function formatBad(bad) {
  let out = "⚠️ <b>أسطر لم تُقبل (" + bad.length + "):</b>";
  for (const b of bad.slice(0, 10)) {
    out += "\n• <code>" + escapeHtml(b.line.slice(0, 60)) + "</code> — " + b.error;
  }
  if (bad.length > 10) out += "\n… و" + (bad.length - 10) + " أسطر أخرى";
  return out;
}

/* ---- عرض القائمة مع السابق والتالي ---- */

async function showList(env, ctx, page) {
  await setMode(env, ctx.chatId, null);
  const total = await countStudents(env);

  if (total === 0) {
    await show(env, ctx, "لا يوجد طلاب مرفوعون بعد.", {
      inline_keyboard: [[{ text: "📤 رفع أسماء الطلاب", callback_data: "upload" }], BACK_ROW],
    });
    return;
  }

  const pages = Math.ceil(total / PAGE_SIZE);
  page = Math.min(Math.max(page, 0), pages - 1);

  const { results } = await env.DB.prepare(
    "SELECT name, grammar, literature FROM results ORDER BY id LIMIT ? OFFSET ?"
  )
    .bind(PAGE_SIZE, page * PAGE_SIZE)
    .all();

  let text = "<b>📋 قائمة الطلاب</b> (" + total + ")\n\n";
  results.forEach((r, i) => {
    text += page * PAGE_SIZE + i + 1 + ". " + escapeHtml(r.name) + " — <b>" + fmtGrade(r.grammar) + "</b> | <b>" + fmtGrade(r.literature) + "</b>\n";
  });

  const nav = [];
  if (page < pages - 1) nav.push({ text: "التالي ⬅️", callback_data: "list:" + (page + 1) });
  nav.push({ text: "📄 " + (page + 1) + "/" + pages, callback_data: "noop" });
  if (page > 0) nav.push({ text: "➡️ السابق", callback_data: "list:" + (page - 1) });

  await show(env, ctx, text, { inline_keyboard: [nav, BACK_ROW] });
}

/* ---- معالجة التحديثات ---- */

async function handleUpdate(env, update) {
  const c = cfg(env);
  let ctx;
  let text = null;
  let data = null;
  let from;

  if (update.callback_query) {
    const cq = update.callback_query;
    if (!cq.message) return;
    from = cq.from;
    data = cq.data || "";
    ctx = { chatId: cq.message.chat.id, messageId: cq.message.message_id };
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
  } else if (update.message) {
    const m = update.message;
    if (m.chat.type !== "private") return;
    from = m.from;
    text = m.text || "";
    ctx = { chatId: m.chat.id };
  } else {
    return;
  }

  // البوت خاص بالإدارة فقط
  if (!from || !c.admins.includes(String(from.id))) {
    if (text !== null) {
      await tg(env, "sendMessage", {
        chat_id: ctx.chatId,
        text: "هذا البوت خاص بإدارة المدرسة.\nمعرّفك: " + from.id,
      });
    }
    return;
  }

  await ensureSchema(env);

  /* --- ضغطات الأزرار --- */
  if (data !== null) {
    if (data === "noop") return;
    if (data === "menu") return showMenu(env, ctx);

    if (data === "upload") {
      await setMode(env, ctx.chatId, "upload");
      return show(
        env,
        ctx,
        "<b>📤 رفع أسماء الطلاب</b>\n\n" +
          "أرسل كليشة الطلاب الذين تريد رفع درجاتهم.\n" +
          "اكتب كل طالب في سطر: الاسم الثلاثي ثم درجة القواعد ثم درجة الأدب، مثال:\n\n" +
          "<code>علي حيدر محمد 28 22\nحسن كريم جاسم 27 20\nزينب أحمد علي 30 25</code>\n\n" +
          "الدرجة الأولى: القواعد (من " + c.grammarMax + ")، والثانية: الأدب (من " + c.literatureMax + ") — ويمكنك إرسال أكثر من رسالة.",
        { inline_keyboard: [[{ text: "✅ إنهاء الرفع", callback_data: "menu" }]] }
      );
    }

    if (data.startsWith("list:")) {
      return showList(env, ctx, parseInt(data.slice(5), 10) || 0);
    }

    if (data === "find") {
      await setMode(env, ctx.chatId, "find");
      return show(env, ctx, "<b>🔎 البحث عن طالب</b>\n\nاكتب اسم الطالب الثلاثي كاملاً:");
    }

    if (data === "del") {
      await setMode(env, ctx.chatId, "del");
      return show(env, ctx, "<b>🗑 حذف طالب</b>\n\nاكتب اسم الطالب الثلاثي كاملاً لحذفه:");
    }

    if (data === "wipe") {
      await setMode(env, ctx.chatId, null);
      const total = await countStudents(env);
      return show(
        env,
        ctx,
        "⚠️ هل أنت متأكد من حذف <b>جميع الطلاب</b> (" + total + ")؟\nلا يمكن التراجع عن هذا الإجراء.",
        {
          inline_keyboard: [
            [{ text: "✅ نعم، احذف الكل", callback_data: "wipe_yes" }],
            [{ text: "❌ إلغاء", callback_data: "menu" }],
          ],
        }
      );
    }

    if (data === "wipe_yes") {
      await env.DB.prepare("DELETE FROM results").run();
      return show(env, ctx, "🗑 تم حذف جميع الطلاب.");
    }
    return;
  }

  /* --- الرسائل النصية --- */
  const cmd = text.trim();
  if (cmd.startsWith("/start") || cmd.startsWith("/menu")) return showMenu(env, ctx);

  const mode = await getMode(env, ctx.chatId);

  if (mode === "upload") return processUpload(env, ctx, text);

  if (mode === "find" || mode === "del") {
    const name = cleanName(text);
    if (countWords(name) < 3) {
      return show(env, ctx, "اكتب الاسم الثلاثي كاملاً.");
    }
    const row = await findStudent(env, name);
    if (!row) return show(env, ctx, "لا توجد نتائج");

    if (mode === "del") {
      await env.DB.prepare("DELETE FROM results WHERE id = ?").bind(row.id).run();
      return show(env, ctx, "🗑 تم حذف: <b>" + escapeHtml(row.name) + "</b>");
    }
    return show(
      env,
      ctx,
      escapeHtml(row.name) + "\nالقواعد: <b>" + fmtGrade(row.grammar) + "</b> / " + c.grammarMax + "\nالأدب: <b>" + fmtGrade(row.literature) + "</b> / " + c.literatureMax
    );
  }

  return showMenu(env, ctx);
}

async function handleWebhook(request, env) {
  if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    const update = await request.json();
    await handleUpdate(env, update);
  } catch (e) {
    // نرجع 200 دائماً حتى لا يعيد تيليجرام إرسال نفس التحديث بلا نهاية
    console.error("webhook error", e && e.stack ? e.stack : e);
  }
  return new Response("ok");
}

// افتح مرة واحدة بعد النشر: https://<worker>/setup?key=<WEBHOOK_SECRET>
async function handleSetup(env, url) {
  if (!env.WEBHOOK_SECRET || url.searchParams.get("key") !== env.WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  const result = await tg(env, "setWebhook", {
    url: url.origin + "/webhook",
    secret_token: env.WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  return json(result);
}

/* ------------------------------------------------------------------ */
/*  المسارات                                                           */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        return new Response(HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });
      }
      if (request.method === "POST" && url.pathname === "/api/search") return await handleSearch(request, env);
      if (request.method === "POST" && url.pathname === "/webhook") return await handleWebhook(request, env);
      if (request.method === "GET" && url.pathname === "/setup") return await handleSetup(env, url);
      return new Response("Not found", { status: 404 });
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      return json({ ok: false, error: "server" }, 500);
    }
  },
};
