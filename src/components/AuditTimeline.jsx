import { useState } from 'react';
import { formatOptionLabel } from '../utils/patchUtils.js';

const eventLabels = {
  workspace_created: 'Workspace Created',
  patch_created: 'Patch Staged',
  patch_edited: 'Patch Edited',
  patch_commented: 'Comment Added',
  reviewer_assigned: 'Reviewer Assigned',
  conflict_detected: 'Conflict Detected',
  conflict_resolved: 'Conflict Resolved',
  verification_passed: 'Checks Passed',
  verification_failed: 'Checks Failed',
  patch_deployed: 'Deployed',
  patch_rejected: 'Rejected',
  patch_rolled_back: 'Rolled Back',
  rollback_blocked: 'Rollback Blocked',
  upstream_change: 'Upstream Edit',
  patches_revalidated: 'Targets Revalidated',
  target_match_confirmed: 'Target Confirmed',
  target_match_rejected: 'Target Rejected',
  preview_reset: 'Preview Reset',
};

export function AuditTimeline({ entries }) {
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('all');
  const [contributor, setContributor] = useState('all');
  const contributors = [...new Set(entries.map((entry) => entry.actor).filter(Boolean))].sort();
  const filtered = entries.filter((entry) => (eventType === 'all' || entry.type === eventType)
    && (contributor === 'all' || entry.actor === contributor)
    && `${entry.id} ${entry.patchId ?? ''} ${entry.summary} ${entry.actor}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className="panel audit-panel">
      <div className="history-heading panel-heading">
        <div><p className="eyebrow">AUDIT TRAIL</p><h2>Activity</h2></div>
        <span className="history-count">{filtered.length} / {entries.length} events</span>
      </div>
      <div className="history-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, patch IDs, contributors" aria-label="Search Audit Trail" /><select value={eventType} onChange={(event) => setEventType(event.target.value)} aria-label="Filter By Event Type"><option value="all">All Event Types</option>{[...new Set(entries.map((entry) => entry.type))].map((type) => <option value={type} key={type}>{formatOptionLabel((eventLabels[type] ?? type).toLowerCase())}</option>)}</select><select value={contributor} onChange={(event) => setContributor(event.target.value)} aria-label="Filter By Contributor"><option value="all">All Contributors</option>{contributors.map((name) => <option key={name}>{name}</option>)}</select></div>
      {filtered.length ? (
        <ol className="audit-list">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <span className={`audit-marker audit-${entry.type}`} />
              <div className="audit-event"><span>{eventLabels[entry.type] ?? entry.type.replaceAll('_', ' ').toUpperCase()}</span><p>{entry.summary}</p><small>{entry.actor} · {new Date(entry.createdAt).toLocaleString()}</small></div>
              {entry.patchId && <code>{entry.patchId}</code>}
            </li>
          ))}
        </ol>
      ) : <div className="audit-empty">{entries.length ? 'No audit events match these filters.' : 'Patch proposals, conflicts, checks, deployments, and reversions will appear here.'}</div>}
    </section>
  );
}