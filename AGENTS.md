# VoicePoint — Agent Guide

This file is for AI coding agents (Claude Code, Cursor, etc.) to understand the project.

## Overview

VoicePoint is a Chrome extension that shows a virtual pointer (☝️) to demonstrate UI workflows. The MVP teaches users how to create a LinkedIn post.

### Flow

1. User clicks "Start Demo" in the popup
2. Background sets `demoActive: true` in chrome.storage.session
3. Background injects content.js + pointer.css into the active tab
4. content.js creates the overlay and runs the correct step based on URL
5. If not on LinkedIn → URL bar pointer step
6. If on LinkedIn → find Create Post button, point at it, highlight it, show DONE
7. On tab navigation, background re-injects content + sends demo-start message

### Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3, permissions: storage, activeTab, scripting |
| `background.js` | State machine, injection, tab tracking |
| `content.js` | Pointer DOM, step logic, animation |
| `pointer.css` | All visual styles |
| `popup.html` | Popup UI (start/stop, step indicators) |
| `popup.js` | Popup event handlers |

### Key technical decisions

- **Programmatic injection** via `chrome.scripting.executeScript` — ensures the content script is always available even on pages loaded before the extension
- **CSS transitions** for pointer movement — smooth 0.7s cubic-bezier animation
- **Target dot** — an 8px blue dot tracks the ☝️ fingertip for precise alignment
- **Retry loop** — polls for LinkedIn's "Create Post" button for up to 25s

### Pointer positioning

The ☝️ emoji (U+261D) points upward. The fingertip is at the emoji's top edge, horizontally centered. To point at an element:

```js
const btnX = rect.left + rect.width / 2 - POINTER_SIZE / 2; // 20
const btnY = rect.top - 8; // fingertip just above the element
```

### LinkedIn selectors (in priority order)

```
button[aria-label="Create a post"]
button[aria-label="Start a post"]
.share-box-feed-entry__trigger
[data-control-name="create_post"]
.share-creation-state__trigger
.feed-shared-controls__trigger
button[data-trigger="share-box"]
```

### To add a new flow

1. Add a new step function in content.js (e.g., `doSlackStep()`)
2. Add the flow detection in `startDemo()` based on hostname
3. Add the step LED in popup.html
4. Add the step message handler in popup.js

## Building / testing

- Load unpacked from `chrome://extensions` with dev mode on
- After code changes, click Reload on the extension card
- Open DevTools on any page, check console for "Sudo Pointer:" logs
