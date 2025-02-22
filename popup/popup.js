// Initialize popup state
document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusDiv = document.getElementById('status');

  // Get current enabled state
  chrome.runtime.sendMessage({ type: 'GET_ENABLED_STATE' }, (response) => {
    enableToggle.checked = response.enabled;
    updateStatus(response.enabled);
  });

  // Handle toggle changes
  enableToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.runtime.sendMessage(
      { type: 'SET_ENABLED_STATE', enabled },
      () => updateStatus(enabled)
    );
  });

  function updateStatus(enabled) {
    statusDiv.className = `status ${enabled ? 'enabled' : 'disabled'}`;
    statusDiv.textContent = enabled 
      ? 'Extension is active and ready to help'
      : 'Extension is currently disabled';
  }
});
