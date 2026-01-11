/**
 * Complete preview phase implementation
 * Fixes HTML rendering and button handlers
 */

window.__CLONEREACT_PREVIEW__ = {
  data: null,

  show(previewData) {
    this.data = previewData;

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.id = 'clonereact-preview';
    previewContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #0a0a0a;
      z-index: 10000001;
      opacity: 0;
      transition: opacity 0.5s ease-out;
      display: grid;
      grid-template-rows: auto 1fr auto;
    `;

    // Header
    const header = this.createHeader();
    previewContainer.appendChild(header);

    // Content (two panels)
    const content = this.createContent();
    previewContainer.appendChild(content);

    // Footer
    const footer = this.createFooter();
    previewContainer.appendChild(footer);

    // Add to body
    document.body.appendChild(previewContainer);

    // Fade in
    setTimeout(() => {
      previewContainer.style.opacity = '1';
    }, 100);

    // Wire up button handlers
    this.wireUpButtons();

    // Insert rendered HTML
    this.insertRenderedHTML();
  },

  createHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px;
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

    header.innerHTML = `
      <div>
        <h1 style="font-size: 20px; font-weight: 600; font-family: -apple-system, sans-serif; color: white;">${this.data.componentName}</h1>
        <p style="font-size: 13px; color: rgba(255, 255, 255, 0.5); margin-top: 4px;">from ${this.data.sourceUrl}</p>
      </div>
      <div style="display: flex; gap: 12px;">
        <button id="btn-copy-code" style="
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          cursor: pointer;
          font-family: -apple-system, sans-serif;
          font-size: 14px;
        ">Copy Code</button>
        <button id="btn-open-folder" style="
          padding: 10px 20px;
          border-radius: 8px;
          background: rgb(34, 197, 94);
          border: none;
          color: white;
          cursor: pointer;
          font-family: -apple-system, sans-serif;
          font-size: 14px;
        ">Open Folder</button>
        <button id="btn-start-over" style="
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          cursor: pointer;
          font-family: -apple-system, sans-serif;
          font-size: 14px;
        ">Start Over</button>
        <button id="btn-done" style="
          padding: 10px 20px;
          border-radius: 8px;
          background: rgb(139, 92, 246);
          border: none;
          color: white;
          cursor: pointer;
          font-family: -apple-system, sans-serif;
          font-size: 14px;
        ">Done</button>
      </div>
    `;

    return header;
  },

  createContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 24px;
      overflow: hidden;
    `;

    // Left panel - screenshot
    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = `
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      overflow: auto;
    `;
    leftPanel.innerHTML = `
      <h3 style="font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.6); margin-bottom: 16px; font-family: -apple-system, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">ORIGINAL</h3>
      <div style="background: white; border-radius: 8px; padding: 20px;">
        <img src="${this.data.screenshot}" style="max-width: 100%; height: auto;" />
      </div>
    `;

    // Right panel - tabs
    const rightPanel = this.createRightPanel();

    content.appendChild(leftPanel);
    content.appendChild(rightPanel);

    return content;
  },

  createRightPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    // Tabs
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const tabButtons = ['Rendered', 'Code', 'Styles'];
    tabButtons.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.className = 'preview-tab' + (i === 0 ? ' active' : '');
      btn.dataset.tab = name.toLowerCase();
      btn.textContent = name;
      btn.style.cssText = `
        padding: 8px 16px;
        border: none;
        background: none;
        color: ${i === 0 ? 'rgb(139, 92, 246)' : 'rgba(255, 255, 255, 0.5)'};
        border-bottom: 2px solid ${i === 0 ? 'rgb(139, 92, 246)' : 'transparent'};
        font-size: 13px;
        cursor: pointer;
        font-family: -apple-system, sans-serif;
      `;
      tabs.appendChild(btn);
    });

    // Tab content container
    const tabContent = document.createElement('div');
    tabContent.style.cssText = 'flex: 1; overflow: auto;';

    // Rendered tab
    const renderedTab = document.createElement('div');
    renderedTab.id = 'tab-rendered';
    renderedTab.className = 'tab-pane active';
    renderedTab.innerHTML = `
      <h3 style="font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.6); margin-bottom: 16px; font-family: -apple-system, sans-serif; text-transform: uppercase;">RENDERED OUTPUT</h3>
      <div style="background: white; border-radius: 8px; padding: 20px; overflow: auto; max-height: 600px;">
        <style id="component-injected-styles"></style>
        <div id="rendered-component"></div>
      </div>
    `;

    // Code tab
    const codeTab = document.createElement('div');
    codeTab.id = 'tab-code';
    codeTab.className = 'tab-pane';
    codeTab.style.display = 'none';
    codeTab.innerHTML = `
      <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; overflow: auto; max-height: 600px;">
        <pre style="margin: 0; font-family: Monaco, monospace; font-size: 12px; line-height: 1.6; color: #e0e0e0; white-space: pre-wrap;">${this.escapeHtml(this.data.code)}</pre>
      </div>
    `;

    // Styles tab
    const stylesTab = document.createElement('div');
    stylesTab.id = 'tab-styles';
    stylesTab.className = 'tab-pane';
    stylesTab.style.display = 'none';
    stylesTab.innerHTML = `
      <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; overflow: auto; max-height: 600px;">
        <pre style="margin: 0; font-family: Monaco, monospace; font-size: 12px; line-height: 1.6; color: #e0e0e0; white-space: pre-wrap;">${this.escapeHtml(this.data.css)}</pre>
      </div>
    `;

    tabContent.appendChild(renderedTab);
    tabContent.appendChild(codeTab);
    tabContent.appendChild(stylesTab);

    panel.appendChild(tabs);
    panel.appendChild(tabContent);

    return panel;
  },

  createFooter() {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 20px;
      border-top: 1px solid rgba(139, 92, 246, 0.2);
      display: flex;
      justify-content: space-between;
      font-family: -apple-system, sans-serif;
    `;

    footer.innerHTML = `
      <div style="font-size: 13px; color: rgba(255, 255, 255, 0.5);">
        ${this.data.fileCount} files · ${this.data.totalSize}
      </div>
      <div style="font-size: 13px; color: rgba(255, 255, 255, 0.5);">
        ${this.data.outputDir}
      </div>
    `;

    return footer;
  },

  wireUpButtons() {
    // Wait for DOM
    setTimeout(() => {
      const copyBtn = document.getElementById('btn-copy-code');
      const openBtn = document.getElementById('btn-open-folder');
      const startBtn = document.getElementById('btn-start-over');
      const doneBtn = document.getElementById('btn-done');

      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(this.data.code).then(() => {
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy Code'; }, 2000);
          });
        });
      }

      if (openBtn) {
        openBtn.addEventListener('click', () => {
          window.clonereact.openFolder();
        });
      }

      if (startBtn) {
        startBtn.addEventListener('click', () => {
          window.clonereact.startOver();
        });
      }

      if (doneBtn) {
        doneBtn.addEventListener('click', () => {
          window.clonereact.close();
        });
      }

      // Tab switcher
      document.querySelectorAll('.preview-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          this.switchTab(e.target.dataset.tab, e.target);
        });
      });

      console.log('[CloneReact] Buttons wired up');
    }, 200);
  },

  insertRenderedHTML() {
    // Wait for rendered-component div to exist
    setTimeout(() => {
      const renderedDiv = document.getElementById('rendered-component');
      const stylesDiv = document.getElementById('component-injected-styles');

      if (!renderedDiv) {
        console.error('[CloneReact] rendered-component div not found');
        return;
      }

      // Insert CSS
      if (stylesDiv) {
        stylesDiv.textContent = this.data.css;
      }

      // Insert HTML - use a safe wrapper
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this.data.extractedHTML || '';

      // Move all children to rendered div
      while (wrapper.firstChild) {
        renderedDiv.appendChild(wrapper.firstChild);
      }

      console.log('[CloneReact] Rendered HTML inserted');
    }, 800);
  },

  switchTab(tabName, button) {
    // Update tab buttons
    document.querySelectorAll('.preview-tab').forEach(tab => {
      tab.classList.remove('active');
      tab.style.color = 'rgba(255, 255, 255, 0.5)';
      tab.style.borderBottomColor = 'transparent';
    });

    button.classList.add('active');
    button.style.color = 'rgb(139, 92, 246)';
    button.style.borderBottomColor = 'rgb(139, 92, 246)';

    // Update content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.style.display = 'none');
    const targetPane = document.getElementById('tab-' + tabName);
    if (targetPane) {
      targetPane.style.display = 'block';
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
