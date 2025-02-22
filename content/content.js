// Content script that runs in the context of the web page
console.log('CAPTCHA AI Assistant content script loaded');

let predictionPopup = null;
let isEnabled = true; // Default enabled state

// Get initial enabled state
chrome.runtime.sendMessage({ type: 'GET_ENABLED_STATE' }, (response) => {
  isEnabled = response.enabled;
});

// Listen for enabled state changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ENABLED_STATE_CHANGED') {
    isEnabled = request.enabled;
    if (!isEnabled && predictionPopup) {
      predictionPopup.classList.remove('active');
    }
  }
});

// Create and inject the prediction popup
function createPredictionPopup() {
  console.log('Creating prediction popup');
  if (predictionPopup) return;

  predictionPopup = document.createElement('div');
  predictionPopup.className = 'captcha-ai-popup';
  
  // Updated HTML structure to better handle scrolling
  predictionPopup.innerHTML = `
    <div class="captcha-ai-content">
      <div class="captcha-ai-compact-view">
        <div class="prediction-text">AI Guess: <span class="text"></span></div>
        <div class="captcha-ai-actions">
          <button class="captcha-ai-fill">Fill</button>
          <button class="captcha-ai-expand">Details</button>
          <button class="captcha-ai-close">×</button>
        </div>
      </div>
    </div>
    <div class="captcha-ai-expanded-view hidden">
      <div class="captcha-ai-details-content">
        <div class="captcha-ai-preview">
          <p class="preview-label">AI Vision:</p>
          <canvas class="preview-canvas"></canvas>
        </div>
        <div class="confidence-score">Confidence: <span class="score"></span></div>
        <div class="char-confidence"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(predictionPopup);
  
  // Add event listeners
  predictionPopup.querySelector('.captcha-ai-close').addEventListener('click', () => {
    predictionPopup.classList.remove('active');
  });

  predictionPopup.querySelector('.captcha-ai-fill').addEventListener('click', () => {
    const predictedText = predictionPopup.querySelector('.prediction-text .text').textContent;
    const inputField = document.querySelector('input[type="text"][placeholder="Enter CAPTCHA text"]');
    if (inputField && predictedText) {
      inputField.value = predictedText;
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
      predictionPopup.classList.remove('active'); // Hide popup after filling
    }
  });

  predictionPopup.querySelector('.captcha-ai-expand').addEventListener('click', (e) => {
    const expandedView = predictionPopup.querySelector('.captcha-ai-expanded-view');
    const isHidden = expandedView.classList.contains('hidden');
    expandedView.classList.toggle('hidden');
    e.target.textContent = isHidden ? 'Hide' : 'Details';
  });
}

// Position the popup near the input field
function positionPopup(inputField) {
  if (!predictionPopup || !inputField) return;
  
  const rect = inputField.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Calculate available space below the input
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - (rect.bottom + 10);
  
  // Position popup
  predictionPopup.style.top = `${rect.bottom + scrollTop + 10}px`;
  predictionPopup.style.left = `${rect.left + scrollLeft}px`;
  
  // Set max-height based on available space
  const expandedView = predictionPopup.querySelector('.captcha-ai-expanded-view');
  if (expandedView) {
    expandedView.style.maxHeight = `${Math.max(100, spaceBelow - 40)}px`;
  }
}

// Rest of your functions remain the same (updatePrediction, preprocessAndSendImage, handleInputFocus)

// Update the popup with prediction results
function updatePrediction(prediction) {
  console.log('Updating prediction:', prediction);
  if (!predictionPopup) return;
  
  const text = prediction.prediction || '';
  const confidence = prediction.confidence || 0;
  const confidencePerChar = prediction.confidencePerChar || [];
  
  predictionPopup.querySelector('.prediction-text .text').textContent = text;
  predictionPopup.querySelector('.confidence-score .score').textContent = 
    `${(confidence * 100).toFixed(1)}%`;
  
  // Update character-wise confidence if available
  const charConfidenceDiv = predictionPopup.querySelector('.char-confidence');
  if (confidencePerChar && confidencePerChar.length > 0) {
    charConfidenceDiv.innerHTML = confidencePerChar.map((conf, idx) => `
      <div class="char-conf-item">
        <span class="char">${text[idx]}</span>
        <div class="conf-bar">
          <div class="conf-fill" style="width: ${conf * 100}%"></div>
        </div>
        <span class="conf-value">${(conf * 100).toFixed(1)}%</span>
      </div>
    `).join('');
  }
}

// Process image and prepare it for the model
async function preprocessAndSendImage(img) {
  // Create a canvas to process the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size to match the model's expected input
  canvas.width = 240;  // From Config.IMAGE_SIZE
  canvas.height = 120;
  
  // Draw and convert to grayscale
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = data[i + 1] = data[i + 2] = avg;
  }
  ctx.putImageData(imageData, 0, 0);
  
  // Show preview in popup
  const previewCanvas = predictionPopup.querySelector('.preview-canvas');
  previewCanvas.width = canvas.width;
  previewCanvas.height = canvas.height;
  previewCanvas.getContext('2d').drawImage(canvas, 0, 0);
  
  // Convert canvas to blob
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  
  // Create FormData and append the image
  const formData = new FormData();
  formData.append('image', blob, 'captcha.jpg');
  
  // Send to prediction endpoint
  const response = await fetch('http://localhost:5000/api/captcha/predict', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
}

// Handle input field focus
async function handleInputFocus(e) {
  if (!isEnabled) return; // Exit if extension is disabled
  
  console.log('Input focus event:', e.target);
  if (!e.target.matches('input[type="text"][placeholder="Enter CAPTCHA text"]')) {
    console.log('Not a CAPTCHA input field');
    return;
  }
  
  console.log('CAPTCHA input field detected');
  
  // Create popup if it doesn't exist
  createPredictionPopup();
  
  // Find the CAPTCHA image
  const captchaImg = document.querySelector('img[alt="CAPTCHA"]');
  if (!captchaImg) {
    console.log('No CAPTCHA image found');
    return;
  }
  
  console.log('Found CAPTCHA image:', captchaImg.src);
  
  // Position and show popup
  positionPopup(e.target);
  predictionPopup.classList.add('active');
  
  try {
    // Create a new image to ensure it's loaded
    const img = new Image();
    img.crossOrigin = 'anonymous';  // Enable CORS
    img.src = captchaImg.src;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    // Process image and get prediction
    const data = await preprocessAndSendImage(img);
    
    if (data.success) {
      updatePrediction({
        prediction: data.prediction,
        confidence: data.confidence,
        confidencePerChar: data.confidencePerChar
      });
    }
  } catch (error) {
    console.error('Error getting CAPTCHA prediction:', error);
  }
}

// Initialize event listeners
document.addEventListener('focusin', handleInputFocus);

// Handle window resize
window.addEventListener('resize', () => {
  if (!isEnabled) return; // Exit if extension is disabled
  
  const inputField = document.querySelector('input[type="text"][placeholder="Enter CAPTCHA text"]');
  if (inputField && predictionPopup?.classList.contains('active')) {
    positionPopup(inputField);
  }
});
