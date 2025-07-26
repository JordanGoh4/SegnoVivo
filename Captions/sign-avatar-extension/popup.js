const toggleBtn = document.getElementById('toggleBtn');
let isActive = false;

function updateButton() {
  if (isActive) {
    toggleBtn.textContent = 'Stop Interpreter';
    toggleBtn.classList.add('stopped');
  } else {
    toggleBtn.textContent = 'Start Interpreter';
    toggleBtn.classList.remove('stopped');
  }
}

async function toggleAvatar() {
  isActive = !isActive;
  updateButton();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    console.warn('No active tab found');
    return;
  }

  chrome.tabs.sendMessage(tab.id, {
    type: isActive ? 'START_AVATAR' : 'STOP_AVATAR',
  });

  chrome.storage.local.set({ active: isActive });
}

chrome.storage.local.get(['active'], (result) => {
  isActive = result.active || false;
  updateButton();
});

toggleBtn.addEventListener('click', toggleAvatar);
