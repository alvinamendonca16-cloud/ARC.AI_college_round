import { getConflicts, getStalePatches, TARGETS } from '../utils/patchUtils.js';

export function ConflictWarning({ patches, websiteState, onResolve, onMessage }) {
  const conflicts = getConflicts(patches);
  const stalePatches = getStalePatches(patches, websiteState);
  if (!conflicts.length && !stalePatches.length) return null;

  return (
    <section className="warning-list" aria-label="Patch warnings">
      {conflicts.map(({ first, second }) => (
        <div className="warning-item" key={`${first.id}-${second.id}`}>
          <span className="warning-icon" aria-hidden="true">!</span>
          <div><strong>Potential Conflict: {first.id} and {second.id}</strong><p>Both pending patches modify {TARGETS[first.target].properties[first.property].label} on the {TARGETS[first.target].label}. Choose which proposal to keep; the other will be rejected.</p><div className="conflict-actions">{[first, second].map((patch) => <button key={patch.id} onClick={() => { const result = onResolve(patch.id, patch.id === first.id ? second.id : first.id); onMessage({ type: result.ok ? 'success' : 'error', text: result.message }); }}>Keep {patch.id}</button>)}</div></div>
        </div>
      ))}
      {stalePatches.map((patch) => (
        <div className="warning-item stale-warning" key={`stale-${patch.id}`}>
          <span className="warning-icon" aria-hidden="true">!</span>
          <div><strong>{patch.id} needs review</strong><p>The live value no longer matches its original value. Applying it is blocked to protect newer changes.</p></div>
        </div>
      ))}
    </section>
  );
}