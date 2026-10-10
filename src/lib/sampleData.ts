import type { WebsiteState, Patch, Version, AuditEvent, Developer } from '@/types';

// ========================
// Initial Sample Website
// ========================

export const initialWebsiteState: WebsiteState = {
  navLinks: ['Home', 'Shop', 'Deals', 'About', 'Contact'],
  productHeading: 'Wireless Headphones',
  productPrice: '$129.99',
  productDescription:
    'Immerse yourself in premium sound with these wireless Bluetooth headphones. 40-hour battery life, active noise cancellation, and memory-foam ear cushions for all-day comfort.',
  buyButtonLabel: 'Buy Now',
  buyButtonBgColor: '#3b82f6',
  buyButtonTextColor: '#ffffff',
  bannerText: 'Free shipping on orders over $50 — Limited time only!',
  bannerBgColor: '#fef3c7',
  footerText: '© 2025 ShopDemo. All rights reserved.',
};

// ========================
// Simulated Developers
// ========================

export const developers: Developer[] = [
  { id: 'dev-1', name: 'Alice Chen', role: 'admin' },
  { id: 'dev-2', name: 'Marcus Reid', role: 'reviewer' },
  { id: 'dev-3', name: 'Priya Patel', role: 'contributor' },
  { id: 'dev-4', name: 'Sam Okoye', role: 'contributor' },
];

// ========================
// Element Registry
// ========================
// Defines which elements are patchable and their stable IDs + metadata

export type ElementRegistryEntry = {
  elementId: string;
  elementType: string;
  label: string;
  context: string;
  supportedProperties: string[];
  // reads the current value from a website state
  readValue: (s: WebsiteState) => string;
  // applies a new value, returning a new state
  applyValue: (s: WebsiteState, value: string) => WebsiteState;
};

export const elementRegistry: ElementRegistryEntry[] = [
  {
    elementId: 'product-heading',
    elementType: 'heading',
    label: 'Product Heading',
    context: 'Main product title at the top of the product page',
    supportedProperties: ['text', 'textColor'],
    readValue: (s) => s.productHeading,
    applyValue: (s, v) => ({ ...s, productHeading: v }),
  },
  {
    elementId: 'product-price',
    elementType: 'text',
    label: 'Product Price',
    context: 'Price displayed below the product heading',
    supportedProperties: ['text', 'textColor'],
    readValue: (s) => s.productPrice,
    applyValue: (s, v) => ({ ...s, productPrice: v }),
  },
  {
    elementId: 'product-description',
    elementType: 'paragraph',
    label: 'Product Description',
    context: 'Descriptive paragraph below the price',
    supportedProperties: ['text', 'textColor'],
    readValue: (s) => s.productDescription,
    applyValue: (s, v) => ({ ...s, productDescription: v }),
  },
  {
    elementId: 'buy-button',
    elementType: 'button',
    label: 'Buy Now Button',
    context: 'Primary call-to-action button below the product description',
    supportedProperties: ['label', 'bgColor', 'textColor'],
    readValue: (s) => s.buyButtonLabel,
    applyValue: (s, v) => ({ ...s, buyButtonLabel: v }),
  },
  {
    elementId: 'banner',
    elementType: 'banner',
    label: 'Promotional Banner',
    context: 'Top promotional banner above the product section',
    supportedProperties: ['text', 'bgColor', 'textColor'],
    readValue: (s) => s.bannerText,
    applyValue: (s, v) => ({ ...s, bannerText: v }),
  },
  {
    elementId: 'footer-text',
    elementType: 'footer',
    label: 'Footer Text',
    context: 'Copyright text at the bottom of the page',
    supportedProperties: ['text', 'textColor'],
    readValue: (s) => s.footerText,
    applyValue: (s, v) => ({ ...s, footerText: v }),
  },
];

export function getElementEntry(elementId: string): ElementRegistryEntry | undefined {
  return elementRegistry.find((e) => e.elementId === elementId);
}

export function buildTarget(elementId: string, state: WebsiteState) {
  const entry = getElementEntry(elementId);
  if (!entry) return null;
  return {
    elementId: entry.elementId,
    elementType: entry.elementType,
    label: entry.label,
    context: entry.context,
  };
}

// ========================
// ID Generator
// ========================

let counter = 0;
export function generatePatchId(): string {
  counter++;
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `PTCH-${ts}-${rnd}-${String(counter).padStart(3, '0')}`;
}

export function generateAuditId(): string {
  return `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ========================
// Storage Keys
// ========================

const STORAGE_KEYS = {
  patches: 'patchwork:patches',
  versions: 'patchwork:versions',
  audit: 'patchwork:audit',
  currentVersion: 'patchwork:currentVersion',
  activeDev: 'patchwork:activeDev',
  websiteState: 'patchwork:websiteState',
};

export function saveState(
  patches: Patch[],
  versions: Version[],
  audit: AuditEvent[],
  currentVersion: number,
  websiteState: WebsiteState,
  activeDevId: string,
) {
  try {
    localStorage.setItem(STORAGE_KEYS.patches, JSON.stringify(patches));
    localStorage.setItem(STORAGE_KEYS.versions, JSON.stringify(versions));
    localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(audit));
    localStorage.setItem(STORAGE_KEYS.currentVersion, String(currentVersion));
    localStorage.setItem(STORAGE_KEYS.websiteState, JSON.stringify(websiteState));
    localStorage.setItem(STORAGE_KEYS.activeDev, activeDevId);
  } catch (e) {
    console.warn('Failed to persist to localStorage', e);
  }
}

export function loadFromStorage(): {
  patches: Patch[] | null;
  versions: Version[] | null;
  audit: AuditEvent[] | null;
  currentVersion: number | null;
  websiteState: WebsiteState | null;
  activeDevId: string | null;
} {
  try {
    return {
      patches: JSON.parse(localStorage.getItem(STORAGE_KEYS.patches) || 'null'),
      versions: JSON.parse(localStorage.getItem(STORAGE_KEYS.versions) || 'null'),
      audit: JSON.parse(localStorage.getItem(STORAGE_KEYS.audit) || 'null'),
      currentVersion: localStorage.getItem(STORAGE_KEYS.currentVersion)
        ? Number(localStorage.getItem(STORAGE_KEYS.currentVersion))
        : null,
      websiteState: JSON.parse(localStorage.getItem(STORAGE_KEYS.websiteState) || 'null'),
      activeDevId: localStorage.getItem(STORAGE_KEYS.activeDev),
    };
  } catch {
    return {
      patches: null,
      versions: null,
      audit: null,
      currentVersion: null,
      websiteState: null,
      activeDevId: null,
    };
  }
}

export function clearStorage() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
