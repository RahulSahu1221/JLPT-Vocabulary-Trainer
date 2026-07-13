/*app.js 

"use strict";

/* ═══════════════════════════════════════════════════════════════════════════════
   JLPT N5–N4 VOCABULARY TRAINER — app.js
   Core engine: background FX, store, dashboard, review (SRS), quiz, routing,
   command palette, theming, SRS dock magnification.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   Single shared key helper — every feature (favorites/learned/weak/SRS/decks)
   must use the EXACT same identity for a word, or state silently desyncs for
   any hiragana-only entry. This is the one and only place that decision lives.
   ───────────────────────────────────────────────────────────────────────────── */
function wordKey(w) {
    if (!w) return "";
    return w.kanji || w.hiragana || "";
}
window.wordKey = wordKey;


function _scheduleReviewNotification() {
    const now = Date.now();
    const due = Object.values(srsData).filter(v => v && v.dueDate <= now + 86400000).length;
    if (due > 0) {
        setTimeout(() => {
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                try {
                    new Notification("JLPT Trainer 🎌", {
                        body: `You have ${due} word${due > 1 ? "s" : ""} ready for review!`,
                        icon: "./data/assets/logo.jpg"
                    });
                } catch (_) { /* permission revoked between check and fire */ }
            }
        }, 5000);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════════
   LIGHTRAYS — Vanilla WebGL background
   ═══════════════════════════════════════════════════════════════════════════════ */
(function initLightRays() {
    const canvas = document.getElementById("lightRaysCanvas");
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;

    const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
    const FRAG = `precision highp float; uniform float iTime; uniform vec2 iRes; uniform vec2 rayPos; uniform vec2 rayDir; uniform vec3 raysColor; float rayStrength(vec2 src, vec2 dir, vec2 coord, float sA, float sB, float spd){ vec2 d = coord - src; float ca = dot(normalize(d), dir); float da = ca + 0.04 * sin(iTime*2.0 + length(d)*0.01)*0.2; float sp = pow(max(da,0.0), 1.0/0.55); float dist = length(d); float mxD = iRes.x * 1.6; float lf = clamp((mxD - dist)/mxD, 0.0, 1.0); float ff = clamp((iRes.x*1.2 - dist)/(iRes.x*1.2), 0.5, 1.0); float bs = clamp((0.45 + 0.15*sin(da*sA + iTime*spd)) + (0.30 + 0.20*cos(-da*sB + iTime*spd)), 0.0, 1.0); return bs * lf * ff * sp; } void main(){ vec2 coord = vec2(gl_FragCoord.x, iRes.y - gl_FragCoord.y); float r1 = rayStrength(rayPos, rayDir, coord, 36.2214, 21.1135, 1.5); float r2 = rayStrength(rayPos, rayDir, coord, 22.3991, 18.0234, 1.1); float v = r1*0.5 + r2*0.4; vec3 col = raysColor * v; gl_FragColor = vec4(col, v * 0.9); }`;

    function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.warn("Shader compile failed:", gl.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {
        iTime: gl.getUniformLocation(prog, "iTime"),
        iRes: gl.getUniformLocation(prog, "iRes"),
        rayPos: gl.getUniformLocation(prog, "rayPos"),
        rayDir: gl.getUniformLocation(prog, "rayDir"),
        raysColor: gl.getUniformLocation(prog, "raysColor")
    };

    const COLOR_DARK = [0.12, 0.45, 1.0];
    const COLOR_LIGHT = [0.30, 0.42, 0.78];

    let currentColor = COLOR_DARK.slice();
    let targetColor = COLOR_DARK.slice();
    let startColor = COLOR_DARK.slice();
    let colorT = 1;
    let fadeStart = 0;

    window.__setLightRaysTheme = (isLight) => {
        startColor = currentColor.slice();
        targetColor = isLight ? COLOR_LIGHT : COLOR_DARK;
        colorT = 0;
        fadeStart = performance.now();
    };

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 80);
    }, { passive: true });
    resize();

    function loop(ts) {
        if (!document.hidden) {
            if (colorT < 1) {
                colorT = Math.min(1, (performance.now() - fadeStart) / 500);
                currentColor = startColor.map((c, i) => c + (targetColor[i] - c) * colorT);
            }
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.uniform1f(U.iTime, ts * 0.0009);
            gl.uniform2f(U.iRes, canvas.width, canvas.height);
            gl.uniform2f(U.rayPos, canvas.width * 0.5, -0.15 * canvas.height);
            gl.uniform2f(U.rayDir, 0.0, 1.0);
            gl.uniform3f(U.raysColor, currentColor[0], currentColor[1], currentColor[2]);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        requestAnimationFrame(loop);
    }

    if (document.body.classList.contains("light-theme")) window.__setLightRaysTheme(true);
    requestAnimationFrame(loop);
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOBAL HELPERS & PWA INIT
   ═══════════════════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
window.$ = $;

function haptic(ms = 15) {
    if (navigator.vibrate) {
        try { navigator.vibrate(ms); } catch (_) { /* some browsers throw on invalid pattern */ }
    }
}
window.haptic = haptic;

function safeText(el, text) { if (el) el.textContent = String(text ?? ""); }

// Escapes a string for safe innerHTML insertion. Always run any user-, API-,
// or third-party-sourced text through this before placing it in markup.
function sanitizeHTML(str) {
    const temp = document.createElement("div");
    temp.textContent = String(str ?? "");
    return temp.innerHTML;
}
window.sanitizeHTML = sanitizeHTML;

// Escapes a string for safe placement inside a single-quoted HTML attribute
// (e.g. inline onclick="fn('...')"). sanitizeHTML alone is NOT enough here
// because it doesn't escape the quote character itself.
function sanitizeAttr(str) {
   return sanitizeHTML(str).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}
window.sanitizeAttr = sanitizeAttr;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
window.shuffleArray = shuffleArray;

// Production-safe global error handling: log full detail to console for
// developers, but never leak raw stack/error text to the end user via toast.
const IS_LOCALHOST = ["localhost", "127.0.0.1", ""].includes(location.hostname);
window.onerror = (msg, url, line, col, err) => {
    console.error("[JLPT Trainer]", msg, url, line, col, err);
    if (IS_LOCALHOST) showToast(`Dev error: ${msg}`, "error");
    else showToast("Something went wrong. Please try again.", "error");
    return false;
};
window.addEventListener("unhandledrejection", e => {
    console.error("[JLPT Trainer] Unhandled rejection:", e.reason);
    if (IS_LOCALHOST) showToast(`Dev rejection: ${e.reason}`, "error");
    else showToast("Something went wrong. Please try again.", "error");
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW registration failed:", err));
    });
}

let japaneseVoice = null;
function initSpeechVoices() {
    if (!window.speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    japaneseVoice =
        voices.find(v => v.lang === "ja-JP") ||
        voices.find(v => v.lang.startsWith("ja")) ||
        null;
}
if (window.speechSynthesis) {
    speechSynthesis.onvoiceschanged = initSpeechVoices;
}
document.addEventListener("click", initSpeechVoices, { once: true });

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA STORE
   ═══════════════════════════════════════════════════════════════════════════════ */
const store = {
    get(key, fb) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return fb;
            const parsed = JSON.parse(raw);
            return parsed === null || parsed === undefined ? fb : parsed;
        } catch {
            return fb;
        }
    },
    set(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
            return true;
        } catch {
            showToast("Storage quota exceeded!", "error");
            return false;
        }
    },
    export() {
        const data = {
            profile: store.get("jlpt_profile", {}),
            srs: store.get("jlpt_srs", {}),
            lesson: store.get("jlpt_lastLesson", 1),
            decks: store.get("jlpt_decks", []),
            xp: store.get("jlpt_xp", 0),
            heatmap: store.get("jlpt_heatmap", {})
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = `jlpt_backup_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 150);
    },
    import(file) {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || typeof data !== 'object' || Array.isArray(data)) {
                    showToast("Invalid backup file format.", "error"); return;
                }
                const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
                const isArr = v => Array.isArray(v);
                if (data.profile && isObj(data.profile)) {
                    const p = data.profile;
                    const clean = {
                        learned:   isArr(p.learned)   ? p.learned.filter(s => typeof s === 'string').slice(0, 10000) : [],
                        favorites: isArr(p.favorites) ? p.favorites.filter(s => typeof s === 'string').slice(0, 10000) : [],
                        weak:      isArr(p.weak)      ? p.weak.filter(s => typeof s === 'string').slice(0, 10000) : [],
                        achievements: isArr(p.achievements) ? p.achievements.filter(s => typeof s === 'string').slice(0, 500) : [],
                        streak:    typeof p.streak === 'number'    ? p.streak    : 0,
                        bestStreak:typeof p.bestStreak === 'number'? p.bestStreak: 0,
                        lastActive:typeof p.lastActive === 'number'? p.lastActive: 0,
                        dailyGoal: typeof p.dailyGoal === 'number' ? p.dailyGoal : 20,
                        wordsStudiedToday: typeof p.wordsStudiedToday === 'number' ? p.wordsStudiedToday : 0,
                        autoPlay:  typeof p.autoPlay === 'boolean' ? p.autoPlay  : false
                    };
                    store.set("jlpt_profile", clean);
                }
                if (data.srs && isObj(data.srs)) store.set("jlpt_srs", data.srs);
                if (data.decks && isArr(data.decks)) store.set("jlpt_decks", data.decks);
                if (typeof data.xp === 'number') store.set("jlpt_xp", data.xp);
                if (data.heatmap && isObj(data.heatmap)) store.set("jlpt_heatmap", data.heatmap);
                showToast("Data restored successfully!", "success");
                setTimeout(() => location.reload(), 1200);
            } catch {
                showToast("Invalid backup file.", "error");
            }
        };
        reader.readAsText(file);
    }
};
window.store = store;

let userProfile = store.get("jlpt_profile", {
    learned: [], favorites: [], weak: [], streak: 0, bestStreak: 0, lastActive: 0,
    dailyGoal: 20, wordsStudiedToday: 0, autoPlay: false, achievements: []
});
// Defensive defaults in case an older/partial profile is loaded from storage.
userProfile.learned = userProfile.learned || [];
userProfile.favorites = userProfile.favorites || [];
userProfile.weak = userProfile.weak || [];
userProfile.achievements = userProfile.achievements || [];
userProfile.dailyGoal = userProfile.dailyGoal || 20;

let srsData = store.get("jlpt_srs", {});

const todayStr = new Date().toDateString();
if (store.get("jlpt_lastActiveDate", "") !== todayStr) {
    const lastDateStr = store.get("jlpt_lastActiveDate", "");
    if (lastDateStr) {
        const lastDate  = new Date(lastDateStr);
        const todayDate = new Date(todayStr);
        const diffDays  = Math.round((todayDate - lastDate) / 86400000);
        if (diffDays === 1) userProfile.streak++;
        else if (diffDays > 1) userProfile.streak = 1;
    } else {
        userProfile.streak = userProfile.streak || 1;
    }

    userProfile.wordsStudiedToday = 0;
    store.set("jlpt_lastActiveDate", todayStr);
}
userProfile.bestStreak = Math.max(userProfile.bestStreak || 0, userProfile.streak);
userProfile.lastActive = Date.now();
store.set("jlpt_profile", userProfile);
window.userProfile = userProfile;
window.srsData = srsData;

/* ═══════════════════════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════════════════════ */
let vocabulary = [], filteredVocabulary = [], currentView = "dashboardView";
let reviewIndex = 0;
let quizMode = "kanjiToMeaning", score = 0, qNum = 0, quizQueue = [];
window.vocabulary = vocabulary;
window.filteredVocabulary = filteredVocabulary;

/* ═══════════════════════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER (card reveal-on-scroll)
   ═══════════════════════════════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); revealObserver.unobserve(e.target); }
    });
}, { threshold: 0.05, rootMargin: "0px 0px 50px 0px" });

/* ═══════════════════════════════════════════════════════════════════════════════
   ROMAJI → HIRAGANA
   ═══════════════════════════════════════════════════════════════════════════════ */
const r2k = { "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お", "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ", "sa": "さ", "shi": "し", "su": "す", "se": "せ", "so": "そ", "ta": "た", "chi": "ち", "tsu": "つ", "te": "て", "to": "と", "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の", "ha": "は", "hi": "ひ", "fu": "ふ", "he": "へ", "ho": "ほ", "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も", "ya": "や", "yu": "ゆ", "yo": "よ", "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ", "wa": "わ", "wo": "を", "nn": "ん", "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご", "za": "ざ", "ji": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ", "da": "だ", "de": "で", "do": "ど", "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ", "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ", "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ", "sha": "しゃ", "shu": "しゅ", "sho": "しょ", "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ", "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ", "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ", "mya": "みゃ", "myu": "みゅ", "myo": "みょ", "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ", "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ", "ja": "じゃ", "ju": "じゅ", "jo": "じょ", "bya": "びゃ", "byu": "びゅ", "byo": "びょ", "pya": "ぴゃ", "pyu": "ぴゅ", "pyo": "ぴょ" };
function normalizeRomaji(str) {
    let s = String(str || "").toLowerCase(), res = "";
    while (s.length) {
        if (s.length >= 3 && r2k[s.substring(0, 3)]) { res += r2k[s.substring(0, 3)]; s = s.substring(3); }
        else if (s.length >= 2 && r2k[s.substring(0, 2)]) { res += r2k[s.substring(0, 2)]; s = s.substring(2); }
        else if (r2k[s.substring(0, 1)]) { res += r2k[s.substring(0, 1)]; s = s.substring(1); }
        else { res += s[0]; s = s.substring(1); }
    }
    return res;
}
window.normalizeRomaji = normalizeRomaji;

/* ═══════════════════════════════════════════════════════════════════════════════
   GLASS DROPDOWN — turns any <select data-glass="true"> into the same
   frosted-glass dropdown design/animation used by the Lesson selector,
   while keeping the original <select> fully working (value, disabled,
   change event) so no other code has to change.
   ═══════════════════════════════════════════════════════════════════════════════ */
function enhanceGlassSelect(selectEl) {
    if (!selectEl || selectEl.dataset.glassEnhanced) return;
    selectEl.dataset.glassEnhanced = "true";
    selectEl.classList.add("glass-select-native");

    const wrap = document.createElement("div");
    wrap.className = "glass-dropdown settings-dropdown";
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "listbox");
    wrap.setAttribute("aria-label", selectEl.getAttribute("aria-label") || "");
    wrap.setAttribute("aria-expanded", "false");
    if (selectEl.getAttribute("style")) wrap.setAttribute("style", selectEl.getAttribute("style"));

    const selectedDiv = document.createElement("div");
    selectedDiv.className = "dropdown-selected";

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "dropdown-options glass-options-portal";
    optionsDiv.setAttribute("role", "listbox");

    Array.from(selectEl.options).forEach(opt => {
        const o = document.createElement("div");
        o.className = "dropdown-option";
        o.setAttribute("role", "option");
        o.tabIndex = 0;
        o.textContent = opt.textContent;
        o.dataset.value = opt.value;
        o.addEventListener("click", e => {
            e.stopPropagation();
            selectEl.value = opt.value;
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
            closeDropdown();
        });
        optionsDiv.appendChild(o);
    });

    wrap.appendChild(selectedDiv);
    wrap.appendChild(optionsDiv);
    selectEl.insertAdjacentElement("afterend", wrap);

    function syncLabel() {
        const cur = selectEl.options[selectEl.selectedIndex];
        selectedDiv.textContent = cur ? cur.textContent : "";
        optionsDiv.querySelectorAll(".dropdown-option").forEach(o => {
            o.classList.toggle("dropdown-option-active", o.dataset.value === selectEl.value);
        });
    }
    syncLabel();
    selectEl._glassSync = syncLabel;
    selectEl.addEventListener("change", syncLabel);

    function refreshDisabled() {
        wrap.classList.toggle("dropdown-disabled", !!selectEl.disabled);
    }
    refreshDisabled();
    new MutationObserver(refreshDisabled).observe(selectEl, { attributes: true, attributeFilter: ["disabled"] });

    const scrollHandler = (e) => {
        if (optionsDiv.contains(e.target)) return;
        closeDropdown();
    };
    const resizeHandler = () => closeDropdown();

    function closeDropdown() {
        if (!wrap.classList.contains("open")) return;
        wrap.classList.remove("open");
        optionsDiv.classList.remove("portal-open");
        wrap.setAttribute("aria-expanded", "false");
        window.removeEventListener("scroll", scrollHandler, true);
        window.removeEventListener("resize", resizeHandler);
        
        setTimeout(() => {
            if (!wrap.classList.contains("open") && optionsDiv.parentNode === document.body) {
                wrap.appendChild(optionsDiv);
            }
        }, 250);
    }

    wrap.addEventListener("click", e => {
        e.stopPropagation();
        if (selectEl.disabled) return;
        const willOpen = !wrap.classList.contains("open");
        
        if (willOpen) {
            document.querySelectorAll(".glass-dropdown.open").forEach(el => {
                if (el !== wrap) el.click();
            });

            const r = wrap.getBoundingClientRect();
            optionsDiv.style.position = "fixed";
            optionsDiv.style.right = "auto";
            optionsDiv.style.top = (r.bottom + 8) + "px";
            optionsDiv.style.left = r.left + "px";
            optionsDiv.style.width = r.width + "px";
            optionsDiv.style.zIndex = "99999";
            
            document.body.appendChild(optionsDiv);
            
            window.addEventListener("scroll", scrollHandler, true);
            window.addEventListener("resize", resizeHandler, { passive: true });
        }
        wrap.classList.toggle("open", willOpen);
        optionsDiv.classList.toggle("portal-open", willOpen);
        wrap.setAttribute("aria-expanded", String(willOpen));
    });
    
    wrap.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); wrap.click(); }
    });
    
    document.addEventListener("click", e => {
        if (!wrap.contains(e.target) && !optionsDiv.contains(e.target)) closeDropdown();
    });
}

function initGlassSelects(root = document) {
    root.querySelectorAll("select[data-glass]").forEach(enhanceGlassSelect);
}
window.initGlassSelects = initGlassSelects;
window.refreshGlassSelect = function (id) {
    const el = document.getElementById(id);
    if (el && typeof el._glassSync === "function") el._glassSync();
};
document.addEventListener("DOMContentLoaded", () => initGlassSelects());

/* ═══════════════════════════════════════════════════════════════════════════════
   TOASTS & ACHIEVEMENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
function showToast(msg, type = "success") {
    const container = $("toastContainer");
    if (!container) return;
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.textContent = msg; // textContent only — never innerHTML for toasts.
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
window.showToast = showToast;

function checkAchievement(id, title) {
    if (!userProfile.achievements.includes(id)) {
        userProfile.achievements.push(id);
        store.set("jlpt_profile", userProfile);
        showToast(`🏆 Achievement Unlocked: ${title}!`, "success");
        updateDashboard();
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LOAD LESSON
   ═══════════════════════════════════════════════════════════════════════════════ */
async function loadLesson(num) {
    try {
        const res = await fetch(`data/lesson${num}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.vocabulary || raw.words || raw.items || []);
        if (!Array.isArray(data)) throw new Error("Malformed lesson data");

        vocabulary = data.map(item => ({
            kanji: item.kanji || item.word || "",
            hiragana: item.hiragana || item.reading || "",
            meaning: item.meaning || item.english || "",
            memory: item.memory || "",
            example: item.example || "",
            section: item.section || "Vocabulary",
            emoji: item.emoji || "📘"
        })).filter(w => w.kanji || w.hiragana || w.meaning);

        filteredVocabulary = [...vocabulary];
        window.vocabulary = vocabulary;
        window.filteredVocabulary = filteredVocabulary;

        store.set("jlpt_lastLesson", num);
        safeText($("lessonSelected"), `Lesson ${num}`);

        vocabulary.forEach(v => {
            const key = wordKey(v);
            if (key && !srsData[key]) srsData[key] = { interval: 0, repetition: 0, eFactor: 2.5, dueDate: Date.now() };
        });
        store.set("jlpt_srs", srsData);

        updateDashboard();
        if (currentView === "vocabView") renderVocabulary();
        if (currentView === "reviewView") startReview();

    } catch (err) {
        console.warn(`Lesson ${num} load failed:`, err);
        showToast(`Lesson ${num} is not available yet.`, "error");
        const lastWorking = store.get("jlpt_lastLesson", 1);
        safeText($("lessonSelected"), `Lesson ${lastWorking}`);
    }
}
window.loadLesson = loadLesson;

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function updateDashboard() {
    safeText($("streakStat"), `🔥 ${userProfile.streak} Days`);
    safeText($("totalLearnedStat"), `${userProfile.learned.length} Words`);

    const now = Date.now();
    const dueCount = Object.values(srsData).filter(v => v && v.dueDate <= now).length;
    safeText($("dueReviewStat"), `${dueCount} Due`);

    const pct = Math.min(100, Math.round((userProfile.wordsStudiedToday / userProfile.dailyGoal) * 100));
    safeText($("dailyGoalStat"), `${userProfile.wordsStudiedToday} / ${userProfile.dailyGoal}`);
    if ($("goalProgressFill")) $("goalProgressFill").style.width = `${pct}%`;

    const lessonLearned = vocabulary.filter(item => userProfile.learned.includes(wordKey(item))).length;
    const lPct = vocabulary.length ? Math.round((lessonLearned / vocabulary.length) * 100) : 0;
    if ($("progressFill")) $("progressFill").style.width = lPct + "%";
    safeText($("lessonTitle"), `Lesson ${store.get("jlpt_lastLesson", 1)} · ${lessonLearned}/${vocabulary.length} learned`);

    const achList = $("achievementsList");
    if (achList) {
        const milestones = [
            { id: "first_10", t: "10 Words" },
            { id: "first_100", t: "100 Words Master" },
            { id: "streak_7", t: "7 Day Streak" }
        ];
        achList.innerHTML = milestones.map(m => {
            const unlocked = userProfile.achievements.includes(m.id);
            return `<div class="achievement-badge ${unlocked ? "" : "locked"}">${unlocked ? "🏅" : "🔒"} ${sanitizeHTML(m.t)}</div>`;
        }).join("");
    }

    if (typeof updateXPBar === "function") updateXPBar();
    if (typeof updateHeatmap === "function") updateHeatmap();
    if (typeof updateReadiness === "function") updateReadiness();
}
window.updateDashboard = updateDashboard;

function recordStudy() {
    userProfile.wordsStudiedToday++;
    store.set("jlpt_profile", userProfile);
    updateDashboard();
    if (userProfile.wordsStudiedToday === 10) checkAchievement("first_10", "First 10 Words");
    if (userProfile.learned.length >= 100) checkAchievement("first_100", "100 Words Master");
    if (userProfile.streak >= 7) checkAchievement("streak_7", "7 Day Streak");
}
window.recordStudy = recordStudy;

/* ═══════════════════════════════════════════════════════════════════════════════
   UNIFIED REVIEW ENGINE (Flashcards + SRS)
   ═══════════════════════════════════════════════════════════════════════════════ */
function startReview(customList) {
    const list = (Array.isArray(customList) && customList.length) ? customList : vocabulary;
    if (!list.length) return;
    vocabulary = list;
    window.vocabulary = vocabulary;
    reviewIndex = 0;
    window.reviewIndex = reviewIndex;
    showReviewCard();
}
window.startReview = startReview;

function showReviewCard() {
    const w = vocabulary[reviewIndex];
    if (!w) return;

    const card = $("srsFlashcard");
    card?.classList.remove("flipped");
    card?.setAttribute("aria-pressed", "false");
    const front = $("srsFront");
    const back  = $("srsBack");
    if (front) front.setAttribute("aria-hidden", "false");
    if (back)  back.setAttribute("aria-hidden",  "true");
    safeText($("srsCounter"), `Card ${reviewIndex + 1} / ${vocabulary.length}`);

    if (front) {
        front.innerHTML = `<div class="flash-accent-line"></div><div style="font-size:40px">${sanitizeHTML(w.emoji)}</div><div class="kanji" style="margin-top:16px">${sanitizeHTML(w.kanji || w.hiragana)}</div>`;
    }

    if (back) {
        back.innerHTML = `
            <div class="flash-accent-line"></div>
            <h2 style="color:var(--accent3)">${sanitizeHTML(w.hiragana)}</h2>
            <button class="fc-speak" type="button" data-speak-text="${sanitizeAttr(w.hiragana || w.kanji)}" title="Play Audio">🔊</button>
            <div class="meaning" style="font-size:20px;margin-top:12px;">${sanitizeHTML(w.meaning)}</div>
            ${w.memory ? `<div class="memory">${sanitizeHTML(w.memory)}</div>` : ""}
        `;
        // Bind audio button without inline onclick (CSP-friendly, no string-escaping fragility).
        const speakBtn = back.querySelector(".fc-speak");
        if (speakBtn) {
            speakBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                speakJapanese(speakBtn.dataset.speakText);
            });
        }
    }

    if ($("reviewPrevBtn")) $("reviewPrevBtn").disabled = reviewIndex === 0;
    if ($("reviewNextBtn")) $("reviewNextBtn").disabled = reviewIndex === vocabulary.length - 1;
}
window.showReviewCard = showReviewCard;

let isAnimatingCard = false;
function transitionCard(direction, callback) {
    if (isAnimatingCard) return;
    isAnimatingCard = true;

    const card = $("srsFlashcard");
    if (!card) { isAnimatingCard = false; return; }

    const outClass = direction === "left" ? "slide-out-left" : "slide-out-right";
    const inClass = direction === "left" ? "slide-in-left" : "slide-in-right";

    card.classList.add(outClass);

    setTimeout(() => {
        card.classList.remove(outClass);
        try {
            callback();
        } catch (e) {
            isAnimatingCard = false;
            console.warn("transitionCard callback error:", e);
            return;
        }
        void card.offsetWidth;
        card.classList.add(inClass);
        setTimeout(() => {
            card.classList.remove(inClass);
            isAnimatingCard = false;
        }, 300);
    }, 220);
}

$("srsFlashcard")?.addEventListener("click", () => {
    if (isAnimatingCard) return;
    const card = $("srsFlashcard");
    card.classList.toggle("flipped");
    haptic();
    if (card.classList.contains("flipped") && userProfile.autoPlay) {
        const w = vocabulary[reviewIndex];
        if (w) speakJapanese(w.hiragana || w.kanji);
    }
});

$("srsFlashcard")?.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { $("reviewPrevBtn")?.click(); }
    if (e.key === "ArrowRight") { $("reviewNextBtn")?.click(); }
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        $("srsFlashcard").click();
    }
});

$("reviewPrevBtn")?.addEventListener("click", () => {
    if (reviewIndex > 0) {
        transitionCard("right", () => {
            reviewIndex--;
            window.reviewIndex = reviewIndex;
            showReviewCard();
        });
    }
});

$("reviewNextBtn")?.addEventListener("click", () => {
    if (reviewIndex < vocabulary.length - 1) {
        transitionCard("left", () => {
            reviewIndex++;
            window.reviewIndex = reviewIndex;
            showReviewCard();
        });
    }
});

function speakJapanese(txt) {
    if (!window.speechSynthesis || !txt) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "ja-JP";
    u.rate = 0.95;
    if (japaneseVoice) u.voice = japaneseVoice;
    speechSynthesis.speak(u);
}
window.speakJapanese = speakJapanese;

[1, 2, 3, 4].forEach(grade => {
    $(`srsBtn${grade}`)?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isAnimatingCard) return;
        processSRSGrade(grade);
    });
});

function processSRSGrade(grade) {
    if (!vocabulary.length) return;
    const word = vocabulary[reviewIndex];
    if (!word) return;
    const key = wordKey(word);
    if (!key) return;

    let { interval, repetition, eFactor } = srsData[key] || { interval: 0, repetition: 0, eFactor: 2.5 };

    let _addedToWeakThisGrade = false;

    if (grade === 1) {
        // Again — you didn't know it. Full reset, due again today, marked weak.
        repetition = 0;
        interval = 0;
        eFactor = eFactor - 0.3;
        if (!userProfile.weak.includes(key)) {
            userProfile.weak.push(key);
            _addedToWeakThisGrade = true;
        }
    } else if (grade === 2) {
        // Hard — you got it, but with effort. Short delay, does NOT reset
        // progress and does NOT get dumped into Weak Words.
        interval = 1;
        repetition = Math.max(1, repetition);
        eFactor = eFactor - 0.15;
    } else if (grade === 3) {
        // Good — first time: 3 days. After that, grows normally.
        repetition++;
        interval = repetition === 1 ? 3 : Math.round(interval * eFactor);
        eFactor = eFactor + 0.05;
    } else {
        // Easy (grade 4) — first time: 7 days. After that, grows faster
        // than "Good" and the ease factor actually increases.
        repetition++;
        interval = repetition === 1 ? 7 : Math.round(interval * eFactor * 1.3);
        eFactor = eFactor + 0.15;
    }

    if (eFactor < 1.3) eFactor = 1.3;
    if (eFactor > 3.0) eFactor = 3.0;

    srsData[key] = { interval, repetition, eFactor, dueDate: Date.now() + interval * 86400000 };
    store.set("jlpt_srs", srsData);

    if (grade >= 3 && !userProfile.learned.includes(key)) {
        userProfile.learned.push(key);
    }
    store.set("jlpt_profile", userProfile);

    recordStudy();
    window._lastGradedWord = word;
    window._lastGradedAddedWeak = _addedToWeakThisGrade;

    if (reviewIndex < vocabulary.length - 1) {
        transitionCard("left", () => {
            reviewIndex++;
            window.reviewIndex = reviewIndex;
            showReviewCard();
        });
    } else {
        showToast("Lesson review complete! 🎉", "success");
    }
}
window.processSRSGrade = processSRSGrade;

/* ═══════════════════════════════════════════════════════════════════════════════
   UI & VIEW ROUTING
   ═══════════════════════════════════════════════════════════════════════════════ */
function syncNavPill(activeId) {
    document.querySelectorAll(".pill").forEach(p => p.classList.remove("active-pill"));
    const btn = $(activeId + "Btn");
    if (btn) btn.classList.add("active-pill");
}
window.syncNavPill = syncNavPill;

function showView(id) {
    const currentlyVisible = document.querySelector(".view-panel:not(.hidden)");
    const target = $(id);

    const finishSwitch = () => {
        document.querySelectorAll(".view-panel").forEach(el => {
            el.classList.add("hidden");
            el.classList.remove("fading-out");
        });
        if (target) {
            target.classList.remove("hidden");
            target.style.animation = "none";
            void target.offsetWidth;
            target.style.animation = "viewFadeIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both";
        }
        currentView = id;
        window.currentView = id;
        if ($("mobilePopover")) {
            $("mobilePopover").setAttribute("aria-hidden", "true");
            $("hamburgerBtn")?.setAttribute("aria-expanded", "false");
        }
    };

    if (currentlyVisible && currentlyVisible !== target) {
        currentlyVisible.classList.add("fading-out");
        setTimeout(finishSwitch, 170);
    } else {
        finishSwitch();
    }
}
window.showView = showView;

["dashboard", "vocab", "review", "quiz", "games"].forEach(v => {
    $(`${v}Btn`)?.addEventListener("click", () => {
        document.body.style.overflow = "";
        if (typeof closeSettingsDrawer === "function") closeSettingsDrawer();
        if (window._dailyChallengeWords && v !== "review") {
            window._dailyChallengeWords = null;
            loadLesson(store.get("jlpt_lastLesson", 1));
        }
        showView(`${v}View`);
        handleViewLogic(v);
    });
    $(`m${v.charAt(0).toUpperCase() + v.slice(1)}Btn`)?.addEventListener("click", () => {
        document.body.style.overflow = "";
        if (typeof closeSettingsDrawer === "function") closeSettingsDrawer();
        showView(`${v}View`);
        handleViewLogic(v);
    });
});
$("mThemeBtn")?.addEventListener("click", () => $("themeToggleBtn")?.click());
$("settingsBtn")?.addEventListener("click", () => window.openSettingsDrawer?.());
$("mSettingsBtn")?.addEventListener("click", () => window.openSettingsDrawer?.());

function handleViewLogic(v) {
    syncNavPill(v);
    if (v === "dashboard") updateDashboard();
    if (v === "vocab") { filteredVocabulary = [...vocabulary]; window.filteredVocabulary = filteredVocabulary; if ($("searchBox")) $("searchBox").value = ""; renderVocabulary(); }
    if (v === "review") startReview();
    if (v === "quiz") startNewQuiz();
    if (v === "games") { if (typeof renderGamesHub === "function") renderGamesHub(); }
}
window.handleViewLogic = handleViewLogic;

$("favBtn")?.addEventListener("click", () => {
    showView("vocabView"); syncNavPill("vocab");
    filteredVocabulary = vocabulary.filter(v => userProfile.favorites.includes(wordKey(v)));
    window.filteredVocabulary = filteredVocabulary;
    renderVocabulary();
});
$("weakBtn")?.addEventListener("click", () => {
    showView("vocabView"); syncNavPill("vocab");
    filteredVocabulary = vocabulary.filter(v => userProfile.weak.includes(wordKey(v)));
    window.filteredVocabulary = filteredVocabulary;
    renderVocabulary();
});

$("hamburgerBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = $("hamburgerBtn");
    const menu = $("mobilePopover");
    const isExpanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!isExpanded));
    menu.setAttribute("aria-hidden", String(isExpanded));
});

document.addEventListener("click", (e) => {
    const btn = $("hamburgerBtn");
    const menu = $("mobilePopover");
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target) && btn.getAttribute("aria-expanded") === "true") {
        btn.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
    }
});

/* ═══════════════════════════════════════════════════════════════════════════════
   VOCABULARY RENDERING (grouped by section)
   ═══════════════════════════════════════════════════════════════════════════════ */
function renderVocabulary() {
    const frag = document.createDocumentFragment();
    const cont = $("vocabularyContainer");
    if (!cont) return;

    if (!filteredVocabulary.length) {
        cont.innerHTML = `<div class="dash-card text-center" style="grid-column:1/-1;"><h3>No words found</h3></div>`;
        return;
    }

    const groupedVocab = {};
    filteredVocabulary.forEach(item => {
        const sectionName = item.section || "Vocabulary";
        if (!groupedVocab[sectionName]) groupedVocab[sectionName] = [];
        groupedVocab[sectionName].push(item);
    });

    Object.keys(groupedVocab).forEach(section => {
        const sectionHeader = document.createElement("div");
        sectionHeader.className = "vocab-section-header";
        sectionHeader.innerHTML = `<span>${sanitizeHTML(section)}</span>`;
        frag.appendChild(sectionHeader);

        groupedVocab[section].forEach(item => {
            const key = wordKey(item);
            const isLearned = userProfile.learned.includes(key);
            const isFav = userProfile.favorites.includes(key);

            const c = document.createElement("div");
            c.className = `card spatial-card ${isLearned ? "card-learned" : ""}`;
            c.dataset.wordKey  = key;
            c.dataset.kanji    = item.kanji    || "";
            c.dataset.hiragana = item.hiragana || "";
            c.dataset.meaning  = item.meaning  || "";
            c.dataset.memory   = item.memory   || "";
            c.dataset.example  = item.example  || "";
            c.dataset.emoji    = item.emoji    || "";

            c.innerHTML = `
                <div class="card-top">
                    <span class="emoji">${sanitizeHTML(item.emoji)}</span>
                    ${isLearned ? `<span class="learned-badge" title="Learned">✅</span>` : ""}
                </div>
                <div class="card-content">
                    <div class="kanji">${sanitizeHTML(item.kanji || item.hiragana)}</div>
                    <div class="hiragana">${sanitizeHTML(item.hiragana)}</div>
                    <div class="meaning">${sanitizeHTML(item.meaning)}</div>
                    ${item.memory ? `<div class="memory">${sanitizeHTML(item.memory)}</div>` : ""}
                </div>
                <div class="card-actions">
                    <button class="action-btn speak-btn" type="button" title="Listen">🔊</button>
                    <button class="action-btn favorite-btn ${isFav ? "favorited" : ""}" type="button" title="Favorite">${isFav ? "⭐" : "☆"}</button>
                </div>`;

            c.querySelector(".speak-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                speakJapanese(item.hiragana || item.kanji);
            });
            c.querySelector(".favorite-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                const idx = userProfile.favorites.indexOf(key);
                if (idx > -1) userProfile.favorites.splice(idx, 1);
                else userProfile.favorites.push(key);
                store.set("jlpt_profile", userProfile);
                renderVocabulary();
                updateDashboard();
            });
            frag.appendChild(c);
        });
    });

    cont.replaceChildren(frag);

    requestAnimationFrame(() => {
        document.querySelectorAll(".card:not(.revealed)").forEach(c => revealObserver.observe(c));
    });
}
window.renderVocabulary = renderVocabulary;

let searchDebounce;
$("searchBox")?.addEventListener("input", e => {
    clearTimeout(searchDebounce);
    const q = e.target.value.trim();

    if (!q) {
        filteredVocabulary = [...vocabulary];
        window.filteredVocabulary = filteredVocabulary;
        if (currentView === "vocabView") renderVocabulary();
        if (typeof closeJishoDropdown === "function") closeJishoDropdown();
        return;
    }

    searchDebounce = setTimeout(() => {
        const ql = q.toLowerCase();
        const rq = normalizeRomaji(ql);

        const localMatches = vocabulary.filter(i =>
            (i.kanji || "").includes(q) ||
            (i.hiragana || "").includes(q) ||
            (i.meaning || "").toLowerCase().includes(ql) ||
            (i.hiragana || "").includes(rq)
        );

        if (localMatches.length > 0) {
            if (currentView !== "vocabView") showView("vocabView");
            filteredVocabulary = localMatches;
            window.filteredVocabulary = filteredVocabulary;
            renderVocabulary();
            if (typeof closeJishoDropdown === "function") closeJishoDropdown();
        } else if (typeof fetchJisho === "function") {
            fetchJisho(q);
        }
    }, 280);
});

/* ═══════════════════════════════════════════════════════════════════════════════
   QUIZ MODE
   ═══════════════════════════════════════════════════════════════════════════════ */
let quizStreak = 0;
let quizBestStreak = 0;
let quizHistory = [];

$("modeKanjiBtn")?.addEventListener("click", () => {
    if (quizMode === "kanjiToMeaning") return;
    quizMode = "kanjiToMeaning";
    $("modeKanjiBtn").classList.add("active-mode");
    $("modeMeaningBtn").classList.remove("active-mode");
    startNewQuiz();
});

$("modeMeaningBtn")?.addEventListener("click", () => {
    if (quizMode === "meaningToKanji") return;
    quizMode = "meaningToKanji";
    $("modeMeaningBtn").classList.add("active-mode");
    $("modeKanjiBtn").classList.remove("active-mode");
    startNewQuiz();
});

function startNewQuiz() {
    if (!vocabulary.length) { showToast("Load a lesson first!", "error"); return; }
    qNum = 0;
    score = 0;
    quizStreak = 0;
    quizHistory = [];
    quizQueue = shuffleArray([...vocabulary]);

    const resBox = $("quizResult");
    if (resBox) resBox.innerHTML = "";

    if ($("quizQuestion")) $("quizQuestion").style.display = "block";
    ["optionA", "optionB", "optionC", "optionD"].forEach(id => { if ($(id)) $(id).style.display = "block"; });

    updateQuizUI();
    nextQuizQuestion();
}
window.startNewQuiz = startNewQuiz;

function updateQuizUI() {
    safeText($("scoreDisplay"), `⭐ Score: ${score}`);
    safeText($("streakDisplay"), `🔥 Streak: ${quizStreak}`);
    safeText($("bestStreakDisplay"), `🏆 Best: ${quizBestStreak}`);
    safeText($("quizCounter"), `Question ${Math.min(qNum + 1, 20)} / 20`);

    const fill = $("quizProgressFill");
    if (fill) fill.style.width = `${(qNum / 20) * 100}%`;
}

function nextQuizQuestion() {
    if (vocabulary.length < 4) {
        showToast("Not enough words in this lesson to quiz!", "error");
        return;
    }
    if (qNum >= 20 || quizQueue.length === 0) {
        endQuiz();
        return;
    }

    updateQuizUI();

    const w = quizQueue.pop();
    if (!w) return;
    window._currentQuizWord = w;

    const isRev = quizMode === "meaningToKanji";

    const qText = $("quizQuestion");
    if (qText) {
        qText.classList.remove("q-in");
        void qText.offsetWidth;
        qText.classList.add("q-in");
        safeText(qText, isRev ? w.meaning : (w.kanji || w.hiragana));
    }

    const ans = isRev ? (w.kanji || w.hiragana) : w.meaning;

    if ($("quizSpeakBtn")) {
        if (isRev) {
            $("quizSpeakBtn").style.display = "none";
        } else {
            $("quizSpeakBtn").style.display = "block";
            $("quizSpeakBtn").onclick = () => speakJapanese(w.hiragana || w.kanji);
        }
    }

    const pool = shuffleArray(
        vocabulary.filter(x => (isRev ? (x.kanji || x.hiragana) : x.meaning) !== ans)
    ).slice(0, 3);
    const opts = shuffleArray([ans, ...pool.map(x => (isRev ? (x.kanji || x.hiragana) : x.meaning))]);

    ["optionA", "optionB", "optionC", "optionD"].forEach((id, i) => {
        const b = $(id);
        if (!b || opts[i] === undefined) return;
        b.className = "quiz-option opt-enter";
        b.disabled = false;
        b.style.opacity = "1";
        b.style.transform = "none";
        safeText(b, opts[i]);

        setTimeout(() => b.classList.remove("opt-enter"), 400);

        b.onclick = () => {
            document.querySelectorAll(".quiz-option").forEach(btn => {
                btn.disabled = true;
                if (btn.textContent === ans) btn.classList.add("correct");
            });

            const key = wordKey(w);
            if (opts[i] === ans) {
                score++;
                quizStreak++;
                quizBestStreak = Math.max(quizBestStreak, quizStreak);
                b.classList.add("correct");
                quizHistory.push({ word: w, correct: true });
                recordStudy();
            } else {
                quizStreak = 0;
                b.classList.add("wrong");
                quizHistory.push({ word: w, correct: false });
                if (key && !userProfile.weak.includes(key)) userProfile.weak.push(key);
            }

            store.set("jlpt_profile", userProfile);
            updateQuizUI();

            setTimeout(() => {
                const quizBox = document.querySelector(".quiz-box");
                quizBox?.classList.add("slide-out-left");
                setTimeout(() => {
                    quizBox?.classList.remove("slide-out-left");
                    qNum++;
                    nextQuizQuestion();
                    quizBox?.classList.add("slide-in-right");
                    setTimeout(() => quizBox?.classList.remove("slide-in-right"), 300);
                }, 220);
            }, 1000);
        };
    });
}
window.nextQuizQuestion = nextQuizQuestion;

function endQuiz() {
    if ($("quizQuestion")) $("quizQuestion").style.display = "none";
    if ($("quizSpeakBtn")) $("quizSpeakBtn").style.display = "none";
    ["optionA", "optionB", "optionC", "optionD"].forEach(id => { if ($(id)) $(id).style.display = "none"; });
    safeText($("quizCounter"), "Quiz Complete");
    if ($("quizProgressFill")) $("quizProgressFill").style.width = "100%";

    const pct = quizHistory.length ? Math.round((score / quizHistory.length) * 100) : 0;
    const resBox = $("quizResult");
    if (!resBox) return;

    const summary = document.createElement("div");
    summary.className = "quiz-summary";

    const scoreWrap = document.createElement("div");
    scoreWrap.className = "quiz-summary-score";
    const scoreBig = document.createElement("div");
    scoreBig.className = "score-big";
    scoreBig.textContent = `${score} / ${quizHistory.length}`;
    const scoreLabel = document.createElement("div");
    scoreLabel.className = "score-label";
    scoreLabel.textContent = "Final Score";
    scoreWrap.append(scoreBig, scoreLabel);

    const statsWrap = document.createElement("div");
    statsWrap.className = "quiz-summary-stats";
    const mkStat = (val, key) => {
        const s = document.createElement("div"); s.className = "quiz-summary-stat";
        const v = document.createElement("div"); v.className = "stat-val"; v.textContent = String(val);
        const k = document.createElement("div"); k.className = "stat-key"; k.textContent = key;
        s.append(v, k); return s;
    };
    statsWrap.append(mkStat(`${pct}%`, "Accuracy"), mkStat(quizBestStreak, "Best Streak"));

    const radarWrap = document.createElement("div");
    radarWrap.className = "radar-chart-wrap";
    radarWrap.style.margin = "14px 0";
    const radarTitle = document.createElement("div");
    radarTitle.className = "radar-chart-title";
    radarTitle.textContent = "Performance Radar";
    const radarCanvas = document.createElement("canvas");
    radarCanvas.id = "quizRadarCanvas";
    radarCanvas.width = 220; radarCanvas.height = 220;
    radarWrap.append(radarTitle, radarCanvas);

    const reportList = document.createElement("div");
    reportList.className = "quiz-report-list";
    quizHistory.forEach(h => {
        const row = document.createElement("div");
        row.className = `quiz-report-item ${h.correct ? "r-correct" : "r-wrong"}`;
        const icon = document.createElement("span"); icon.className = "r-icon"; icon.textContent = h.correct ? "✅" : "❌";
        const kanji = document.createElement("span"); kanji.className = "r-kanji"; kanji.textContent = h.word.kanji || h.word.hiragana || "";
        const kana  = document.createElement("span"); kana.className  = "r-kana";  kana.textContent  = h.word.hiragana || "";
        const mean  = document.createElement("span"); mean.style.cssText = "margin-left:auto; font-size:12px; opacity:0.8;"; mean.textContent = h.word.meaning || "";
        row.append(icon, kanji, kana, mean);
        reportList.appendChild(row);
    });

    const restartBtn = document.createElement("button");
    restartBtn.className = "quiz-summary-restart";
    restartBtn.type = "button";
    restartBtn.textContent = "Retry Quiz";
    restartBtn.addEventListener("click", startNewQuiz);

    summary.append(scoreWrap, statsWrap, radarWrap, reportList, restartBtn);
    resBox.replaceChildren(summary);

    setTimeout(() => {
        if (typeof drawRadarFromHistory === "function") {
            drawRadarFromHistory("quizRadarCanvas", quizHistory);
        }
    }, 80);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CUSTOM LESSON DROPDOWN
   ═══════════════════════════════════════════════════════════════════════════════ */
const dropBox = $("lessonDropdown");
const dropSel = $("lessonSelected");
const dropOpts = $("lessonOptions");

if (dropBox && dropSel && dropOpts) {
    dropBox.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !dropBox.classList.contains("open");
        dropBox.classList.toggle("open");
        dropBox.setAttribute("aria-expanded", String(willOpen));
    });
    dropBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            dropBox.click();
        }
    });

    document.addEventListener("click", e => {
        if (!dropBox.contains(e.target)) {
            dropBox.classList.remove("open");
            dropBox.setAttribute("aria-expanded", "false");
        }
    });

    const fragOpts = document.createDocumentFragment();
    for (let i = 1; i <= 50; i++) {
        const o = document.createElement("div");
        o.className = "dropdown-option";
        o.setAttribute("role", "option");
        o.tabIndex = 0;
        o.textContent = `Lesson ${i}`;
        o.addEventListener("click", (e) => {
            e.stopPropagation();
            dropSel.textContent = `Lesson ${i}`;
            dropBox.classList.remove("open");
            dropBox.setAttribute("aria-expanded", "false");
            loadLesson(i);
        });
        fragOpts.appendChild(o);
    }
    dropOpts.appendChild(fragOpts);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMMAND PALETTE
   ═══════════════════════════════════════════════════════════════════════════════ */
const commands = [
    { n: "Go to Dashboard", k: "H", a: () => $("dashboardBtn")?.click() },
    { n: "Go to Vocabulary", k: "V", a: () => $("vocabBtn")?.click() },
    { n: "Review SRS", k: "R", a: () => $("reviewBtn")?.click() },
    { n: "Start Quiz", k: "Q", a: () => $("quizBtn")?.click() },
    { n: "Open Games", k: "", a: () => $("gamesBtn")?.click() },
    { n: "My Decks", k: "D", a: () => $("decksNavBtn")?.click() },
    { n: "Toggle Theme", k: "", a: () => $("themeToggleBtn")?.click() },
    { n: "Open Settings", k: "", a: () => $("settingsBtn")?.click() },
    { n: "Export Backup", k: "", a: () => store.export() },
    { n: "Daily Challenge", k: "", a: () => window.startDailyChallenge?.() },
    { n: "Speed Round", k: "", a: () => window.startSpeedRound?.() },
    { n: "Keyboard Shortcuts", k: "?", a: () => $("shortcutOverlay")?.classList.remove("hidden") }
];

document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCmdPalette();
        return;
    }
    if (e.key === "Escape") { $("cmdOverlay")?.classList.add("hidden"); closeFeedback(); }

    if (currentView === "reviewView") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.key === "ArrowRight") $("reviewNextBtn")?.click();
        if (e.key === "ArrowLeft") $("reviewPrevBtn")?.click();
        if (e.key === " ") { e.preventDefault(); $("srsFlashcard")?.click(); }
        if (e.key === "1") $("srsBtn1")?.click();
        if (e.key === "2") $("srsBtn2")?.click();
        if (e.key === "3") $("srsBtn3")?.click();
        if (e.key === "4") $("srsBtn4")?.click();
    }
});

function toggleCmdPalette() {
    const o = $("cmdOverlay"), i = $("cmdInput");
    if (!o || !i) return;
    if (o.classList.contains("hidden")) { o.classList.remove("hidden"); i.value = ""; i.focus(); renderCmd(); }
    else { o.classList.add("hidden"); }
}
window.toggleCmdPalette = toggleCmdPalette;
$("cmdPaletteMobileBtn")?.addEventListener("click", toggleCmdPalette);
$("cmdCloseBtn")?.addEventListener("click", () => $("cmdOverlay")?.classList.add("hidden"));

$("cmdInput")?.addEventListener("input", e => renderCmd(e.target.value.toLowerCase()));
function renderCmd(q = "") {
    const r = $("cmdResults");
    if (!r) return;
    r.innerHTML = "";
    const matches = commands.filter(c => c.n.toLowerCase().includes(q));
    matches.forEach(c => {
        const li = document.createElement("li");
        li.className = "cmd-item";
        li.tabIndex = 0;
        const nameSpan = document.createElement("span");
        nameSpan.textContent = c.n;
        const kbdSpan = document.createElement("span");
        kbdSpan.className = "cmd-kbd";
        kbdSpan.textContent = c.k;
        li.appendChild(nameSpan);
        li.appendChild(kbdSpan);
        li.addEventListener("click", () => { c.a(); toggleCmdPalette(); });
        r.appendChild(li);
    });
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FEEDBACK MODAL
   ═══════════════════════════════════════════════════════════════════════════════ */
$("feedbackFab")?.addEventListener("click", () => $("feedbackOverlay")?.classList.remove("hidden"));
function closeFeedback() {
    $("feedbackOverlay")?.classList.add("hidden");
    if ($("feedbackText")) $("feedbackText").value = "";
}
window.closeFeedback = closeFeedback;

$("submitFeedbackBtn")?.addEventListener("click", () => {
    const c = $("feedbackCategory")?.value || "Other";
    const t = $("feedbackText")?.value || "";
    const to = "sahurahulcoc@gmail.com";
    const subject = encodeURIComponent(`JLPT Trainer Feedback: ${c}`);
    const body = encodeURIComponent(t);

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isIOS) {
        window.location.href = `googlegmail:///co?to=${to}&subject=${subject}&body=${body}`;
    } else if (isMobile) {
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
    } else {
        const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
        window.open(`https://mail.google.com/mail/u/0/?extsrc=mailto&url=${encodeURIComponent(mailtoLink)}`, "_blank", "noopener,noreferrer");
    }
    closeFeedback();
    showToast("Opening Gmail...", "success");
});

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════════ */
function updateThemeLabels(isLight) {
    const label = $("themeLabel");
    const hoverLabel = $("themeLabelHover");
    const mLabel = $("mThemeBtn");
    if (label) label.textContent = isLight ? "🌙 Dark" : "☀️ Light";
    if (hoverLabel) hoverLabel.textContent = isLight ? "☀️ Light" : "🌙 Dark";
    if (mLabel) mLabel.textContent = isLight ? "🌙 Dark Mode" : "☀️ Light Mode";
}

$("themeToggleBtn")?.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    store.set("jlpt_theme", isLight ? "light" : "dark");
    if (window.__setLightRaysTheme) window.__setLightRaysTheme(isLight);
    updateThemeLabels(isLight);
});

const isLightTheme = store.get("jlpt_theme") === "light";
if (isLightTheme) document.body.classList.add("light-theme");
updateThemeLabels(isLightTheme);
const metaThemeInit = document.getElementById("metaThemeColor");
if (metaThemeInit) metaThemeInit.content = isLightTheme ? "#e2e8f0" : "#07080d";

/* ═══════════════════════════════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════════════════════════════ */
const initLvl = store.get("jlpt_lastLesson", 1);
loadLesson(initLvl);

const _startHash = (window.location.hash || "").replace("#", "");
if (_startHash === "review") {
    showView("reviewView");
    syncNavPill("review");
    setTimeout(() => startReview(), 50);
} else if (_startHash === "quiz") {
    showView("quizView");
    syncNavPill("quiz");
    setTimeout(() => startNewQuiz(), 50);
} else {
    showView("dashboardView");
    syncNavPill("dashboard");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   GSAP FLUID PILL-HOVER ANIMATION
   ═══════════════════════════════════════════════════════════════════════════════ */
function setupGSAPPill(pill) {
    const circle = pill.querySelector(".hover-circle");
    const label = pill.querySelector(".pill-label");
    const white = pill.querySelector(".pill-label-hover");

    if (!circle || !label || !white || pill.dataset.gsapBound || typeof gsap === "undefined") return;
    pill.dataset.gsapBound = "true";
    let tl;

    const updateLayout = () => {
        const w = pill.offsetWidth || 120;
        const h = pill.offsetHeight || 36;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });
        gsap.set(label, { y: 0 });
        gsap.set(white, { y: h + 10, opacity: 0 });

        if (tl) tl.kill();
        tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, duration: 0.35, ease: "power2.out" }, 0);
        tl.to(label, { y: -(h + 5), duration: 0.35, ease: "power2.out" }, 0);
        tl.to(white, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    };

    pill.addEventListener("mouseenter", () => { updateLayout(); tl.play(); });
    pill.addEventListener("mouseleave", () => { if (tl) tl.reverse(); });
}

function initAllPillAnimations() {
    document.querySelectorAll(".pill, .pill-anim").forEach(setupGSAPPill);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SMART SCROLL (hide nav/toolbar on scroll-down)
   ═══════════════════════════════════════════════════════════════════════════════ */
let lastScrollY = window.scrollY;
const pillNavWrap = $("pillNavWrap");
const floatingToolbar = $("floatingToolbar");

window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    if (Math.abs(currentScrollY - lastScrollY) > 10) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            pillNavWrap?.classList.add("nav-hidden");
            floatingToolbar?.classList.add("toolbar-hidden");
        } else {
            pillNavWrap?.classList.remove("nav-hidden");
            floatingToolbar?.classList.remove("toolbar-hidden");
        }
        lastScrollY = currentScrollY;
    }
}, { passive: true });

/* ═══════════════════════════════════════════════════════════════════════════════
   SRS DOCK — mouse-proximity magnification (macOS-dock style)
   ═══════════════════════════════════════════════════════════════════════════════ */
function setupSRSDock() {
    const dock = $("srsDock");
    if (!dock) return;

    const items = Array.from(dock.querySelectorAll(".srs-dock-item"));
    const buttons = items.map(item => item.querySelector(".srs-dock-btn")).filter(Boolean);
    const BASE_SIZE = 56;
    const MAX_SIZE = 88;
    const INFLUENCE = 150;

    let centers = [];
    let rafPending = false;
    let lastClientX = 0;

    function recalcCenters() {
        centers = buttons.map(btn => {
            const rect = btn.getBoundingClientRect();
            return rect.left + rect.width / 2;
        });
    }

    function applyMagnification(clientX) {
        buttons.forEach((btn, i) => {
            const dist = Math.abs(clientX - centers[i]);
            let size = dist < INFLUENCE
                ? BASE_SIZE + (MAX_SIZE - BASE_SIZE) * Math.pow(1 - dist / INFLUENCE, 1.8)
                : BASE_SIZE;
            size = Math.round(size);
            btn.style.width = size + "px";
            btn.style.height = size + "px";
            btn.style.fontSize = Math.round(size * 0.40) + "px";
            btn.style.borderRadius = Math.round(size * 0.265) + "px";
        });
        rafPending = false;
    }

    dock.addEventListener("mouseenter", recalcCenters);
    dock.addEventListener("mousemove", e => {
        lastClientX = e.clientX;
        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => applyMagnification(lastClientX));
        }
    });
    dock.addEventListener("mouseleave", () => {
        buttons.forEach(btn => {
            btn.style.width = "";
            btn.style.height = "";
            btn.style.fontSize = "";
            btn.style.borderRadius = "";
        });
    });

    window.addEventListener("resize", () => {
        if (dock.matches(":hover")) recalcCenters();
    }, { passive: true });

    buttons.forEach(btn => {
        btn.addEventListener("touchstart", () => {
            btn.style.width = MAX_SIZE + "px";
            btn.style.height = MAX_SIZE + "px";
            btn.style.fontSize = Math.round(MAX_SIZE * 0.40) + "px";
        }, { passive: true });
        btn.addEventListener("touchend", () => {
            btn.style.width = "";
            btn.style.height = "";
            btn.style.fontSize = "";
        }, { passive: true });
    });
}

setTimeout(initAllPillAnimations, 200);
setupSRSDock();
