import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_WEBSITE_STATE,
  getConflicts,
  getPatchRevision,
  getStalePatches,
  formatOptionLabel,
  formatStatus,
  makePatch,
  normalizeWebsiteUrl,
  parseRequest,
  resolveSmartTarget,
} from './patchUtils.js';

test('parses supported color, heading, button text, and card requests', () => {
  assert.deepEqual(parseRequest('Change the Buy Now button to green'), {
    target: 'buy-now-button', property: 'backgroundColor', newValue: 'green',
  });
  assert.deepEqual(parseRequest('Change the Buy Now button text to Purchase Now'), {
    target: 'buy-now-button', property: 'textContent', newValue: 'Purchase Now',
  });
  assert.deepEqual(parseRequest('Change the main heading to Welcome to our Store'), {
    target: 'main-heading', property: 'textContent', newValue: 'Welcome to our Store',
  });
  assert.deepEqual(parseRequest('Change the product card background to light blue'), {
    target: 'product-card', property: 'backgroundColor', newValue: 'light blue',
  });
  assert.deepEqual(parseRequest('Change the product card layout to split'), {
    target: 'product-card', property: 'layout', newValue: 'split',
  });
  assert.deepEqual(parseRequest('Change the Buy Now button behavior to request-notification'), {
    target: 'buy-now-button', property: 'behavior', newValue: 'request-notification',
  });
  assert.deepEqual(parseRequest('Change the Buy Now button text color to red'), {
    target: 'buy-now-button', property: 'color', newValue: 'red',
  });
  assert.deepEqual(parseRequest('Change the main heading font size to 28px'), {
    target: 'main-heading', property: 'fontSize', newValue: '28px',
  });
  assert.deepEqual(parseRequest('Change the product card border radius to 12px'), {
    target: 'product-card', property: 'borderRadius', newValue: '12px',
  });
});

test('rejects unsupported, invalid, and no-op requests', () => {
  assert.match(parseRequest('Change the button to chartreuse').error, /couldn’t map/);
  assert.match(parseRequest('Change the Buy Now button to chartreuse').error, /supported color/);
  assert.match(parseRequest('Change the product card layout to carousel').error, /supported Card Layout/);
  assert.match(parseRequest('Change the Buy Now button behavior to run-script').error, /supported Click Behavior/);
  const noOp = makePatch({
    id: 'P-001',
    parsed: parseRequest('Change the Buy Now button to blue'),
    websiteState: INITIAL_WEBSITE_STATE,
  });
  assert.match(noOp.error, /already has/);
});

test('creates the shared patch format from the current website value', () => {
  const parsed = parseRequest('Change the Buy Now button to green');
  const result = makePatch({ id: 'P-001', parsed, websiteState: INITIAL_WEBSITE_STATE, createdAt: '2026-10-10T00:00:00.000Z' });
  assert.deepEqual(result.patch, {
    id: 'P-001', workspaceId: undefined, target: 'buy-now-button', property: 'backgroundColor',
    oldValue: 'blue', newValue: 'green', status: 'pending', createdAt: '2026-10-10T00:00:00.000Z',
    author: undefined,
    comments: [], trackingStatus: 'valid', validationStatus: 'not-tested',
    description: 'Primary Button: Background Color',
    locator: {
      selector: '[data-patch-target="buy-now-button"]',
      semanticLabel: 'Studio One purchase action', tagName: 'button', container: 'product-card',
      role: 'button', accessibleName: 'Studio One purchase action',
      fingerprint: 'button:Studio One purchase action',
    },
  });
});

test('normalizes URL input and rejects unsafe or invalid protocols', () => {
  assert.deepEqual(normalizeWebsiteUrl('example.com'), { url: 'https://example.com/' });
  assert.deepEqual(normalizeWebsiteUrl('http://localhost:4000/store'), { url: 'http://localhost:4000/store' });
  assert.match(normalizeWebsiteUrl('javascript:alert(1)').error, /valid public website URL/);
  assert.match(normalizeWebsiteUrl('').error, /Enter a website URL/);
});

test('flags only pending patches that target the same property', () => {
  const patches = [
    { id: 'P-001', target: 'buy-now-button', property: 'backgroundColor', status: 'pending' },
    { id: 'P-002', target: 'buy-now-button', property: 'backgroundColor', status: 'pending' },
    { id: 'P-003', target: 'buy-now-button', property: 'textContent', status: 'pending' },
    { id: 'P-004', target: 'buy-now-button', property: 'backgroundColor', status: 'rejected' },
  ];
  assert.deepEqual(getConflicts(patches).map(({ first, second }) => [first.id, second.id]), [['P-001', 'P-002']]);
});

test('flags pending patches whose original value no longer matches live state', () => {
  const patches = [
    { id: 'P-001', target: 'buy-now-button', property: 'backgroundColor', oldValue: 'blue', status: 'pending' },
    { id: 'P-002', target: 'main-heading', property: 'textContent', oldValue: INITIAL_WEBSITE_STATE['main-heading'].textContent, status: 'pending' },
    { id: 'P-003', target: 'buy-now-button', property: 'backgroundColor', oldValue: 'blue', status: 'rejected' },
  ];
  const website = { ...INITIAL_WEBSITE_STATE, 'buy-now-button': { ...INITIAL_WEBSITE_STATE['buy-now-button'], backgroundColor: 'green' } };
  assert.deepEqual(getStalePatches(patches, website).map(({ id }) => id), ['P-001']);
});

test('re-locates a stable target after its structural container changes', () => {
  const element = {
    dataset: { patchTarget: 'product-card', patchSemantic: 'Studio One product card' },
    tagName: 'ARTICLE',
    parentElement: { closest: () => ({ dataset: { patchContainer: 'featured-rail' } }) },
  };
  const result = resolveSmartTarget({
    target: 'product-card',
    locator: { semanticLabel: 'Studio One product card', tagName: 'article', container: 'product-grid' },
  }, { querySelectorAll: () => [element] });
  assert.equal(result.element, element);
  assert.equal(result.method, 'stable-key');
  assert.equal(result.moved, true);
});

test('falls back to the semantic locator when a stable target key is missing', () => {
  const element = {
    dataset: { patchSemantic: 'Studio One purchase action' },
    tagName: 'BUTTON',
    parentElement: { closest: () => ({ dataset: { patchContainer: 'product-card' } }) },
  };
  const result = resolveSmartTarget({
    target: 'buy-now-button',
    locator: { semanticLabel: 'Studio One purchase action', tagName: 'button', container: 'product-card' },
  }, { querySelectorAll: () => [element] });
  assert.equal(result.element, element);
  assert.equal(result.method, 'semantic-context');
  assert.equal(result.moved, false);
});

test('verification revision changes when a proposed patch value changes', () => {
  const patch = { workspaceId: 'W-1', target: 'buy-now-button', property: 'backgroundColor', oldValue: 'blue', newValue: 'green' };
  const verifiedRevision = getPatchRevision(patch);
  assert.notEqual(getPatchRevision({ ...patch, newValue: 'red' }), verifiedRevision);
  assert.equal(getPatchRevision(patch), verifiedRevision);
});

test('formats statuses and option labels without changing internal values', () => {
  assert.equal(formatStatus('rolled_back'), 'Rolled Back');
  assert.equal(formatStatus('verification_failed'), 'Verification Failed');
  assert.equal(formatStatus('target-missing'), 'Target Missing');
  assert.equal(formatOptionLabel('request-notification'), 'Request Notification');
});