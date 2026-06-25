# VoicePoint — Agent Workflow Instructions

This file defines how AI agents (Cursor Claude, Claude Code, etc.) should work with the VoicePoint codebase.

## Before Making Changes

1. Read `CLAUDE.md` first to understand the architecture
2. Read `content.js` to understand the existing step pattern
3. Check `manifest.json` for current permissions and configuration
4. Use `getBoundingClientRect()` for accurate element positioning — never guess coordinates

## Coding Conventions

- **No comments in code** — logic should be self-documenting with readable variable names
- **Use CSS transitions for movement** — smooth easing with `cubic-bezier`
- **Always handle `pointer-events: none`** — the overlay must never block user interaction
- **Console.log is OK for debugging** — remove before production
- **Use `chrome.storage.session`** for state that needs to survive page navigation
- **Emoji for pointer icon** — no image assets, just ☝️ (U+261D)

## Workflow Step Pattern

Every workflow step follows this pattern:

```javascript
async function doStepName() {
  if (!isActive) return;

  // 1. Center pointer first (entry animation)
  pointer.style.transition = 'none';
  movePointerTo(cx, cy);
  void pointer.offsetHeight;
  pointer.style.transition = '';

  // 2. Find target element with retry
  const el = await waitForEl(SELECTORS, 'fallback_selector', 20000);
  if (!el) { showTooltip('Not found...'); return; }

  // 3. Scroll and wait
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await waitForScroll(el);

  // 4. Position pointer at element
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2 - POINTER_SIZE / 2;
  const y = rect.top - 8;  // tip of ☝️ above element
  movePointerTo(x, y);

  // 5. Click animation + highlight
  clickAnimation();
  highlightElement(el);

  // 6. Show tooltip + proceed
  showTooltip('Instruction...', false);
  await delay(3000);
  hideTooltip();
  showDone();
}
```

## Adding a New Workflow

1. Define URL-specific selectors as a const array at the top of the function
2. Add URL matching in `startDemo()` — check `window.location.hostname`
3. Create the step function following the pattern above
4. Add step update messages for the popup UI
5. Test on the target page before committing

## Testing Workflow

1. Load the extension unpacked in Chrome
2. Open DevTools console on the target page
3. Click Start Demo in the popup
4. Look for `Sudo Pointer: content script loaded` in console
5. Watch the pointer animation — verify position accuracy
6. Check `chrome://extensions` → service worker for background errors

## Git Workflow

- Commit messages: `prefix: short description` (e.g. `fix: correct pointer offset for LinkedIn button`)
- Keep the pointer.css separate from content.js (separation of concerns)
- Test on a clean Chrome profile before pushing
