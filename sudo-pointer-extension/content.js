if (window.__sudoPointerLoaded) return;
window.__sudoPointerLoaded = true;

console.log('Sudo Pointer: content script loaded');

let isActive = false;
let overlay, pointer, targetDot, tooltip, doneOverlay;
let pointerX = -100, pointerY = -100;
let currentHighlight = null;

const POINTER_SIZE = 40;

function createOverlay() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.className = 'sudo-pointer-overlay';
  document.documentElement.appendChild(overlay);

  targetDot = document.createElement('div');
  targetDot.className = 'sudo-target-dot';
  document.documentElement.appendChild(targetDot);

  pointer = document.createElement('div');
  pointer.className = 'sudo-pointer';
  pointer.textContent = '☝️';
  document.documentElement.appendChild(pointer);

  tooltip = document.createElement('div');
  tooltip.className = 'sudo-tooltip';
  document.documentElement.appendChild(tooltip);

  doneOverlay = document.createElement('div');
  doneOverlay.className = 'sudo-done-overlay';
  doneOverlay.innerHTML = `
    <div class="sudo-done-text">✓ DONE</div>
    <div class="sudo-done-sub">LinkedIn post creation ready</div>
  `;
  document.documentElement.appendChild(doneOverlay);
}

function removeOverlay() {
  if (overlay) { overlay.remove(); overlay = null; }
  if (pointer) { pointer.remove(); pointer = null; }
  if (targetDot) { targetDot.remove(); targetDot = null; }
  if (tooltip) { tooltip.remove(); tooltip = null; }
  if (doneOverlay) { doneOverlay.remove(); doneOverlay = null; }
  removeHighlight();
}

function movePointerTo(x, y) {
  pointerX = x;
  pointerY = y;
  pointer.style.left = x + 'px';
  pointer.style.top = y + 'px';
  targetDot.style.left = (x + POINTER_SIZE / 2 - 4) + 'px';
  targetDot.style.top = (y - 4) + 'px';
}

function getPointerRect() {
  return { x: pointerX - 10, y: pointerY - 10, w: POINTER_SIZE, h: POINTER_SIZE };
}

function showTooltip(text, belowPointer) {
  tooltip.innerHTML = text;
  tooltip.classList.add('visible');
  const pr = getPointerRect();
  const tipX = belowPointer ? pr.x : pointerX + POINTER_SIZE / 2 - 150;
  const tipY = belowPointer ? pr.y + pr.h + 16 : pointerY - 75;
  tooltip.style.left = Math.max(10, Math.min(tipX, window.innerWidth - 330)) + 'px';
  tooltip.style.top = Math.max(10, tipY) + 'px';
}

function hideTooltip() {
  tooltip.classList.remove('visible');
}

function showDone() {
  doneOverlay.classList.add('visible');
  chrome.storage.session.set({ demoActive: false });
  isActive = false;
  setTimeout(() => {
    doneOverlay.classList.remove('visible');
    removeOverlay();
  }, 5000);
}

function clickAnimation() {
  pointer.classList.remove('click-anim');
  void pointer.offsetWidth;
  pointer.classList.add('click-anim');
  targetDot.classList.add('click-dot');
  setTimeout(() => targetDot.classList.remove('click-dot'), 350);
  const ripple = document.createElement('div');
  ripple.className = 'sudo-ripple';
  ripple.style.left = (pointerX + POINTER_SIZE / 2 - 20) + 'px';
  ripple.style.top = (pointerY - 20) + 'px';
  document.documentElement.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

function removeHighlight() {
  if (currentHighlight) {
    currentHighlight.classList.remove('sudo-highlight');
    currentHighlight.style.outline = '';
    currentHighlight = null;
  }
}

function highlightElement(el) {
  removeHighlight();
  currentHighlight = el;
  el.classList.add('sudo-highlight');
}

function waitForEl(selector, textMatch, timeout = 20000) {
  const check = () => {
    for (const sel of selector) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    const all = document.querySelectorAll(textMatch);
    for (const el of all) {
      const t = (el.textContent || '').toLowerCase().trim();
      if (t.includes('start a post') || t.includes('create a post')) return el;
    }
    return null;
  };
  return new Promise(resolve => {
    const found = check();
    if (found) return resolve(found);
    let waited = 0;
    const iv = setInterval(() => {
      waited += 500;
      const f = check();
      if (f) { clearInterval(iv); resolve(f); }
      else if (waited >= timeout) { clearInterval(iv); resolve(null); }
    }, 500);
  });
}

function doUrlBarStep() {
  if (!isActive) return;
  const cx = window.innerWidth / 2 - POINTER_SIZE / 2;
  const cy = window.innerHeight / 2;
  pointer.style.transition = 'none';
  movePointerTo(-100, -100);
  void pointer.offsetHeight;
  movePointerTo(cx, cy);
  pointer.classList.add('arrive-anim');
  setTimeout(() => pointer.classList.remove('arrive-anim'), 500);
  pointer.style.transition = '';
  setTimeout(() => {
    const targetX = window.innerWidth / 2 - POINTER_SIZE / 2;
    const targetY = 8;
    movePointerTo(targetX, targetY);
    setTimeout(() => {
      clickAnimation();
      showTooltip('Click the address bar above, type <code>linkedin.com</code> and press <b>Enter</b>', true);
      setTimeout(hideTooltip, 8000);
    }, 800);
  }, 700);
  try { chrome.runtime.sendMessage({ type: 'step-urlbar' }); } catch (e) {}
}

async function doLinkedInStep() {
  if (!isActive) return;
  try { chrome.runtime.sendMessage({ type: 'step-linkedin' }); } catch (e) {}

  const cx = window.innerWidth / 2 - POINTER_SIZE / 2;
  const cy = window.innerHeight / 2;
  pointer.style.transition = 'none';
  movePointerTo(-100, -100);
  void pointer.offsetHeight;
  movePointerTo(cx, cy);
  pointer.style.transition = '';

  const LINKEDIN_SELECTORS = [
    'button[aria-label="Create a post"]',
    'button[aria-label="Start a post"]',
    '.share-box-feed-entry__trigger',
    '[data-control-name="create_post"]',
    '.share-creation-state__trigger',
    '.feed-shared-controls__trigger',
    'button[data-trigger="share-box"]',
  ];

  showTooltip('Looking for the "Create Post" button on LinkedIn...', true);

  const button = await waitForEl(LINKEDIN_SELECTORS, 'button, div[role="button"]', 25000);
  hideTooltip();

  if (!button) {
    showTooltip('Could not find "Create Post" — navigate to your LinkedIn feed page.', true);
    setTimeout(hideTooltip, 5000);
    return;
  }

  button.scrollIntoView({ behavior: 'smooth', block: 'center' });

  await new Promise(r => {
    let done = false;
    const onEnd = () => { if (!done) { done = true; r(); } };
    setTimeout(onEnd, 1200);
    button.addEventListener('scrollend', onEnd, { once: true });
  });

  const rect = button.getBoundingClientRect();
  const btnX = rect.left + rect.width / 2 - POINTER_SIZE / 2;
  const btnY = rect.top - 8;

  movePointerTo(btnX, btnY);
  await new Promise(r => setTimeout(r, 700));
  clickAnimation();
  highlightElement(button);
  showTooltip('☝️ Click <b>Create a Post</b> to start a LinkedIn post!', false);

  setTimeout(() => {
    hideTooltip();
    showDone();
    try { chrome.runtime.sendMessage({ type: 'step-done' }); } catch (e) {}
    setTimeout(() => {
      removeHighlight();
      removeOverlay();
      try { chrome.runtime.sendMessage({ type: 'demo-ended' }); } catch (e) {}
    }, 5000);
  }, 3000);
}

function startDemo() {
  if (isActive) return;
  isActive = true;
  createOverlay();
  if (window.location.hostname.includes('linkedin.com')) {
    doLinkedInStep();
  } else {
    doUrlBarStep();
  }
}

function stopDemo() {
  isActive = false;
  chrome.storage.session.set({ demoActive: false });
  removeHighlight();
  if (tooltip) hideTooltip();
  if (doneOverlay) doneOverlay.classList.remove('visible');
  setTimeout(removeOverlay, 300);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'demo-start') startDemo();
  if (message.type === 'demo-stop') stopDemo();
  if (message.type === 'ping') sendResponse({ alive: true });
});

chrome.storage.session.get(['demoActive'], ({ demoActive }) => {
  if (demoActive) startDemo();
});
