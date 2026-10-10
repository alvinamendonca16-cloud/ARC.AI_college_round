export const TARGETS = {
  'page-background': {
    label: 'Background', semanticLabel: 'SONORA storefront background', tagName: 'section',
    properties: { backgroundColor: { label: 'Background Color', values: ['white', 'light blue'] } },
  },
  'navigation-bar': {
    label: 'Navigation Bar', semanticLabel: 'SONORA navigation bar', tagName: 'nav', container: 'store-root',
    properties: {
      backgroundColor: { label: 'Background Color', values: ['white', 'light blue'] },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      padding: { label: 'Padding', values: ['8px', '12px', '16px', '20px', '24px'] },
    },
  },
  logo: {
    label: 'Logo', semanticLabel: 'SONORA wordmark', tagName: 'span', container: 'navigation-bar',
    properties: {
      textContent: { label: 'Logo Text', values: null },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      fontSize: { label: 'Font Size', values: ['10px', '12px', '14px', '16px', '18px', '20px'] },
    },
  },
  'buy-now-button': {
    label: 'Primary Button',
    semanticLabel: 'Studio One purchase action',
    tagName: 'button',
    container: 'product-card',
    properties: {
      backgroundColor: {
        label: 'Background Color',
        values: ['blue', 'green', 'red'],
      },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      fontSize: { label: 'Font Size', values: ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'] },
      borderRadius: { label: 'Border Radius', values: ['0px', '4px', '8px', '12px', '16px'] },
      visibility: { label: 'Visibility', values: ['visible', 'hidden'] },
      padding: { label: 'Padding', values: ['8px', '12px', '16px', '20px', '24px'] },
      textAlign: { label: 'Alignment', values: ['left', 'center', 'right'] },
      textContent: { label: 'Button Text', values: null },
      behavior: { label: 'Click Behavior', values: ['add-to-bag', 'request-notification'] },
    },
  },
  'main-heading': {
    label: 'Main Heading',
    semanticLabel: 'Sonora storefront headline',
    tagName: 'h2',
    container: 'store-content',
    properties: {
      textContent: { label: 'Heading Text', values: null },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      fontSize: { label: 'Font Size', values: ['16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px'] },
      textAlign: { label: 'Alignment', values: ['left', 'center', 'right'] },
      marginTop: { label: 'Top Spacing', values: ['0px', '8px', '16px', '24px', '32px'] },
      visibility: { label: 'Visibility', values: ['visible', 'hidden'] },
    },
  },
  subheading: {
    label: 'Subheading', semanticLabel: 'SONORA storefront subheading', tagName: 'p', container: 'store-content',
    properties: {
      textContent: { label: 'Subheading Text', values: null },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      fontSize: { label: 'Font Size', values: ['10px', '12px', '14px', '16px', '18px', '20px'] },
      textAlign: { label: 'Alignment', values: ['left', 'center', 'right'] },
    },
  },
  'product-card': {
    label: 'Product Card',
    semanticLabel: 'Studio One product card',
    tagName: 'article',
    container: 'product-grid',
    properties: {
      backgroundColor: {
        label: 'Background Color',
        values: ['white', 'light blue'],
      },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      borderRadius: { label: 'Border Radius', values: ['0px', '4px', '8px', '12px', '16px'] },
      borderColor: { label: 'Border Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      borderWidth: { label: 'Border Width', values: ['0px', '1px', '2px', '3px', '4px'] },
      padding: { label: 'Padding', values: ['8px', '12px', '16px', '20px', '24px'] },
      visibility: { label: 'Visibility', values: ['visible', 'hidden'] },
      textAlign: { label: 'Alignment', values: ['left', 'center', 'right'] },
      layout: { label: 'Card Layout', values: ['standard', 'split'] },
    },
  },
  'product-image': {
    label: 'Product Image', semanticLabel: 'Studio One product image', tagName: 'img', container: 'product-image-wrap',
    properties: {
      imageSource: { label: 'Image URL', values: null },
      borderRadius: { label: 'Border Radius', values: ['0px', '4px', '8px', '12px', '16px'] },
      visibility: { label: 'Visibility', values: ['visible', 'hidden'] },
    },
  },
  'product-title': {
    label: 'Product Title', semanticLabel: 'Studio One product title', tagName: 'h3', container: 'product-info',
    properties: {
      textContent: { label: 'Product Name', values: null },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      fontSize: { label: 'Font Size', values: ['12px', '14px', '16px', '18px', '20px', '22px', '24px'] },
    },
  },
  'product-description': {
    label: 'Description', semanticLabel: 'Studio One product description', tagName: 'p', container: 'product-info',
    properties: {
      textContent: { label: 'Description Text', values: null },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      fontSize: { label: 'Font Size', values: ['10px', '12px', '14px', '16px', '18px', '20px'] },
    },
  },
  'product-price': {
    label: 'Product Price', semanticLabel: 'Studio One product price', tagName: 'strong', container: 'product-info',
    properties: {
      textContent: { label: 'Price Text', values: null },
      color: { label: 'Text Color', values: ['white', 'black', 'charcoal', 'green', 'red'] },
      fontSize: { label: 'Font Size', values: ['12px', '14px', '16px', '18px', '20px', '22px', '24px'] },
    },
  },
};

export const STATUS_LABELS = {
  pending: 'Pending',
  applied: 'Deployed',
  rejected: 'Rejected',
  rolled_back: 'Rolled Back',
  verified: 'Verified',
  conflict: 'Conflict',
  'conflict-detected': 'Conflict',
  verification_failed: 'Verification Failed',
};

export function formatStatus(status) {
  return STATUS_LABELS[status] ?? String(status).replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatOptionLabel(value) {
  return String(value).replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const COLOR_VALUES = {
  blue: '#2f62df',
  green: '#17845d',
  red: '#c94343',
  white: '#ffffff',
  'light blue': '#e2f1fb',
  black: '#111827',
  charcoal: '#34423d',
};

export const INITIAL_WEBSITE_STATE = {
  'page-background': { backgroundColor: '#f8f8f2' },
  'navigation-bar': { backgroundColor: 'white', color: 'charcoal', padding: '12px' },
  logo: { textContent: 'SONORA', color: 'charcoal', fontSize: '10px' },
  'buy-now-button': {
    backgroundColor: 'blue', color: 'white', fontSize: '12px', borderRadius: '0px',
    visibility: 'visible', padding: '12px', textAlign: 'left', textContent: 'Buy Now', behavior: 'add-to-bag',
  },
  'main-heading': {
    textContent: 'Make room for better sound.', color: 'charcoal', fontSize: '22px',
    textAlign: 'center', marginTop: '0px', visibility: 'visible',
  },
  subheading: { textContent: 'SOUND, REFINED', color: 'charcoal', fontSize: '9px', textAlign: 'center' },
  'product-card': {
    backgroundColor: 'white', color: 'charcoal', borderRadius: '4px', borderColor: '#e7e7e0', borderWidth: '1px', padding: '8px',
    visibility: 'visible', textAlign: 'left', layout: 'standard',
  },
  'product-image': {
    imageSource: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85',
    borderRadius: '2px', visibility: 'visible',
  },
  'product-title': { textContent: 'Studio One', color: 'charcoal', fontSize: '15px' },
  'product-description': { textContent: 'Immersive audio. All-day comfort.', color: 'charcoal', fontSize: '10px' },
  'product-price': { textContent: '$249', color: 'charcoal', fontSize: '14px' },
};

const normalizeColor = (value) => value.toLowerCase().trim().replace(/\s+/g, ' ');

function validateValue(target, property, value) {
  const definition = TARGETS[target]?.properties[property];
  if (!definition) return `That property is not supported for the selected website element.`;

  const normalized = property === 'backgroundColor' ? normalizeColor(value) : value.trim();
  const maxLength = property === 'imageSource' ? 2048 : 80;
  if (!normalized || normalized.length > maxLength || /[<>\n\r]/.test(normalized)) {
    return `Enter a non-empty value of ${maxLength} characters or fewer.`;
  }
  const validHexColor = (property === 'backgroundColor' || property === 'color') && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(normalized);
  if (property === 'imageSource') {
    try {
      const url = new URL(normalized);
      if (!['http:', 'https:'].includes(url.protocol)) return 'Enter an image URL using HTTP or HTTPS.';
    } catch {
      return 'Enter a valid image URL using HTTP or HTTPS.';
    }
  }
  if (definition.values && !definition.values.includes(normalized) && !validHexColor) {
    return `Choose a supported ${property === 'backgroundColor' ? 'color' : definition.label}: ${definition.values.join(', ')}.`;
  }
  return null;
}

export function parseRequest(request) {
  const input = request.trim();
  let match;

  match = input.match(/^change the buy now button(?: background color| color)? to (.+)$/i);
  if (match) {
    const newValue = normalizeColor(match[1]);
    const error = validateValue('buy-now-button', 'backgroundColor', newValue);
    return error ? { error } : { target: 'buy-now-button', property: 'backgroundColor', newValue };
  }

  const visualPropertyAliases = {
    'buy now button': {
      'text color': 'color', color: 'color', 'font size': 'fontSize', 'border radius': 'borderRadius',
      visibility: 'visibility', padding: 'padding', alignment: 'textAlign',
    },
    'main heading': {
      'text color': 'color', color: 'color', 'font size': 'fontSize', alignment: 'textAlign',
      'top spacing': 'marginTop', visibility: 'visibility',
    },
    'product card': {
      'text color': 'color', color: 'color', 'border radius': 'borderRadius', 'border color': 'borderColor', 'border width': 'borderWidth', padding: 'padding',
      visibility: 'visibility', alignment: 'textAlign',
    },
  };
  const targetAliases = { 'buy now button': 'buy-now-button', 'main heading': 'main-heading', 'product card': 'product-card' };
  match = input.match(/^change the (buy now button|main heading|product card) (text color|color|font size|border radius|border color|border width|visibility|padding|alignment|top spacing) to (.+)$/i);
  if (match) {
    const targetName = match[1].toLowerCase();
    const target = targetAliases[targetName];
    const property = visualPropertyAliases[targetName][match[2].toLowerCase()];
    const newValue = property === 'color' ? normalizeColor(match[3]) : match[3].trim().toLowerCase();
    const error = validateValue(target, property, newValue);
    return error ? { error } : { target, property, newValue };
  }

  match = input.match(/^change the buy now button text to (.+)$/i);
  if (match) {
    const newValue = match[1].trim();
    const error = validateValue('buy-now-button', 'textContent', newValue);
    return error ? { error } : { target: 'buy-now-button', property: 'textContent', newValue };
  }

  match = input.match(/^change the buy now button behavior to (.+)$/i);
  if (match) {
    const newValue = match[1].trim().toLowerCase();
    const error = validateValue('buy-now-button', 'behavior', newValue);
    return error ? { error } : { target: 'buy-now-button', property: 'behavior', newValue };
  }

  match = input.match(/^change the main heading to (.+)$/i);
  if (match) {
    const newValue = match[1].trim();
    const error = validateValue('main-heading', 'textContent', newValue);
    return error ? { error } : { target: 'main-heading', property: 'textContent', newValue };
  }

  match = input.match(/^change the product card background(?: color)? to (.+)$/i);
  if (match) {
    const newValue = normalizeColor(match[1]);
    const error = validateValue('product-card', 'backgroundColor', newValue);
    return error ? { error } : { target: 'product-card', property: 'backgroundColor', newValue };
  }

  match = input.match(/^change the product card layout to (.+)$/i);
  if (match) {
    const newValue = match[1].trim().toLowerCase();
    const error = validateValue('product-card', 'layout', newValue);
    return error ? { error } : { target: 'product-card', property: 'layout', newValue };
  }

  return {
    error: 'I couldn’t map that request to a supported change. Try changing a button color, text, or behavior; the main heading; or the product card background or layout.',
  };
}

export function validateProposal(target, property, value) {
  if (!TARGETS[target]?.properties[property]) return { error: 'Select a supported website element and property.' };
  const rawValue = String(value ?? '').trim();
  const normalized = property === 'backgroundColor' || property === 'color'
    ? normalizeColor(rawValue)
    : property === 'textContent' || property === 'imageSource' ? rawValue : rawValue.toLowerCase();
  const error = validateValue(target, property, normalized);
  return error ? { error } : { target, property, newValue: normalized };
}

export function getConflicts(patches) {
  const pending = patches.filter((patch) => patch.status === 'pending');
  const conflicts = [];
  for (let firstIndex = 0; firstIndex < pending.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < pending.length; secondIndex += 1) {
      const first = pending[firstIndex];
      const second = pending[secondIndex];
      if (first.target === second.target && first.property === second.property) {
        conflicts.push({ first, second });
      }
    }
  }
  return conflicts;
}

export function getStalePatches(patches, websiteState) {
  return patches.filter((patch) =>
    patch.status === 'pending' && websiteState[patch.target]?.[patch.property] !== patch.oldValue,
  );
}

  export function getPatchRevision(patch) {
    if (!patch) return null;
    return JSON.stringify([
      patch.workspaceId,
      patch.target,
      patch.property,
      patch.oldValue,
      patch.newValue,
      patch.locator?.selector,
      patch.locator?.semanticLabel,
      patch.locator?.tagName,
    ]);
  }

export function makePatch({ id, parsed, websiteState, author, workspaceId, description, createdAt = new Date().toISOString() }) {
  const oldValue = websiteState[parsed.target]?.[parsed.property];
  if (oldValue === undefined) return { error: 'That website element or property no longer exists.' };
  if (oldValue === parsed.newValue) return { error: 'The website already has that value. Choose a different change.' };
  const target = TARGETS[parsed.target];
  return {
    patch: {
      id,
      workspaceId,
      target: parsed.target,
      property: parsed.property,
      oldValue,
      newValue: parsed.newValue,
      status: 'pending',
      createdAt,
      author,
      comments: [],
      trackingStatus: 'valid',
      validationStatus: 'not-tested',
      description: description || `${TARGETS[parsed.target].label}: ${TARGETS[parsed.target].properties[parsed.property].label}`,
      locator: {
        selector: `[data-patch-target="${parsed.target}"]`,
        semanticLabel: target.semanticLabel,
        tagName: target.tagName,
        container: target.container,
        role: target.tagName === 'button' ? 'button' : ['h2', 'h3'].includes(target.tagName) ? 'heading' : target.tagName === 'img' ? 'img' : target.tagName === 'nav' ? 'navigation' : 'article',
        accessibleName: target.semanticLabel,
        fingerprint: `${target.tagName}:${target.semanticLabel}`,
      },
    },
  };
}

export function resolveSmartTarget(patch, root) {
  if (!root?.querySelectorAll) return { element: null, method: 'unavailable', moved: false };
  const elements = [...root.querySelectorAll('[data-patch-target], [data-patch-semantic]')];
  const stableMatch = elements.find((element) => element.dataset.patchTarget === patch.target);
  const semanticMatch = stableMatch ?? elements.find((element) =>
    element.dataset.patchSemantic === patch.locator?.semanticLabel
    && element.tagName.toLowerCase() === patch.locator?.tagName,
  );
  if (!semanticMatch) return { element: null, method: 'not-found', moved: false };

  const container = semanticMatch.parentElement?.closest('[data-patch-container]')?.dataset.patchContainer;
  return {
    element: semanticMatch,
    method: stableMatch ? 'stable-key' : 'semantic-context',
    moved: Boolean(patch.locator?.container && container !== patch.locator.container),
    container,
    confidence: stableMatch ? 1 : container === patch.locator?.container ? 0.94 : 0.82,
  };
}

export function normalizeWebsiteUrl(input) {
  const value = input.trim();
  if (!value) return { error: 'Enter a website URL to continue.' };
  if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) {
    return { error: 'Enter a valid public website URL using HTTP or HTTPS.' };
  }
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
      return { error: 'Enter a valid public website URL using HTTP or HTTPS.' };
    }
    return { url: url.toString() };
  } catch {
    return { error: 'That URL does not look valid. Try a domain such as example.com.' };
  }
}

export function readStoredValue(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}