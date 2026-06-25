let activeTabId = null;

async function injectIntoTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {
    // already injected, that's fine
  }
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['pointer.css']
    });
  } catch (e) {
    // already injected
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'start-demo') {
    (async () => {
      await chrome.storage.session.set({ demoActive: true });
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab) return;
      activeTabId = tab.id;
      await injectIntoTab(tab.id);
      try { await chrome.tabs.sendMessage(tab.id, { type: 'demo-start' }); } catch (e) {}
    })();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'stop-demo') {
    chrome.storage.session.set({ demoActive: false });
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) chrome.tabs.sendMessage(tab.id, { type: 'demo-stop' }).catch(() => {});
    });
    activeTabId = null;
    sendResponse({ success: true });
  }

  if (message.type === 'get-state') {
    chrome.storage.session.get(['demoActive'], ({ demoActive }) => {
      sendResponse({ demoActive: !!demoActive });
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === activeTabId) {
    chrome.storage.session.get(['demoActive'], async ({ demoActive }) => {
      if (demoActive) {
        await injectIntoTab(tabId);
        try { await chrome.tabs.sendMessage(tabId, { type: 'demo-start' }); } catch (e) {}
      }
    });
  }
});
