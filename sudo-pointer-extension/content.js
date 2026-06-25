if (window.__sudoPointerLoaded) { /* already running */ }
window.__sudoPointerLoaded = true;

console.log('Sudo Pointer: content script loaded');

let isActive = false;
let overlay, pointer, tooltip, doneOverlay;
let pointerX = -100, pointerY = -100;
let currentHighlight = null;

function createOverlay() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.className = 'sudo-pointer-overlay';
  document.documentElement.appendChild(overlay);

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

  console.log('Sudo Pointer: overlay created');
}

function removeOverlay() {
  if (overlay) { overlay.remove(); overlay = null; }
  if (pointer) { pointer.remove(); pointer = null; }
  if (tooltip) { tooltip.remove(); tooltip = null; }
  if (doneOverlay) { doneOverlay.remove(); doneOverlay = null; }
  removeHighlight();
}

function movePointerTo(x, y) {
  pointerX = x;
  pointerY = y;
  pointer.style.left = x + 'px';
  pointer.style.top = y + 'px';
}

function getPointerRect() {
  return { x: pointerX - 10, y: pointerY - 10, w: 40, h: 40 };
}

function showTooltip(text, belowPointer) {
  tooltip.innerHTML = text;
  tooltip.classList.add('visible');
  const pr = getPointerRect();
  const tipX = pr.x - 60;
  const tipY = belowPointer ? pr.y + pr.h + 16 : pr.y - 70;
  tooltip.style.left = Math.max(10, Math.min(tipX, window.innerWidth - 330)) + 'px';
  tooltip.style.top = tipY + 'px';
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
  const ripple = document.createElement('div');
  ripple.className = 'sudo-ripple';
  ripple.style.left = (pointerX - 20) + 'px';
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

const LINKEDIN_SELECTORS = [
  'button[aria-label="Create a post"]',
  'button[aria-label="Start a post"]',
  '.share-box-feed-entry__trigger',
  '[data-control-name="create_post"]',
  '.share-creation-state__trigger',
];

function findCreatePostButton() {
  for (const sel of LINKEDIN_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    const text = (btn.textContent || '').toLowerCase().trim();
    if (text.includes('start a post') || text.includes('create a post')) return btn;
  }
  const divs = document.querySelectorAll('div[role="button"]');
  for (const div of divs) {
    const text = (div.textContent || '').toLowerCase().trim();
    if (text.includes('start a post') || text.includes('create a post')) return div;
  }
  return null;
}

function doUrlBarStep() {
  if (!isActive) return;
  pointer.style.transition = 'none';
  movePointerTo(window.innerWidth / 2 - 20, window.innerHeight / 2 - 20);
  void pointer.offsetHeight;
  pointer.classList.add('arrive-anim');
  setTimeout(() => pointer.classList.remove('arrive-anim'), 500);
  pointer.style.transition = '';
  const targetX = window.innerWidth / 2 - 20;
  const targetY = 12;
  setTimeout(() => {
    movePointerTo(targetX, targetY);
    setTimeout(() => {
      clickAnimation();
      showTooltip('Click the address bar above, type <code>linkedin.com</code> and press <b>Enter</b>', true);
      setTimeout(hideTooltip, 7000);
    }, 800);
  }, 600);
  try {
    chrome.runtime.sendMessage({ type: 'step-urlbar' });
  } catch (e) {}
}

async function doLinkedInStep() {
  if (!isActive) return;
  try {
    chrome.runtime.sendMessage({ type: 'step-linkedin' });
  } catch (e) {}
  pointer.style.transition = 'none';
  movePointerTo(window.innerWidth / 2 - 20, window.innerHeight / 2 - 20);
  void pointer.offsetHeight;
  pointer.style.transition = '';
  let button = findCreatePostButton();
  if (!button) {
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      button = findCreatePostButton();
      if (button) break;
    }
  }
  if (!button) {
    showTooltip('Could not find the "Create Post" button on LinkedIn.', true);
    setTimeout(hideTooltip, 4000);
    return;
  }
  button.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(r => setTimeout(r, 800));
  const rect = button.getBoundingClientRect();
  const btnX = rect.left + rect.width / 2 - 10;
  const btnY = rect.top + 10;
  movePointerTo(btnX, btnY);
  await new Promise(r => setTimeout(r, 600));
  clickAnimation();
  highlightElement(button);
  showTooltip('☝️ Click here to <b>Create a Post</b> on LinkedIn!', false);
  setTimeout(() => {
    hideTooltip();
    showDone();
    try { chrome.runtime.sendMessage({ type: 'step-done' }); } catch (e) {}
    setTimeout(() => {
      removeHighlight();
      removeOverlay();
      try { chrome.runtime.sendMessage({ type: 'demo-ended' }); } catch (e) {}
    }, 5000);
  }, 2500);
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

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Sudo Pointer: got message', message.type);
  if (message.type === 'demo-start') startDemo();
  if (message.type === 'demo-stop') stopDemo();
  if (message.type === 'ping') sendResponse({ alive: true });
});

// Check if demo was already active (e.g., after navigation)
chrome.storage.session.get(['demoActive'], ({ demoActive }) => {
  if (demoActive) {
    console.log('Sudo Pointer: demo was active, resuming');
    startDemo();
  }
});
