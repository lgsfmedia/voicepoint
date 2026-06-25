# VoicePoint Architecture Guide

This file describes the architecture of the VoicePoint Chrome extension for AI agents (Claude, Cursor, etc.) to understand the codebase and make informed changes.

## Overview

VoicePoint is a Chrome extension (Manifest V3) that overlays a virtual pointer (☝️) on web pages to guide users through UI workflows. It uses programmatic script injection to ensure the pointer always works regardless of page load state.

## Core Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  popup.js    │────▶│  background.js   │────▶│  content.js     │
│  (popup UI)  │     │  (service worker)│     │  (injected)     │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │                        │
                           ▼                        ▼
                    chrome.storage.session    DOM overlay
                    (state persistence)      (position: fixed)
```

### Layers

1. **Popup** (`popup.html` + `popup.js`)
   - Thin UI with Start/Stop buttons and step indicators
   - Communicates with background via `chrome.runtime.sendMessage`
   - Receives step update messages from content script

2. **Background Service Worker** (`background.js`)
   - State machine: manages `demoActive` flag in `chrome.storage.session`
   - Injects content.js and pointer.css into tabs via `chrome.scripting.executeScript`
   - Tracks `activeTabId` for re-injection on navigation (`tabs.onUpdated`)
   - Relays messages between popup and content script

3. **Content Script** (`content.js`)
   - Injected into pages on-demand by background
   - Creates fixed-position overlay DOM nodes
   - Orchestrates step progression (URL bar → LinkedIn button)
   - Calculates element positions using `getBoundingClientRect()`
   - Uses `requestAnimationFrame` / `scrollend` for accurate positioning

### State Flow

```
User clicks Start
       │
       ▼
background sets session.storage: { demoActive: true }
       │
       ▼
background injects content.js into active tab
       │
       ▼
content.js checks URL:
  ├── linkedin.com → doLinkedInStep()
  └── other        → doUrlBarStep()
       │
       ▼
User navigates → tabs.onUpdated fires
       │
       ▼
background re-injects content.js (if demoActive)
       │
       ▼
content.js re-checks URL and continues
```

### Key Design Decisions

- **No manifest content_scripts**: We inject programmatically to support already-open tabs
- **`pointer-events: none`**: Pointer overlay never blocks user interaction
- **`position: fixed`**: Pointer stays in viewport, not scrolled with page
- **CSS transitions for movement**: Smooth easing `cubic-bezier(0.22, 1, 0.36, 1)`
- **Emoji pointer (☝️)**: No image assets needed, works cross-platform

## File Reference

### `content.js` — Core Functions

| Function | Purpose |
|----------|---------|
| `createOverlay()` | Creates DOM nodes (pointer, dot, tooltip, done screen) |
| `movePointerTo(x, y)` | Sets pointer position via CSS `left`/`top` |
| `clickAnimation()` | Triggers CSS click bounce + ripple effect |
| `highlightElement(el)` | Adds pulsing glow animation to target element |
| `waitForEl(selectors, timeout)` | Polls DOM for element with retry |
| `doUrlBarStep()` | Step 1: point at URL bar, show instruction tooltip |
| `doLinkedInStep()` | Step 2: find "Create Post", animate pointer, highlight, show DONE |
| `startDemo()` | Entry point — creates overlay and dispatches to correct step |
| `stopDemo()` | Cleans up overlay and resets state |

### `background.js` — State Management

| Function | Purpose |
|----------|---------|
| `injectIntoTab(tabId)` | Injects content.js + pointer.css via scripting API |
| `onMessage` handler | Routes start-demo, stop-demo, get-state messages |
| `tabs.onUpdated` listener | Re-injects on navigation when demo is active |

## Adding New Workflows

1. Add a new step function in `content.js` (e.g. `doGithubStep()`)
2. Add the URL check in `startDemo()` (e.g. `github.com`)
3. Update `popup.html` with a new step indicator if needed
4. To make it a reusable workflow system, define steps in a JSON config

## Troubleshooting

- **Pointer not showing**: Check `chrome://extensions` → service worker is running
- **Wrong position**: `getBoundingClientRect()` must be called after scroll completes
- **Double injection**: `window.__sudoPointerLoaded` flag prevents duplicate execution
- **CSS not applying**: Run `chrome.scripting.insertCSS` with matching `tabId`
