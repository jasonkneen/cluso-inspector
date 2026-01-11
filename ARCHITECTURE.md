# cluso-inspector Architecture

## Overview

`cluso-inspector` is a standalone Electron-based visual selector tool that extracts HTML and screenshots from any website.

## Design Principles

1. **Single Responsibility**: Only handles element selection and extraction
2. **Tool, Not Framework**: Other tools consume its JSON output
3. **Zero Dependencies**: Works standalone via npx
4. **Stdout Output**: JSON goes to stdout for easy piping

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User runs command:                        │
│         npx cluso-inspector https://github.com               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │  bin/cluso-          │  CLI wrapper
         │  inspector.js        │  - Parses args
         │                      │  - Spawns Electron
         │  (Node.js process)   │  - Reads temp file
         └──────────┬───────────┘  - Outputs to stdout
                    │
                    │ spawn('electron', [main.js, url, tmpFile, lang])
                    │
                    ▼
         ┌──────────────────────┐
         │  main.js             │  Electron main process
         │                      │  - Creates BrowserWindow
         │  (Electron main)     │  - Injects inspector.js
         └──────────┬───────────┘  - Handles IPC
                    │
                    │ loadURL(targetURL)
                    │
                    ▼
         ┌──────────────────────┐
         │  Target Website      │  Renderer process
         │                      │  - Displays website
         │  (Browser context)   │  - Runs injected inspector
         └──────────┬───────────┘
                    │
                    │ executeJavaScript(inspector.js)
                    │
                    ▼
         ┌──────────────────────┐
         │  cluso-inspector.js  │  Injected inspector UI
         │                      │  - Visual overlay (hover/select)
         │  (Injected script)   │  - DOM tree extraction
         └──────────┬───────────┘  - Toolbar with buttons
                    │
                    │ User clicks "Select"
                    │
                    ▼
         ┌──────────────────────┐
         │  Screenshot capture  │  IPC to main process
         │                      │  - capturePage()
         │  (Main process)      │  - Returns base64 PNG
         └──────────┬───────────┘
                    │
                    │ IPC: extraction-complete
                    │
                    ▼
         ┌──────────────────────┐
         │  Write temp file     │  JSON with all data
         │                      │  - HTML
         │  (Main process)      │  - Screenshot (base64)
         └──────────┬───────────┘  - Selector, dimensions
                    │
                    │ app.quit()
                    │
                    ▼
         ┌──────────────────────┐
         │  CLI reads temp file │  Back to Node.js
         │                      │
         │  (bin script)        │  - Read JSON
         └──────────┬───────────┘  - Output to stdout
                    │
                    ▼
                 stdout
             (JSON output)
```

## Key Components

### 1. CLI Wrapper (`bin/cluso-inspector.js`)
- **Purpose**: Command-line interface
- **Responsibilities**:
  - Parse URL and language arguments
  - Validate inputs
  - Spawn Electron process
  - Manage temp file I/O
  - Output JSON to stdout

### 2. Main Process (`main.js`)
- **Purpose**: Electron main process
- **Responsibilities**:
  - Create BrowserWindow
  - Load target URL
  - Inject inspector script
  - Handle IPC messages
  - Capture screenshots
  - Write extraction data to temp file

### 3. Inspector Script (`cluso-inspector.js`)
- **Purpose**: Visual selection UI (injected into target page)
- **Responsibilities**:
  - Create visual overlays (hover=blue, selected=purple)
  - Create toolbar with Select/Clear/Cancel buttons
  - Extract DOM tree structure
  - Compute element styles
  - Trigger screenshot via IPC
  - Send extraction data to main process

### 4. Preload Script (`preload.js`)
- **Purpose**: Bridge between renderer and main (contextBridge)
- **Responsibilities**:
  - Expose safe IPC methods to renderer
  - `window.clonereact.sendExtraction()`
  - `window.clonereact.cancel()`
  - `window.clonereact.captureElement()`

## Data Flow

### Selection Flow
1. User hovers → Inspector positions blue overlay
2. User clicks → Inspector positions purple overlay
3. User clicks "Select" → Inspector extracts DOM tree
4. Inspector requests screenshot via IPC
5. Main process captures page → Returns base64 PNG
6. Inspector sends complete data via IPC
7. Main process writes JSON to temp file
8. Main process exits
9. CLI reads temp file → Outputs to stdout

### Cancellation Flow
1. User clicks "Cancel" or presses ESC
2. Inspector sends cancel IPC
3. Main process exits with code 1
4. CLI outputs error to stderr

## Output Format

```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2026-01-11T10:00:00.000Z",
  "language": "typescript",
  "extractions": [
    {
      "selector": "div.hero",
      "isReact": false,
      "component": {
        "type": "element",
        "tagName": "div",
        "props": { "className": "hero" },
        "children": [...]
      },
      "html": "<div class=\"hero\">...</div>",
      "screenshot": "data:image/png;base64,...",
      "dimensions": { "width": 1200, "height": 600, "top": 100, "left": 120 },
      "meta": { "tagName": "div", "id": "hero", "classes": ["hero"] }
    }
  ]
}
```

## Integration with Other Tools

### clonereact Skill
The `clonereact` skill can use `cluso-inspector` as an input source:

```bash
# Option 1: User selects element visually
clonereact --select https://github.com

# Option 2: User provides files
clonereact --files screenshot.png component.html

# Internally:
# --select runs: npx cluso-inspector <url> | clonereact-process
```

### Custom Scripts
Any tool can consume cluso-inspector output:

```javascript
const { execSync } = require('child_process');
const extraction = JSON.parse(
  execSync('npx cluso-inspector https://github.com').toString()
);
// Use extraction.extractions[0].screenshot, .html, etc.
```

## Security Model

### Electron Security
- `contextIsolation: true` - Renderer isolated from Node.js
- `nodeIntegration: false` - No Node.js in renderer
- `webSecurity: true` - Standard web security policies
- Preload script exposes minimal IPC surface

### Inspector Script
- Injected into target page context
- No access to Node.js or filesystem
- Only communicates via `window.clonereact` (from preload)
- Marked with `data-clonereact-ui` to avoid self-selection

## Performance Considerations

### Screenshot Size
- Full-page screenshots can be 1-5MB base64
- Consider limiting max dimensions
- Option to skip screenshot for large pages

### DOM Tree Depth
- Limited to 5 levels deep (`maxDepth = 5`)
- Prevents infinite recursion
- Skips script/style tags

### Memory
- Temp files cleaned up after output
- Electron process exits immediately after extraction

## Error Handling

### User Cancellation
- Exit code 1
- stderr: "Extraction cancelled"

### Invalid URL
- Exit code 1
- stderr: "Error: Invalid URL"

### Electron Failure
- Exit code N (electron exit code)
- stderr: "Error: Electron process failed"

## Future Enhancements

- [ ] Multi-select (select multiple elements)
- [ ] React Fiber extraction (detect React components)
- [ ] Configurable screenshot dimensions
- [ ] Save to file option (in addition to stdout)
- [ ] Browser viewport size customization
- [ ] Wait for network idle before injection
