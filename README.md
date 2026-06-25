# VoicePoint ☝️

> A virtual pointer overlay that demonstrates UI workflows — like having a teacher point at things on your screen.

VoicePoint is a Chrome extension that places a **sudo pointer** (a floating ☝️ hand) on top of any webpage. It can autonomously move, click-animate, and highlight elements to show users exactly what to do — no video, no screenshots, no confusion.

Think of it as Clicky ([farzaa/clicky](https://github.com/farzaa/clicky)) for the browser: a lightweight, scriptable, AI-ready teaching overlay.

---

## The Problem

**Software onboarding is broken.**

- New hires stare at a screen flooded with menus, buttons, and fields — overwhelmed.
- Existing walkthroughs are static screenshots, bloated videos, or fragile step‑lists that go out of date the moment the UI changes.
- Trainers spend hours recording Loom videos that nobody re-watches. Documentation rots. Users get stuck on the same trivial flows again and again.

The core issue: **there is no lightweight, programmable way to visually guide someone through a UI in real time.**

Screen recordings are passive — the viewer watches, they don't do. Text guides require context‑switching. In‑app tours are expensive to build and maintain for every flow.

---

## The Vision: VoicePoint

VoicePoint turns any UI flow into a **live, pointed‑at demonstration** — a virtual "buddy cursor" that moves across the screen, taps buttons, and highlights exactly where to click.

The MVP (this repo) demonstrates the core mechanic:

<p align="center">
  <img src="screenshots/popup.png" alt="VoicePoint popup with Start Demo button" width="240">
  &nbsp;&nbsp;
  <img src="screenshots/urlbar-pointer.png" alt="☝️ pointing at the URL bar" width="600">
</p>

1.  Click **Start Demo** in the extension popup.
2.  A ☝️ hand appears and points at the URL bar with a click animation.
3.  A tooltip reads: *"Type linkedin.com and press Enter."*

<p align="center">
  <img src="screenshots/tooltip.png" alt="Tooltip instructing user to type linkedin.com" width="600">
</p>

4.  The user follows the instruction — VoicePoint detects the navigation.
5.  On LinkedIn, the ☝️ hand glides to the **"Create a Post"** button, highlights it with a pulsing glow, and shows **✓ DONE**.

<p align="center">
  <img src="screenshots/linkedin-done.png" alt="☝️ pointer highlighting the Create Post button with DONE overlay" width="600">
</p>

No video. No narration. Just a clear, visual pointer saying *"do this, then this, then you're done."*

### Why this matters

- **Active learning** — The user performs the action themselves; they don't just watch.
- **Zero video fatigue** — A 3‑second pointer animation replaces 30 seconds of screen recording.
- **Flow‑aware** — VoicePoint can react to page changes, wait for elements to load, and adapt.
- **AI‑ready** — The pointer can be controlled by an LLM (like Claude or GPT) that reads the screen, decides the next action, and moves the pointer accordingly. The architecture supports plugging in any AI provider.

### Use cases

| Use case | How VoicePoint helps |
|---|---|
| **Employee onboarding** | Walk new hires through Slack, Notion, Salesforce setup without a live trainer. |
| **Customer education** | Embed guided tours in your SaaS product — "click here to create your first project." |
| **Accessibility** | Visually impaired users can follow along as the pointer highlights the next interaction target. |
| **QA / demo recording** | Record a sequence of pointer actions and replay them as a reproducible test or demo. |
| **Self‑paced learning** | Learners control the pace — the pointer waits for them to complete each step before moving on. |

---

## How it works

VoicePoint injects a transparent overlay into the page with `pointer-events: none` — it never blocks clicks or typing. The ☝️ pointer and a blue target dot are positioned absolutely with CSS transitions for smooth movement.

```js
// Core loop (simplified)
startDemo()
  → createOverlay()
  → if page is linkedin.com:
      doLinkedInStep()     // find button, animate pointer, highlight, show DONE
    else:
      doUrlBarStep()       // point at URL bar, click animation, show tooltip
```

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
3.  Click **Load unpacked** → select the `voicepoint/` directory

### How to test

1.  Open any page (e.g. `google.com`)
2.  Click the VoicePoint icon in the Chrome toolbar → **Start Demo**
3.  Watch the ☝️ pointer appear and point at the URL bar
4.  Type `linkedin.com` in the URL bar and press Enter
5.  On LinkedIn, the pointer moves to the "Create a Post" button, highlights it, and shows **✓ DONE**

---

## Roadmap

| Phase | Feature |
|---|---|
| **MVP** | ☝️ Sudo pointer with 2‑step LinkedIn demo |
| **Next** | Record & replay — capture pointer positions and actions |
| **Next** | Voice commands — "Point at the profile menu" |
| **Future** | AI agent integration (LLM reads screen → moves pointer) |
| **Future** | Multi‑step script engine — define flows in JSON |
| **Future** | Cross‑browser (Firefox, Edge, Safari) |

---

## License

MIT — see [LICENSE](LICENSE).

---

*VoicePoint is inspired by Farza's [Clicky](https://github.com/farzaa/clicky) — an AI teacher that lives next to your cursor. This is a browser‑native take on the same idea: a lightweight, scriptable pointer overlay that helps people learn software by doing.*
