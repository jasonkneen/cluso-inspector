# Development Guide

## Local Development

### Setup

```bash
cd ~/.claude/skills/clonereact/electron-app

# Install dependencies
npm install
```

### Running Locally

#### Option 1: npm run dev (Recommended)
```bash
npm run dev https://github.com

# With language
npm run dev https://github.com typescript

# Pipe to file
npm run dev https://example.com > test.json
```

This uses the CLI wrapper (`bin/cluso-inspector.js`) exactly as it would run via npx.

#### Option 2: Direct Electron
```bash
npm start
# Opens electron app without URL (for testing UI only)
```

#### Option 3: node bin script
```bash
node bin/cluso-inspector.js https://github.com
```

### Testing Changes

#### Test CLI Wrapper
```bash
# Test argument parsing
npm run dev --help
npm run dev https://invalid-url  # Should error

# Test output format
npm run dev https://example.com | jq .
```

#### Test Electron App
```bash
# Make changes to main.js or cluso-inspector.js
npm run dev https://github.com

# Check stdout JSON
npm run dev https://github.com > output.json
cat output.json | jq '.extractions[0].selector'
```

#### Test npm link
Before publishing, test as if it were installed globally:

```bash
# Create global symlink
npm link

# Run from anywhere
cd ~
cluso-inspector https://github.com

# Remove symlink
npm unlink -g cluso-inspector
```

### Development Workflow

1. **Make changes** to source files
2. **Test locally** with `npm run dev`
3. **Verify output** JSON structure
4. **Test with npm link** to simulate global install
5. **Commit changes**
6. **Bump version** with `npm version patch`
7. **Publish** with `npm publish`

### Debugging

#### Enable DevTools
Uncomment in `main.js`:

```javascript
mainWindow.webContents.openDevTools();
```

Then run:
```bash
npm run dev https://github.com
```

This opens Chrome DevTools for the renderer process.

#### Console Logging
Add debug logs:

```javascript
// In cluso-inspector.js (renderer)
console.log('[Inspector]', data);

// In main.js (main process)
console.log('[Main]', data);
```

Logs appear in terminal (main) or DevTools (renderer).

#### stderr vs stdout
- **stdout**: JSON output only (don't pollute with logs)
- **stderr**: Debug logs, errors, status messages

```javascript
// Good: debug to stderr
process.stderr.write('[cluso-inspector] Debug info\n');

// Bad: debug to stdout (breaks JSON)
console.log('[cluso-inspector] Debug info');
```

### File Structure

```
electron-app/
├── bin/
│   └── cluso-inspector.js    # CLI wrapper (executable)
├── main.js                    # Electron main process
├── cluso-inspector.js         # Injected UI/inspector
├── preload.js                 # IPC bridge (contextBridge)
├── package.json               # npm config
├── node_modules/              # Dependencies
├── README.md                  # User docs
├── ARCHITECTURE.md            # Technical docs
├── PUBLISHING.md              # Publishing guide
├── DEVELOPMENT.md             # This file
└── OVERVIEW.md                # Complete overview
```

### Making Changes

#### Change Button Text
Edit `cluso-inspector.js`:
```javascript
toolbar.innerHTML = `
  <button id="btn-extract" class="primary">Your Text Here</button>
`;
```

#### Change Window Size
Edit `main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1920,  // Default: 1440
  height: 1080, // Default: 900
  // ...
});
```

#### Change Overlay Colors
Edit `cluso-inspector.js`:
```javascript
const INSPECTOR_STYLES = `
#cluso-hover-overlay {
  border: 2px dashed #ff0000;  // Change color
}
`;
```

#### Add New CLI Argument
Edit `bin/cluso-inspector.js`:
```javascript
const args = process.argv.slice(2);
const url = args[0];
const language = args[1] || 'typescript';
const newArg = args[2] || 'default'; // Add new arg

// Pass to Electron
const electron = spawn(electronPath, [mainPath, url, tmpFile, language, newArg]);
```

Then update `main.js` to read it:
```javascript
const newArg = process.argv[5] || 'default';
```

### Testing Edge Cases

#### Invalid URLs
```bash
npm run dev not-a-url
# Should error: "Error: Invalid URL"
```

#### Cancellation
```bash
npm run dev https://example.com
# Click "Cancel" button
# Should exit with code 1
```

#### Large Screenshots
```bash
npm run dev https://github.com
# Select large element (whole page)
# Check output.json size
```

#### Deep DOM Trees
```bash
npm run dev https://github.com
# Select element with many nested children
# Verify depth limit works (max 5 levels)
```

### Common Issues

#### "electron: command not found"
```bash
npm install
# Installs electron locally
```

#### "Permission denied" on bin script
```bash
chmod +x bin/cluso-inspector.js
```

#### JSON output broken
Check for console.log() calls that pollute stdout:
```bash
# Find all console.log in CLI wrapper
grep -n "console.log" bin/cluso-inspector.js

# Should only output JSON to stdout
# Use process.stderr.write() for debug logs
```

#### Screenshot not captured
Check IPC flow:
1. `cluso-inspector.js` calls `window.clonereact.captureElement()`
2. `preload.js` exposes this via contextBridge
3. `main.js` handles IPC and calls `capturePage()`
4. Returns base64 PNG back to renderer

Add logs at each step:
```javascript
// cluso-inspector.js
console.log('[Renderer] Requesting screenshot...');

// main.js
console.log('[Main] Capturing screenshot...');
console.log('[Main] Screenshot captured:', base64.length);
```

### Performance Testing

#### Screenshot Size
```bash
npm run dev https://github.com > out.json
cat out.json | jq '.extractions[0].screenshot' | wc -c
# Should be ~1-5MB base64
```

#### Memory Usage
```bash
# Monitor Electron memory
npm run dev https://github.com &
PID=$!
while kill -0 $PID 2>/dev/null; do
  ps -o rss= -p $PID
  sleep 1
done
```

#### Startup Time
```bash
time npm run dev https://example.com > /dev/null
# Should complete in 3-5 seconds
```

### Release Checklist

Before publishing a new version:

- [ ] Run `npm run dev` with multiple URLs
- [ ] Test cancellation flow
- [ ] Test invalid inputs
- [ ] Test JSON output with `jq`
- [ ] Test with `npm link`
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Commit all changes
- [ ] Run `npm publish`
- [ ] Test with `npx cluso-inspector`
- [ ] Tag release: `git tag v1.0.1`

### VS Code Setup

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug cluso-inspector",
      "program": "${workspaceFolder}/bin/cluso-inspector.js",
      "args": ["https://example.com"],
      "console": "integratedTerminal"
    }
  ]
}
```

Press F5 to debug.

### Git Workflow

```bash
# Make changes
vim main.js

# Test locally
npm run dev https://github.com

# Commit
git add main.js
git commit -m "feat: improve screenshot quality"

# Bump version
npm version patch
# Creates commit + tag automatically

# Push
git push origin main --tags

# Publish
npm publish
```

### Environment Variables

Set for debugging:

```bash
# Verbose Electron output
export ELECTRON_ENABLE_LOGGING=1
npm run dev https://github.com

# Disable sandbox (only for debugging)
export ELECTRON_NO_SANDBOX=1
npm run dev https://github.com
```

### Useful Commands

```bash
# Check package size before publish
npm pack --dry-run

# List files that will be published
npm pack --dry-run | grep -v "^npm notice"

# Validate package.json
npm run validate

# Check for outdated deps
npm outdated

# Update dependencies
npm update
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev <url>` | Test locally with URL |
| `npm start` | Run Electron directly |
| `npm link` | Test as global install |
| `npm unlink -g cluso-inspector` | Remove global link |
| `npm version patch` | Bump version (1.0.0 → 1.0.1) |
| `npm publish` | Publish to npm |
| `npm pack` | Create tarball without publishing |
