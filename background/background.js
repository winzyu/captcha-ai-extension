// Background script for handling extension events
chrome.runtime.onInstalled.addListener(() => {
  console.log('CAPTCHA AI Assistant installed');
  // Set default enabled state
  chrome.storage.sync.set({ enabled: true });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_ENABLED_STATE') {
    chrome.storage.sync.get(['enabled'], (result) => {
      sendResponse({ enabled: result.enabled ?? true });
    });
    return true; // Required for async response
  }
  
  if (request.type === 'SET_ENABLED_STATE') {
    chrome.storage.sync.set({ enabled: request.enabled }, () => {
      // Notify all tabs about the state change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ENABLED_STATE_CHANGED',
            enabled: request.enabled
          }).catch(() => {}); // Ignore errors for inactive tabs
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.type === 'CAPTCHA_DETECTED') {
    console.log('CAPTCHA detected on page:', sender.tab.url);
  }
  return true;
});
