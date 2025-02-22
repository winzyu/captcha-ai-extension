# CAPTCHA AI Chrome Extension

A Chrome extension that provides real-time CAPTCHA predictions and assistance using an AI model.

## Features

- Real-time CAPTCHA detection
- AI-powered text prediction
- Auto-fill capability
- Detailed confidence scores
- Toggle extension on/off
- Visual previews of AI processing

## Project Structure

```
extension/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/
│   ├── content.js
│   └── content.css
└── background/
    └── background.js
```

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/captcha-ai-extension.git
cd captcha-ai-extension
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Components

### Manifest (manifest.json)

Key configurations:
```json
{
  "manifest_version": 3,
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["http://localhost:*/*"],
  "content_scripts": [...],
  "background": {
    "service_worker": "background/background.js",
    "type": "module"
  }
}
```

### Popup Interface

User interface for extension control:
- Enable/disable toggle
- Status indication
- Styled with custom CSS

### Content Script

Handles page interaction:
- CAPTCHA detection
- Image preprocessing
- Prediction display
- Auto-fill functionality

### Background Script

Manages extension state:
- Handles installation
- Maintains settings
- Manages message passing

## Features Implementation

### CAPTCHA Detection

The content script identifies CAPTCHA inputs using:
```javascript
document.querySelector('input[type="text"][placeholder="Enter CAPTCHA text"]')
```

### Image Processing

Preprocesses CAPTCHA images for the AI model:
```javascript
async function preprocessAndSendImage(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Image processing steps...
}
```

### Prediction Display

Custom UI for showing predictions:
- Floating popup
- Character-wise confidence
- Visual preprocessing preview

### Auto-fill Capability

Automatically fills CAPTCHA inputs:
```javascript
function fillCaptchaInput(text) {
  const input = document.querySelector('input[type="text"][placeholder="Enter CAPTCHA text"]');
  if (input) {
    input.value = text;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
```

## Styling

### Popup Styling

Clean, modern interface with:
- Toggle switch
- Status indicators
- Consistent typography

### Content Styling

Floating prediction window with:
- Responsive positioning
- Character confidence bars
- Expandable details view

## API Integration

Communicates with backend service:
```javascript
async function getPrediction(imageData) {
  const response = await fetch('http://localhost:5000/api/captcha/predict', {
    method: 'POST',
    body: imageData
  });
  return response.json();
}
```

## State Management

Uses Chrome Storage API:
```javascript
chrome.storage.sync.get(['enabled'], (result) => {
  // Handle enabled state
});
```

## Message Passing

Communication between components:
```javascript
chrome.runtime.sendMessage({ type: 'GET_ENABLED_STATE' }, (response) => {
  // Handle response
});
```

## Security Considerations

1. Host Permissions:
   - Limited to specific domains
   - Minimal required permissions

2. Content Security:
   - Safe image processing
   - Secure data handling

3. Input Validation:
   - Sanitized user input
   - Error handling

## Development

1. Local Testing:
   - Use Chrome's developer mode
   - Load unpacked extension
   - Enable debugging

2. Debugging Tips:
   - Use Chrome DevTools
   - Background page debugging
   - Content script console

## Browser Support

- Chrome/Chromium-based browsers
- Manifest V3 compatible
- ES6+ features

## Error Handling

Comprehensive error handling:
```javascript
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  // User feedback
}
```

## Performance

Optimizations:
- Efficient image processing
- Event delegation
- Resource cleanup
- Memory management

## Deployment

1. Package the extension:
   - Zip all files
   - Exclude development files
   - Include only necessary resources

2. Chrome Web Store:
   - Create developer account
   - Submit package
   - Provide store listing

## Best Practices

1. Code Organization:
   - Modular structure
   - Clear separation of concerns
   - Consistent naming

2. Performance:
   - Event throttling
   - Resource optimization
   - Clean up listeners

3. User Experience:
   - Clear feedback
   - Graceful failures
   - Intuitive interface

## License

MIT License - Feel free to use this code for your own projects.
