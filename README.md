# cluso-inspector

Visual element selector for extracting HTML and screenshots from any website.

<img width="1552" height="1012" alt="Screenshot 2026-01-11 at 15 33 21" src="https://github.com/user-attachments/assets/bc85c397-e9fb-4515-b3b7-d66728558686" />


## Installation

```bash
# Use directly with npx (no installation required)
npx cluso-inspector https://github.com

# Or install globally
npm install -g cluso-inspector
cluso-inspector https://github.com
```

## Usage

```bash
cluso-inspector <url> [language]
```

### Arguments

- **url** (required) - The URL to open and extract from
- **language** (optional) - Target language: `typescript` or `javascript` (default: `typescript`)

### Examples

```bash
# Extract from GitHub
npx cluso-inspector https://github.com

# Specify JavaScript output
npx cluso-inspector https://github.com javascript

# Extract from any site
npx cluso-inspector https://example.com typescript
```

## How It Works

1. **Launch**: Opens the URL in an Electron browser window
2. **Select**: Hover over elements (blue outline), click to select (purple outline)
3. **Extract**: Click "Select" button to capture HTML + screenshot
4. **Output**: Returns JSON to stdout with all extracted data

## Output Format

The tool outputs JSON to stdout:

```json
{
  "success": true,
  "url": "https://github.com",
  "timestamp": "2026-01-11T10:00:00.000Z",
  "language": "typescript",
  "extractions": [
    {
      "selector": "div.hero > div.container",
      "isReact": false,
      "component": { ... },
      "html": "<div class=\"hero\">...</div>",
      "screenshot": "data:image/png;base64,...",
      "dimensions": {
        "width": 1200,
        "height": 600,
        "top": 100,
        "left": 120
      },
      "meta": {
        "tagName": "div",
        "id": "hero-section",
        "classes": ["hero", "container"]
      }
    }
  ]
}
```

## Use Cases

- **Component extraction**: Extract React/HTML components from live sites
- **Design replication**: Capture visual elements with pixel-perfect screenshots
- **Automated testing**: Extract DOM structure for test validation
- **Documentation**: Capture UI elements with code + screenshot

## Piping to Files

```bash
# Save JSON to file
npx cluso-inspector https://github.com > extraction.json

# Extract screenshot separately
npx cluso-inspector https://github.com | jq -r '.extractions[0].screenshot' > screenshot.png
```

## Integration

Use with other tools via stdout:

```javascript
const { execSync } = require('child_process');
const data = JSON.parse(
  execSync('npx cluso-inspector https://github.com').toString()
);
console.log(data.extractions[0].selector);
```

## Keyboard Shortcuts

- **Click**: Select element
- **ESC**: Cancel and close
- **Clear**: Clear current selection

## Requirements

- Node.js 14+
- Electron 28+ (auto-installed)

## License

MIT
