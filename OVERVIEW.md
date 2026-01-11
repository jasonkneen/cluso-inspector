# cluso-inspector - Complete Overview

## What Is This?

`cluso-inspector` is a standalone Electron-based visual selector that lets you point-and-click to extract HTML and screenshots from any website. It outputs JSON to stdout, making it pipe-friendly and reusable by any tool.

## The Transformation

### Before (Monolithic)
The original `electron-app` was tightly coupled to the `clonereact` skill:
- Hardcoded CloneReact branding
- "Extract Component" button
- Only worked within the skill workflow
- Not reusable by other tools

### After (Standalone Tool)
Now `cluso-inspector` is a standalone npm package:
- Generic tool for element selection
- "Select" button (cleaner, universal)
- Outputs to stdout (pipe-friendly)
- Can be used by ANY tool via npx
- Published to npm, no installation required

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  User runs: npx cluso-inspector https://github.com  │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ bin/cluso-          │  ← CLI wrapper
        │ inspector.js        │    Parses args, spawns Electron
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ main.js             │  ← Electron main
        │                     │    Creates window, injects script
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Target Website      │  ← Browser loads URL
        │ (github.com)        │    Displays page
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ cluso-inspector.js  │  ← Injected UI
        │                     │    Overlay, toolbar, selection
        └─────────┬───────────┘
                  │
                  │ User clicks "Select"
                  │
                  ▼
        ┌─────────────────────┐
        │ Screenshot via IPC  │  ← Main process captures page
        │                     │    Returns base64 PNG
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Write JSON to       │  ← Temp file with all data
        │ temp file           │
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ CLI reads file,     │  ← Back to Node.js
        │ outputs to stdout   │    Clean JSON output
        └─────────────────────┘
```

## Key Files

### Core Application
- **`bin/cluso-inspector.js`** - Executable CLI wrapper, handles args and stdout
- **`main.js`** - Electron main process, creates window and handles IPC
- **`cluso-inspector.js`** - Injected UI with visual overlay and toolbar
- **`preload.js`** - Security bridge between renderer and main (contextBridge)
- **`package.json`** - npm package config with bin entry

### Documentation
- **`README.md`** - User-facing usage guide
- **`ARCHITECTURE.md`** - Technical deep-dive for developers
- **`PUBLISHING.md`** - Step-by-step npm publishing guide
- **`OVERVIEW.md`** (this file) - Complete picture
- **`.npmignore`** - Keeps npm package clean

### Deprecated (Not Published)
- `multi-stage-ui.html` - Old multi-phase UI (too complex)
- `preview-complete.js` - Old preview system (moved to Claude)
- `selector-ui.html` - Old HTML-based UI (replaced by injected JS)
- `extractor.js` - Old extraction logic (merged into cluso-inspector.js)
- `*.ts` files - TypeScript drafts (not in final version)

## Usage

### Basic
```bash
npx cluso-inspector https://github.com
```

### With Language
```bash
npx cluso-inspector https://github.com typescript
npx cluso-inspector https://example.com javascript
```

### Piping
```bash
# Save to file
npx cluso-inspector https://github.com > extraction.json

# Extract specific field
npx cluso-inspector https://github.com | jq -r '.extractions[0].selector'

# Use in scripts
SELECTOR=$(npx cluso-inspector https://github.com | jq -r '.extractions[0].selector')
echo "Selected: $SELECTOR"
```

### Help
```bash
npx cluso-inspector --help
```

## Output Format

```json
{
  "success": true,
  "url": "https://github.com",
  "timestamp": "2026-01-11T10:00:00.000Z",
  "language": "typescript",
  "extractions": [
    {
      "selector": "div.logged-out > div.application-main > main",
      "isReact": false,
      "reactVersion": null,
      "component": {
        "type": "element",
        "tagName": "div",
        "props": { "className": "hero" },
        "children": [
          { "type": "text", "value": "The future of building..." }
        ]
      },
      "html": "<div class=\"hero\">...</div>",
      "screenshot": "data:image/png;base64,iVBORw0KGg...",
      "dimensions": {
        "width": 1440,
        "height": 600,
        "top": 100,
        "left": 0
      },
      "meta": {
        "tagName": "div",
        "id": "hero-section",
        "classes": ["hero", "container"]
      },
      "styles": {
        "display": "flex",
        "background": "linear-gradient(...)",
        "padding": "60px 24px"
      }
    }
  ]
}
```

## Visual UI

### Selection States
- **Hover**: Blue dashed outline (2px, #3b82f6)
- **Selected**: Purple solid outline (3px, #8b5cf6)

### Toolbar
Fixed at top center:
- **Info**: Shows selected element (e.g., "div.hero")
- **Clear**: Clears current selection
- **Select**: Extracts and returns JSON
- **Cancel**: Closes app without extracting

### Keyboard
- **Click**: Select element
- **ESC**: Cancel and close

## Integration with clonereact

The `clonereact` skill uses cluso-inspector as its selection mechanism:

```bash
# User runs skill
/clonereact https://github.com

# Skill internally runs
npx cluso-inspector https://github.com typescript > /tmp/extraction.json

# Skill reads JSON
node generate-component.js /tmp/extraction.json

# Creates:
# - ComponentName.tsx (React component)
# - ComponentName-screenshot.png (visual reference)
# - demo.html (live preview)
```

See `../INTEGRATION.md` for complete integration details.

## Use Cases

### 1. Component Extraction (clonereact)
Extract and recreate React components from live sites.

### 2. Design Replication
Capture visual elements with pixel-perfect screenshots for design work.

### 3. Automated Testing
Extract DOM structure for test validation and snapshot testing.

### 4. Documentation
Capture UI elements with code + screenshot for technical documentation.

### 5. Custom Pipelines
Pipe output to any tool that needs HTML + screenshot data.

## Technical Details

### Security Model
- **Context Isolation**: Renderer isolated from Node.js
- **No Node Integration**: Renderer has no filesystem access
- **Preload Bridge**: Minimal IPC surface via contextBridge
- **Web Security**: Standard browser security policies

### Performance
- **Screenshot Size**: 1-5MB base64 PNG (full page)
- **DOM Tree Depth**: Limited to 5 levels (prevents infinite recursion)
- **Temp Files**: Cleaned up after output
- **Memory**: Electron exits immediately after extraction

### Error Handling
- **Exit Code 0**: Success
- **Exit Code 1**: User cancelled or error
- **Stderr**: Error messages (doesn't pollute JSON stdout)
- **Stdout**: Clean JSON only (or help text)

## Publishing to npm

### Quick Publish
```bash
cd ~/.claude/skills/clonereact/electron-app

# First time: create npm account
npm adduser

# Publish
npm publish
```

### After Publishing
Users can run without installation:
```bash
npx cluso-inspector https://example.com
```

See `PUBLISHING.md` for detailed steps.

## Development

### Local Testing
```bash
cd ~/.claude/skills/clonereact/electron-app
node bin/cluso-inspector.js https://example.com > test.json
cat test.json | jq .
```

### With npm link
```bash
npm link
cluso-inspector https://example.com
npm unlink -g cluso-inspector
```

### Debugging
```bash
# Enable Electron DevTools
# Uncomment in main.js:
mainWindow.webContents.openDevTools();
```

## Roadmap

### v1.0 (Current)
- [x] Visual selection with hover/select
- [x] Screenshot capture via Electron
- [x] DOM tree extraction (5 levels deep)
- [x] Computed styles extraction
- [x] JSON stdout output
- [x] CLI with args validation
- [x] Cancel button
- [x] npm package structure

### v1.1 (Future)
- [ ] Multi-select (select multiple elements)
- [ ] React Fiber detection (extract React props/state)
- [ ] Configurable screenshot dimensions
- [ ] Save to file option (in addition to stdout)
- [ ] Wait for network idle before injection
- [ ] Custom viewport sizes

### v2.0 (Future)
- [ ] Browser choice (Chromium/Firefox/WebKit)
- [ ] Authentication support (login flows)
- [ ] Shadow DOM extraction
- [ ] iframe support
- [ ] Animation capture

## Comparison to Alternatives

### vs Browser DevTools Inspect
- **cluso-inspector**: Automated, JSON output, screenshot included
- **DevTools**: Manual, no structured export, no screenshot

### vs Playwright/Puppeteer
- **cluso-inspector**: Visual UI, point-and-click, screenshot bundled
- **Playwright**: Code-based, requires selectors upfront, more powerful but harder

### vs html2canvas
- **cluso-inspector**: Full Electron screenshot + DOM tree
- **html2canvas**: Canvas-based, no DOM structure, client-side only

## Credits

Adapted from `ai-cluso` shared-inspector package. Visual overlay system inspired by browser DevTools.

## License

MIT

## Support

- Issues: GitHub Issues (after publishing)
- Docs: This directory
- Examples: See `README.md` and `INTEGRATION.md`
