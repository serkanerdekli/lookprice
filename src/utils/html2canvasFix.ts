/**
 * Utility to convert modern CSS color functions like oklch(...) or oklab(...) into standard rgb()/rgba() format.
 * html2canvas does not natively parse oklch() or oklab(), causing export errors when Tailwind CSS v4 or modern color functions are present.
 */

import html2canvas, { Options } from 'html2canvas';

let canvas2dCtx: CanvasRenderingContext2D | null = null;

function get2dContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!canvas2dCtx) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      canvas2dCtx = canvas.getContext('2d', { willReadFrequently: true });
    } catch (e) {
      canvas2dCtx = null;
    }
  }
  return canvas2dCtx;
}

/**
 * Mathematical OKLCH -> RGB/RGBA converter.
 */
export function oklchToRgb(oklchStr: string): string {
  if (!oklchStr) return oklchStr;
  
  const regex = /oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([-\d.]+)(?:deg)?(?:\s*\/\s*([\d.%]+))?\s*\)/i;
  const match = oklchStr.match(regex);
  if (!match) return 'rgb(30, 41, 59)'; // Safe slate-800 default
  
  let L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
  let C = match[2].endsWith('%') ? (parseFloat(match[2]) / 100) * 0.4 : parseFloat(match[2]);
  let H = parseFloat(match[3]);
  let A = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

  if (isNaN(L)) L = 0.5;
  if (isNaN(C)) C = 0;
  if (isNaN(H)) H = 0;

  const hRad = (H * Math.PI) / 180;
  const oklabA = C * Math.cos(hRad);
  const oklabB = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * oklabA + 0.2158037573 * oklabB;
  const m_ = L - 0.1055613458 * oklabA - 0.0638541728 * oklabB;
  const s_ = L - 0.0894841775 * oklabA - 0.1291980554 * oklabB;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLinVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgb = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    const v = x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
    return Math.round(Math.min(255, Math.max(0, v * 255)));
  };

  const r = toSrgb(rLin);
  const g = toSrgb(gLin);
  const b = toSrgb(bLinVal);

  if (A < 1) {
    return `rgba(${r}, ${g}, ${b}, ${A.toFixed(3)})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Mathematical OKLAB -> RGB/RGBA converter.
 */
export function oklabToRgb(oklabStr: string): string {
  if (!oklabStr) return oklabStr;

  const regex = /oklab\(\s*([\d.%]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i;
  const match = oklabStr.match(regex);
  if (!match) return 'rgb(51, 65, 85)'; // Safe default slate-700

  let L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
  let a = parseFloat(match[2]);
  let b = parseFloat(match[3]);
  let A = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

  if (isNaN(L)) L = 0.5;
  if (isNaN(a)) a = 0;
  if (isNaN(b)) b = 0;

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 0.1291980554 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLinVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgb = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    const v = x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
    return Math.round(Math.min(255, Math.max(0, v * 255)));
  };

  const r = toSrgb(rLin);
  const g = toSrgb(gLin);
  const bVal = toSrgb(bLinVal);

  if (A < 1) {
    return `rgba(${r}, ${g}, ${bVal}, ${A.toFixed(3)})`;
  }
  return `rgb(${r}, ${g}, ${bVal})`;
}

/**
 * Converts a single color string token (e.g. "oklch(...)" or "oklab(...)") to sRGB.
 */
export function convertSingleColorToRgb(singleColorStr: string): string {
  if (!singleColorStr) return singleColorStr;
  const trimmed = singleColorStr.trim();

  // 1. Try browser canvas context first (native browser Color 4 engine)
  const ctx = get2dContext();
  if (ctx) {
    try {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillStyle = trimmed;
      const normalized = ctx.fillStyle;
      if (normalized && !normalized.includes('oklch') && !normalized.includes('oklab') && !normalized.includes('color(')) {
        return normalized;
      }
    } catch (e) {}
  }

  // 2. Math fallback
  if (trimmed.startsWith('oklab(')) {
    return oklabToRgb(trimmed);
  }
  if (trimmed.startsWith('oklch(')) {
    return oklchToRgb(trimmed);
  }
  return trimmed;
}

/**
 * Replaces all modern color tokens in any CSS string with standard sRGB.
 */
export function parseAndConvertColorToRgb(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  
  if (!colorStr.includes('oklch') && !colorStr.includes('oklab') && !colorStr.includes('color(')) {
    return colorStr;
  }

  let result = colorStr;
  result = result.replace(/oklab\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi, (m) => convertSingleColorToRgb(m));
  result = result.replace(/oklch\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi, (m) => convertSingleColorToRgb(m));
  result = result.replace(/color\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi, (m) => convertSingleColorToRgb(m));

  return result;
}

/**
 * Sanitizes a string containing CSS rules by replacing oklch/oklab occurrences with converted RGB/HEX
 */
export function sanitizeCssString(cssText: string): string {
  if (!cssText || (!cssText.includes('oklch') && !cssText.includes('oklab') && !cssText.includes('color('))) {
    return cssText;
  }
  return parseAndConvertColorToRgb(cssText);
}

/**
 * Sanitizes a cloned Document before html2canvas parses its colors and styles.
 * Preserves Tailwind CSS rules while stripping all oklch/oklab color calls and locking computed styles.
 */
export function sanitizeClonedDocForHtml2Canvas(
  clonedDoc: Document, 
  clonedTargetElement?: HTMLElement, 
  originalTargetElement?: HTMLElement
) {
  if (!clonedDoc) return;

  // 0. Reset document and body margins/paddings to prevent scroll/offset shifts
  try {
    if (clonedDoc.documentElement) {
      clonedDoc.documentElement.style.margin = '0';
      clonedDoc.documentElement.style.padding = '0';
      clonedDoc.documentElement.style.border = 'none';
      clonedDoc.documentElement.style.overflow = 'visible';
    }
    if (clonedDoc.body) {
      clonedDoc.body.style.margin = '0';
      clonedDoc.body.style.padding = '0';
      clonedDoc.body.style.border = 'none';
      clonedDoc.body.style.overflow = 'visible';
      clonedDoc.body.style.position = 'relative';
      clonedDoc.body.style.top = '0';
      clonedDoc.body.style.left = '0';
    }
  } catch (e) {}

  // 1. Lock exact canonical dimensions on the cloned poster container and isolate it at (0,0) of clonedDoc.body
  if (clonedTargetElement) {
    try {
      const canonicalWidth = originalTargetElement?.offsetWidth || clonedTargetElement.offsetWidth || 340;
      const canonicalHeight = originalTargetElement?.offsetHeight || clonedTargetElement.offsetHeight || 340;

      // ISOLATION: Move clonedTargetElement to be the sole direct child of clonedDoc.body
      // Strips away parent modal backdrops, dialog padding, scroll offsets, and parent transforms
      if (clonedDoc.body && clonedTargetElement.parentElement !== clonedDoc.body) {
        clonedDoc.body.innerHTML = '';
        clonedDoc.body.appendChild(clonedTargetElement);
      }

      // Lock documentElement and body to exact poster dimensions at (0,0)
      if (clonedDoc.documentElement) {
        clonedDoc.documentElement.style.margin = '0';
        clonedDoc.documentElement.style.padding = '0';
        clonedDoc.documentElement.style.border = 'none';
        clonedDoc.documentElement.style.width = `${canonicalWidth}px`;
        clonedDoc.documentElement.style.height = `${canonicalHeight}px`;
        clonedDoc.documentElement.style.overflow = 'hidden';
      }

      if (clonedDoc.body) {
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.border = 'none';
        clonedDoc.body.style.position = 'absolute';
        clonedDoc.body.style.top = '0';
        clonedDoc.body.style.left = '0';
        clonedDoc.body.style.width = `${canonicalWidth}px`;
        clonedDoc.body.style.height = `${canonicalHeight}px`;
        clonedDoc.body.style.overflow = 'hidden';
        clonedDoc.body.style.backgroundColor = 'transparent';
      }

      // Lock clonedTargetElement to top-left (0,0) with no margins or transforms
      clonedTargetElement.style.position = 'absolute';
      clonedTargetElement.style.top = '0';
      clonedTargetElement.style.left = '0';
      clonedTargetElement.style.margin = '0';
      clonedTargetElement.style.transform = 'none';
      clonedTargetElement.style.width = `${canonicalWidth}px`;
      clonedTargetElement.style.height = `${canonicalHeight}px`;
      clonedTargetElement.style.minWidth = `${canonicalWidth}px`;
      clonedTargetElement.style.minHeight = `${canonicalHeight}px`;
      clonedTargetElement.style.maxWidth = `${canonicalWidth}px`;
      clonedTargetElement.style.maxHeight = `${canonicalHeight}px`;
      clonedTargetElement.style.boxSizing = 'border-box';
    } catch (e) {}
  }

  // 2. Prevent line clipping and text cutoff on all text elements
  try {
    const textNodes = Array.from(clonedDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, b, strong')) as HTMLElement[];
    textNodes.forEach((node) => {
      node.classList.remove('truncate', 'line-clamp-1', 'line-clamp-2', 'line-clamp-3', 'leading-none', 'leading-tight', 'leading-snug');
      
      if (node.style.webkitLineClamp) {
        node.style.webkitLineClamp = 'unset';
      }
      
      // Force overflow to be visible on all text containers so glyph ascenders/descenders are never clipped
      node.style.setProperty('overflow', 'visible', 'important');
      node.style.setProperty('text-overflow', 'clip', 'important');
      node.style.setProperty('max-height', 'none', 'important');

      // CRITICAL html2canvas baseline fix:
      // Force generous line-height (1.5) on text nodes so uppercase letters (G, A, P, B, İ, Ş, M) and accents are never clipped
      node.style.setProperty('line-height', '1.5', 'important');
      
      if (node.tagName === 'SPAN') {
        node.style.setProperty('display', 'inline-block', 'important');
        node.style.setProperty('vertical-align', 'middle', 'important');
      }
    });
  } catch (e) {}

  // 3. Sanitize all existing <style> tags in clonedDoc
  const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = sanitizeCssString(styleTag.textContent);
    }
  });

  // 4. Gather live stylesheet rules, sanitize them, and inject into clonedDoc
  try {
    let globalCssText = '';
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            globalCssText += rule.cssText + '\n';
          }
        }
      } catch (e) {}
    }

    if (globalCssText) {
      const sanitizedGlobalCss = sanitizeCssString(globalCssText);
      const injectedStyle = clonedDoc.createElement('style');
      injectedStyle.setAttribute('id', 'html2canvas-sanitized-tailwind');
      injectedStyle.textContent = sanitizedGlobalCss;
      clonedDoc.head.appendChild(injectedStyle);

      const linkTags = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
      linkTags.forEach((link) => link.remove());
    }
  } catch (e) {}

  // 5. Scan all cloned elements for any remaining inline style attributes with oklch/oklab
  const allClonedElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
  allClonedElements.forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color('))) {
      el.setAttribute('style', sanitizeCssString(styleAttr));
    }
  });

  // 6. Synchronize and guarantee all <img> tags in clonedDoc have valid Data URLs and clean styles
  try {
    const clonedImgs = Array.from(clonedDoc.querySelectorAll('img')) as HTMLImageElement[];
    const originalImgs = originalTargetElement ? (Array.from(originalTargetElement.querySelectorAll('img')) as HTMLImageElement[]) : [];
    
    clonedImgs.forEach((clonedImg, idx) => {
      const origImg = originalImgs[idx];
      if (origImg && origImg.src) {
        clonedImg.src = origImg.src;
      }
      
      // Strip any complex CSS filter (like drop-shadow) on the cloned image that html2canvas cannot render
      clonedImg.style.filter = 'none';
      (clonedImg.style as any).webkitFilter = 'none';
      clonedImg.style.visibility = 'visible';
      clonedImg.style.display = 'block';

      // Ensure loading is eager and decoded
      clonedImg.loading = 'eager';
      (clonedImg as any).decoding = 'sync';
    });
  } catch (e) {}
}

/**
 * Converts a Blob to a base64 Data URL string.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        resolve('');
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts any image URL (local, remote, CORS or non-CORS) into a bulletproof base64 Data URL.
 * Uses local proxy /api/proxy-image if the direct CORS fetch is blocked by upstream servers.
 */
export async function urlToDataUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:')) return url;

  // 1. Try direct fetch with CORS (works for same-origin or CORS-enabled CDNs)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      if (dataUrl && dataUrl.startsWith('data:')) {
        return dataUrl;
      }
    }
  } catch (e) {
    // Cross-origin request blocked by browser CORS policy, proceed to proxy
  }

  // 2. High-performance backend proxy with format=dataurl
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}&format=dataurl`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const json = await res.json();
      if (json?.dataUrl && typeof json.dataUrl === 'string' && json.dataUrl.startsWith('data:')) {
        return json.dataUrl;
      }
    }
  } catch (e) {}

  // 3. Backend proxy binary stream fallback
  try {
    const proxyBinaryUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyBinaryUrl);
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      if (dataUrl && dataUrl.startsWith('data:')) {
        return dataUrl;
      }
    }
  } catch (e) {}

  // 4. Instagram proxy-image route fallback
  try {
    const proxyInstaUrl = `/api/instagram/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyInstaUrl);
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      if (dataUrl && dataUrl.startsWith('data:')) {
        return dataUrl;
      }
    }
  } catch (e) {}

  return url;
}

/**
 * Prepares all <img> elements inside a target container before html2canvas capture.
 * Converts external non-CORS image sources to base64 Data URLs and guarantees they are fully decoded.
 */
export async function prepareImagesForHtml2Canvas(element: HTMLElement): Promise<void> {
  if (!element) return;
  const imgs = Array.from(element.querySelectorAll('img'));
  const bgElements = Array.from(element.querySelectorAll<HTMLElement>('*')).filter(el => {
    const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none' && bg.includes('url(');
  });

  await Promise.all([
    // Process <img> tags
    ...imgs.map(async (img) => {
      const currentSrc = img.src || img.getAttribute('src');
      if (!currentSrc) return;
      if (!currentSrc.startsWith('data:')) {
        const dataUrl = await urlToDataUrl(currentSrc);
        if (dataUrl && dataUrl.startsWith('data:')) {
          img.src = dataUrl;
        }
      }
      await new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 800);
      });
      if ('decode' in img && typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch (e) {}
      }
    }),
    // Process background-image elements
    ...bgElements.map(async (el) => {
      const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
      const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
      if (match && match[1]) {
        const currentSrc = match[1];
        if (!currentSrc.startsWith('data:')) {
          const dataUrl = await urlToDataUrl(currentSrc);
          if (dataUrl && dataUrl.startsWith('data:')) {
            el.style.setProperty('background-image', `url("${dataUrl}")`, 'important');
          }
        }
      }
    })
  ]);
}

/**
 * Bulletproof html2canvas wrapper:
 * 1. Pre-converts all images in the container to base64 Data URLs via local proxy to eliminate CORS blocks
 * 2. Monkey-patches getComputedStyle so modern colors (oklch, oklab, color()) are safely converted to rgb/rgba
 * 3. WebIDL compliance: Prevents "Illegal invocation" by never passing Proxy receiver to native getters
 * 4. Injects sanitization into onclone
 * 5. Ensures allowTaint is disabled so canvas.toDataURL() never throws SecurityError
 * 6. Restores original getComputedStyle after capture
 */
export async function safeHtml2Canvas(
  element: HTMLElement,
  options: Partial<Options> = {}
): Promise<HTMLCanvasElement> {
  // Pre-convert all images inside target element to base64 Data URLs for 100% CORS safety and instant canvas drawing
  try {
    await prepareImagesForHtml2Canvas(element);
  } catch (err) {
    console.warn("safeHtml2Canvas image prep warning:", err);
  }

  const originalGetComputedStyle = window.getComputedStyle;

  const createStyleProxy = (origComputed: CSSStyleDeclaration): CSSStyleDeclaration => {
    if (!origComputed) return origComputed;

    return new Proxy(origComputed, {
      get(target, prop, _receiver) {
        // 1. Explicit fast-paths for methods called by html2canvas
        if (prop === 'getPropertyValue') {
          return (propertyName: string) => {
            try {
              const val = target.getPropertyValue(propertyName);
              return parseAndConvertColorToRgb(val);
            } catch (e) {
              return '';
            }
          };
        }

        if (prop === 'item') {
          return (index: number) => {
            try {
              return target.item(index);
            } catch (e) {
              return '';
            }
          };
        }

        if (prop === 'getPropertyPriority') {
          return (propertyName: string) => {
            try {
              return target.getPropertyPriority(propertyName);
            } catch (e) {
              return '';
            }
          };
        }

        if (prop === 'setProperty') {
          return (propertyName: string, value: string, priority?: string) => {
            try {
              target.setProperty(propertyName, value, priority);
            } catch (e) {}
          };
        }

        if (prop === 'removeProperty') {
          return (propertyName: string) => {
            try {
              return target.removeProperty(propertyName);
            } catch (e) {
              return '';
            }
          };
        }

        // 2. Explicit properties on CSSStyleDeclaration
        if (prop === 'length') {
          try {
            return target.length;
          } catch (e) {
            return 0;
          }
        }

        if (prop === 'cssText') {
          try {
            return parseAndConvertColorToRgb(target.cssText);
          } catch (e) {
            return '';
          }
        }

        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          try {
            return target.item(Number(prop));
          } catch (e) {
            return '';
          }
        }

        // 3. Fallback for all other properties (e.g. style.color, style.display, etc.)
        // CRITICAL WebIDL Guard:
        // NEVER pass `receiver` (the Proxy) as the 3rd argument to Reflect.get!
        // In browser WebIDL, getters throw "TypeError: Illegal invocation" if `this` is a Proxy.
        // We ALWAYS invoke getters with `target` as `this`.
        let val: any;
        try {
          val = Reflect.get(target, prop, target);
        } catch (e) {
          try {
            val = (target as any)[prop];
          } catch (e2) {
            val = undefined;
          }
        }

        if (typeof val === 'function') {
          return val.bind(target);
        }

        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('color('))) {
          return parseAndConvertColorToRgb(val);
        }

        return val;
      },
      has(target, prop) {
        try {
          return Reflect.has(target, prop);
        } catch (e) {
          return prop in target;
        }
      },
      ownKeys(target) {
        try {
          return Reflect.ownKeys(target);
        } catch (e) {
          return [];
        }
      },
      getOwnPropertyDescriptor(target, prop) {
        try {
          const desc = Reflect.getOwnPropertyDescriptor(target, prop);
          if (desc) {
            return {
              ...desc,
              configurable: true
            };
          }
          return desc;
        } catch (e) {
          return undefined;
        }
      }
    });
  };

  try {
    // Intercept host window getComputedStyle
    window.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
      if (!el) return originalGetComputedStyle.call(window, el as any, pseudoElt);
      try {
        const computed = originalGetComputedStyle.call(window, el, pseudoElt);
        if (!computed) return computed;
        return createStyleProxy(computed);
      } catch (e) {
        return originalGetComputedStyle.call(window, el, pseudoElt);
      }
    };

    const userOnClone = options.onclone;

    const mergedOptions: Partial<Options> = {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      ...options,
      allowTaint: false, // CRITICAL: NEVER allow taint when exporting toDataURL!
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        // Intercept cloned iframe defaultView getComputedStyle
        if (clonedDoc.defaultView && clonedDoc.defaultView.getComputedStyle) {
          const iframeOrigGetComputed = clonedDoc.defaultView.getComputedStyle;
          clonedDoc.defaultView.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
            if (!el) return iframeOrigGetComputed.call(clonedDoc.defaultView, el as any, pseudoElt);
            try {
              const computed = iframeOrigGetComputed.call(clonedDoc.defaultView, el, pseudoElt);
              if (!computed) return computed;
              return createStyleProxy(computed);
            } catch (e) {
              return iframeOrigGetComputed.call(clonedDoc.defaultView, el, pseudoElt);
            }
          };
        }

        sanitizeClonedDocForHtml2Canvas(clonedDoc, clonedElement, element);

        if (userOnClone) {
          try {
            userOnClone(clonedDoc, clonedElement);
          } catch (e) {
            console.warn("User onclone hook error:", e);
          }
        }
      }
    };

    return await html2canvas(element, mergedOptions);
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
}
