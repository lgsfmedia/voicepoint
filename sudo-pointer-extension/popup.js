const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

async function updateUI() {
  const res = await chrome.runtime.sendMessage({ type: 'get-state' });
  const active = res && res.demoActive;
  startBtn.style.display = active ? 'none' : '';
  stopBtn.style.display = active ? '' : 'none';
  status.textContent = active ? 'Demo running...' : 'Ready';
}

startBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'start-demo' });
  step1.classList.add('active');
  status.textContent = 'Demo running...';
  startBtn.disabled = true;
  startBtn.textContent = '▶ Starting...';
  setTimeout(() => {
    startBtn.style.display = 'none';
    stopBtn.style.display = '';
    startBtn.disabled = false;
    startBtn.textContent = '▶ Start Demo';
  }, 300);
});

stopBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'stop-demo' });
  step1.classList.remove('active');
  step2.classList.remove('active');
  step3.classList.remove('active');
  startBtn.style.display = '';
  stopBtn.style.display = 'none';
  status.textContent = 'Stopped';
  setTimeout(() => { status.textContent = 'Ready'; }, 1500);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'step-urlbar') step1.classList.add('active');
  if (message.type === 'step-linkedin') {
    step1.classList.remove('active');
    step2.classList.add('active');
  }
  if (message.type === 'step-done') {
    step2.classList.remove('active');
    step3.classList.add('active');
    status.textContent = 'Complete!';
  }
  if (message.type === 'demo-ended') {
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    startBtn.style.display = '';
    stopBtn.style.display = 'none';
    status.textContent = 'Ready';
  }
});

updateUI();
