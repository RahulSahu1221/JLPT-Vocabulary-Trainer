<USER_REQUEST>
# RONIN â€” Master Brief: Diagnosis, Modal System Overhaul, Game Rules, i18n, Theme Shutter

This is a large work order. Work through it in this exact order â€” later sections assume earlier
ones are already fixed and stable, and several of the new features (Game Rules, the theme
shutter) deliberately reuse infrastructure that Section 3 is responsible for making trustworthy
first.

---

## 0. Ground rules for this entire pass

- **No new root-level patch scripts.** Every fix below must be a direct, single, verified edit to
  the real file it belongs in. This project has a well-established history of one-off Node.js
  "patch scripts" silently corrupting `app.js` because they rely on brittle string/position
  matching â€” do not add to that pattern here.
- **Create a new file or folder only when the work genuinely cannot live in an existing file.**
  Default to extending `app.js`, `decks.js`, `games.js`, `index.html`, or `style.css` directly.
- After any edit to a JS file, run a real syntax check before moving on. Zero errors is the bar.

---

## 1. CRITICAL â€” Diagnose and resolve the current syntax errors before anything else

The project currently shows live problems in the editor: `fix_app_syntax.js` (4 problems),
`index.html` (3 problems), `style.css` (1 problem). Resolve all of these before touching any new
feature work.

1. **`fix_app_syntax.js` is itself syntactically broken** â€” it contains a literal `\`` (a
   backslash immediately before a backtick) at the point where a template literal should simply
   start with `` ` ``. This is not valid JavaScript outside of a string context and will throw
   immediately if this file is ever executed. Do not attempt to run this script. Its intended
   change â€” restoring the `_startHash` initialization block (the `if (_startHash === "review")
   {...} else if (_startHash === "quiz") {...} else {...}` block that decides which view loads on
   startup) to its clean form â€” should instead be applied as a single, direct, manually verified
   edit to `app.js`, then this script deleted.

2. **Read `app.js` end to end** and confirm, with particular attention to the region around the
   `_startHash` initialization block and the `GSAP FLUID PILL-HOVER ANIMATION` section immediately
   after it (this is the exact neighborhood `fix_app_syntax.js` and `restore_and_update.js` were
   both separately trying to repair) â€” confirm `setupGSAPPill` exists exactly once, is a complete
   function, and that the `_startHash` block is well-formed and not truncated or duplicated.

3. **Resolve the `update_quiz.js` / `update_quiz_engine.js` collision.** These two scripts patch
   overlapping regions of the quiz engine with different boundaries and materially different final
   implementations â€” one calls a separate `checkAnswer()` function, the other inlines all
   answer-checking logic into each option button's click handler and never defines `checkAnswer`
   at all. **Use `update_quiz_engine.js`'s version as canonical** (it's the more complete
   implementation â€” it includes the quiz timer and inline correct/wrong feedback). Confirm the
   live `app.js` matches that version exactly, with no leftover reference to a `checkAnswer`
   function that no longer exists anywhere.

4. Open the editor's Problems panel for `index.html` and `style.css` and resolve whatever the 3
   and 1 flagged issues are â€” read them directly rather than guessing, since their specifics
   aren't visible from these patch-script files alone.

5. Confirm there is exactly one top-level declaration of every variable across `app.js` that
   multiple scripts have touched: `reviewList`, `quizStreak`, `quizBestStreak`, `quizHistory`,
   `quizAudioTimeout`, `currentQuizLength`, `quizTimerId`, `quizTimeLeft`, `isAnimatingCard`.
   Duplicates will throw a fatal error that takes down the entire page.

6. Run a real syntax check against every shipped JS file. Do not proceed to Section 2 until this
   is completely clean.

---

## 2. File consolidation

Nine one-off Node.js patch scripts currently sit in the project root, none of which are part of
the running app: `add_display_settings.js`, `fix_app_syntax.js`, `restore_and_update.js`,
`update_app.js`, `update_decks.js`, `update_html.js`, `update_quiz.js`, `update_quiz_engine.js`,
`update_style.js`.

1. For each one, confirm its intended change is actually present and correct in the real target
   file (`app.js`, `decks.js`, or `index.html`), applying Section 1's fixes and the canonical
   choices noted there along the way â€” verify by reading the live files directly, not by
   re-running any script.
2. Once every intended change is confirmed correct in place, **delete all nine files.**
3. Do not recreate this pattern going forward â€” see the ground rules in Section 0.

---

## 3. Universal modal & popup closing system

This is the highest-priority feature fix in this pass, and everything in Sections 4 and 6 depends
on it being solid, since both the new Game Rules modal and the new theme transition reuse this
system.

### Leading hypothesis to check first
Given this project's history, the single most likely explanation for close buttons failing
**everywhere, for every popup type** simultaneously is a JavaScript error somewhere in `app.js`
that prevents the script from finishing execution â€” which would mean close-button click handlers
were never attached to the DOM in the first place, for any popup, not just some. This is far more
parsimonious than dozens of independently broken close buttons. **Section 1 must be fully resolved
and verified before assuming any individual close button is broken for its own reason** â€” retest
whether the reported issue persists after Section 1 alone.

### Confirmed concrete bug already found in this codebase
One exact instance of an ID mismatch breaking a dismiss action has already been identified: a call
to `closeModal("typingWrap")` where the real element's ID is `typingModeWrap` â€” the string passed
doesn't match anything in the DOM, so the call is a silent no-op. (Note: this specific element
isn't actually a modal and shouldn't be routed through `closeModal()` at all â€” see the standing
fix from the prior pass â€” but its existence proves this exact class of ID-typo bug is live in the
codebase.) **Audit every single call site that opens or closes a modal-like element across
`app.js`, `decks.js`, `games.js`, and `index.html`, and confirm every ID string passed to
`openModal()`/`closeModal()` exactly matches a real element's `id` attribute.**

### Root-cause audit â€” go through each of these systematically
- **Missing/duplicate event listeners**: confirm `setupSettingsDrawer()` (and any equivalent setup
  function for other modal types) is called exactly once during initialization, not once per open
  â€” repeated calls would stack duplicate listeners on every settings control, including the close
  button.
- **Incorrect selectors / wrong element IDs**: covered above â€” audit every ID string.
- **Escape key handling is currently hardcoded to only two modals.** The existing global Escape
  listener only closes the command palette and the feedback modal by name â€” it does not close the
  rules modal, deck overlays, word detail, keyboard shortcuts overlay, the settings drawer, or the
  new Game Rules modal from Section 4. **Fix:** make Escape handling generic â€” find whichever
  modal/drawer is currently open (by checking for the absence of the `hidden` class, or an
  equivalent "is open" state) and close that one, rather than a hardcoded list of specific IDs.
- **Outside-click-to-dismiss is inconsistently implemented.** The glass dropdowns have their own
  outside-click handling, but audit whether the actual `.modal-overlay` backdrop has a click
  listener that calls `closeModal()` when the backdrop itself (not the inner panel) is clicked â€”
  add this generically for every modal that should support it, with a way to opt a specific modal
  out (e.g. a destructive confirmation dialog) if outside-click dismissal isn't appropriate there.
- **Settings drawer uses a separate, bespoke GSAP-based close mechanism** (`closeSettingsDrawer`,
  independent of the shared `openModal`/`closeModal` pair). Audit it on its own terms: confirm
  `sdCloseBtn`'s listener is bound exactly once, confirm `gsap.killTweensOf(...)` correctly cancels
  any in-flight opening animation before starting the close timeline (so rapid open/close doesn't
  produce a stuck or conflicting animation state), and confirm the `else` (non-GSAP) fallback path
  correctly removes all the same classes the GSAP path does.
- **Z-index / pointer-events**: confirm no invisible overlay or backdrop element is left with
  active pointer-events after a close completes, which would silently block clicks on the
  underlying page without any visible sign of a problem.

### New baseline behavior to add to the shared modal system (not currently present)
The current `openModal()`/`closeModal()` pair only toggles a `hidden` class â€” it does none of the
following, all of which should become standard behavior for every modal going through this system:
- **Background scroll lock** while any modal is open (and reliably restored on close, even if
  multiple modals could theoretically stack â€” track this with a counter, not a boolean, so closing
  one modal doesn't re-enable scroll while another is still open).
- **Focus management**: store `document.activeElement` at open time; on close, return focus to
  that exact element (e.g. the game card that opened the Game Rules modal). Trap Tab-key focus
  within the modal while it's open.
- **Cleanup on close**: any timers, intervals, animation frames, or one-off listeners a specific
  modal's content created while open must be cleared when it closes â€” this should be something
  each modal type can hook into (e.g. an optional `onClose` callback passed to `closeModal`),
  rather than left to each modal to remember independently.

### Animation correctness
Reconfirm, now that Section 1 is clean, that every modal type actually has both an open and a
matching reverse "closing" keyframe defined in `style.css`, and that every close path (button,
Escape, outside-click, and successful-action auto-close) goes through the same `closeModal()` call
â€” not a direct `classList` toggle â€” so the animation reliably plays every time, with no abrupt
disappearance, no flicker, and no leftover invisible backdrop.

---

## 4. Game Rules popup system (Games section)

### Reuse what already exists â€” don't build a new modal
This project already has a `rulesOverlay` modal built (`rulesIcon`, `rulesTitle`, `rulesList`,
`rulesCancelBtn`, and a `rulesStartBtn` already labeled "Let's Go â†’") from earlier work. **Extend
and reuse this exact component for the Game Rules feature rather than creating a new modal** â€” add
whatever additional content slots are needed (Objective, Winning Condition, Tips, Controls) to its
existing structure, and reuse its existing CSS rather than writing new modal styling from scratch.

### Data-driven configuration
Build one configuration object per game, keyed by the game's real ID as defined in `games.js`
(read `games.js`'s actual game list / `renderGamesHub` first â€” don't assume specific game names;
build a config entry for each game that actually exists in this codebase today). Each entry should
provide: title, short description, objective, an array of rule strings, the winning condition,
controls (where applicable), and optional tips. The Rules modal component should render entirely
from this data â€” adding a new game in the future should only require a new config entry, no new UI
code.

### Flow
1. Clicking a game card must **not** launch the game directly anymore. Instead, look up that
   game's config and open the (reused) Rules modal populated with its content.
2. Track which game is pending (e.g. a module-level variable set when the modal opens, cleared
   when it closes) so the two buttons know what to act on.
3. **Cancel**: close the modal via the shared `closeModal()` system (with its proper closing
   animation and focus restoration to the game card that was clicked), do not initialize or
   preload the game, and clear the pending-game state.
4. **Let's Go**: close the modal, then invoke whatever the existing game-launch function already
   is for that game â€” preserve all existing game initialization logic exactly as it works today;
   this popup should sit in front of that logic, not replace or duplicate it.

### Correctness under repeated/rapid interaction
Guard against: rapidly clicking different game cards (each click should fully replace the pending
game and modal content, not stack), clicking "Let's Go" multiple times rapidly (the second click
should be a no-op once the game has already been launched/the modal has already started closing),
and reopening the modal for a different game immediately after closing it for another.

---

## 5. Multi-language settings

### Required behavior
Add a language selector to the Settings drawer. **On every page load, the UI must display in
English, regardless of any previously selected language** â€” translations only take effect when
the user actively changes the language from within Settings during that session. It's fine (and
useful) for the dropdown's own selected value to remember the user's last choice so it shows the
right option when they reopen Settings â€” just don't let that stored value auto-apply to the rest
of the UI on load.

### Architecture â€” this needs to be a real key-based system, not an extension of the current ad hoc map
The existing i18n implementation only covers a handful of nav-bar labels via a small hardcoded
object. That's not sufficient groundwork for real multi-language support. Build a proper
translation-key architecture instead:
- Every user-facing string in the app (buttons, labels, headings, toast messages, achievement
  text, empty-state messages, modal content â€” everywhere) should be addressable by a stable key
  (e.g. via a `data-i18n-key` attribute on the element, or a lookup call at the point each string
  is rendered dynamically).
- Each supported language is a flat keyâ†’string dictionary. Start with `en` as the complete,
  authoritative baseline (it already exists as the app's current hardcoded text).
- Add dictionaries for: Vietnamese, Korean, Thai, Filipino/Tagalog, Traditional Chinese (Taiwan),
  Simplified Chinese, and Spanish â€” the languages representing the largest non-English JLPT
  learner audiences.
- **Any string not yet translated in a given language must fall back to the English string**
  rather than showing a blank or a raw key â€” this makes the system safe to ship incrementally,
  filling in full coverage over time without ever showing broken UI text in the meantime.
- Flag clearly that machine-translating the initial dictionaries is a reasonable way to bootstrap
  this, but the content should get a real review pass by a fluent speaker before being treated as
  final, since this is a language-learning app where incorrect UI text in the target language
  undermines trust in the product specifically.

---

## 6. Theme transition redesign â€” rolling shutter

**This replaces the previously requested circular-reveal-from-light-rays-origin design entirely.**
If any code toward that earlier concept was already started, remove it and replace it with the
design below rather than keeping both.

### Behavior
On toggling the theme: a full-viewport overlay begins at the top edge and smoothly translates
downward (GPU-accelerated `transform: translateY(...)`, not `top`/`height`, to avoid layout
thrashing) until it fully covers the interface. At the moment of full coverage, perform the actual
theme swap (the existing `.light-theme` class toggle, logo filter update, and light-rays
background theme call â€” reuse the single unified mechanism from the prior fix pass, don't fork a
second theming path). The overlay then continues its motion off the bottom edge of the viewport in
one continuous downward movement, revealing the newly-themed interface underneath as it exits â€”
this should read as one continuous physical motion, not two separate animations bolted together.

### Implementation approach
Drive this with JavaScript-orchestrated phases rather than trying to time a CSS animation duration
against a matching `setTimeout` value in another file (this project has already run into bugs from
exactly that kind of cross-file magic-number synchronization with the modal-close timing). Use
either the Web Animations API's `.finished` promise or a `transitionend`/`animationend` listener to
know precisely when the "fully covered" point is reached before performing the theme swap, and
again to know when the reveal has finished before doing any cleanup (removing the overlay element
from the DOM, re-enabling interaction).

### Requirements
- Reuse the existing theme storage/persistence and the unified `.light-theme` toggle mechanism â€”
  this is purely a visual wrapper around that existing swap, not a new theme system.
- Respect the existing "Reduce Motion" setting: skip the shutter entirely and fall back to an
  instant (or minimal) theme swap when it's enabled.
- No white flash, no visible repaint artifacts, no delay between the shutter finishing and the app
  becoming interactive again.
- Must work correctly at every breakpoint (mobile, tablet, desktop) and in installed PWA mode,
  adapting to the actual viewport size rather than a fixed dimension.
- Guard against rapid repeated toggling â€” if the user clicks the toggle again while a shutter
  animation is already in progress, either queue it cleanly or let the current one finish before
  starting the next; don't let two overlapping shutter animations run at once.

---

## Testing checklist
1. Confirm zero syntax errors across every JS file, and zero flagged problems in `index.html`/
   `style.css`, before testing any of the following.
2. Open and close every modal/popup type in the app using every dismissal method (âœ•/close button,
   Cancel, Escape, outside click where applicable, and a successful action's auto-close) â€”
   confirm every single one closes reliably, every time, with its proper reverse animation, no
   residual overlay, and focus correctly returned to whatever triggered it.
3. Rapidly open/close the same modal repeatedly, and open different modals back-to-back â€” confirm
   no stuck states, no duplicate overlays, no broken scroll-lock.
4. Click a game card â€” confirm the Rules modal opens with that specific game's real content
   (not generic placeholder text), Cancel returns cleanly to the Games view without starting
   anything, and "Let's Go" correctly launches that exact game with all existing gameplay intact.
5. Reload the app â€” confirm it always starts in English regardless of any previously selected
   language. Open Settings, change the language, confirm the UI updates live, and confirm any
   string not yet translated falls back to English rather than showing broken text.
6. Toggle the theme repeatedly, including rapid double-clicks â€” confirm the shutter animation
   plays smoothly every time with no white flash or stuck frame, the underlying theme swap is
   correct, and enabling Reduce Motion skips the shutter entirely.
7. Confirm all nine patch-script files are gone from the project root, and that no new stray files
   were created during this pass.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-08-02T22:43:29+05:30.

The user's current state is as follows:
Active Document: e:\JAPANESE_LANGUAGE\RONIN WEB APP\RONIN 2\add_display_settings.js (LANGUAGE_JAVASCRIPT)
Cursor is on line: 1
Other open documents:
- e:\JAPANESE_LANGUAGE\RONIN WEB APP\RONIN 2\style.css (LANGUAGE_CSS)
- e:\JAPANESE_LANGUAGE\RONIN WEB APP\RONIN 2\add_display_settings.js (LANGUAGE_JAVASCRIPT)
- e:\JAPANESE_LANGUAGE\RONIN WEB APP\RONIN 2\fix_app_syntax.js (LANGUAGE_JAVASCRIPT)
- e:\JAPANESE_LANGUAGE\RONIN WEB APP\RONIN 2\index.html (LANGUAGE_HTML)
No browser pages are currently open.
</ADDITIONAL_METADATA>