/**
 * CloneReact Element Inspector
 * Adapted from ai-cluso shared-inspector package
 * Provides visual overlay for element selection
 */

// Import styles (will be read from inspector-styles.ts)
const INSPECTOR_STYLES = `
#cluso-hover-overlay {
  position: absolute;
  pointer-events: none;
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  z-index: 999998;
  opacity: 0;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
#cluso-hover-overlay.visible {
  opacity: 1;
}

#cluso-screenshot-overlay {
  position: absolute;
  pointer-events: none;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  z-index: 999998;
  opacity: 0;
  transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
#cluso-screenshot-overlay.visible {
  opacity: 1;
}

#cluso-selection-overlay {
  position: absolute;
  pointer-events: none;
  border: 3px solid #8b5cf6;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.3), 0 4px 12px rgba(139, 92, 246, 0.4);
  z-index: 999999;
  opacity: 0;
  transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
#cluso-selection-overlay.visible {
  opacity: 1;
}

.cluso-overlay-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

#cluso-screenshot-overlay .cluso-overlay-label {
  background: rgba(59, 130, 246, 0.9);
}

#cluso-selection-overlay .cluso-overlay-label {
  background: rgba(139, 92, 246, 0.9);
}

#clonereact-toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  z-index: 1000000;
  box-shadow: 0 10px 40px rgba(139, 92, 246, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

#clonereact-toolbar button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

#clonereact-toolbar button:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
}

#clonereact-toolbar button.primary {
  background: rgb(139, 92, 246);
  border-color: rgb(139, 92, 246);
}

#clonereact-toolbar button.primary:hover {
  background: rgb(124, 58, 237);
}

#clonereact-toolbar .info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

#cluso-branding {
  position: fixed;
  top: 8px;
  left: 80px;
  z-index: 1000001;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 8px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  pointer-events: none;
  -webkit-app-region: no-drag;
}

#cluso-branding-logo {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
}

#cluso-branding-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  letter-spacing: -0.02em;
}
`;

(function() {
  'use strict';

  const SCREENSHOT_PADDING_X = 0.2; // 20% horizontal padding for screenshot
  const SCREENSHOT_PADDING_Y = 1.0; // 100% vertical padding for screenshot

  let hoverOverlay = null;
  let screenshotOverlay = null;
  let selectionOverlay = null;
  let selectedElement = null;
  let currentHoveredElement = null;

  /**
   * Initialize inspector
   */
  function init() {
    console.log('[CloneReact] Initializing inspector...');

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = INSPECTOR_STYLES;
    document.head.appendChild(styleEl);

    // Create overlays
    hoverOverlay = document.createElement('div');
    hoverOverlay.id = 'cluso-hover-overlay';
    hoverOverlay.setAttribute('data-clonereact-ui', '1');
    document.body.appendChild(hoverOverlay);

    screenshotOverlay = document.createElement('div');
    screenshotOverlay.id = 'cluso-screenshot-overlay';
    screenshotOverlay.setAttribute('data-clonereact-ui', '1');
    screenshotOverlay.innerHTML = '<div class="cluso-overlay-label">Image</div>';
    document.body.appendChild(screenshotOverlay);

    selectionOverlay = document.createElement('div');
    selectionOverlay.id = 'cluso-selection-overlay';
    selectionOverlay.setAttribute('data-clonereact-ui', '1');
    selectionOverlay.innerHTML = '<div class="cluso-overlay-label">Element</div>';
    document.body.appendChild(selectionOverlay);

    // Create branding
    createBranding();

    // Create toolbar
    createToolbar();

    // Event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', handleScroll, true);

    console.log('[CloneReact] Inspector ready');
  }

  /**
   * Create branding in top-left
   */
  function createBranding() {
    const branding = document.createElement('div');
    branding.id = 'cluso-branding';
    branding.setAttribute('data-clonereact-ui', '1');

    const iconUrl = window.__CLONEREACT_ICON_URL__ || '';

    if (iconUrl) {
      branding.innerHTML = `
        <img id="cluso-branding-logo" src="${iconUrl}" alt="cluso" />
        <div id="cluso-branding-text">cluso</div>
      `;
    } else {
      // Fallback to "C" if no icon
      branding.innerHTML = `
        <div id="cluso-branding-logo" style="font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;">C</div>
        <div id="cluso-branding-text">cluso</div>
      `;
    }

    document.body.appendChild(branding);
  }

  /**
   * Handle scroll - reposition overlays
   */
  function handleScroll() {
    if (selectedElement) {
      positionScreenshotOverlay(selectedElement);
      positionOverlay(selectionOverlay, selectedElement);
    }
  }

  /**
   * Create toolbar
   */
  function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'clonereact-toolbar';
    toolbar.setAttribute('data-clonereact-ui', '1');

    toolbar.innerHTML = `
      <div class="info"><span id="selection-count">Hover to highlight, click to select</span></div>
      <button id="btn-clear">Clear</button>
      <button id="btn-extract" class="primary">Select</button>
      <button id="btn-cancel">Cancel</button>
    `;

    document.body.appendChild(toolbar);

    // Button handlers
    document.getElementById('btn-clear').addEventListener('click', clearSelection);
    document.getElementById('btn-extract').addEventListener('click', extractComponent);
    document.getElementById('btn-cancel').addEventListener('click', cancel);
  }

  /**
   * Position overlay over element
   */
  function positionOverlay(overlay, element) {
    const rect = element.getBoundingClientRect();
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }

  /**
   * Handle mouse move
   */
  function handleMouseMove(event) {
    const target = event.target;

    // Ignore our UI
    if (target.closest('[data-clonereact-ui]')) {
      hoverOverlay.classList.remove('visible');
      return;
    }

    currentHoveredElement = target;
    positionOverlay(hoverOverlay, target);
    hoverOverlay.classList.add('visible');
  }

  /**
   * Handle click
   */
  function handleClick(event) {
    const target = event.target;

    // Ignore our UI
    if (target.closest('[data-clonereact-ui]')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Clear previous selection
    if (screenshotOverlay) {
      screenshotOverlay.classList.remove('visible');
    }
    if (selectionOverlay) {
      selectionOverlay.classList.remove('visible');
    }

    // Mark new selection
    selectedElement = target;

    // Position screenshot overlay (20% larger, blue)
    positionScreenshotOverlay(target);
    screenshotOverlay.classList.add('visible');

    // Position element overlay (exact bounds, purple)
    positionOverlay(selectionOverlay, target);
    selectionOverlay.classList.add('visible');

    // Hide hover
    hoverOverlay.classList.remove('visible');

    // Update count
    updateSelectionCount();
  }

  /**
   * Position screenshot overlay with padding (50% width, 60% height)
   */
  function positionScreenshotOverlay(element) {
    const rect = element.getBoundingClientRect();
    const paddingX = rect.width * SCREENSHOT_PADDING_X / 2;
    const paddingY = rect.height * SCREENSHOT_PADDING_Y / 2;

    screenshotOverlay.style.top = `${rect.top + window.scrollY - paddingY}px`;
    screenshotOverlay.style.left = `${rect.left + window.scrollX - paddingX}px`;
    screenshotOverlay.style.width = `${rect.width + (paddingX * 2)}px`;
    screenshotOverlay.style.height = `${rect.height + (paddingY * 2)}px`;
  }

  /**
   * Update selection count
   */
  function updateSelectionCount() {
    const countEl = document.getElementById('selection-count');
    if (selectedElement) {
      const tagName = selectedElement.tagName.toLowerCase();
      const className = selectedElement.className ? '.' + selectedElement.className.split(' ')[0] : '';
      countEl.textContent = `Selected: ${tagName}${className}`;
    } else {
      countEl.textContent = 'Hover to highlight, click to select';
    }
  }

  /**
   * Clear selection
   */
  function clearSelection() {
    selectedElement = null;
    if (screenshotOverlay) {
      screenshotOverlay.classList.remove('visible');
    }
    if (selectionOverlay) {
      selectionOverlay.classList.remove('visible');
    }
    updateSelectionCount();
  }

  /**
   * Extract component
   */
  async function extractComponent() {
    if (!selectedElement) {
      alert('Please select an element first');
      return;
    }

    console.log('[CloneReact] Extracting component...');

    // Use the react-fiber extraction if available
    const extraction = window.__extractReactContext ?
      window.__extractReactContext(selectedElement) :
      await extractBasicElement(selectedElement);

    // Send to main process (will show generating phase and preview)
    window.clonereact.sendExtraction({
      success: true,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      extractions: [extraction]
    });
  }

  /**
   * Capture element screenshot using Electron's native API with padding (50% width, 60% height)
   */
  async function captureScreenshot(element) {
    try {
      const rect = element.getBoundingClientRect();
      const selector = getSelector(element);

      // Calculate padding (50% width, 60% height)
      const paddingX = rect.width * SCREENSHOT_PADDING_X / 2;
      const paddingY = rect.height * SCREENSHOT_PADDING_Y / 2;

      // Get bounds relative to page (not viewport) with padding
      const bounds = {
        x: Math.max(0, Math.round(rect.left + window.scrollX - paddingX)),
        y: Math.max(0, Math.round(rect.top + window.scrollY - paddingY)),
        width: Math.round(rect.width + (paddingX * 2)),
        height: Math.round(rect.height + (paddingY * 2))
      };

      console.log('[CloneReact Renderer] Requesting screenshot with 20% width + 100% height padding for:', selector, bounds);

      // Use Electron's native screenshot via IPC with bounds
      const screenshot = await window.clonereact.captureElement(selector, bounds);

      console.log('[CloneReact Renderer] IPC returned, screenshot:', screenshot ? screenshot.substring(0, 50) : 'NULL');

      if (screenshot && screenshot.length > 1000) {
        console.log('[CloneReact Renderer] Screenshot received:', screenshot.length, 'chars');
        return screenshot;
      } else {
        console.error('[CloneReact Renderer] Screenshot too small or null:', screenshot ? screenshot.length : 0);
        return null;
      }
    } catch (error) {
      console.error('[CloneReact Renderer] Screenshot request failed:', error);
      return null;
    }
  }

  /**
   * Extract DOM tree structure recursively
   */
  function extractDOMTree(element, depth = 0, maxDepth = 3) {
    if (!element || depth > maxDepth) return null;

    // Skip script and style tags
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return null;

    const node = {
      type: 'element',
      tagName: element.tagName.toLowerCase(),
      name: element.tagName.toLowerCase(),
      props: {},
      children: []
    };

    // Extract attributes as props
    Array.from(element.attributes || []).forEach(attr => {
      if (attr.name === 'class') {
        node.props.className = attr.value;
      } else if (attr.name !== 'style') {
        node.props[attr.name] = attr.value;
      }
    });

    // Extract state classes (hover, active, disabled, etc.)
    const stateClasses = extractStateClasses(element);
    if (stateClasses) {
      node.states = stateClasses;
    }

    // Extract children
    Array.from(element.childNodes || []).forEach(child => {
      if (child.nodeType === 3) { // Text node
        const text = child.textContent.trim();
        if (text.length > 0 && text.length < 200) {
          node.children.push({ type: 'text', value: text });
        }
      } else if (child.nodeType === 1) { // Element node
        const childNode = extractDOMTree(child, depth + 1, maxDepth);
        if (childNode) {
          node.children.push(childNode);
        }
      }
    });

    return node;
  }

  /**
   * Basic element extraction (fallback if React Fiber not available)
   */
  async function extractBasicElement(element) {
    const rect = element.getBoundingClientRect();

    console.log('[CloneReact Renderer] Starting extraction for:', element.tagName);

    // Capture screenshot FIRST (returns Promise)
    console.log('[CloneReact Renderer] About to call captureScreenshot...');
    const screenshot = await captureScreenshot(element);
    console.log('[CloneReact Renderer] captureScreenshot returned, type:', typeof screenshot);
    console.log('[CloneReact Renderer] Screenshot value:', screenshot ? screenshot.substring(0, 100) : 'NULL OR UNDEFINED');
    console.log('[CloneReact Renderer] Screenshot length:', screenshot ? screenshot.length : 0);

    // Extract DOM tree
    const domTree = extractDOMTree(element, 0, 5);

    const extraction = {
      selector: getSelector(element),
      isReact: false,
      reactVersion: null,
      component: domTree,
      html: element.outerHTML.substring(0, 10000),
      styles: getComputedStylesObj(element),
      screenshot: screenshot, // Assign the awaited screenshot
      dimensions: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      meta: {
        tagName: element.tagName.toLowerCase(),
        id: element.id,
        classes: Array.from(element.classList)
      }
    };

    console.log('[CloneReact Renderer] Built extraction object');
    console.log('[CloneReact Renderer] extraction.screenshot exists?', !!extraction.screenshot);
    console.log('[CloneReact Renderer] extraction.screenshot length:', extraction.screenshot ? extraction.screenshot.length : 0);

    return extraction;
  }

  /**
   * Get CSS selector for element
   */
  function getSelector(element) {
    if (element.id) return '#' + element.id;

    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += '.' + classes[0];
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Get computed styles as object
   */
  function getComputedStylesObj(element) {
    const computed = window.getComputedStyle(element);
    const styles = {};

    const props = [
      'display', 'position', 'width', 'height', 'margin', 'padding',
      'background', 'backgroundColor', 'border', 'borderRadius',
      'color', 'fontSize', 'fontFamily', 'fontWeight',
      'flex', 'flexDirection', 'alignItems', 'justifyContent', 'gap'
    ];

    props.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal' && value !== '0px') {
        styles[prop] = value;
      }
    });

    return styles;
  }

  /**
   * Extract state-based classes (hover, active, disabled, focus, etc.)
   */
  function extractStateClasses(element) {
    const className = element.className || '';
    if (typeof className !== 'string') return {};

    const classes = className.split(' ').filter(c => c.trim());
    const states = {
      hover: [],
      active: [],
      focus: [],
      disabled: [],
      checked: [],
      selected: []
    };

    const statePattern = /^(hover|active|focus|disabled|checked|selected):(.+)$/;

    classes.forEach(cls => {
      const match = cls.match(statePattern);
      if (match) {
        const [, state, style] = match;
        if (states[state]) {
          states[state].push(style);
        }
      }
    });

    // Filter out empty state arrays
    Object.keys(states).forEach(key => {
      if (states[key].length === 0) {
        delete states[key];
      }
    });

    return Object.keys(states).length > 0 ? states : null;
  }

  /**
   * Cancel extraction
   */
  function cancel() {
    window.clonereact.cancel();
  }

  // Export API
  window.__CLONEREACT_INSPECTOR__ = {
    init,
    clearSelection,
    extractComponent,
    cancel
  };

  console.log('[CloneReact] Inspector module loaded');
})();
