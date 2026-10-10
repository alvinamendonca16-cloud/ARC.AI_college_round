import { useEffect, useState } from 'react';
import { COLOR_VALUES, formatOptionLabel, formatStatus, TARGETS } from '../utils/patchUtils.js';

function PreviewValue({ patch, value }) {
  if (patch.property === 'imageSource') return <img className="image-preview-value" src={value} alt="Product image preview" />;
  if (patch.property === 'backgroundColor' || patch.property === 'color') {
    const style = patch.property === 'color'
      ? { color: COLOR_VALUES[value] ?? value }
      : { backgroundColor: COLOR_VALUES[value] ?? value };
    return <span className="preview-value-chip" style={style}>{value}</span>;
  }
  if (patch.property === 'behavior') return <span className="preview-copy">{formatOptionLabel(value)}</span>;
  if (patch.target === 'main-heading') return <span className="preview-heading">{value}</span>;
  if (patch.target === 'buy-now-button') return <span className="preview-copy">{value}</span>;
  if (patch.property === 'layout') return <span className={`preview-layout layout-${value}`}><i /><i /><i /></span>;
  if (patch.property === 'visibility') return <span className="preview-copy">{formatOptionLabel(value)}</span>;
  return <span className="preview-copy">{TARGETS[patch.target].properties[patch.property].label}: <strong>{value}</strong></span>;
}

export function PatchPreview({ patch, currentValue, latestRun, verificationCurrent, isDeploying, hasConflict, activeDeveloper, locatorState, onDeploy, onReject, onUpdate, onAddComment, onResolveTargetReview }) {
  const [commentText, setCommentText] = useState('');
  const [editedValue, setEditedValue] = useState(patch?.newValue ?? '');
  useEffect(() => setEditedValue(patch?.newValue ?? ''), [patch?.id, patch?.newValue]);
  if (!patch) {
    return (
      <section className="panel preview-panel empty-preview">
        <div className="panel-heading"><div><p className="eyebrow">PATCH REVIEW</p><h2>Preview Changes</h2></div></div>
        <p>Create a patch to compare the current website with your proposed change.</p>
      </section>
    );
  }

  const isStale = currentValue !== patch.oldValue;
  const appliedValueChanged = patch.status === 'applied' && currentValue !== patch.newValue;
  const targetNeedsReview = ['needs-review', 'target-missing', 'conflict-detected'].includes(patch.trackingStatus);
  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <div><p className="eyebrow">PATCH REVIEW</p><h2>Preview Changes</h2></div>
        <span className={`status-badge status-${patch.status}`}>{formatStatus(patch.status)}</span>
      </div>
      <div className="patch-identification"><strong>{patch.id}</strong><span>{TARGETS[patch.target].label}</span></div>
      {patch.status === 'pending' && <form className="proposal-editor" onSubmit={(event) => { event.preventDefault(); const result = onUpdate(editedValue); if (result.ok) setEditedValue(result.patch.newValue); }}>
        <label>Proposed Value
          {patch.property === 'backgroundColor' || patch.property === 'color' ? <input type="color" aria-label="Edit proposed color" value={/^#[\da-f]{6}$/i.test(editedValue) ? editedValue : COLOR_VALUES[editedValue] ?? '#ffffff'} onChange={(event) => setEditedValue(event.target.value)} />
              : TARGETS[patch.target].properties[patch.property].values ? <select aria-label="Edit proposed value" value={editedValue} onChange={(event) => setEditedValue(event.target.value)}>{TARGETS[patch.target].properties[patch.property].values.map((value) => <option key={value} value={value}>{formatOptionLabel(value)}</option>)}</select>
              : <input aria-label="Edit proposed value" value={editedValue} maxLength={80} onChange={(event) => setEditedValue(event.target.value)} />}
        </label>
        <button type="submit" className="secondary-button" disabled={!editedValue.trim() || editedValue === patch.newValue}>Update Proposal</button>
      </form>}
      <div className="diff-preview">
        <div className="diff-cell diff-before"><span className="diff-label"><i />ORIGINAL</span><PreviewValue patch={patch} value={patch.oldValue} /></div>
        <span className="diff-arrow" aria-hidden="true">→</span>
        <div className="diff-cell diff-after"><span className="diff-label"><i />PROPOSED</span><PreviewValue patch={patch} value={patch.newValue} /></div>
      </div>
      <div className="patch-meta"><span>{TARGETS[patch.target].properties[patch.property].label} <strong>{patch.oldValue} → {patch.newValue}</strong></span><span>By <strong>{patch.author ?? 'Unknown'}</strong></span><time dateTime={patch.createdAt}>{new Date(patch.createdAt).toLocaleString()}</time></div>
      <div className={`locator-status ${locatorState?.moved ? 'locator-moved' : ''}`}><span>{locatorState?.moved ? '↗' : '◎'}</span>{locatorState?.element ? `${locatorState.moved ? 'Element Moved; Re-located' : 'Element Tracked'} · ${formatOptionLabel(locatorState.method)}` : 'Target Locator Unavailable'}</div>
      <div className={`tracking-pill tracking-${patch.trackingStatus ?? 'valid'}`}>Target Status: {formatStatus(patch.trackingStatus ?? 'valid')}</div>
      {isStale && patch.status === 'pending' && <div className="inline-warning"><strong>Live value changed.</strong> This patch starts from “{patch.oldValue}”, but the website now has “{currentValue}”. Reject it and generate a fresh patch before applying.</div>}
      {appliedValueChanged && <div className="inline-warning"><strong>Newer live change detected.</strong> This patch wrote “{patch.newValue}”, but the website now has “{currentValue}”. Rollback is blocked to protect the newer value.</div>}
      {targetNeedsReview && patch.candidate && <div className="target-candidate"><strong>Possible Match: {TARGETS[patch.candidate.target]?.label ?? formatOptionLabel(patch.candidate.target)}</strong><span>{formatOptionLabel(patch.candidate.method)} · {Math.round(patch.candidate.confidence * 100)}% confidence · {formatOptionLabel(patch.candidate.container ?? 'unknown parent')}. Confirm before deployment.</span><div><button className="text-button" onClick={() => onResolveTargetReview(true)}>Confirm Match</button><button className="text-button rollback-button" onClick={() => onResolveTargetReview(false)}>Reject Match</button></div></div>}
      {patch.status === 'pending' && (
        <div className="review-actions">
          <button className="primary-button deploy-button" onClick={onDeploy} disabled={isDeploying || isStale || hasConflict || targetNeedsReview || !verificationCurrent || !latestRun?.passed}>
            {isDeploying ? 'Deploying…' : isStale || hasConflict ? 'Blocked by Conflict' : targetNeedsReview ? 'Needs Review' : !verificationCurrent || !latestRun?.passed ? 'Needs Verification' : 'Deploy Verified Patch'}
          </button>
          <button className="secondary-button" onClick={onReject}>Reject Patch</button>
        </div>
      )}
      {patch.status === 'applied' && <button className="primary-button deploy-button" disabled>Deployed</button>}
      {patch.status === 'pending' && !verificationCurrent && <p className="review-note">Run verification for this exact proposal before deploying it.</p>}
      {patch.status === 'pending' && latestRun?.passed && !verificationCurrent && <p className="review-note">The proposal changed after its last passing run. Previous checks remain in the audit trail but no longer authorize deployment.</p>}
      {patch.status === 'pending' && hasConflict && <p className="review-note">Resolve the same-property conflict before deployment.</p>}
      {patch.status !== 'pending' && <p className="review-note">This record is {formatStatus(patch.status).toLowerCase()}. {patch.releaseVersion ? `Release ${patch.releaseVersion}.` : ''} Original and proposed values remain in history.</p>}
      <div className="patch-discussion"><div className="discussion-heading"><strong>Patch Discussion</strong><span>{patch.comments?.length ?? 0}</span></div>
        {patch.comments?.length ? <ul>{patch.comments.map((comment) => <li key={comment.id}><p>{comment.text}</p><small>{comment.author} · {new Date(comment.createdAt).toLocaleString()}</small></li>)}</ul> : <p className="discussion-empty">No comments yet.</p>}
        <form onSubmit={(event) => { event.preventDefault(); const result = onAddComment(commentText); if (result.ok) setCommentText(''); }}><input aria-label="Add Patch Comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a discussion note…" maxLength={240} /><button className="text-button" type="submit" disabled={!commentText.trim()}>Post Comment</button></form>
      </div>
    </section>
  );
}