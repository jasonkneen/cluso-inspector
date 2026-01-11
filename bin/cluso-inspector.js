#!/usr/bin/env node

/**
 * cluso-inspector CLI
 *
 * Usage:
 *   cluso-inspector <url> [language]
 *
 * Examples:
 *   cluso-inspector https://github.com
 *   cluso-inspector https://github.com typescript
 *   npx cluso-inspector https://example.com javascript
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
cluso-inspector - Visual element selector for web components

Usage:
  cluso-inspector <url> [language]

Arguments:
  url       - The URL to open and extract from (required)
  language  - Target language: typescript or javascript (default: typescript)

Examples:
  cluso-inspector https://github.com
  cluso-inspector https://github.com typescript
  npx cluso-inspector https://example.com javascript

Output:
  Outputs JSON to stdout with: { screenshot, html, selector, dimensions, ... }
  `);
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
}

const url = args[0];
const language = args[1] || 'typescript';

// Validate URL
try {
  new URL(url);
} catch (error) {
  console.error('Error: Invalid URL:', url);
  process.exit(1);
}

// Validate language
if (!['typescript', 'javascript'].includes(language)) {
  console.error('Error: Language must be "typescript" or "javascript"');
  process.exit(1);
}

// Create temp file for output (Electron will write here, we'll read and output to stdout)
const tmpFile = `/tmp/cluso-inspector-${process.pid}.json`;

// Path to Electron app
const electronPath = require('electron');
const mainPath = path.join(__dirname, '..', 'main.js');

// Launch Electron
const electron = spawn(electronPath, [mainPath, url, tmpFile, language], {
  stdio: ['inherit', 'pipe', 'pipe']
});

// Capture electron stdout/stderr (for debugging)
electron.stdout.on('data', (data) => {
  // Log to stderr so it doesn't interfere with JSON output
  process.stderr.write(`[cluso-inspector] ${data}`);
});

electron.stderr.on('data', (data) => {
  process.stderr.write(`[cluso-inspector] ${data}`);
});

// When Electron exits
electron.on('close', (code) => {
  if (code === 0) {
    // Read the temp file and output to stdout
    if (fs.existsSync(tmpFile)) {
      const data = fs.readFileSync(tmpFile, 'utf8');
      console.log(data); // Output JSON to stdout

      // Clean up temp file
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      process.exit(0);
    } else {
      console.error('Error: Extraction data not found');
      process.exit(1);
    }
  } else if (code === 1) {
    // User cancelled
    console.error('Extraction cancelled');
    process.exit(1);
  } else {
    console.error('Error: Electron process failed with code', code);
    process.exit(code || 1);
  }
});

// Handle signals
process.on('SIGINT', () => {
  electron.kill('SIGINT');
  process.exit(1);
});

process.on('SIGTERM', () => {
  electron.kill('SIGTERM');
  process.exit(1);
});
