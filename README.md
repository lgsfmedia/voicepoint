# VoicePoint ☝️

**Every day, millions of people stare at a screen and don't know where to click.** Software onboarding is a universal pain — new hires, customers, and even experienced users get lost in menus, buttons, and workflows that nobody ever taught them. The existing solutions (videos, screenshots, text guides) are all *passive*: they show, but they don't *guide*. VoicePoint solves this by placing a **live, autonomous virtual pointer** (a floating ☝️ hand) on top of any webpage that moves, clicks, and highlights in real time — like a teacher standing behind you, pointing at exactly what to do. This is not another tutorial tool. This is a fundamental rethinking of how software teaches itself: a programmable, scriptable, AI-ready overlay that turns any UI flow into an interactive guided walkthrough without recording a single video or writing a single line of documentation.

---

## 🏆 Judging Criteria

### 💡 Innovation & Originality (25%)

The core idea is surprisingly simple yet entirely unexplored: **a second cursor that isn't controlled by a mouse**. While Clicky (farzaa/clicky) proved that a secondary cursor overlay on the OS level can act as an AI teacher, no one has brought this concept to the browser as a lightweight, zero-install Chrome extension. VoicePoint is the first browser-native "sudo pointer" — a virtual hand that:
- Operates in a `pointer-events: none` overlay so it never blocks real interaction
- Survives page navigations via `chrome.storage.session` state persistence
- Can be extended to any website or web app with zero configuration
- Is architected from day one for AI agent integration (LLM → screen observation → pointer action)

This inverts the traditional "record a video" model. Instead of a person recording their screen, VoicePoint *programmatically performs* the demonstration — meaning it can be generated, scripted, replayed, and eventually driven by an LLM that reads the page and decides where to point.

### ⚙️ Technical Execution (25%)

VoicePoint's engineering is deliberately minimal and clever:

**Problem:** Chrome extensions using Manifest V3 cannot reliably inject content scripts into already-open tabs. The `content_scripts` declaration in the manifest only injects into pages loaded *after* extension installation.

**Solution:** VoicePoint uses `chrome.scripting.executeScript()` + `insertCSS()` programmatically from the service worker, combined with a `chrome.tabs.onUpdated` listener that re-injects the overlay every time the user navigates to a new page during an active demo. This ensures 100% injection reliability.

**Problem:** A `position: fixed` overlay must track page scroll, resize, and dynamic DOM changes.

**Solution:** The ☝️ pointer uses CSS `transition: left 0.7s cubic-bezier(0.22, 1, 0.36, 1), top 0.7s ...` for butter-smooth animation, with `requestAnimationFrame`-aligned timing for scroll completion detection. An 8px blue target dot (`position: fixed`) follows the fingertip with the same transition so the user always knows the exact pixel being pointed at.

**Problem:** LinkedIn loads its feed progressively via JavaScript — the "Create Post" button can appear 5-15 seconds after the page loads.

**Solution:** A polling retry loop (`setInterval` every 500ms for up to 25 seconds) with 8 fallback CSS selectors (from `button[aria-label="Create a post"]` to `div[role="button"]` text matches) ensures the button is found regardless of LinkedIn's A/B testing or layout changes.

```js
// Core architecture: one overlay, two steps, URL-routed
startDemo()
  → createOverlay()          // injects pointer, target dot, tooltip, done overlay
  → if hostname contains "linkedin.com":
      doLinkedInStep()       // find button → scroll → animate pointer → highlight → DONE
    else:
      doUrlBarStep()         // animate to top-center → click animation → tooltip
```

**State machine:**
```
inactive → [Start Demo] → url_bar_step
                                ↓ (user types linkedin.com, navigates)
                          linkedin_step
                                ↓ (button found, pointed at)
                          done
                                ↓ (5s timeout)
                          cleanup → inactive
```

State is persisted in `chrome.storage.session` (survives navigation, cleared on browser close) and the service worker tracks the active tab ID to re-inject on `tabs.onUpdated`.

### ✅ Functional Completeness (20%)

The core loop works end-to-end with zero external dependencies:

<p align="center">
  <img src="screenshots/popup.png" alt="VoicePoint popup with Start Demo button" width="240">
  &nbsp;&nbsp;
  <img src="screenshots/urlbar-pointer.png" alt="☝️ pointing at the URL bar" width="600">
</p>

1. **User clicks Start Demo** in the popup → the background service worker sets `demoActive: true` in `chrome.storage.session` and injects `content.js` + `pointer.css` into the active tab.
2. **☝️ hand appears at screen center** with a scale-in animation, then glides to `(50vw, 8px)` — the URL bar area — with a click animation (scale 1 → 0.85 → 1.1 → 1) and a blue ripple ring.
3. **Tooltip appears:** *"Click the address bar above, type linkedin.com and press Enter"* — the instruction stays visible for 8 seconds, then fades.

<p align="center">
  <img src="screenshots/tooltip.png" alt="Tooltip instructing user to type linkedin.com" width="600">
</p>

4. **User navigates to LinkedIn** → `chrome.tabs.onUpdated` fires → the background script detects `linkedin.com` in the URL and re-injects the content script, which reads `demoActive: true` from storage and runs `doLinkedInStep()`.
5. **Retry loop activates** — the script polls for the "Create Post" button using 8 different selectors, retrying every 500ms for up to 25 seconds.
6. **Button found** → `scrollIntoView({ behavior: 'smooth', block: 'center' })` → script waits for the `scrollend` event (with a 1200ms timeout fallback) → calculates button position via `getBoundingClientRect()`.
7. **☝️ hand glides to the button's top-center** with the blue target dot aligning precisely at `(rect.left + width/2, rect.top)`.
8. **Button is highlighted** with a pulsing blue glow (`box-shadow` animation cycling between 0px and 6px spread every 1.5s) and a border ring via `::after` pseudo-element.
9. **✓ DONE overlay fades in** over a semi-transparent background — "✓ DONE" scales up with a bounce ease, subtitle appears.

<p align="center">
  <img src="screenshots/linkedin-done.png" alt="☝️ pointer highlighting the Create Post button with DONE overlay" width="600">
</p>

10. **Auto-cleanup** after 5 seconds — state reset, overlay removed, popup returns to "Ready".

### 🎯 Problem-Solution Fit (20%)

**The personal pain point:** Every team I've been on uses Loom, Notion docs, and Slack messages to onboard new teammates. New hires watch a 15-minute Loom, alt-tab to the app, and immediately get stuck on step 3. They ping the author, wait for a reply, and lose 30 minutes of flow. I've been that new hire. I've been that author answering the same Slack question four times.

**Why existing solutions fail:**

| Solution | Problem |
|---|---|
| **Loom / video** | Passive watching; viewer doesn't do. Impossible to update — re-record the whole thing. |
| **Screenshots + arrows** | Static. Break when UI changes. No way to show multi-step flows. |
| **In-app tours (Intro.js, Shepherd)** | Requires modifying the target app's codebase. Expensive to build and maintain. |
| **Text guides / Notion docs** | Context-switching hell. "Click the button in the top-right corner" — which button? |
| **Clicky (macOS)** | OS-level app, Mac-only, requires install + permissions. Not embeddable in a browser. |

**VoicePoint's unique fit:** A Chrome extension is zero-friction — install once, works on any page, no code changes to the target app. It bridges the gap between "watch a video" (passive) and "do it yourself" (active) by *pointing at the actual UI while you perform the action*. The user doesn't watch a recording — they follow a live pointer on the real page, in real time, at their own pace.

### 🎨 UX & Design (5%)

- **The ☝️ hand emoji** was chosen over a synthetic cursor icon because it's universally recognized, cross-platform, and inherently friendly — it feels like a person pointing rather than a machine cursor.
- **A blue target dot** (8px, `#4A90D9`, white border, box-shadow glow) pinpoints the exact pixel being pointed at, because emoji rendering varies across platforms and the dot eliminates ambiguity.
- **CSS `cubic-bezier(0.22, 1, 0.36, 1)` transitions** create an "ease-out with overshoot" feel — the pointer arrives quickly and settles naturally, mimicking a human hand gesture rather than a robotic linear movement.
- **The tooltip** uses a dark translucent card (`rgba(26, 26, 46, 0.95)`) with a blue accent border, rounded corners, and a subtle slide-up entrance — readable on any background.
- **The DONE overlay** uses a full-screen semi-transparent backdrop with a large green checkmark (72px, `#2ecc71`) and a bounce-in animation — satisfying, celebratory, unambiguous.
- **Ripple effect** on click: a circular ring expands from the click point, providing haptic-like visual feedback.
- **Pulsing highlight** on the target element alternates between 0px and 6px box-shadow spread — attention-grabbing without being distracting.
- **`pointer-events: none`** on the entire overlay ensures the user can click through the pointer — it never blocks interaction, ever.

### 📚 Learning & Ambition (5%)

This project was built by stretching into three unfamiliar territories:

1. **Chrome Extension Manifest V3** — MV3's service worker lifecycle is significantly more restrictive than MV2's background pages. The service worker can be terminated after 30s of inactivity, meaning `setTimeout` and promise chains must be carefully managed. We learned to use `chrome.storage.session` (a MV3-only API) for state persistence and `chrome.scripting.executeScript()` for reliable content injection.

2. **CSS animation timing for real-world UI** — Getting the ☝️ hand to feel *natural* required deep work with cubic-bezier curves, understanding how easing affects perceived motion, and tuning the click animation's compression/overshoot phases to match human expectation. The difference between a "robotic" pointer and a "human" pointer is ~200ms of timing and the right easing curve.

3. **DOM resilience against dynamic SPAs** — LinkedIn's React-based feed is a worst-case scenario for script injection: it loads progressively, A/B tests different layouts, and changes selectors without notice. Building the retry loop with 8 fallback selectors and a 25-second timeout taught us that "find the element" is the hardest problem in browser automation.

**What's next:** VoicePoint is designed for an AI agent architecture where an LLM (Claude, GPT) observes the screen via screenshot, decides the next action, and sends `[POINT: x, y, label]` commands to the pointer. The service worker architecture already supports this: a message-based protocol where the AI sends `{ type: 'point-to', x, y, label }` and the pointer moves. We deliberately built the MVP without API keys to prove the core loop works, but the full vision is an AI teacher that watches, points, and explains — all in the browser, all in real time.

---

## How it works

VoicePoint injects a transparent overlay into the page with `pointer-events: none` — it never blocks clicks or typing. The ☝️ pointer and a blue target dot are positioned absolutely with CSS transitions for smooth movement.

The extension uses:
- **Manifest V3** with `scripting` + `activeTab` permissions
- `chrome.scripting.executeScript` / `insertCSS` for reliable injection into existing tabs
- `chrome.storage.session` to persist demo state across page navigations
- `chrome.tabs.onUpdated` to re-inject the pointer after navigation

---

## Directory structure

```
voicepoint/
├── manifest.json         # Chrome extension manifest (MV3)
├── background.js         # Service worker — state management, injection, tab tracking
├── content.js            # Injected script — pointer creation, animation, step logic
├── pointer.css           # All styles: pointer, tooltip, highlight, DONE overlay, ripple
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic — start/stop buttons, step indicators
├── screenshots/          # Demo screenshots for the README
│   ├── popup.png
│   ├── urlbar-pointer.png
│   ├── tooltip.png
│   └── linkedin-done.png
├── AGENTS.md             # AI agent prompt / architecture reference
├── .cursorrules          # Cursor IDE configuration
└── README.md
```

---

## Development

### Load the extension

1.  Open `chrome://extensions/`
2.  Toggle **Developer mode** ON
3.  Click **Load unpacked** → select the `sudo-pointer-extension/` directory

### How to test

1.  Open any page (e.g. `google.com`)
2.  Click the VoicePoint icon in the Chrome toolbar → **Start Demo**
3.  Watch the ☝️ pointer appear and point at the URL bar
4.  Type `linkedin.com` in the URL bar and press Enter
5.  On LinkedIn, the pointer moves to the "Create a Post" button, highlights it, and shows **✓ DONE**

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| **MVP** | ☝️ Sudo pointer with 2‑step LinkedIn demo | ✅ Complete |
| **Phase 2** | Record & replay — capture pointer positions and actions | 🔜 Next |
| **Phase 3** | Voice commands — "Point at the profile menu" | 🔜 Next |
| **Phase 4** | AI agent integration (LLM reads screen → moves pointer) | 🌐 Future |
| **Phase 5** | Multi‑step script engine — define flows in JSON | 🌐 Future |
| **Phase 6** | Cross‑browser (Firefox, Edge, Safari) | 🌐 Future |

---

## License

MIT — see [LICENSE](LICENSE).

---

*VoicePoint is inspired by Farza's [Clicky](https://github.com/farzaa/clicky) — an AI teacher that lives next to your cursor. This is a browser‑native take on the same idea: a lightweight, scriptable pointer overlay that helps people learn software by doing. No installation. No video. Just a hand that points.*
