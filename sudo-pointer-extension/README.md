# VoicePoint ☝️

**A virtual pointer overlay that demonstrates UI workflows — like having a teacher point at the screen, but automated.**

---

## The Problem

Learning new software is hard. Tutorials are passive — you watch a video or read a guide, then try to replicate the steps from memory. You get lost, miss a click, or end up on the wrong page. There's no one there to point at what you should do next.

Screen recording tools capture what happened, but they can't guide you in real time. Training videos are expensive to produce and go out of date fast. Documentation tells you what to do but not where to click.

The gap between *instruction* and *action* is where most learners fall through.

## The VoicePoint Solution

VoicePoint is a lightweight browser extension that overlays a **guided pointer** (☝️) on top of any web page. It shows you exactly where to click, what to type, and what to expect — step by step, in real time.

Think of it as Clicky ([heyclicky.com](https://www.heyclicky.com/)) for the browser — a virtual teaching assistant that lives alongside your cursor.

### How it works

1. A workflow author records a sequence of steps (click here, type this, wait for that)
2. When a learner runs the workflow, VoicePoint's **sudo pointer** (☝️) appears on screen
3. The pointer moves smoothly to each target element, clicks with a visual ripple, and waits for the learner to follow along
4. Tooltips explain *what* to do and *why*

### Example: Posting on LinkedIn

```
▶ Start Demo
  ↓
☝️ Pointer moves to the URL bar → "Type linkedin.com and press Enter"
  ↓
  User navigates to LinkedIn
  ↓
☝️ Pointer flies to "Create a Post" button → blue glow highlights it
  ↓
✓ DONE — the learner knows exactly where to click
```

This turns a passive how-to guide into an **interactive, guided walkthrough**.

## Who is this for?

| Role | How VoicePoint helps |
|------|---------------------|
| **Trainers & Educators** | Create interactive tutorials that guide learners step by step |
| **SaaS Companies** | Onboard new users without costly video production |
| **Customer Success** | Walk customers through complex workflows live |
| **Self-Learners** | Follow along with automated guides at your own pace |
| **Developers** | Demonstrate features and workflows without screen recording |

## Why a virtual pointer?

Real cursors are distracting — they twitch, they wander, and the learner's own cursor is already on screen. A **sudo pointer** is:

- **Intentional** — it moves with purpose, always toward a target
- **Animated** — smooth transitions make the path obvious
- **Non-blocking** — `pointer-events: none` means it never intercepts clicks
- **Augmented** — paired with tooltips, highlights, and ripple effects to create a rich learning signal

## Project Structure

```
sudo-pointer-extension/
├── manifest.json        # Chrome Extension manifest (MV3)
├── background.js        # Service worker — state management & injection
├── content.js           # Core logic — pointer, tooltips, step orchestration
├── pointer.css          # All styling & animations
├── popup.html           # Extension popup UI
├── popup.js             # Popup interaction logic
├── CLAUDE.md            # Architecture guide for AI agents
├── AGENTS.md            # Agent workflow instructions
└── README.md            # This file
```

## Installation

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `sudo-pointer-extension/` directory
5. Click the ☝️ icon in the toolbar → **Start Demo**

## Roadmap

- [ ] **Multi-step workflow recorder** — capture clicks, inputs, and assertions
- [ ] **Workflow file format** — shareable JSON/YAML step definitions
- [ ] **Conditional branching** — handle different UI states
- [ ] **Speed control** — slow down / speed up the pointer
- [ ] **Recording playback** — save and replay workflows
- [ ] **AI-powered authoring** — describe a workflow in natural language, get a guide

## License

MIT
