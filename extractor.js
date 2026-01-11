/**
 * React Component Extractor for Electron
 * Combines Fiber tree extraction with screenshot capture
 */

(function() {
  'use strict';

  /**
   * Find React Fiber node for a DOM element
   */
  function findFiberNode(element) {
    const key = Object.keys(element).find(k =>
      k.startsWith('__reactFiber$') ||
      k.startsWith('__reactInternalInstance$')
    );
    return key ? element[key] : null;
  }

  /**
   * Get component name from Fiber node
   */
  function getComponentName(fiber) {
    if (!fiber) return null;
    if (fiber.type && fiber.type.name) return fiber.type.name;
    if (fiber.type && fiber.type.displayName) return fiber.type.displayName;
    if (typeof fiber.type === 'string') return fiber.type;
    return fiber.elementType?.name || 'Unknown';
  }

  /**
   * Extract props from Fiber node
   */
  function extractProps(fiber) {
    if (!fiber || !fiber.memoizedProps) return {};

    const props = { ...fiber.memoizedProps };
    delete props.children;

    // Serialize functions as placeholders
    Object.keys(props).forEach(key => {
      if (typeof props[key] === 'function') {
        props[key] = `[Function: ${props[key].name || 'anonymous'}]`;
      } else if (props[key] && typeof props[key] === 'object' && !Array.isArray(props[key])) {
        try {
          JSON.stringify(props[key]);
        } catch {
          props[key] = '[Object: complex]';
        }
      }
    });

    return props;
  }

  /**
   * Extract state from Fiber node
   */
  function extractState(fiber) {
    if (!fiber) return null;

    if (fiber.memoizedState && fiber.stateNode) {
      return fiber.memoizedState;
    }

    const hooks = [];
    let hook = fiber.memoizedState;
    while (hook) {
      hooks.push({
        value: hook.memoizedState,
        queue: hook.queue ? '[Queue]' : null
      });
      hook = hook.next;
    }

    return hooks.length > 0 ? { hooks } : null;
  }

  /**
   * Get computed styles for element
   */
  function extractStyles(element) {
    if (!(element instanceof HTMLElement)) return {};

    const computed = window.getComputedStyle(element);
    const styles = {};

    const relevantProps = [
      'display', 'position', 'width', 'height', 'margin', 'padding',
      'background', 'backgroundColor', 'border', 'borderRadius',
      'color', 'fontSize', 'fontFamily', 'fontWeight',
      'flex', 'flexDirection', 'alignItems', 'justifyContent', 'gap',
      'grid', 'gridTemplateColumns', 'gridGap'
    ];

    relevantProps.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal' && value !== '0px') {
        styles[prop] = value;
      }
    });

    return styles;
  }

  /**
   * Walk Fiber tree and build component structure
   */
  function walkFiberTree(fiber, depth = 0, maxDepth = 5) {
    if (!fiber || depth > maxDepth) return null;

    const component = {
      name: getComponentName(fiber),
      type: typeof fiber.type === 'string' ? 'element' : 'component',
      props: extractProps(fiber),
      state: extractState(fiber),
      key: fiber.key,
      depth,
      children: []
    };

    if (fiber.stateNode instanceof HTMLElement) {
      component.styles = extractStyles(fiber.stateNode);
      component.tagName = fiber.stateNode.tagName.toLowerCase();
    }

    let child = fiber.child;
    while (child) {
      const childComponent = walkFiberTree(child, depth + 1, maxDepth);
      if (childComponent) {
        component.children.push(childComponent);
      }
      child = child.sibling;
    }

    return component;
  }

  /**
   * Capture element as screenshot (using canvas)
   */
  async function captureElementScreenshot(element) {
    try {
      const rect = element.getBoundingClientRect();

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Use html2canvas if available, otherwise use native screenshot
      if (window.html2canvas) {
        const canvasElement = await html2canvas(element, {
          backgroundColor: null,
          scale: window.devicePixelRatio
        });
        return canvasElement.toDataURL('image/png');
      }

      // Fallback: return placeholder
      return null;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }

  /**
   * Get element selector (CSS)
   */
  function getSelector(element) {
    if (element.id) {
      return '#' + element.id;
    }

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
   * Main extraction function for a single element
   */
  async function extractElement(element, maxDepth = 5) {
    // Get selector
    const selector = getSelector(element);

    // Check for React
    const fiber = findFiberNode(element);
    const isReact = !!fiber;

    // Detect React version
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const reactVersion = hook?.renderers?.values()?.next()?.value?.version || 'unknown';

    // Extract component tree if React
    const componentTree = isReact ? walkFiberTree(fiber, 0, maxDepth) : null;

    // Get element HTML
    const outerHTML = element.outerHTML;

    // Get computed styles
    const computedStyles = extractStyles(element);

    // Capture screenshot
    const screenshot = await captureElementScreenshot(element);

    // Get dimensions
    const rect = element.getBoundingClientRect();

    return {
      selector,
      isReact,
      reactVersion: isReact ? reactVersion : null,
      component: componentTree,
      html: outerHTML.substring(0, 5000), // Limit HTML size
      styles: computedStyles,
      screenshot,
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
  }

  // Export to window
  window.__REACT_COMPONENT_EXTRACTOR__ = {
    extractElement,
    findFiberNode,
    walkFiberTree,
    getComponentName,
    extractProps,
    extractState,
    extractStyles,
    getSelector
  };

  console.log('✅ CloneReact Extractor loaded');
})();
