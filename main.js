const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    titleBarStyle: 'hiddenInset', // Hide title bar, keep traffic lights
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    backgroundColor: '#1a1a1a',
    show: false,
    title: 'Cluso Inspector'
  });

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    mainWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        injectInspector();
      }, 1000);
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function injectInspector() {
  if (!mainWindow) return;

  const inspectorScript = fs.readFileSync(
    path.join(__dirname, 'cluso-inspector.js'),
    'utf8'
  );

  // Load cluso icon as base64 data URL
  const iconPath = path.join(__dirname, 'assets', 'cluso-icon.png');
  let iconDataUrl = '';
  try {
    const iconBuffer = fs.readFileSync(iconPath);
    iconDataUrl = `data:image/png;base64,${iconBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('[CloneReact] Could not load cluso icon:', error.message);
  }

  mainWindow.webContents.executeJavaScript(inspectorScript)
    .then(() => {
      return mainWindow.webContents.executeJavaScript(`
        window.__CLONEREACT_ICON_URL__ = ${JSON.stringify(iconDataUrl)};
        window.__CLONEREACT_INSPECTOR__.init();
      `);
    })
    .then(() => {
      console.log('[CloneReact] Inspector ready');
    })
    .catch((error) => {
      console.error('[CloneReact] Injection failed:', error);
    });
}

// IPC: Screenshot capture
ipcMain.handle('capture-element', async (event, selector, bounds) => {
  if (!mainWindow) return null;

  try {
    // Capture only the element's bounding rectangle
    const rect = bounds ? {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    } : undefined;

    const image = await mainWindow.webContents.capturePage(rect);
    const base64 = image.toPNG().toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log('[CloneReact] Screenshot captured:', bounds ? `${bounds.width}x${bounds.height}` : 'full page', dataUrl.length, 'chars');
    return dataUrl;
  } catch (error) {
    console.error('[CloneReact] Screenshot failed:', error);
    return null;
  }
});

// IPC: Extraction complete
ipcMain.handle('extraction-complete', async (event, data) => {
  const outputPath = process.argv[3] || '/tmp/clonereact-output-' + process.pid + '.json';
  const language = process.argv[4] || 'typescript';

  // Save screenshot as separate file
  let screenshotPath = null;
  if (data.extractions && data.extractions[0] && data.extractions[0].screenshot) {
    const base64Data = data.extractions[0].screenshot.replace(/^data:image\/png;base64,/, '');
    screenshotPath = outputPath.replace('.json', '-screenshot.png');
    try {
      fs.writeFileSync(screenshotPath, Buffer.from(base64Data, 'base64'));
      console.log('[CloneReact] Screenshot saved:', screenshotPath);
      // Replace base64 with path in output
      data.extractions[0].screenshotPath = screenshotPath;
      delete data.extractions[0].screenshot;
    } catch (error) {
      console.error('[CloneReact] Failed to save screenshot:', error);
    }
  }

  // Add language to output
  const outputData = {
    ...data,
    language
  };

  try {
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log('[CloneReact] Extraction saved:', outputPath);
  } catch (error) {
    console.error('[CloneReact] Failed to save:', error);
  }

  // Close and exit
  setTimeout(() => {
    if (mainWindow) mainWindow.close();
    app.quit();
  }, 500);

  return { success: true };
});

// IPC: Cancel
ipcMain.handle('extraction-cancelled', async () => {
  if (mainWindow) mainWindow.close();
  app.quit();
  process.exit(1);
});

// App lifecycle
app.whenReady().then(() => {
  const targetURL = process.argv[2];

  if (!targetURL) {
    console.error('Usage: electron main.js <url> <output-json-path>');
    app.quit();
    process.exit(1);
    return;
  }

  createWindow(targetURL);
});

app.on('window-all-closed', () => {
  app.quit();
});

process.on('uncaughtException', (error) => {
  console.error('[CloneReact] Error:', error);
  process.exit(1);
});
