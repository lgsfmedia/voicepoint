# VoicePoint ☝️

**Your mom just called again. She can't find the "Upload" button.**

You've been here before. You describe where it is — "top right, blue, next to the search bar." She stares at the screen, moves the mouse in slow circles, and says "I don't see it." You send a screenshot with a red circle. She still doesn't see it — her browser zoom is different, or the UI updated last week, or she's on a different page entirely. Twenty minutes later, she finds it. Then the next screen asks for a file format she's never heard of, and she's stuck again.

This isn't about impatience. It's about a fundamental gap in how software teaches itself. When you're in the same room, you can lean over and point. When you're on the phone, you have words — and words fail at spatial tasks on a screen.

VoicePoint closes that gap. It places a **live, autonomous virtual pointer** (a floating ☝️ hand) on top of any webpage — it moves, clicks, and highlights in real time, like you standing behind your loved one and pointing at exactly what to do. There's no video to watch, no screenshots to compare. The hand is on the real page, pointing at the real button, waiting for them to click it.

---

## The Problem

**There is no good way to guide someone through a UI when you aren't in the same room.**

Every method we have is either passive, fragile, or invasive:

- **Phone calls** devolve into "no, the *other* blue button." Both people get frustrated. Learning doesn't stick.
- **Screenshots with arrows** work exactly once. A UI update, a different screen resolution, a single A/B test — and the arrow points at the wrong place.
- **Screen recordings** force the viewer to watch a video, then alt-tab to the real page, remember the steps, and execute them. Working memory is limited. They forget step 2 by the time they've finished step 3.
- **In-app guided tours** require modifying the application's codebase. Your mom's bank, your dad's insurance portal, your grandmother's email provider — none of them will build custom tours for your family.
- **Remote desktop tools** (TeamViewer, AnyDesk) are security risks and overkill for "click the blue button." They require installation, configuration, and trust on both sides.

None of these solve the real problem: **spatial guidance at a distance.** When you point at something in person, the other person's eyes follow your finger. They see exactly where to look. Every other channel — voice, text, video — adds a layer of indirection that loses information.

VoicePoint is the digital equivalent of pointing. It's a finger that reaches through the screen.

---

## What VoicePoint Does

VoicePoint is a Chrome extension that creates a **second cursor** — an autonomous ☝️ pointer that lives in a transparent overlay above the page. It never blocks mouse clicks or keyboard input (`pointer-events: none`). It doesn't record or stream anything. It just points.

The pointer can:
- Glide to any coordinate on the page with smooth, natural motion
- Perform a click animation (press, overshoot, settle) with a visual ripple
- Highlight any element with a pulsing blue glow
- Display instructional tooltips that fade in and out
- Survive page navigations — it follows the user from one page to the next
- Wait — it polls for elements that haven't loaded yet, up to 25 seconds

<p align="center">
  <img src="screenshots/popup.png" alt="VoicePoint popup" width="240">
  &nbsp;&nbsp;
  <img src="screenshots/urlbar-pointer.png" alt="☝️ pointing at URL bar" width="600">
</p>

---

## How It's Built

**The hard part isn't the pointer. It's making the pointer survive the browser's constraints.**

Chrome Manifest V3 eliminated persistent background pages. Service workers can be terminated after 30 seconds of inactivity. Content scripts declared in `manifest.json` only inject into tabs that load *after* the extension is installed — so if your parent already has a tab open, the extension can't see it. And when they navigate from one page to another, the old content script is destroyed with the old page.

VoicePoint solves these problems with three mechanisms:

**1. Programmatic injection.** When the user clicks "Start Demo," the service worker calls `chrome.scripting.executeScript()` and `chrome.scripting.insertCSS()` to inject the content script and styles into the active tab right now — regardless of whether the tab existed before the extension was loaded. This is more reliable than manifest-declared content scripts because it's on-demand and doesn't depend on page lifecycle.

**2. Session-level state persistence.** `chrome.storage.session` stores `{ demoActive: true }`. This API was designed for MV3's ephemeral world: it survives page navigations (so the next page knows the demo is active) but clears when the browser closes (so there's no stale state). When the service worker detects a tab navigation via `chrome.tabs.onUpdated`, it re-injects the content script, which reads `demoActive` from storage and resumes the demo.

**3. Resilient element detection.** LinkedIn's feed is a React single-page application. It loads progressively, A/B tests different layouts, and changes CSS selectors without notice. The "Create Post" button might appear 2 seconds after the page loads or 15 seconds later. VoicePoint polls every 500ms for up to 25 seconds using 8 different selectors in priority order:

```js
const SELECTORS = [
  'button[aria-label="Create a post"]',
  'button[aria-label="Start a post"]',
  '.share-box-feed-entry__trigger',
  '[data-control-name="create_post"]',
  '.share-creation-state__trigger',
  '.feed-shared-controls__trigger',
  'button[data-trigger="share-box"]',
];
// Fallback: text-match any <button> or <div role="button">
```

If none of the selectors match, it falls back to iterating every `<button>` and `<div role="button">` on the page, matching by text content. This catches layouts that have never been seen before.

**The state machine that ties it together:**

```
inactive → [Start Demo] → url_bar_step
                                ↓ (user types linkedin.com, navigates)
                          linkedin_step
                                ↓ (button found)
                          done → cleanup → inactive
```

**Pointer positioning requires precision.** The ☝️ emoji (U+261D) points upward. Its fingertip is at the top edge, roughly centered horizontally. To point at an element, the fingertip must land exactly at the element's top-center:

```js
const pointerLeft = rect.left + rect.width / 2 - 20;  // center the 40px emoji
const pointerTop  = rect.top - 8;                      // fingertip just above the element
```

An 8px blue target dot follows the fingertip with the same CSS transition. This eliminates the ambiguity of emoji rendering — the dot's center is the exact pixel being pointed at.

**Scroll timing is non-trivial.** `scrollIntoView({ behavior: 'smooth' })` triggers an animated scroll that doesn't block JavaScript. The position must be measured *after* the scroll finishes, not before. VoicePoint listens for the `scrollend` event with a 1200ms timeout fallback — whichever comes first.

---

## The Demo: Teaching LinkedIn in 10 Seconds

This is the complete end-to-end flow. No external dependencies, no API keys, no server:

<p align="center">
  <img src="screenshots/popup.png" alt="Popup" width="240">
  &nbsp;&nbsp;
  <img src="screenshots/urlbar-pointer.png" alt="URL bar" width="600">
</p>

1. Click **Start Demo** in the popup. The service worker sets `demoActive: true` and injects the overlay.

2. The ☝️ hand appears at screen center with a scale-in animation, then glides to the top of the page — where the URL bar lives. The motion uses `cubic-bezier(0.22, 1, 0.36, 1)` — an ease-out curve with a slight overshoot that mimics a human hand arriving at a target.

3. A click animation plays: the hand compresses to 85% scale (the "press"), shifts down 4px, then rebounds to 110% before settling. A blue ripple ring expands from the click point. The entire animation takes 350ms — fast enough to feel responsive, slow enough to register visually.

<p align="center">
  <img src="screenshots/tooltip.png" alt="Tooltip" width="600">
</p>

4. A tooltip appears: *"Click the address bar above, type linkedin.com and press Enter"* — a dark card with a blue accent, readable on any background, positioned near the pointer.

5. The user types `linkedin.com` and presses Enter. The page navigates. The service worker detects the URL change and re-injects the content script, which reads `demoActive: true` and starts the LinkedIn step.

6. A retry loop begins polling for the "Create Post" button. Meanwhile, a "Looking for the Create Post button..." tooltip keeps the user informed. The loop runs every 500ms for up to 25 seconds.

7. The button is found. VoicePoint scrolls it into view, waits for the scroll to finish, calculates its exact position, and glides the ☝️ hand to the button's top-center.

<p align="center">
  <img src="screenshots/linkedin-done.png" alt="Done overlay" width="600">
</p>

8. The button is highlighted with a pulsing blue glow — `box-shadow` cycles from 0px to 6px spread every 1.5 seconds. A border ring appears via `::after` pseudo-element.

9. **✓ DONE** fades in over a semi-transparent backdrop. The text scales up with a bounce ease. A subtitle reads *"LinkedIn post creation ready."*

10. After 5 seconds, the overlay is removed and state resets. The extension returns to "Ready."

---

## Why This Approach Works

**A Chrome extension is the right medium for this problem.** It requires no installation on the target's computer beyond what they already have (Chrome). It requires no modification of the target website. It works on any page, on any operating system, for anyone who can install a browser extension.

**The pointer is not a recording.** A video shows you what happened. The pointer shows you what to do — right now, on the real page, with the real UI. If the UI changes, the pointer still points at the right place (as long as the script is updated). There's no lag, no confusion between "what's in the video" and "what's on my screen."

**The architecture is designed for AI.** The service worker already accepts a simple message protocol: `{ type: 'point-to', x, y, label }`. Plugging in an LLM that observes the screen and decides where to point requires adding the API call — the infrastructure is already in place. The current demo uses hardcoded coordinates and selectors, but the same message bus can carry AI-generated commands.

---

## Design Details

Every visual decision has a reason:

| Element | Why |
|---|---|
| **☝️ hand** | Universally recognized, cross-platform, friendly. A synthetic cursor icon feels like a machine. A hand feels like a person. |
| **Blue target dot (8px, `#4A90D9`, white border)** | Emoji rendering varies across platforms. The dot's exact center is the unambiguous target. |
| **`cubic-bezier(0.22, 1, 0.36, 1)` transitions** | The pointer arrives quickly, overshoots slightly, and settles — the same motion profile as a human hand pointing. Linear motion feels robotic. |
| **Dark tooltip (`rgba(26, 26, 46, 0.95)`)** | Readable on light *or* dark backgrounds. Slide-up entrance with fade-in draws attention without jarring. |
| **Green ✓ DONE (72px, `#2ecc71`)** | Large, celebratory, unambiguous. The bounce-in animation signals completion with positive reinforcement. |
| **Ripple ring on click** | Haptic-like visual feedback. The ring expanding from the click point tells the user "something happened here." |
| **`pointer-events: none`** | The overlay never intercepts clicks, typing, scrolling, or any interaction. It's a pointer, not a wall. |

---

## What This Becomes

The MVP demonstrates the core loop: a 2-step, hardcoded walkthrough for LinkedIn. The next iteration is a **recording mode**: the caregiver performs the actions once while the extension records the pointer positions, and the loved one replays the recording anytime.

After that, the natural evolution is **AI-driven guidance**: an LLM with vision takes a screenshot of the page, decides the next action, and sends a pointer command. The caregiver never needs to record anything — they just describe the task, and the AI builds the walkthrough.

The long-term vision is a platform where any software task can be turned into an interactive, pointer-guided walkthrough with zero effort — for parents learning Facebook, for grandparents navigating healthcare portals, for anyone who's ever been on the phone saying "no, the other blue button."

---

## Directory Structure

```
voicepoint/
├── manifest.json         # Chrome extension manifest (MV3)
├── background.js         # Service worker — state machine, injection, tab tracking
├── content.js            # Injected script — pointer overlay, animation, step logic
├── pointer.css           # All visual styles
├── popup.html            # Extension popup UI
├── popup.js              # Popup event handlers
├── screenshots/
│   ├── popup.png
│   ├── urlbar-pointer.png
│   ├── tooltip.png
│   └── linkedin-done.png
├── AGENTS.md             # AI agent reference
├── .cursorrules          # Cursor IDE configuration
└── README.md
```

---

## Getting Started

### Load the extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `sudo-pointer-extension/` directory

### Run the demo

1. Open any page (e.g. `google.com`)
2. Click the VoicePoint icon in the toolbar → **Start Demo**
3. The ☝️ hand appears and points at the URL bar
4. Type `linkedin.com` and press Enter
5. On LinkedIn, the pointer moves to "Create a Post," highlights it, and shows **✓ DONE**

---

## Roadmap

| Phase | What it unlocks |
|---|---|
| **MVP** | ☝️ Hardcoded 2-step demo (LinkedIn) |
| **Record mode** | Caregiver performs actions once → loved one replays anytime |
| **Script engine** | Define walkthroughs as JSON: `[{url, selector, action, tooltip}, ...]` |
| **AI integration** | LLM observes screen → sends pointer commands. Bring your own key. |
| **Cross-browser** | Firefox, Edge, Safari |

---

## License

MIT — see [LICENSE](LICENSE).

---

*Inspired by Farza's [Clicky](https://github.com/farzaa/clicky) — an AI teacher that lives next to your cursor. VoicePoint is a browser-native take on the same idea: a lightweight, scriptable pointer overlay that helps people learn software by doing. No installation. No video. Just a hand that points.*
