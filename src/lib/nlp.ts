import type { Patch, PatchProperty, PatchTarget, WebsiteState } from '@/types';
import { buildTarget, getElementEntry } from './sampleData';
import { resolveColor } from './colors';

// ========================
// Natural-Language Patch Parser
// ========================
// Parses simple English requests like:
//   "Change the Buy Now button to green."
//   "Rename Buy Now to Add to Cart."
//   "Change the product heading to Premium Headphones."
//   "Change the buy button text color to red."

export type NlpResult =
  | {
      ok: true;
      target: PatchTarget;
      property: PatchProperty;
      newValue: string;
      explanation: string;
    }
  | {
      ok: false;
      explanation: string;
    };

// Map of element keywords -> elementId
const elementKeywords: Record<string, string[]> = {
  'buy-button': ['buy now button', 'buy button', 'purchase button', 'cta button', 'call to action button', 'add to cart button'],
  'product-heading': ['product heading', 'product title', 'heading', 'title', 'product name'],
  'product-price': ['price', 'product price', 'cost'],
  'product-description': ['description', 'product description', 'product text'],
  'banner': ['banner', 'promotional banner', 'promo banner', 'top banner'],
  'footer-text': ['footer', 'footer text', 'copyright'],
};

function matchElement(text: string): { elementId: string; matchedPhrase: string } | null {
  for (const [elementId, keywords] of Object.entries(elementKeywords)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return { elementId, matchedPhrase: kw };
      }
    }
  }
  return null;
}

export function parseNaturalLanguage(
  input: string,
  state: WebsiteState,
): NlpResult {
  const text = input.toLowerCase().trim();

  if (!text) {
    return { ok: false, explanation: 'Please enter a request.' };
  }

  // Must start with a change/modify/set/rename/make keyword
  const actionKeywords = ['change', 'rename', 'make', 'set', 'update', 'turn', 'modify', 'switch'];
  const hasAction = actionKeywords.some((k) => text.startsWith(k) || text.includes(` ${k} `));

  if (!hasAction) {
    return {
      ok: false,
      explanation:
        'Unrecognized request. Try starting with "Change", "Rename", "Make", or "Set" — e.g. "Change the Buy Now button to green."',
    };
  }

  // 1) Detect color change patterns: "to green", "to #hex", "color to red"
  //    Patterns: "<element> ... (background) color to <color>" or "<element> ... to <color>"
  const elementMatch = matchElement(text);
  if (!elementMatch) {
    return {
      ok: false,
      explanation:
        'Could not identify a target element. Supported elements: Buy Now button, product heading, product price, product description, banner, footer.',
    };
  }

  const entry = getElementEntry(elementMatch.elementId);
  if (!entry) {
    return { ok: false, explanation: 'Internal error: element not found in registry.' };
  }

  const target = buildTarget(elementMatch.elementId, state);
  if (!target) {
    return { ok: false, explanation: 'Could not build target metadata.' };
  }

  // ---- Determine property ----

  // Check for explicit "background color" / "bg color"
  const isBgColor =
    text.includes('background color') ||
    text.includes('background colour') ||
    text.includes('bg color') ||
    text.includes('bg colour') ||
    (text.includes('background') && text.includes('color'));

  // Check for explicit "text color" / "font color" / "text colour"
  const isTextColor =
    text.includes('text color') ||
    text.includes('text colour') ||
    text.includes('font color') ||
    text.includes('font colour') ||
    text.includes('textcolour');

  // Check for rename / label change
  const isRename =
    text.startsWith('rename') ||
    text.includes('label to') ||
    text.includes('button to') === false && (text.includes('rename') && text.includes('to'));

  // Extract the value after "to" keyword (the last "to" in the sentence)
  const toIndex = text.lastIndexOf(' to ');
  let rawValue = '';
  if (toIndex !== -1) {
    rawValue = text.slice(toIndex + 4).trim();
  }

  // Remove trailing punctuation
  rawValue = rawValue.replace(/[.!?]+$/, '').trim();

  // ---- Route to property ----

  // Color change for background
  if (isBgColor || (!isTextColor && !isRename && entry.elementType === 'button' && !entry.supportedProperties.includes('text') && entry.supportedProperties.includes('bgColor'))) {
    const colorHex = resolveColor(rawValue);
    if (!colorHex) {
      return {
        ok: false,
        explanation: `"${rawValue}" is not a recognized color. Try named colors like green, red, blue, or a hex code like #22c55e.`,
      };
    }
    if (!entry.supportedProperties.includes('bgColor')) {
      return {
        ok: false,
        explanation: `The ${entry.label} does not support background color changes.`,
      };
    }
    return {
      ok: true,
      target,
      property: 'bgColor',
      newValue: colorHex,
      explanation: `Interpreted: change the ${entry.label} background color to ${colorHex}.`,
    };
  }

  // Text color change
  if (isTextColor) {
    const colorHex = resolveColor(rawValue);
    if (!colorHex) {
      return {
        ok: false,
        explanation: `"${rawValue}" is not a recognized color. Try named colors like green, red, blue, or a hex code.`,
      };
    }
    if (!entry.supportedProperties.includes('textColor')) {
      return {
        ok: false,
        explanation: `The ${entry.label} does not support text color changes.`,
      };
    }
    return {
      ok: true,
      target,
      property: 'textColor',
      newValue: colorHex,
      explanation: `Interpreted: change the ${entry.label} text color to ${colorHex}.`,
    };
  }

  // For buttons: "to green" without "label" or "rename" -> background color
  if (entry.elementType === 'button' && !isRename) {
    const colorHex = resolveColor(rawValue);
    if (colorHex && entry.supportedProperties.includes('bgColor')) {
      return {
        ok: true,
        target,
        property: 'bgColor',
        newValue: colorHex,
        explanation: `Interpreted: change the ${entry.label} background color to ${colorHex}.`,
      };
    }
    // If not a color, treat as label change
    if (rawValue && entry.supportedProperties.includes('label')) {
      return {
        ok: true,
        target,
        property: 'label',
        newValue: capitalize(rawValue),
        explanation: `Interpreted: change the ${entry.label} label to "${capitalize(rawValue)}".`,
      };
    }
  }

  // Banner: "to yellow" -> background color if it's a color, else text
  if (entry.elementType === 'banner' && !isRename) {
    const colorHex = resolveColor(rawValue);
    if (colorHex && entry.supportedProperties.includes('bgColor')) {
      return {
        ok: true,
        target,
        property: 'bgColor',
        newValue: colorHex,
        explanation: `Interpreted: change the ${entry.label} background color to ${colorHex}.`,
      };
    }
  }

  // Generic text change (heading, description, price, footer)
  if (rawValue && entry.supportedProperties.includes('text')) {
    return {
      ok: true,
      target,
      property: 'text',
      newValue: capitalize(rawValue),
      explanation: `Interpreted: change the ${entry.label} text to "${rawValue}".`,
    };
  }

  // Label change (buttons)
  if (rawValue && entry.supportedProperties.includes('label')) {
    return {
      ok: true,
      target,
      property: 'label',
      newValue: capitalize(rawValue),
      explanation: `Interpreted: change the ${entry.label} label to "${capitalize(rawValue)}".`,
    };
  }

  return {
    ok: false,
    explanation:
      'Could not determine what to change. Try: "Change the Buy Now button to green." or "Rename Buy Now to Add to Cart."',
  };
}

function capitalize(s: string): string {
  // Preserve original casing for words that look like proper names or have caps
  if (/[A-Z]/.test(s)) return s;
  // Capitalize first letter only for short labels
  if (s.length <= 30) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return s;
}

// ========================
// Manual Patch Form Helper
// ========================

export function validatePatchValue(
  property: PatchProperty,
  value: string,
): { valid: boolean; message: string } {
  if (!value.trim()) {
    return { valid: false, message: 'Value cannot be empty.' };
  }
  if (property === 'bgColor' || property === 'textColor') {
    const hex = resolveColor(value);
    if (!hex) {
      return {
        valid: false,
        message: `"${value}" is not a valid color. Use a named color (green, red, blue...) or hex (#22c55e).`,
      };
    }
    return { valid: true, message: hex };
  }
  // text or label
  if (value.length > 500) {
    return { valid: false, message: 'Value is too long (max 500 characters).' };
  }
  return { valid: true, message: value };
}
