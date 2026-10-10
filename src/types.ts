// ========================
// Core Type Definitions
// ========================

export type PatchProperty = 'text' | 'label' | 'bgColor' | 'textColor';

export type PatchStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'deployed'
  | 'rolled_back';

export type CheckResult = {
  name: string;
  passed: boolean;
  message: string;
};

export type VerificationResult = {
  checks: CheckResult[];
  passed: boolean;
  timestamp: number;
};

export type PatchTarget = {
  elementId: string;       // stable app-internal element ID (not a CSS selector)
  elementType: string;     // 'button' | 'heading' | 'paragraph' | etc.
  label: string;           // accessible label / text
  context: string;         // surrounding context description
};

export type Patch = {
  id: string;
  author: string;
  createdAt: number;
  target: PatchTarget;
  property: PatchProperty;
  oldValue: string;
  newValue: string;
  status: PatchStatus;
  baseVersion: number;      // the website version the patch was created against
  verification: VerificationResult | null;
  reviewComment: string;
  deployedVersion: number | null;
  rolledBackAt: number | null;
  rolledBackByVersion: number | null;
};

export type StaleReplacement = {
  suggested: PatchTarget | null;
  confidence: number;       // 0-1
  message: string;
};

// The controllable website state
export type WebsiteState = {
  navLinks: string[];
  productHeading: string;
  productPrice: string;
  productDescription: string;
  buyButtonLabel: string;
  buyButtonBgColor: string;
  buyButtonTextColor: string;
  bannerText: string;
  bannerBgColor: string;
  footerText: string;
};

export type Version = {
  version: number;
  timestamp: number;
  state: WebsiteState;
  patchIds: string[];
  description: string;
};

export type AuditEvent = {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  details: string;
  patchId?: string;
  version?: number;
};

export type Developer = {
  id: string;
  name: string;
  role: 'contributor' | 'reviewer' | 'admin';
};

export type Conflict = {
  patchId: string;
  conflictingPatchId: string;
  elementId: string;
  property: PatchProperty;
  reason: string;
};

export type ViewName = 'dashboard' | 'patches' | 'preview' | 'history' | 'audit';
