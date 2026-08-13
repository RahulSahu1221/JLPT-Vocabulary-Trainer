/* theme-shutter.js
   ═══════════════════════════════════════════════════════════════════════════
   RONIN — Japanese shop-shutter theme transition.

   How it works (matches the physical metaphor exactly):
   1. We ask the browser for a View Transition (document.startViewTransition).
      The browser itself takes a real pixel snapshot of the page BEFORE the
      theme class changes ("old"), lets our callback flip the theme class,
      then takes a second snapshot AFTER ("new"). Both snapshots exist at the
      same time, "new" stacked directly above "old" — this is native browser
      behavior, not something we build by hand, so it costs nothing extra to
      capture and composites entirely on the GPU.
   2. By default the browser cross-fades old → new. We turn that default off
      in CSS and instead animate the "new" snapshot's clip-path ourselves,
      from fully hidden to fully revealed, top → bottom. That clip line IS
      the shutter edge.
   3. A thin fixed gradient bar ("shutter-edge") tracks the exact same
      keyframes to give the edge a soft drop-shadow + hint of motion blur,
      so it reads as a physical shutter rather than a flat wipe.

   No colors and no CSS custom properties are ever animated here — only
   clip-path and transform, both of which the compositor can run at 60fps
   without repainting the page underneath.
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";

const SHUTTER_DURATION_MS = 175;
const SHUTTER_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)"; // slight accelerate, settle — no overshoot

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
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)" }
        ],
        {
            duration: SHUTTER_DURATION_MS,
            easing: SHUTTER_EASING,
            pseudoElement: "::view-transition-new(root)"
        }
    );

    const edgeAnim = edge.animate(
        [
            { transform: "translateY(-26px)" },
            { transform: `translateY(${viewportH}px)` }
        ],
        {
            duration: SHUTTER_DURATION_MS,
            easing: SHUTTER_EASING
        }
    );

    try {
        await Promise.all([clipAnim.finished, edgeAnim.finished]);
    } catch (_) { /* interrupted by a rapid second toggle — fine, just clean up */ }

    edge.remove();
    try { await transition.finished; } catch (_) { /* no-op */ }
}

window.runShutterTransition = runShutterTransition;
