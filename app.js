"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
// LIGHTRAYS — Vanilla WebGL background
// ═══════════════════════════════════════════════════════════════════════════════
(function initLightRays() {
    const canvas = document.getElementById("lightRaysCanvas");
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;

    const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
    const FRAG = `precision highp float; uniform float iTime; uniform vec2 iRes; uniform vec2 rayPos; uniform vec2 rayDir; uniform vec3 raysColor; float rayStrength(vec2 src, vec2 dir, vec2 coord, float sA, float sB, float spd){ vec2 d = coord - src; float ca = dot(normalize(d), dir); float da = ca + 0.04 * sin(iTime*2.0 + length(d)*0.01)*0.2; float sp = pow(max(da,0.0), 1.0/0.55); float dist = length(d); float mxD = iRes.x * 1.6; float lf = clamp((mxD - dist)/mxD, 0.0, 1.0); float ff = clamp((iRes.x*1.2 - dist)/(iRes.x*1.2), 0.5, 1.0); float bs = clamp((0.45 + 0.15*sin(da*sA + iTime*spd)) + (0.30 + 0.20*cos(-da*sB + iTime*spd)), 0.0, 1.0); return bs * lf * ff * sp; } void main(){ vec2 coord = vec2(gl_FragCoord.x, iRes.y - gl_FragCoord.y); float r1 = rayStrength(rayPos, rayDir, coord, 36.2214, 21.1135, 1.5); float r2 = rayStrength(rayPos, rayDir, coord, 22.3991, 18.0234, 1.1); float v = r1*0.5 + r2*0.4; vec3 col = raysColor * v; gl_FragColor = vec4(col, v * 0.9); }`;

    const prog = gl.createProgram();
    const vs = gl.createShader(gl.VERTEX_SHADER), fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs, VERT); gl.compileShader(vs);
    gl.shaderSource(fs, FRAG); gl.compileShader(fs);
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = { iTime: gl.getUniformLocation(prog, "iTime"), iRes: gl.getUniformLocation(prog, "iRes"), rayPos: gl.getUniformLocation(prog, "rayPos"), rayDir: gl.getUniformLocation(prog, "rayDir"), raysColor: gl.getUniformLocation(prog, "raysColor") };

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
        canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", () => setTimeout(resize, 80), { passive: true }); resize();

    function loop(ts) {
        // Only run the heavy WebGL math if the tab is currently visible
        if (!document.hidden) {
            if (colorT < 1) {
                colorT = Math.min(1, (performance.now() - fadeStart) / 500);
               
                currentColor = startColor.map((c, i) =>
                    c + (targetColor[i] - c) * colorT
                );
            }
            
            gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.uniform1f(U.iTime, ts * 0.0009); gl.uniform2f(U.iRes, canvas.width, canvas.height);
            gl.uniform2f(U.rayPos, canvas.width * 0.5, -0.15 * canvas.height); gl.uniform2f(U.rayDir, 0.0, 1.0);
            gl.uniform3f(U.raysColor, currentColor[0], currentColor[1], currentColor[2]);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        
        // This keeps the loop alive in the background without burning CPU
        requestAnimationFrame(loop);
    }
    
    if (document.body.classList.contains("light-theme")) window.__setLightRaysTheme(true);
    
    // The crucial ignition key that was missing!
    requestAnimationFrame(loop); 
})();

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL HELPERS & PWA INIT
// ═══════════════════════════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);
function haptic(ms = 15) {
    if (navigator.vibrate) {
        navigator.vibrate(ms);
    }
}
function safeText(el, text) { if (el) el.textContent = String(text ?? ""); }

// ADD THIS UTILITY:
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// ADD THIS UTILITY:
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.onerror = (msg, url, line) => { showToast(`Error: ${msg}`, 'error'); return false; };
window.addEventListener('unhandledrejection', e => showToast(`Failed: ${e.reason}`, 'error'));

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

let japaneseVoice = null;

function initSpeechVoices() {
    const voices = speechSynthesis.getVoices();

    japaneseVoice =
        voices.find(v => v.lang === "ja-JP") ||
        voices.find(v => v.lang.startsWith("ja")) ||
        null;
}

speechSynthesis.onvoiceschanged = initSpeechVoices;

document.addEventListener(
    "click",
    () => {
        initSpeechVoices();
    },
    { once: true }
);

// ═══════════════════════════════════════════════════════════════════════════════
// DATA STORE ARCHITECTURE 
// ═══════════════════════════════════════════════════════════════════════════════
const store = {
    get: (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } },
    set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { showToast("Storage quota exceeded!", "error"); } },
    export: () => {
        const data = { profile: store.get('jlpt_profile', {}), srs: store.get('jlpt_srs', {}), lesson: store.get('jlpt_lastLesson', 1) };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jlpt_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(a.href);
    },
    import: (file) => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if(data.profile) store.set('jlpt_profile', data.profile);
                if(data.srs) store.set('jlpt_srs', data.srs);
                showToast("Data Restored Successfully", "success"); setTimeout(()=>location.reload(), 1500);
            } catch { showToast("Invalid backup file.", "error"); }
        };
        reader.readAsText(file);
    }
};

let userProfile = store.get('jlpt_profile', {
    learned: [], favorites: [], weak: [], streak: 0, bestStreak: 0, lastActive: 0,
    dailyGoal: 20, wordsStudiedToday: 0, autoPlay: false, achievements: []
});
let srsData = store.get('jlpt_srs', {}); 

const todayStr = new Date().toDateString();
if (store.get('jlpt_lastActiveDate', '') !== todayStr) {
    const last = new Date(userProfile.lastActive);
    const diff = (new Date() - last) / (1000 * 60 * 60 * 24);
    if (diff > 1 && diff <= 2) userProfile.streak++;
    else if (diff > 2) userProfile.streak = 1;
    else if (userProfile.streak === 0) userProfile.streak = 1;
    
    userProfile.wordsStudiedToday = 0;
    store.set('jlpt_lastActiveDate', todayStr);
}
userProfile.bestStreak = Math.max(userProfile.bestStreak, userProfile.streak);
userProfile.lastActive = Date.now();
store.set('jlpt_profile', userProfile);

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════
let vocabulary = [], filteredVocabulary = [], currentView = 'dashboardView';
let reviewIndex = 0; // Unified tracker for the Review section
let quizMode = "kanjiToMeaning", score = 0, qNum = 0, quizQueue = [];

// ═══════════════════════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER & MAPPER
// ═══════════════════════════════════════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); revealObserver.unobserve(e.target); }
    });
}, { threshold: 0.05, rootMargin: "0px 0px 50px 0px" });

const r2k = {"a":"あ","i":"い","u":"う","e":"え","o":"お","ka":"か","ki":"き","ku":"く","ke":"け","ko":"こ","sa":"さ","shi":"し","su":"す","se":"せ","so":"そ","ta":"た","chi":"ち","tsu":"つ","te":"て","to":"と","na":"な","ni":"に","nu":"ぬ","ne":"ね","no":"の","ha":"は","hi":"ひ","fu":"ふ","he":"へ","ho":"ほ","ma":"ま","mi":"み","mu":"む","me":"め","mo":"も","ya":"や","yu":"ゆ","yo":"よ","ra":"ら","ri":"り","ru":"る","re":"れ","ro":"ろ","wa":"わ","wo":"を","nn":"ん","ga":"が","gi":"ぎ","gu":"ぐ","ge":"げ","go":"ご","za":"ざ","ji":"じ","zu":"ず","ze":"ぜ","zo":"ぞ","da":"だ","de":"で","do":"ど","ba":"ば","bi":"び","bu":"ぶ","be":"べ","bo":"ぼ","pa":"ぱ","pi":"ぴ","pu":"ぷ","pe":"ぺ","po":"ぽ","kya":"きゃ","kyu":"きゅ","kyo":"きょ","sha":"しゃ","shu":"しゅ","sho":"しょ","cha":"ちゃ","chu":"ちゅ","cho":"ちょ","nya":"にゃ","nyu":"にゅ","nyo":"にょ","hya":"ひゃ","hyu":"ひゅ","hyo":"ひょ","mya":"みゃ","myu":"みゅ","myo":"みょ","rya":"りゃ","ryu":"りゅ","ryo":"りょ","gya":"ぎゃ","gyu":"ぎゅ","gyo":"ぎょ","ja":"じゃ","ju":"じゅ","jo":"じょ","bya":"びゃ","byu":"びゅ","byo":"びょ","pya":"ぴゃ","pyu":"ぴゅ","pyo":"ぴょ"};
function normalizeRomaji(str) {
    let s = str.toLowerCase(), res = "";
    while(s.length) {
        if(s.length>=3 && r2k[s.substring(0,3)]) { res += r2k[s.substring(0,3)]; s = s.substring(3); }
        else if(s.length>=2 && r2k[s.substring(0,2)]) { res += r2k[s.substring(0,2)]; s = s.substring(2); }
        else if(r2k[s.substring(0,1)]) { res += r2k[s.substring(0,1)]; s = s.substring(1); }
        else { res += s[0]; s = s.substring(1); }
    }
    return res;
}

function showToast(msg, type='success') {
    const t = document.createElement('div'); t.className = `toast toast-${type}`; t.textContent = msg;
    $('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
function checkAchievement(id, title) {
    if (!userProfile.achievements.includes(id)) {
        userProfile.achievements.push(id); store.set('jlpt_profile', userProfile);
        showToast(`🏆 Achievement Unlocked: ${title}!`, 'success');
        updateDashboard();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD LESSON 
// ═══════════════════════════════════════════════════════════════════════════════
async function loadLesson(num) {
    try {
        const res = await fetch(`data/lesson${num}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        let data = Array.isArray(raw) ? raw : raw.vocabulary || raw.words || raw.items;
        vocabulary = data.map(item => ({
            kanji: item.kanji || item.word || "",
            hiragana: item.hiragana || item.reading || "",
            meaning: item.meaning || item.english || "",
            memory: item.memory || "", example: item.example || "",
            section: item.section || "Vocabulary", emoji: item.emoji || "📘"
        })).filter(w => w.kanji || w.hiragana || w.meaning);
        
        filteredVocabulary = [...vocabulary];
        store.set('jlpt_lastLesson', num);
        $('lessonSelected').textContent = `Lesson ${num}`;
        
        vocabulary.forEach(v => {
            if (!srsData[v.kanji]) srsData[v.kanji] = { interval: 0, repetition: 0, eFactor: 2.5, dueDate: Date.now() };
        });
        store.set('jlpt_srs', srsData);

        updateDashboard();
        if(currentView === 'vocabView') renderVocabulary();
        if(currentView === 'reviewView') startReview();
        
    } catch (err) {
        showToast(`Lesson ${num} is not available yet.`, 'error');
        // Rollback the UI to the last known working lesson
        const lastWorking = store.get('jlpt_lastLesson', 1);
        $('lessonSelected').textContent = `Lesson ${lastWorking}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD 
// ═══════════════════════════════════════════════════════════════════════════════
function updateDashboard() {
    safeText($("streakStat"), `🔥 ${userProfile.streak} Days`);
    safeText($("totalLearnedStat"), `${userProfile.learned.length} Words`);
    
    const now = Date.now();
    const dueCount = Object.values(srsData).filter(v => v.dueDate <= now).length;
    safeText($("dueReviewStat"), `${dueCount} Due`);
    
    const pct = Math.min(100, Math.round((userProfile.wordsStudiedToday / userProfile.dailyGoal) * 100));
    safeText($("dailyGoalStat"), `${userProfile.wordsStudiedToday} / ${userProfile.dailyGoal}`);
    if($("goalProgressFill")) $("goalProgressFill").style.width = `${pct}%`;

    const lessonLearned = vocabulary.filter(item => userProfile.learned.includes(item.kanji)).length;
    const lPct = vocabulary.length ? Math.round((lessonLearned / vocabulary.length) * 100) : 0;
    if($("progressFill")) $("progressFill").style.width = lPct + "%";
    safeText($("lessonTitle"), `Lesson ${store.get('jlpt_lastLesson', 1)} · ${lessonLearned}/${vocabulary.length} learned`);

    const achList = $("achievementsList");
    if(achList) {
        const milestones = [{id:'first_10', t:'10 Words'}, {id:'first_100', t:'100 Words Master'}, {id:'streak_7', t:'7 Day Streak'}];
        achList.innerHTML = milestones.map(m => 
            `<div class="achievement-badge ${userProfile.achievements.includes(m.id)?'':'locked'}">${userProfile.achievements.includes(m.id)?'🏅':'🔒'} ${m.t}</div>`
        ).join('');
    }
}

function recordStudy() {
    userProfile.wordsStudiedToday++; store.set('jlpt_profile', userProfile);
    updateDashboard();
    if (userProfile.wordsStudiedToday === 10) checkAchievement('first_10', 'First 10 Words');
    if (userProfile.learned.length >= 100) checkAchievement('first_100', '100 Words Master');
    if (userProfile.streak >= 7) checkAchievement('streak_7', '7 Day Streak');
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED REVIEW ENGINE (Cards + SRS)
// ═══════════════════════════════════════════════════════════════════════════════
function startReview() {
    if (!vocabulary.length) return;
    reviewIndex = 0;
    showReviewCard();
}

function showReviewCard() {
    const w = vocabulary[reviewIndex]; 
    if(!w) return;

    // Reset UI State for the new card
    $("srsFlashcard").classList.remove("flipped");
    safeText($("srsCounter"), `Card ${reviewIndex + 1} / ${vocabulary.length}`);
    
    // Inject Content
    
    $("srsFront").innerHTML = `<div style="font-size:40px">${sanitizeHTML(w.emoji)}</div><div class="kanji" style="margin-top:16px">${sanitizeHTML(w.kanji)}</div>`;
    
    // Safely encode variables for the inline onclick handler
    const safeHiraganaForAudio = sanitizeHTML(w.hiragana).replace(/'/g, "\\'");

    $("srsBack").innerHTML = `
        <h2 style="color:var(--accent3)">${sanitizeHTML(w.hiragana)}</h2>
        <button class="fc-speak" onclick="event.stopPropagation(); speakJapanese('${safeHiraganaForAudio}')" title="Play Audio">🔊</button>
        <div class="meaning" style="font-size:20px;margin-top:12px;">${sanitizeHTML(w.meaning)}</div>
        ${w.memory ? `<div class="memory">${sanitizeHTML(w.memory)}</div>` : ''}
    `;

    // Manage Navigation Button States
    if($('reviewPrevBtn')) $('reviewPrevBtn').disabled = reviewIndex === 0;
    if($('reviewNextBtn')) $('reviewNextBtn').disabled = reviewIndex === vocabulary.length - 1;
}

// ✨ NEW: Animation Wrapper for Smooth Transitions
let isAnimatingCard = false;
function transitionCard(direction, callback) {
    if (isAnimatingCard) return; // Prevent spam-clicking breaking the UI
    isAnimatingCard = true;
    
    const card = $("srsFlashcard");
    const outClass = direction === "left" ? "slide-out-left" : "slide-out-right";
    const inClass  = direction === "left" ? "slide-in-left"  : "slide-in-right";
    
    // Slide Out
    card.classList.add(outClass);
    
    setTimeout(() => {
        card.classList.remove(outClass);
        callback(); // Swap the text content while the card is invisible
        
        // Force the browser to register the swap before sliding back in
        void card.offsetWidth;
        
        // Slide In
        card.classList.add(inClass);
        
        setTimeout(() => {
            card.classList.remove(inClass);
            isAnimatingCard = false; // Re-enable clicks
        }, 300); // 300ms matches the CSS ease-spring duration
    }, 220); // 220ms matches the CSS fade-out duration
}

// Flip Card Action
$("srsFlashcard")?.addEventListener("click", () => {
    if (isAnimatingCard) return; // Don't flip while it is sliding!
    const card = $("srsFlashcard");
    card.classList.toggle("flipped");
    haptic();
    if (card.classList.contains("flipped") && userProfile.autoPlay) {
        const w = vocabulary[reviewIndex];
        if (w) speakJapanese(w.hiragana);
    }
});

$("srsFlashcard")?.addEventListener("keydown", e => {
    
    if (e.key === "ArrowLeft") {
        $("reviewPrevBtn")?.click();
    }

    if (e.key === "ArrowRight") {
        $("reviewNextBtn")?.click();
    }

    if (
        e.key === "Enter" ||
        e.key === " "
    ) {
        e.preventDefault();
        $("srsFlashcard").click();
    }
});


$("srsFlashcard")?.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

$("srsFlashcard")?.addEventListener("touchend", e => {
    touchEndX = e.changedTouches[0].screenX;

    const delta = touchEndX - touchStartX;

    if (Math.abs(delta) < 60) return;

    if (delta < 0 && reviewIndex < vocabulary.length - 1) {

        transitionCard("left", () => {
            reviewIndex++;
            showReviewCard();
        });

    } else if (delta > 0 && reviewIndex > 0) {

        transitionCard("right", () => {
            reviewIndex--;
            showReviewCard();
        });
    }
}, { passive: true });

// Manual Navigation Actions (Now animated!)
$("reviewPrevBtn")?.addEventListener("click", () => { 
    if(reviewIndex > 0) { 
        transitionCard("right", () => {
            reviewIndex--; 
            showReviewCard(); 
        });
    }
});

$("reviewNextBtn")?.addEventListener("click", () => { 
    if(reviewIndex < vocabulary.length - 1) { 
        transitionCard("left", () => {
            reviewIndex++; 
            showReviewCard(); 
        });
    }
});

let touchStartX = 0;
let touchEndX = 0;

const card = $("srsFlashcard");

card?.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
});

card?.addEventListener("touchend", e => {

    touchEndX = e.changedTouches[0].screenX;

    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) < 60) return;

    if (diff < 0) {
        $("reviewNextBtn")?.click();
    } else {
        $("reviewPrevBtn")?.click();
    }
});

function speakJapanese(txt) {
    if (!window.speechSynthesis) return;

    speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(txt);

    u.lang = "ja-JP";
    u.rate = 0.95;

    if (japaneseVoice) {
        u.voice = japaneseVoice;
    }

    speechSynthesis.speak(u);
}

// SRS Grading Actions
[1,2,3,4].forEach(grade => {
    $(`srsBtn${grade}`)?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isAnimatingCard) return; // Prevent grading mid-slide
        processSRSGrade(grade);
    });
});

function processSRSGrade(grade) {
    if(!vocabulary.length) return;
    const word = vocabulary[reviewIndex];
    let { interval, repetition, eFactor } = srsData[word.kanji];

    // Mathematical Spaced Repetition Updates
    if (grade >= 3) { 
        if (repetition === 0) interval = 1;
        else if (repetition === 1) interval = 6;
        else interval = Math.round(interval * eFactor);
        repetition++;
    } else { 
        repetition = 0; interval = 1;
        if (!userProfile.weak.includes(word.kanji)) userProfile.weak.push(word.kanji);
    }
    
    eFactor = eFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (eFactor < 1.3) eFactor = 1.3;

    // Save
    srsData[word.kanji] = { interval, repetition, eFactor, dueDate: Date.now() + interval * 86400000 };
    store.set('jlpt_srs', srsData);
    
    if (grade >= 3 && !userProfile.learned.includes(word.kanji)) {
        userProfile.learned.push(word.kanji);
    }
    
    recordStudy();

    // Auto-Advance to the next card after grading (Now animated!)
    if (reviewIndex < vocabulary.length - 1) {
        transitionCard("left", () => {
            reviewIndex++;
            showReviewCard();
        });
    } else {
        showToast("Lesson review complete! 🎉", "success");
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI & VIEW ROUTING
// ═══════════════════════════════════════════════════════════════════════════════
function syncNavPill(activeId) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active-pill'));
    const btn = $(activeId + 'Btn');
    if (btn) btn.classList.add('active-pill');
}

function showView(id) {
    document.querySelectorAll('.view-panel').forEach(el => el.classList.add('hidden'));
    const v = $(id); 
    if(v) {
        v.classList.remove('hidden');
        v.style.animation = 'none'; void v.offsetWidth; v.style.animation = 'viewFadeIn 0.3s ease both';
    }
    currentView = id;
    if ($("mobilePopover")) { $("mobilePopover").setAttribute("aria-hidden", "true"); $("hamburgerBtn").setAttribute("aria-expanded", "false"); }
}

['dashboard', 'vocab', 'review', 'quiz', 'settings'].forEach(v => {
    $(`${v}Btn`)?.addEventListener('click', () => { showView(`${v}View`); handleViewLogic(v); });
    $(`m${v.charAt(0).toUpperCase()+v.slice(1)}Btn`)?.addEventListener('click', () => { showView(`${v}View`); handleViewLogic(v); });
});

function handleViewLogic(v) {
    syncNavPill(v);
    if(v === 'dashboard') updateDashboard();
    if(v === 'vocab') { filteredVocabulary = [...vocabulary]; $("searchBox").value=""; renderVocabulary(); }
    if(v === 'review') startReview();
    if(v === 'quiz') startNewQuiz(); // <--- Change this line
    if(v === 'settings') { $("goalSelect").value = userProfile.dailyGoal; $("autoPlayAudio").checked = userProfile.autoPlay; }
}

$('favBtn')?.addEventListener('click', () => { showView('vocabView'); syncNavPill('vocab'); filteredVocabulary = vocabulary.filter(v => userProfile.favorites.includes(v.kanji)); renderVocabulary(); });
$('weakBtn')?.addEventListener('click', () => { showView('vocabView'); syncNavPill('vocab'); filteredVocabulary = vocabulary.filter(v => userProfile.weak.includes(v.kanji)); renderVocabulary(); });

// 📱 Mobile Hamburger Menu Toggle
$('hamburgerBtn')?.addEventListener('click', (e) => {
    e.stopPropagation(); // Stop the click from immediately bubbling to the document
    const btn = $('hamburgerBtn');
    const menu = $('mobilePopover');
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    
    btn.setAttribute('aria-expanded', !isExpanded);
    menu.setAttribute('aria-hidden', isExpanded);
});

// Close menu if user taps outside of it
document.addEventListener('click', (e) => {
    const btn = $('hamburgerBtn');
    const menu = $('mobilePopover');
    
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target) && btn.getAttribute('aria-expanded') === 'true') {
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOCABULARY RENDERING (With Section Grouping)
// ═══════════════════════════════════════════════════════════════════════════════
function renderVocabulary() {
    const frag = document.createDocumentFragment();
    const cont = $("vocabularyContainer");
    if(!cont) return;
    
    if (!filteredVocabulary.length) { 
        cont.innerHTML = `<div class="dash-card text-center" style="grid-column:1/-1;"><h3>No words found</h3></div>`; 
        return; 
    }

    // Group the vocabulary by 'section'
    const groupedVocab = {};
    filteredVocabulary.forEach(item => {
        const sectionName = item.section || "Vocabulary";
        if (!groupedVocab[sectionName]) groupedVocab[sectionName] = [];
        groupedVocab[sectionName].push(item);
    });

    // Iterate through each group and render its header and cards
    Object.keys(groupedVocab).forEach(section => {
        // 1. Create the Section Header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = "vocab-section-header";
        sectionHeader.innerHTML = `<span>${section}</span>`;
        frag.appendChild(sectionHeader);

        // 2. Render the Cards for this Section
        groupedVocab[section].forEach(item => {
            const isLearned = userProfile.learned.includes(item.kanji);
            const isFav = userProfile.favorites.includes(item.kanji);
            
            const c = document.createElement('div'); 
            c.className = `card spatial-card ${isLearned ? 'card-learned' : ''}`;
            
            c.innerHTML = `
                <div class="card-top">
                    <span class="emoji">${sanitizeHTML(item.emoji)}</span>
                    ${isLearned ? `<span class="learned-badge" title="Learned">✅</span>` : ''}
                </div>
                <div class="card-content">
                    <div class="kanji">${sanitizeHTML(item.kanji)}</div>
                    <div class="hiragana">${sanitizeHTML(item.hiragana)}</div>
                    <div class="meaning">${sanitizeHTML(item.meaning)}</div>
                    ${item.memory ? `<div class="memory">${sanitizeHTML(item.memory)}</div>` : ''}
                </div>
                <div class="card-actions">
                    <button class="action-btn speak-btn" title="Listen">🔊</button>
                    <button class="action-btn favorite-btn ${isFav ? 'favorited' : ''}" title="Favorite">${isFav ? '⭐' : '☆'}</button>
                </div>`;
                
            c.querySelector('.speak-btn').onclick = (e) => { e.stopPropagation(); speakJapanese(item.hiragana); };
            c.querySelector('.favorite-btn').onclick = (e) => { 
                e.stopPropagation(); 
                const index = userProfile.favorites.indexOf(item.kanji);
                if(index > -1) userProfile.favorites.splice(index, 1); 
                else userProfile.favorites.push(item.kanji);
                store.set('jlpt_profile', userProfile); 
                renderVocabulary(); updateDashboard();
            };
            frag.appendChild(c);
        });
    });

    cont.replaceChildren(frag);

    requestAnimationFrame(() => {
        document.querySelectorAll('.card:not(.revealed)').forEach(c => revealObserver.observe(c));
    });
}

let searchDebounce;
$("searchBox")?.addEventListener("input", e => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        if(currentView !== 'vocabView') showView('vocabView');
        const q = e.target.value.trim().toLowerCase();
        const rq = normalizeRomaji(q); 
        filteredVocabulary = vocabulary.filter(i => 
            (i.kanji||"").includes(q) || (i.hiragana||"").includes(q) || (i.meaning||"").toLowerCase().includes(q) || (i.hiragana||"").includes(rq)
        );
        renderVocabulary();
    }, 200);
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ MODE (Fully Restored Logic)
// ═══════════════════════════════════════════════════════════════════════════════
let quizStreak = 0;
let quizBestStreak = 0;
let quizHistory = []; // Tracks right/wrong for the final summary

$("modeKanjiBtn")?.addEventListener("click", () => {
    if(quizMode === "kanjiToMeaning") return;
    quizMode = "kanjiToMeaning";
    $("modeKanjiBtn").classList.add("active-mode");
    $("modeMeaningBtn").classList.remove("active-mode");
    startNewQuiz();
});

$("modeMeaningBtn")?.addEventListener("click", () => {
    if(quizMode === "meaningToKanji") return;
    quizMode = "meaningToKanji";
    $("modeMeaningBtn").classList.add("active-mode");
    $("modeKanjiBtn").classList.remove("active-mode");
    startNewQuiz();
});

function startNewQuiz() {
    qNum = 0; 
    score = 0; 
    quizStreak = 0;
    quizHistory = [];
    quizQueue = shuffleArray([...vocabulary]);
    
    // Clear out any old summary card
    const resBox = $("quizResult");
    if(resBox) resBox.innerHTML = "";
    
    // Ensure the question area is visible
    $("quizQuestion").style.display = "block";
    ["optionA","optionB","optionC","optionD"].forEach(id => $(id).style.display = "block");
    
    updateQuizUI();
    nextQuizQuestion();
}

function updateQuizUI() {
    safeText($("scoreDisplay"), `⭐ Score: ${score}`);
    safeText($("streakDisplay"), `🔥 Streak: ${quizStreak}`);
    safeText($("bestStreakDisplay"), `🏆 Best: ${quizBestStreak}`);
    safeText($("quizCounter"), `Question ${qNum + 1} / 20`);
    
    const fill = $("quizProgressFill");
    if (fill) fill.style.width = `${((qNum) / 20) * 100}%`;
}

function nextQuizQuestion() {
    if(vocabulary.length < 4) {
        showToast("Not enough words in this lesson to quiz!", "error");
        return;
    }
    
    if (qNum >= 20 || quizQueue.length === 0) {
        endQuiz();
        return;
    }

    updateQuizUI(); 

    const w = quizQueue.pop(); 
    if(!w) return;
    
    const isRev = quizMode === "meaningToKanji";

    // Trigger smooth entrance animation for the question text
    const qText = $("quizQuestion");
    qText.classList.remove("q-in");
    void qText.offsetWidth; // Force browser reflow to restart animation
    qText.classList.add("q-in");

    safeText(qText, isRev ? w.meaning : w.kanji);
    const ans = isRev ? w.kanji : w.meaning;
    
    if(isRev) $("quizSpeakBtn").style.display = "none";
    else {
        $("quizSpeakBtn").style.display = "block";
        $("quizSpeakBtn").onclick = () => speakJapanese(w.hiragana);
    }
    
    const pool = vocabulary.filter(x => (isRev?x.kanji:x.meaning) !== ans).sort(()=>Math.random()-0.5).slice(0,3);
    const opts = [ans, ...pool.map(x=>isRev?x.kanji:x.meaning)].sort(()=>Math.random()-0.5);
    
    ["optionA","optionB","optionC","optionD"].forEach((id, i) => {
        const b = $(id); 
        // Reset styles for new incoming options
        b.className = "quiz-option opt-enter"; 
        b.disabled = false; 
        b.style.opacity = "1";
        b.style.transform = "none";
        safeText(b, opts[i]);
        
        setTimeout(() => b.classList.remove("opt-enter"), 400);

        b.onclick = () => {
            document.querySelectorAll(".quiz-option").forEach(btn => {
                btn.disabled = true; 
                if(btn.textContent === ans) btn.classList.add("correct");
            });
            
            if(opts[i] === ans) { 
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
                if (!userProfile.weak.includes(w.kanji)) userProfile.weak.push(w.kanji);
            }
            
            store.set('jlpt_profile', userProfile);
            updateQuizUI(); 
            
            // 🌟 Smooth Exit Animation Sequence
            setTimeout(() => {
                $("quizQuestion").classList.add("q-out");
                ["optionA","optionB","optionC","optionD"].forEach(optId => {
                    const opt = $(optId);
                    opt.style.transition = "all 0.2s var(--ease-out)";
                    opt.style.opacity = "0";
                    opt.style.transform = "translateX(-20px)";
                });

                // Wait for exit animations to finish before loading next question
                setTimeout(() => {
                    $("quizQuestion").classList.remove("q-out");
                    qNum++;
                    nextQuizQuestion();
                }, 200); 
            }, 1000); // Wait 1 second after user clicks to read the answer
        };
    });
}

function endQuiz() {
    // Hide active question elements
    $("quizQuestion").style.display = "none";
    $("quizSpeakBtn").style.display = "none";
    ["optionA","optionB","optionC","optionD"].forEach(id => $(id).style.display = "none");
    $("quizCounter").textContent = "Quiz Complete";
    $("quizProgressFill").style.width = "100%";

    const pct = Math.round((score / 20) * 100);
    const resBox = $("quizResult");
    
    let reportHTML = quizHistory.map(h => `
        <div class="quiz-report-item ${h.correct ? 'r-correct' : 'r-wrong'}">
            <span class="r-icon">${h.correct ? '✅' : '❌'}</span>
            <span class="r-kanji">${h.word.kanji}</span>
            <span class="r-kana">${h.word.hiragana}</span>
            <span class="meaning" style="margin-left:auto; font-size:12px; opacity:0.8;">${h.word.meaning}</span>
        </div>
    `).join('');

    resBox.innerHTML = `
        <div class="quiz-summary">
            <div class="quiz-summary-score">
                <div class="score-big">${score} / 20</div>
                <div class="score-label">Final Score</div>
            </div>
            <div class="quiz-summary-stats">
                <div class="quiz-summary-stat">
                    <div class="stat-val">${pct}%</div>
                    <div class="stat-key">Accuracy</div>
                </div>
                <div class="quiz-summary-stat">
                    <div class="stat-val">${quizBestStreak}</div>
                    <div class="stat-key">Best Streak</div>
                </div>
            </div>
            <div class="quiz-report-list">
                ${reportHTML}
            </div>
            <button class="quiz-summary-restart" onclick="startNewQuiz()">Retry Quiz</button>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM DROPDOWN 
// ═══════════════════════════════════════════════════════════════════════════════
const dropBox = $("lessonDropdown");
const dropSel = $("lessonSelected");
const dropOpts = $("lessonOptions");

if(dropBox && dropSel && dropOpts) {
    dropBox.addEventListener("click", (e) => {
        dropBox.classList.toggle("open");
        dropOpts.classList.toggle("hidden");
    });

    document.addEventListener("click", e => {
        if (!dropBox.contains(e.target)) {
            dropBox.classList.remove("open");
            dropOpts.classList.add("hidden");
        }
    });

    for(let i=1; i<=50; i++) { 
        const o = document.createElement("div"); 
        o.className = "dropdown-option";
        o.textContent = `Lesson ${i}`; 
        o.onclick = () => {
            dropSel.textContent = `Lesson ${i}`;
            loadLesson(i);
        };
        dropOpts.appendChild(o); 
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE & KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════════════
const commands = [
    { n: 'Go to Dashboard', k: 'hd', a: () => $('dashboardBtn').click() },
    { n: 'Review SRS', k: 'hr', a: () => $('reviewBtn').click() },
    { n: 'Toggle Theme', k: 'ht', a: () => $('themeToggleBtn').click() },
    { n: 'Export Backup', k: 'eb', a: () => store.export() }
];

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); toggleCmdPalette(); }
    if (e.key === 'Escape') { $('cmdOverlay').classList.add('hidden'); closeFeedback(); }
    
    // Bind Keyboard Shortcuts to unified Review Mode
    if (currentView === 'reviewView') {
        if(e.key === 'ArrowRight') $('reviewNextBtn').click();
        if(e.key === 'ArrowLeft') $('reviewPrevBtn').click();
        if(e.key === ' ') { e.preventDefault(); $('srsFlashcard').click(); }
        if(e.key==='1') $('srsBtn1').click(); 
        if(e.key==='2') $('srsBtn2').click();
        if(e.key==='3') $('srsBtn3').click(); 
        if(e.key==='4') $('srsBtn4').click();
    }
});

function toggleCmdPalette() {
    const o = $('cmdOverlay'), i = $('cmdInput');
    if (o.classList.contains('hidden')) { o.classList.remove('hidden'); i.value=''; i.focus(); renderCmd(); }
    else { o.classList.add('hidden'); }
}

$('cmdInput')?.addEventListener('input', e => renderCmd(e.target.value.toLowerCase()));
function renderCmd(q = '') {
    const r = $('cmdResults'); r.innerHTML = '';
    const matches = commands.filter(c => c.n.toLowerCase().includes(q));
    matches.forEach(c => {
        const li = document.createElement('li'); li.className = 'cmd-item';
        li.innerHTML = `<span>${c.n}</span> <span class="cmd-kbd">${c.k}</span>`;
        li.onclick = () => { c.a(); toggleCmdPalette(); };
        r.appendChild(li);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS & FEEDBACK EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
$('exportBtn')?.addEventListener('click', store.export);
$('importFile')?.addEventListener('change', e => { if(e.target.files[0]) store.import(e.target.files[0]); });
$('resetDataBtn')?.addEventListener('click', () => {
    if(confirm("Are you sure? This deletes ALL progress and SRS data forever.")) {
        localStorage.clear(); location.reload();
    }
});

$('savePreferencesBtn')?.addEventListener('click', () => {
    userProfile.dailyGoal = parseInt($('goalSelect').value);
    userProfile.autoPlay = $('autoPlayAudio').checked;
    store.set('jlpt_profile', userProfile);
    updateDashboard(); 
    showToast("Preferences saved successfully!", "success");
});

$('feedbackFab')?.addEventListener('click', () => $('feedbackOverlay').classList.remove('hidden'));
function closeFeedback() { $('feedbackOverlay').classList.add('hidden'); $('feedbackText').value = ''; }

$('submitFeedbackBtn')?.addEventListener('click', () => {
    const c = $('feedbackCategory').value;
    const t = $('feedbackText').value;
    const to = "sahurahulcoc@gmail.com";
    const subject = encodeURIComponent(`JLPT Trainer V2 Feedback: ${c}`);
    const body = encodeURIComponent(t);

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isIOS) {
        window.location.href = `googlegmail:///co?to=${to}&subject=${subject}&body=${body}`;
    } else if (isMobile) {
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank');
    } else {
        const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
        window.open(`https://mail.google.com/mail/u/0/?extsrc=mailto&url=${encodeURIComponent(mailtoLink)}`, '_blank');
    }
    closeFeedback(); showToast("Opening Gmail...", "success");
});

$('themeToggleBtn')?.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    store.set('jlpt_theme', isLight ? 'light' : 'dark');
    if(window.__setLightRaysTheme) window.__setLightRaysTheme(isLight);
});
if(store.get('jlpt_theme') === 'light') document.body.classList.add('light-theme');

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════
const initLvl = store.get('jlpt_lastLesson', 1);
loadLesson(initLvl);
showView('dashboardView');
syncNavPill('dashboard');

// ═══════════════════════════════════════════════════════════════════════════════
// GSAP FLUID HOVER ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════
function setupGSAPPill(pill) {
    const circle = pill.querySelector('.hover-circle');
    const label = pill.querySelector('.pill-label');
    const white = pill.querySelector('.pill-label-hover');
    
    // Check if elements exist, if it's already bound, OR if GSAP failed to load
    if(!circle || !label || !white || pill.dataset.gsapBound || typeof gsap === 'undefined') return;

    pill.dataset.gsapBound = "true";
    let tl;

    const updateLayout = () => {
        let w = pill.offsetWidth || 120;
        let h = pill.offsetHeight || 36;
        let R = ((w * w) / 4 + h * h) / (2 * h);
        let D = Math.ceil(2 * R) + 2;
        let delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        let originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });
        gsap.set(label, { y: 0 });
        gsap.set(white, { y: h + 10, opacity: 0 });

        if(tl) tl.kill();
        tl = gsap.timeline({ paused: true });
        
        tl.to(circle, { scale: 1.2, duration: 0.35, ease: "power2.out" }, 0);
        tl.to(label, { y: -(h + 5), duration: 0.35, ease: "power2.out" }, 0);
        tl.to(white, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    };

    pill.addEventListener('mouseenter', () => { updateLayout(); tl.play(); });
    pill.addEventListener('mouseleave', () => { if(tl) tl.reverse(); });
}

setTimeout(() => { document.querySelectorAll('.pill, .pill-anim').forEach(setupGSAPPill); }, 200);

// ═══════════════════════════════════════════════════════════════════════════════
// SMART SCROLL LOGIC
// ═══════════════════════════════════════════════════════════════════════════════
let lastScrollY = window.scrollY;
const pillNavWrap = document.getElementById("pillNavWrap");
const floatingToolbar = document.getElementById("floatingToolbar");

window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    if (Math.abs(currentScrollY - lastScrollY) > 10) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            if(pillNavWrap) pillNavWrap.classList.add("nav-hidden");
            if(floatingToolbar) floatingToolbar.classList.add("toolbar-hidden");
        } else {
            if(pillNavWrap) pillNavWrap.classList.remove("nav-hidden");
            if(floatingToolbar) floatingToolbar.classList.remove("toolbar-hidden");
        }
        lastScrollY = currentScrollY;
    }
}, { passive: true });