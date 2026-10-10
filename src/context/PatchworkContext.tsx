import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Patch, WebsiteState, Version, AuditEvent, Developer, ViewName, VerificationResult, StaleReplacement } from '@/types';
import {
  initialWebsiteState,
  developers,
  generatePatchId,
  generateAuditId,
  buildTarget,
  getElementEntry,
  loadFromStorage,
  saveState,
} from '@/lib/sampleData';
import { verifyPatch, applyPatchToState, suggestStaleReplacement } from '@/lib/verification';
import { detectConflicts } from '@/lib/verification';
import type { ConflictInfo } from '@/lib/verification';

type PatchworkContextValue = {
  // State
  patches: Patch[];
  versions: Version[];
  audit: AuditEvent[];
  websiteState: WebsiteState;
  currentVersion: number;
  activeDeveloper: Developer;
  selectedPatchId: string | null;
  view: ViewName;
  conflicts: ConflictInfo[];

  // Derived
  selectedPatch: Patch | null;

  // Actions
  setView: (v: ViewName) => void;
  setActiveDeveloper: (dev: Developer) => void;
  selectPatch: (id: string | null) => void;
  createPatch: (params: {
    target: Patch['target'];
    property: Patch['property'];
    oldValue: string;
    newValue: string;
  }) => Patch;
  runVerification: (patchId: string) => void;
  approvePatch: (patchId: string, comment?: string) => void;
  rejectPatch: (patchId: string, comment?: string) => void;
  deployPatch: (patchId: string) => { success: boolean; message: string };
  rollbackToVersion: (version: number) => { success: boolean; message: string };
  resolveConflict: (patchId: string, keepPatchId: string) => void;
  resetAll: () => void;
  addAuditEvent: (action: string, details: string, patchId?: string, version?: number) => void;
  simulateStaleTarget: (patchId: string) => void;
  getSuggestedReplacement: (patchId: string) => StaleReplacement | null;
};

const PatchworkContext = createContext<PatchworkContextValue | null>(null);

export function usePatchwork() {
  const ctx = useContext(PatchworkContext);
  if (!ctx) throw new Error('usePatchwork must be used within PatchworkProvider');
  return ctx;
}

export function PatchworkProvider({ children }: { children: ReactNode }) {
  // Load from localStorage on init
  const stored = loadFromStorage();

  const [patches, setPatches] = useState<Patch[]>(
    stored.patches ?? [],
  );
  const [versions, setVersions] = useState<Version[]>(
    stored.versions ?? [
      {
        version: 1,
        timestamp: Date.now(),
        state: initialWebsiteState,
        patchIds: [],
        description: 'Initial version — original sample website',
      },
    ],
  );
  const [audit, setAudit] = useState<AuditEvent[]>(
    stored.audit ?? [
      {
        id: generateAuditId(),
        timestamp: Date.now(),
        actor: 'system',
        action: 'INIT',
        details: 'PATCHWORK initialized. Version 1 created with original sample website.',
        version: 1,
      },
    ],
  );
  const [websiteState, setWebsiteState] = useState<WebsiteState>(
    stored.websiteState ?? initialWebsiteState,
  );
  const [currentVersion, setCurrentVersion] = useState<number>(
    stored.currentVersion ?? 1,
  );
  const [activeDeveloper, setActiveDeveloper] = useState<Developer>(
    developers.find((d) => d.id === stored.activeDevId) ?? developers[0],
  );
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [view, setView] = useState<ViewName>('dashboard');

  // Persist to localStorage on every change
  useEffect(() => {
    saveState(patches, versions, audit, currentVersion, websiteState, activeDeveloper.id);
  }, [patches, versions, audit, currentVersion, websiteState, activeDeveloper]);

  // Compute conflicts
  const conflicts = detectConflicts(patches);

  const selectedPatch = patches.find((p) => p.id === selectedPatchId) ?? null;

  // ---- Audit helper ----
  const addAuditEvent = useCallback(
    (action: string, details: string, patchId?: string, version?: number) => {
      setAudit((prev) => [
        ...prev,
        {
          id: generateAuditId(),
          timestamp: Date.now(),
          actor: activeDeveloper.name,
          action,
          details,
          patchId,
          version,
        },
      ]);
    },
    [activeDeveloper],
  );

  // ---- Create Patch ----
  const createPatch = useCallback(
    (params: {
      target: Patch['target'];
      property: Patch['property'];
      oldValue: string;
      newValue: string;
    }): Patch => {
      const id = generatePatchId();
      const patch: Patch = {
        id,
        author: activeDeveloper.name,
        createdAt: Date.now(),
        target: params.target,
        property: params.property,
        oldValue: params.oldValue,
        newValue: params.newValue,
        status: 'pending',
        baseVersion: currentVersion,
        verification: null,
        reviewComment: '',
        deployedVersion: null,
        rolledBackAt: null,
        rolledBackByVersion: null,
      };
      setPatches((prev) => [...prev, patch]);
      addAuditEvent(
        'PATCH_CREATED',
        `Patch ${id} created by ${activeDeveloper.name}: ${params.target.label} ${params.property} from "${truncate(params.oldValue)}" to "${truncate(params.newValue)}".`,
        id,
      );
      return patch;
    },
    [activeDeveloper, currentVersion, addAuditEvent],
  );

  // ---- Run Verification ----
  const runVerification = useCallback(
    (patchId: string) => {
      setPatches((prev) =>
        prev.map((p) => {
          if (p.id !== patchId) return p;
          const staleReplacement = suggestStaleReplacement(p, websiteState);
          const result = verifyPatch(p, websiteState, prev, currentVersion, staleReplacement);
          addAuditEvent(
            'VERIFIED',
            `Verification for ${patchId}: ${result.passed ? 'PASSED' : 'FAILED'} — ${result.checks.filter((c) => c.passed).length}/${result.checks.length} checks passed.`,
            patchId,
          );
          return { ...p, verification: result };
        }),
      );
    },
    [websiteState, currentVersion, addAuditEvent],
  );

  // ---- Approve ----
  const approvePatch = useCallback(
    (patchId: string, comment?: string) => {
      const patch = patches.find((p) => p.id === patchId);
      if (!patch) return;
      if (patch.verification == null || !patch.verification.passed) {
        addAuditEvent(
          'APPROVE_BLOCKED',
          `Cannot approve ${patchId}: verification has not passed.`,
          patchId,
        );
        return;
      }
      // Only reviewer or admin can approve
      if (activeDeveloper.role === 'contributor') {
        addAuditEvent(
          'APPROVE_BLOCKED',
          `${activeDeveloper.name} (contributor) cannot approve patches. Only reviewers or admins can approve.`,
          patchId,
        );
        return;
      }
      setPatches((prev) =>
        prev.map((p) =>
          p.id === patchId
            ? { ...p, status: 'approved', reviewComment: comment || p.reviewComment }
            : p,
        ),
      );
      addAuditEvent(
        'APPROVED',
        `Patch ${patchId} approved by ${activeDeveloper.name}.${comment ? ` Comment: "${comment}"` : ''}`,
        patchId,
      );
    },
    [patches, activeDeveloper, addAuditEvent],
  );

  // ---- Reject ----
  const rejectPatch = useCallback(
    (patchId: string, comment?: string) => {
      const patch = patches.find((p) => p.id === patchId);
      if (!patch) return;
      if (activeDeveloper.role === 'contributor') {
        addAuditEvent(
          'REJECT_BLOCKED',
          `${activeDeveloper.name} (contributor) cannot reject patches. Only reviewers or admins can reject.`,
          patchId,
        );
        return;
      }
      setPatches((prev) =>
        prev.map((p) =>
          p.id === patchId
            ? { ...p, status: 'rejected', reviewComment: comment || p.reviewComment }
            : p,
        ),
      );
      addAuditEvent(
        'REJECTED',
        `Patch ${patchId} rejected by ${activeDeveloper.name}.${comment ? ` Comment: "${comment}"` : ''}`,
        patchId,
      );
    },
    [patches, activeDeveloper, addAuditEvent],
  );

  // ---- Deploy ----
  const deployPatch = useCallback(
    (patchId: string): { success: boolean; message: string } => {
      const patch = patches.find((p) => p.id === patchId);
      if (!patch) return { success: false, message: 'Patch not found.' };

      if (patch.status !== 'approved') {
        const msg = `Cannot deploy ${patchId}: status is "${patch.status}", must be "approved".`;
        addAuditEvent('DEPLOY_BLOCKED', msg, patchId);
        return { success: false, message: msg };
      }

      if (!patch.verification || !patch.verification.passed) {
        const msg = `Cannot deploy ${patchId}: verification has not passed.`;
        addAuditEvent('DEPLOY_BLOCKED', msg, patchId);
        return { success: false, message: msg };
      }

      // Re-check conflicts with deployed patches
      const conflictingDeployed = patches.filter(
        (p) =>
          p.id !== patchId &&
          p.status === 'deployed' &&
          p.target.elementId === patch.target.elementId &&
          p.property === patch.property,
      );
      if (conflictingDeployed.length > 0) {
        const msg = `Cannot deploy ${patchId}: conflicts with deployed patch(es) ${conflictingDeployed.map((c) => c.id).join(', ')}. Resolve conflicts first.`;
        addAuditEvent('DEPLOY_BLOCKED', msg, patchId);
        return { success: false, message: msg };
      }

      // Re-verify old value matches current (stale check)
      const entry = getElementEntry(patch.target.elementId);
      if (entry) {
        const currentValue = readCurrentValue(websiteState, patch.target.elementId, patch.property);
        if (currentValue !== patch.oldValue) {
          const msg = `Cannot deploy ${patchId}: stale patch. Old value was "${truncate(patch.oldValue)}" but current value is "${truncate(currentValue)}". Re-verify the patch against the current state.`;
          addAuditEvent('DEPLOY_BLOCKED', msg, patchId);
          return { success: false, message: msg };
        }
      }

      // Apply the patch
      const newState = applyPatchToState(websiteState, patch);
      const newVersionNumber = currentVersion + 1;
      const newVersion: Version = {
        version: newVersionNumber,
        timestamp: Date.now(),
        state: newState,
        patchIds: [patchId],
        description: `Deployed: ${patch.target.label} ${patch.property} → "${truncate(patch.newValue)}"`,
      };

      setWebsiteState(newState);
      setVersions((prev) => [...prev, newVersion]);
      setCurrentVersion(newVersionNumber);
      setPatches((prev) =>
        prev.map((p) =>
          p.id === patchId ? { ...p, status: 'deployed', deployedVersion: newVersionNumber } : p,
        ),
      );

      // Mark other patches targeting the same element+property as stale
      setPatches((prev) =>
        prev.map((p) => {
          if (
            p.id !== patchId &&
            p.target.elementId === patch.target.elementId &&
            p.property === patch.property &&
            (p.status === 'pending' || p.status === 'approved')
          ) {
            // They need re-verification — clear their verification
            return { ...p, verification: null };
          }
          return p;
        }),
      );

      addAuditEvent(
        'DEPLOYED',
        `Patch ${patchId} deployed by ${activeDeveloper.name}. Version ${newVersionNumber} created.`,
        patchId,
        newVersionNumber,
      );

      return {
        success: true,
        message: `Patch ${patchId} deployed. Version ${newVersionNumber} created.`,
      };
    },
    [patches, websiteState, currentVersion, activeDeveloper, addAuditEvent],
  );

  // ---- Rollback ----
  
  // ---- Rollback ----
  const rollbackToVersion = useCallback(
    (version: number): { success: boolean; message: string } => {
      const targetVersion = versions.find((v) => v.version === version);

      if (!targetVersion) {
        const msg = `Cannot rollback: version ${version} does not exist.`;
        addAuditEvent('ROLLBACK_FAILED', msg, undefined, version);
        return { success: false, message: msg };
      }

      if (version >= currentVersion) {
        const msg = `Cannot rollback: version ${version} is the current or a future version.`;
        addAuditEvent('ROLLBACK_FAILED', msg, undefined, version);
        return { success: false, message: msg };
      }

      // Identify patches that will be undone.
      const undoneVersions = versions.filter(
        (v) => v.version > version && v.version <= currentVersion
      );
      const undonePatchIds = undoneVersions.flatMap((v) => v.patchIds);

      // Keep version numbers increasing after rollback.
      const newVersionNumber =
        Math.max(...versions.map((v) => v.version), currentVersion) + 1;

      const rollbackVersion: Version = {
        version: newVersionNumber,
        timestamp: Date.now(),
        state: { ...targetVersion.state },
        patchIds: [],
        description: `Rollback: restored website state from v${version}`,
      };

      // Restore the website and record the new version.
      setWebsiteState({ ...targetVersion.state });
      setVersions((prev) => [...prev, rollbackVersion]);
      setCurrentVersion(newVersionNumber);

      // Mark undone patches and clear outdated verification results.
      setPatches((prev) =>
        prev.map((p) => {
          if (undonePatchIds.includes(p.id) && p.status === 'deployed') {
            return {
              ...p,
              status: 'rolled_back',
              rolledBackAt: Date.now(),
              rolledBackByVersion: newVersionNumber,
            };
          }

          if (p.status === 'pending' || p.status === 'approved') {
            return { ...p, verification: null };
          }

          return p;
        })
      );

      const msg =
        `Rolled back from v${currentVersion} to the state of v${version}. ` +
        `New version v${newVersionNumber} created. ` +
        `Undone patches: ${
          undonePatchIds.length > 0 ? undonePatchIds.join(', ') : 'none'
        }.`;

      addAuditEvent('ROLLBACK_SUCCESS', msg, undefined, newVersionNumber);

      return { success: true, message: msg };
    },
    [versions, currentVersion, addAuditEvent],
  );

  // ---- Resolve Conflict ----
  const resolveConflict = useCallback(
    (patchId: string, keepPatchId: string) => {
      // Reject the other patch
      const patch = patches.find((p) => p.id === patchId);
      const otherPatch = patches.find((p) => p.id === keepPatchId);
      if (!patch || !otherPatch) return;

      // The patch that is NOT kept gets rejected
      const rejectId = patchId === keepPatchId ? null : findConflictingPatchId(patches, patchId, keepPatchId);
      if (rejectId) {
        setPatches((prev) =>
          prev.map((p) =>
            p.id === rejectId
              ? { ...p, status: 'rejected', reviewComment: `Rejected due to conflict with ${keepPatchId}.` }
              : p,
          ),
        );
        addAuditEvent(
          'CONFLICT_RESOLVED',
          `Conflict resolved: kept ${keepPatchId}, rejected ${rejectId}.`,
          keepPatchId,
        );
      }
    },
    [patches, addAuditEvent],
  );

  // ---- Simulate Stale Target ----
  const simulateStaleTarget = useCallback((patchId: string) => {
    // This simulates a target element changing by clearing verification on the patch
    // and adding an audit event
    setPatches((prev) =>
      prev.map((p) =>
        p.id === patchId ? { ...p, verification: null } : p,
      ),
    );
  }, []);

  const getSuggestedReplacement = useCallback(
    (patchId: string): StaleReplacement | null => {
      const patch = patches.find((p) => p.id === patchId);
      if (!patch) return null;
      return suggestStaleReplacement(patch, websiteState);
    },
    [patches, websiteState],
  );

  // ---- Reset ----
  const resetAll = useCallback(() => {
    setPatches([]);
    setVersions([
      {
        version: 1,
        timestamp: Date.now(),
        state: initialWebsiteState,
        patchIds: [],
        description: 'Initial version — original sample website',
      },
    ]);
    setWebsiteState(initialWebsiteState);
    setCurrentVersion(1);
    setAudit([
      {
        id: generateAuditId(),
        timestamp: Date.now(),
        actor: 'system',
        action: 'RESET',
        details: 'All data reset. Version 1 restored.',
        version: 1,
      },
    ]);
    setSelectedPatchId(null);
  }, []);

  const selectPatch = useCallback((id: string | null) => {
    setSelectedPatchId(id);
  }, []);

  const value: PatchworkContextValue = {
    patches,
    versions,
    audit,
    websiteState,
    currentVersion,
    activeDeveloper,
    selectedPatchId,
    view,
    conflicts,
    selectedPatch,
    setView,
    setActiveDeveloper,
    selectPatch,
    createPatch,
    runVerification,
    approvePatch,
    rejectPatch,
    deployPatch,
    rollbackToVersion,
    resolveConflict,
    resetAll,
    addAuditEvent,
    simulateStaleTarget,
    getSuggestedReplacement,
  };

  return <PatchworkContext.Provider value={value}>{children}</PatchworkContext.Provider>;
}

// Helpers
function truncate(s: string, len = 40): string {
  if (s.length <= len) return s;
  return s.slice(0, len) + '...';
}

function readCurrentValue(
  state: WebsiteState,
  elementId: string,
  property: Patch['property'],
): string {
  const entry = getElementEntry(elementId);
  if (!entry) return '';
  switch (property) {
    case 'text':
    case 'label':
      return entry.readValue(state);
    case 'bgColor':
      if (elementId === 'buy-button') return state.buyButtonBgColor;
      if (elementId === 'banner') return state.bannerBgColor;
      return '';
    case 'textColor':
      if (elementId === 'buy-button') return state.buyButtonTextColor;
      return '';
    default:
      return '';
  }
}

function findConflictingPatchId(patches: Patch[], patchId: string, keepId: string): string | null {
  const patch = patches.find((p) => p.id === patchId);
  if (!patch) return null;
  const conflicting = patches.find(
    (p) =>
      p.id !== patchId &&
      p.id !== keepId &&
      p.target.elementId === patch.target.elementId &&
      p.property === patch.property &&
      (p.status === 'pending' || p.status === 'approved' || p.status === 'deployed'),
  );
  return conflicting?.id ?? null;
}
