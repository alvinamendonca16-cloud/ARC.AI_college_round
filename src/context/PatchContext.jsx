import { createContext, useContext, useEffect, useRef } from 'react';
import {
  getConflicts,
  getPatchRevision,
  INITIAL_WEBSITE_STATE,
  makePatch,
  parseRequest,
  resolveSmartTarget,
  TARGETS,
  validateProposal,
} from '../utils/patchUtils.js';
import { useStoredState } from '../utils/useStoredState.js';

const PatchContext = createContext(null);
export const DEVELOPERS = ['Alex Morgan', 'Priya Shah', 'Jordan Lee', 'Sam Rivera'];

function mergeWebsiteDefaults(savedState) {
  return Object.fromEntries(Object.entries(INITIAL_WEBSITE_STATE).map(([target, defaults]) => [
    target,
    { ...defaults, ...(savedState?.[target] ?? {}) },
  ]));
}

export function PatchProvider({ children }) {
  const [workspace, setWorkspace] = useStoredState('patchwork.workspace', null);
  const [savedWebsiteState, setWebsiteState] = useStoredState('patchwork.website', INITIAL_WEBSITE_STATE);
  const websiteState = mergeWebsiteDefaults(savedWebsiteState);
  const [patches, setPatches] = useStoredState('patchwork.patches', []);
  const [auditEntries, setAuditEntries] = useStoredState('patchwork.audit', []);
  const [verificationRuns, setVerificationRuns] = useStoredState('patchwork.verifications', []);
  const [releases, setReleases] = useStoredState('patchwork.releases', []);
  const [layoutShifted, setLayoutShifted] = useStoredState('patchwork.layoutShifted', false);
  const nextId = useRef(Math.max(0, ...patches.map((patch) => Number(patch.id?.match(/\d+$/)?.[0] ?? 0))) + 1);
  const nextEventId = useRef(Math.max(0, ...auditEntries.map((entry) => Number(entry.id?.match(/\d+$/)?.[0] ?? 0))) + 1);
  const nextReleaseNumber = useRef(Math.max(0, ...releases.map((release) => Number(release.version?.match(/\d+$/)?.[0] ?? 0))) + 1);
  const deployingPatchIds = useRef(new Set());
  const deployedPatchIds = useRef(new Set(patches.filter((patch) => patch.status === 'applied').map((patch) => patch.id)));

  useEffect(() => {
    setWebsiteState((current) => mergeWebsiteDefaults(current));
  }, [setWebsiteState]);

  function createVersion() {
    const version = `v1.0.${nextReleaseNumber.current}`;
    nextReleaseNumber.current += 1;
    return version;
  }

  function recordAudit(type, summary, actor, details = {}) {
    const entry = {
      id: `A-${String(nextEventId.current).padStart(3, '0')}`,
      type,
      summary,
      actor,
      createdAt: new Date().toISOString(),
      ...details,
    };
    nextEventId.current += 1;
    setAuditEntries((current) => [entry, ...current]);
    return entry;
  }

  function createWorkspace(url, isDemo) {
    if (workspace?.url === url && workspace.isDemo === isDemo) {
      recordAudit('workspace_reopened', `${workspace.hostname} workspace reopened`, DEVELOPERS[0], { workspaceId: workspace.id });
      return workspace;
    }
    const nextWorkspace = {
      id: `workspace-${Date.now().toString(36)}`,
      url,
      hostname: new URL(url).hostname,
      isDemo,
      createdAt: new Date().toISOString(),
    };
    setWorkspace(nextWorkspace);
    setWebsiteState(INITIAL_WEBSITE_STATE);
    setPatches([]);
    setVerificationRuns([]);
    setReleases([]);
    setLayoutShifted(false);
    nextReleaseNumber.current = 1;
    nextId.current = 1;
    deployedPatchIds.current.clear();
    recordAudit('workspace_created', isDemo ? 'Built-in demo workspace opened' : `External workspace opened for ${nextWorkspace.hostname}`, DEVELOPERS[0], { workspaceId: nextWorkspace.id });
    return nextWorkspace;
  }

  function createPatch(request, author, description = '') {
    if (!workspace?.isDemo) return { ok: false, message: 'Visual patches are available only for the built-in demo. Open the demo workspace to continue.' };
    const parsed = typeof request === 'string' ? parseRequest(request) : validateProposal(request.target, request.property, request.newValue);
    if (parsed.error) return { ok: false, message: parsed.error };

    const id = `P-${String(nextId.current).padStart(3, '0')}`;
    const result = makePatch({ id, parsed, websiteState, author, workspaceId: workspace.id, description: description || request.description });
    if (result.error) return { ok: false, message: result.error };

    nextId.current += 1;
    setPatches((current) => [result.patch, ...current]);
    recordAudit('patch_created', `${id} proposed: ${result.patch.oldValue} -> ${result.patch.newValue}`, author, { patchId: id });
    const newConflicts = getConflicts([...patches, result.patch]).filter(({ first, second }) => first.id === id || second.id === id);
    for (const { first, second } of newConflicts) {
      recordAudit('conflict_detected', `${first.id} conflicts with ${second.id} on ${first.target}.${first.property}`, author, {
        patchId: id,
        relatedPatchId: first.id === id ? second.id : first.id,
      });
    }
    return { ok: true, patch: result.patch, message: `${id} is ready for review.` };
  }

  function recordVerification({ patchId, actor, checks }) {
    const patch = patches.find((record) => record.id === patchId);
    if (!patch || patch.status !== 'pending') return null;
    const run = {
      id: `V-${String(nextEventId.current).padStart(3, '0')}`,
      patchId,
      actor,
      checks,
      passed: checks.every((check) => check.passed),
      patchRevision: getPatchRevision(patch),
      createdAt: new Date().toISOString(),
    };
    setVerificationRuns((current) => [run, ...current]);
    setPatches((current) => current.map((patch) => patch.id === patchId
      ? { ...patch, validationStatus: run.passed ? 'passed' : 'failed' }
      : patch,
    ));
    recordAudit(run.passed ? 'verification_passed' : 'verification_failed',
      `${patchId} browser checks ${run.passed ? 'passed' : 'failed'} (${checks.filter((check) => check.passed).length}/${checks.length})`,
      actor, { patchId, verificationId: run.id });
    return run;
  }

  function updatePatch(id, value, actor) {
    const patch = patches.find((record) => record.id === id);
    if (!patch || patch.status !== 'pending') return { ok: false, message: 'Only a pending patch can be edited.' };
    const proposal = validateProposal(patch.target, patch.property, value);
    if (proposal.error) return { ok: false, message: proposal.error };
    if (proposal.newValue === patch.oldValue) return { ok: false, message: 'The proposed value must differ from the original value.' };

    const updatedPatch = { ...patch, newValue: proposal.newValue, validationStatus: 'not-tested', editedAt: new Date().toISOString() };
    const updatedPatches = patches.map((record) => record.id === id ? updatedPatch : record);
    setPatches(updatedPatches);
    recordAudit('patch_edited', `${id} proposal edited to ${proposal.newValue}; verification must be rerun`, actor, { patchId: id });
    for (const { first, second } of getConflicts(updatedPatches)) {
      if (first.id === id || second.id === id) {
        recordAudit('conflict_detected', `${first.id} conflicts with ${second.id} on ${first.target}.${first.property}`, actor, {
          patchId: id,
          relatedPatchId: first.id === id ? second.id : first.id,
        });
      }
    }
    return { ok: true, patch: updatedPatch, message: `${id} updated. Run verification again before deployment.` };
  }

  function addComment(id, text, actor) {
    const commentText = text.trim();
    if (!commentText) return { ok: false, message: 'Write a comment before posting.' };
    const patch = patches.find((record) => record.id === id);
    if (!patch) return { ok: false, message: 'That patch no longer exists.' };
    const comment = { id: `C-${Date.now().toString(36)}`, text: commentText, author: actor, createdAt: new Date().toISOString() };
    setPatches((current) => current.map((record) => record.id === id
      ? { ...record, comments: [...(record.comments ?? []), comment] }
      : record,
    ));
    recordAudit('patch_commented', `${actor} commented on ${id}`, actor, { patchId: id });
    return { ok: true, message: 'Comment added.' };
  }

  function revalidatePatches(actor) {
    const conflictIds = new Set(getConflicts(patches).flatMap(({ first, second }) => [first.id, second.id]));
    let needsReview = 0;
    let missing = 0;
    setPatches((current) => current.map((patch) => {
      if (patch.status !== 'pending') return patch;
      const target = resolveSmartTarget(patch, document);
      const stale = websiteState[patch.target]?.[patch.property] !== patch.oldValue;
      const trackingStatus = !target.element ? 'target-missing'
        : stale ? 'needs-review'
          : conflictIds.has(patch.id) ? 'conflict-detected'
            : target.method === 'semantic-context' || target.moved ? 'needs-review' : 'valid';
      if (trackingStatus === 'needs-review') needsReview += 1;
      if (trackingStatus === 'target-missing') missing += 1;
      return {
        ...patch,
        trackingStatus,
        candidate: target.element ? { target: patch.target, confidence: target.confidence, method: target.method, container: target.container } : null,
        locatorMethod: target.method,
      };
    }));
    recordAudit('patches_revalidated', `Revalidated pending patches: ${needsReview} need review, ${missing} targets missing`, actor);
    return { total: patches.filter((patch) => patch.status === 'pending').length, needsReview, missing };
  }

  function resolveTargetReview(id, accepted, actor) {
    const patch = patches.find((record) => record.id === id);
    if (!patch || !patch.candidate) return { ok: false, message: 'No semantic match is available to review.' };
    const trackingStatus = accepted ? 'valid' : 'target-missing';
    setPatches((current) => current.map((record) => record.id === id ? { ...record, trackingStatus } : record));
    recordAudit(accepted ? 'target_match_confirmed' : 'target_match_rejected', `${actor} ${accepted ? 'confirmed' : 'rejected'} target match for ${id}`, actor, { patchId: id });
    return { ok: true, message: accepted ? 'Semantic target confirmed.' : 'Target match rejected; deployment is blocked.' };
  }

  function resetPreview(actor) {
    const resetAt = new Date().toISOString();
    setWebsiteState(INITIAL_WEBSITE_STATE);
    deployedPatchIds.current.clear();
    setPatches((current) => current.map((patch) => patch.status === 'applied'
      ? { ...patch, status: 'rolled_back', rolledBackAt: resetAt }
      : patch,
    ));
    const version = createVersion();
    setReleases((current) => [{ version, patchId: null, action: 'reset', status: 'restored', snapshot: INITIAL_WEBSITE_STATE, actor, createdAt: resetAt }, ...current]);
    recordAudit('preview_reset', `Demo preview restored to its original snapshot as ${version}`, actor, { version });
    return { ok: true, message: `Demo preview reset as ${version}. Audit history was preserved.` };
  }

  function applyPatch(id, actor) {
    if (deployingPatchIds.current.has(id) || deployedPatchIds.current.has(id)) {
      return { ok: false, message: `${id} is already being deployed or has already been deployed.` };
    }
    const patch = patches.find((record) => record.id === id);
    if (!patch || patch.status !== 'pending') {
      return { ok: false, message: 'Only a pending patch can be deployed.' };
    }
    if (!workspace?.isDemo || patch.workspaceId !== workspace.id) return { ok: false, message: 'This patch is not attached to the active demo workspace.' };
    const proposal = validateProposal(patch.target, patch.property, patch.newValue);
    if (proposal.error || websiteState[patch.target]?.[patch.property] === undefined) {
      return { ok: false, message: proposal.error ?? 'The patch target or property no longer exists.' };
    }
    if (getConflicts(patches).some(({ first, second }) => first.id === id || second.id === id)) {
      setPatches((current) => current.map((record) => record.id === id ? { ...record, trackingStatus: 'conflict-detected' } : record));
      recordAudit('deployment_blocked', `${id} deployment blocked by an unresolved patch conflict`, actor, { patchId: id });
      return { ok: false, message: 'Resolve this patch’s pending conflict before deployment.' };
    }
    if (websiteState[patch.target]?.[patch.property] !== patch.oldValue) {
      setPatches((current) => current.map((record) => record.id === id ? { ...record, trackingStatus: 'needs-review' } : record));
      recordAudit('deployment_blocked', `${id} deployment blocked because its original value is stale`, actor, { patchId: id });
      return { ok: false, message: 'This patch is stale because the live value changed. Reject it and generate a fresh patch before applying.' };
    }
    if (patch.trackingStatus === 'target-missing' || patch.trackingStatus === 'needs-review') {
      return { ok: false, message: 'Revalidate and resolve the semantic target before deployment.' };
    }
    const latestVerification = verificationRuns.find((run) => run.patchId === id);
    if (!latestVerification?.passed || latestVerification.patchRevision !== getPatchRevision(patch)) {
      return { ok: false, message: 'This patch needs verification. Run checks again for its current contents before deployment.' };
    }
    const located = resolveSmartTarget(patch, document);
    if (!located.element) {
      setPatches((current) => current.map((record) => record.id === id ? { ...record, trackingStatus: 'target-missing' } : record));
      recordAudit('deployment_blocked', `${id} deployment blocked because its target is missing`, actor, { patchId: id });
      return { ok: false, message: 'The target could not be located by its stable or semantic locator. No changes were deployed.' };
    }

    deployingPatchIds.current.add(id);
    const version = createVersion();
    const deployedAt = new Date().toISOString();
    const nextWebsiteState = {
      ...websiteState,
    };
    nextWebsiteState[patch.target] = { ...websiteState[patch.target], [patch.property]: patch.newValue };
    try {
      setWebsiteState(nextWebsiteState);
      setPatches((current) => current.map((record) =>
        record.id === id ? { ...record, status: 'applied', deployedBy: actor, releaseVersion: version, appliedAt: deployedAt } : record,
      ));
      setReleases((current) => [{
        version, patchId: id, target: patch.target, property: patch.property,
        oldValue: patch.oldValue, newValue: patch.newValue, action: 'deploy', status: 'deployed',
        verificationPassed: latestVerification.passed, snapshot: nextWebsiteState, actor, createdAt: deployedAt,
      }, ...current]);
      recordAudit('patch_deployed', `${id} deployed as ${version}`, actor, { patchId: id, version });
      deployedPatchIds.current.add(id);
    return { ok: true, message: `${id} deployed as ${version}.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected deployment error.';
      recordAudit('deployment_failed', `${id} deployment failed: ${message}`, actor, { patchId: id, version });
      return { ok: false, message: `${id} was not deployed. ${message}` };
    } finally {
      deployingPatchIds.current.delete(id);
    }
  }

  function rejectPatch(id, actor) {
    const patch = patches.find((record) => record.id === id);
    if (!patch || patch.status !== 'pending') {
      return { ok: false, message: 'Only a pending patch can be rejected.' };
    }
    setPatches((current) => current.map((record) =>
      record.id === id ? { ...record, status: 'rejected' } : record,
    ));
    recordAudit('patch_rejected', `${id} rejected by ${actor}`, actor, { patchId: id });
    const relatedConflicts = getConflicts(patches).filter(({ first, second }) => first.id === id || second.id === id);
    for (const { first, second } of relatedConflicts) {
      recordAudit('conflict_resolved', `${id} rejected; conflict with ${first.id === id ? second.id : first.id} is resolved`, actor, {
        patchId: id,
        relatedPatchId: first.id === id ? second.id : first.id,
      });
    }
    return { ok: true, message: `${id} rejected. The sample website was not changed.` };
  }

  function resolveConflict(keepId, rejectId, actor) {
    const isConflict = getConflicts(patches).some(({ first, second }) =>
      (first.id === keepId && second.id === rejectId) || (first.id === rejectId && second.id === keepId),
    );
    if (!isConflict) return { ok: false, message: 'Those patches are not an active conflict.' };
    setPatches((current) => current.map((patch) => patch.id === rejectId
      ? { ...patch, status: 'rejected', rejectedBy: actor, rejectedAt: new Date().toISOString() }
      : patch.id === keepId ? { ...patch, trackingStatus: 'valid' } : patch,
    ));
    recordAudit('conflict_resolved', `${actor} kept ${keepId} and rejected ${rejectId}`, actor, { patchId: keepId, relatedPatchId: rejectId });
    recordAudit('patch_rejected', `${rejectId} rejected to resolve conflict with ${keepId}`, actor, { patchId: rejectId, relatedPatchId: keepId });
    return { ok: true, message: `Conflict resolved. ${keepId} remains pending; ${rejectId} was rejected.` };
  }

  function rollbackPatch(id, actor) {
    const patch = patches.find((record) => record.id === id);
    if (!patch || patch.status !== 'applied') {
      return { ok: false, message: 'Only an applied patch can be rolled back.' };
    }
    if (websiteState[patch.target]?.[patch.property] !== patch.newValue) {
      recordAudit('rollback_blocked', `${id} rollback blocked because the live value changed after deployment`, actor, { patchId: id });
      return { ok: false, message: `${id} cannot be rolled back safely because the live value changed after it was applied.` };
    }
    const version = createVersion();
    const rolledBackAt = new Date().toISOString();

    setWebsiteState((current) => ({
      ...current,
      [patch.target]: { ...current[patch.target], [patch.property]: patch.oldValue },
    }));
    setPatches((current) => current.map((record) =>
      record.id === id ? { ...record, status: 'rolled_back', rollbackVersion: version, rolledBackAt } : record,
    ));
    setReleases((current) => [{
      version, patchId: id, target: patch.target, property: patch.property,
      oldValue: patch.newValue, newValue: patch.oldValue, action: 'rollback', status: 'restored',
      snapshot: { ...websiteState, [patch.target]: { ...websiteState[patch.target], [patch.property]: patch.oldValue } }, actor, createdAt: rolledBackAt,
    }, ...current]);
    recordAudit('patch_rolled_back', `${id} reverted as ${version}; original value restored`, actor, { patchId: id, version });
    return { ok: true, message: `${id} rolled back as ${version}. The original value was restored.` };
  }

  function simulateUpstreamChange(actor, target = 'main-heading', property = 'textContent') {
    const currentValue = websiteState[target]?.[property];
    const propertyDefinition = TARGETS[target]?.properties[property];
    if (currentValue === undefined || !propertyDefinition) {
      return { ok: false, message: 'The selected website property could not be updated.' };
    }
    const choices = propertyDefinition.values;
    const nextValue = choices
      ? choices.find((value) => value !== currentValue)
      : target === 'main-heading'
        ? currentValue === INITIAL_WEBSITE_STATE['main-heading'].textContent
          ? 'Sound that moves with you.'
          : INITIAL_WEBSITE_STATE['main-heading'].textContent
        : currentValue === 'Buy Now' ? 'Shop Studio One' : 'Buy Now';
    const version = createVersion();
    setWebsiteState((current) => ({
      ...current,
      [target]: { ...current[target], [property]: nextValue },
    }));
    setReleases((current) => [{
      version, patchId: null, target, property, oldValue: currentValue, newValue: nextValue,
      action: 'upstream', status: 'updated',
      snapshot: { ...websiteState, [target]: { ...websiteState[target], [property]: nextValue } },
      actor, createdAt: new Date().toISOString(),
    }, ...current]);
    recordAudit('upstream_change', `External site update changed ${target}.${property} to “${nextValue}” as ${version}`, actor, { version, target, property });
    return { ok: true, message: `Upstream update recorded as ${version}. Existing patches will be checked against the new value.` };
  }

  function moveElement() {
    setLayoutShifted((current) => !current);
  }

  function simulateElementIdChange(target, actor) {
    const element = document.querySelector(`[data-patch-target="${target}"]`);
    if (!element) return { ok: false, message: 'The demo element could not be found.' };
    element.dataset.patchTarget = `${target}-renamed`;
    recordAudit('element_identity_changed', `Demo element identity changed for ${target}; semantic recovery is required`, actor, { target });
    return { ok: true, message: 'Element ID changed. Revalidate patches to test semantic recovery.' };
  }

  return (
    <PatchContext.Provider value={{
      workspace, websiteState, patches, auditEntries, verificationRuns, releases, layoutShifted,
      createWorkspace, addComment, updatePatch, revalidatePatches, resolveTargetReview, resolveConflict, resetPreview,
      createPatch, recordVerification, applyPatch, rejectPatch, rollbackPatch,
      simulateUpstreamChange, moveElement, simulateElementIdChange,
    }}>
      {children}
    </PatchContext.Provider>
  );
}

export function usePatches() {
  const value = useContext(PatchContext);
  if (!value) throw new Error('usePatches must be used inside PatchProvider.');
  return value;
}