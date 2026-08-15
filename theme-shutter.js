/* theme-shutter.js
   ═══════════════════════════════════════════════════════════════════════════
   RONIN — Japanese shop-shutter theme transition.
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";

const SHUTTER_DURATION_MS = 600; // was 175 — 175ms read as too fast/twitchy; 600ms gives the sweep time to actually register
const SHUTTER_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)"; // slight accelerate, settle — no overshoot
const SHUTTER_BLUR_PEAK_PX = 7; // how blurry the screen gets at the midpoint of the sweep — tune this one number to make the blur stronger/weaker

function shutterSupported() {
    return typeof document.startViewTransition === "function";
}

function prefersReducedMotion() {
    try {
        if (typeof store !== "undefined" && store.get("jlpt_settings_reduceMotion", false)) return true;
    } catch (_) { /* store not ready yet */ }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Runs `applyThemeFn` (which flips the theme class + swaps labels/meta color)
 * behind a top-to-bottom shutter sweep. Falls back to an instant, flash-free
 * swap on browsers without View Transitions support, or when the user has
 * asked for reduced motion.
 */
async function runShutterTransition(applyThemeFn) {
    if (prefersReducedMotion() || !shutterSupported()) {
        applyThemeFn();
        return;
    }

    let transition;
    try {
        transition = document.startViewTransition(() => applyThemeFn());
    } catch (_) {
        applyThemeFn();
        return;
    }

    try {
        await transition.ready;
    } catch (_) {
        return; // transition was skipped (e.g. tab hidden) — theme already applied
    }

    const edge = document.createElement("div");
    edge.className = "shutter-edge";
    document.body.appendChild(edge);
    const viewportH = window.innerHeight;

    const clipAnim = document.documentElement.animate(
        [
            { clipPath: "inset(0 0 100% 0)", filter: "blur(0px)" },
            { clipPath: "inset(0 0 40% 0)",  filter: `blur(${SHUTTER_BLUR_PEAK_PX}px)`, offset: 0.5 },
            { clipPath: "inset(0 0 0% 0)",   filter: "blur(0px)" }
        ],
        {
            duration: SHUTTER_DURATION_MS,
            easing: SHUTTER_EASING,
            pseudoElement: "::view-transition-new(root)",
            fill: "forwards" // hold the fully-revealed, fully-sharp state — without this, the
                              // moment the animation ends the browser snaps clip-path back to
                              // the base CSS rule (fully hidden), which is exactly what caused
                              // the old-theme blink right after the sweep finished.
        }
    );

    // The old theme blurs in step with the new one, so the whole screen briefly
    // softens as the shutter passes over it rather than only the incoming layer.
    const oldBlurAnim = document.documentElement.animate(
        [
            { filter: "blur(0px)" },
            { filter: `blur(${SHUTTER_BLUR_PEAK_PX}px)`, offset: 0.5 },
            { filter: "blur(0px)" }
        ],
        {
            duration: SHUTTER_DURATION_MS,
            easing: SHUTTER_EASING,
            pseudoElement: "::view-transition-old(root)",
            fill: "forwards"
        }
    );

    const edgeAnim = edge.animate(
        [
            { transform: "translateY(-26px)" },
            { transform: `translateY(${viewportH}px)` }
        ],
        {
            duration: SHUTTER_DURATION_MS,
            easing: SHUTTER_EASING,
            fill: "forwards" // same reasoning — keep the edge bar at its end position
                              // instead of snapping back to translateY(-26px)
        }
    );

    try {
        await Promise.all([clipAnim.finished, oldBlurAnim.finished, edgeAnim.finished]);
    } catch (_) { /* interrupted by a rapid second toggle — fine, just clean up */ }

    edge.remove();
    try { await transition.finished; } catch (_) { /* no-op */ }
}

window.runShutterTransition = runShutterTransition;
