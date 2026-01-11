const { contextBridge, ipcRenderer } = require('electron');

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld('clonereact', {
  // Send extraction data back to main process
  sendExtraction: (data) => ipcRenderer.invoke('extraction-complete', data),

  // Cancel extraction
  cancel: () => ipcRenderer.invoke('extraction-cancelled'),

  // Request screenshot of element via main process
  captureElement: (selector, bounds) => ipcRenderer.invoke('capture-element', selector, bounds),

  // Preview phase actions
  exportFiles: () => ipcRenderer.invoke('export-files'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  startOver: () => ipcRenderer.invoke('start-over'),
  close: () => ipcRenderer.invoke('close-app'),

  // Listen for generation complete event from main
  onGenerationComplete: (callback) => {
    ipcRenderer.on('generation-complete', (event, data) => callback(data));
  },

  // Get initial config
  getConfig: () => ({
    version: '1.0.0',
    maxDepth: 5,
  }),
});
