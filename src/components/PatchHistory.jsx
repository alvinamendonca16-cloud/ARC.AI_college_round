import { useState } from 'react';
import { formatStatus, TARGETS } from '../utils/patchUtils.js';

export function PatchHistory({ patches, activeDeveloper, onSelect, onRollback, onMessage }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const ordered = [...patches]
    .filter((patch) => status === 'all' || patch.status === status)
    .filter((patch) => `${patch.id} ${TARGETS[patch.target].label} ${patch.oldValue} ${patch.newValue} ${patch.author ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  return (
    <section className="panel history-panel">
      <div className="panel-heading history-heading">
        <div><p className="eyebrow">PATCH LIST</p><h2>Patch History</h2></div>
        <span className="history-count">{ordered.length} / {patches.length} records</span>
      </div>
      <div className="history-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patches, targets, values, authors" aria-label="Search Patch History" /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter patches by status"><option value="all">All Statuses</option><option value="pending">Pending</option><option value="applied">Deployed</option><option value="rejected">Rejected</option><option value="rolled_back">Rolled Back</option></select></div>
      {ordered.length === 0 ? (
        <div className="empty-history"><span className="empty-mark">—</span><p>{patches.length ? 'No patches match these filters.' : 'No patch history yet. Generate your first patch to get started.'}</p></div>
      ) : (
        <div className="history-table-wrap">
          <table>
            <thead><tr><th>Patch</th><th>Target</th><th>Change</th><th>Author / release</th><th>Status</th><th>Created</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {ordered.map((patch) => (
                <tr key={patch.id}>
                  <td className="patch-id">{patch.id}</td>
                  <td>{TARGETS[patch.target].label}</td>
                  <td><span className="change-values"><span>{patch.oldValue}</span><i aria-hidden="true">→</i><strong>{patch.newValue}</strong></span></td>
                  <td><span>{patch.author ?? '—'}</span>{patch.releaseVersion && <small className="table-release">{patch.releaseVersion}</small>}</td>
                  <td><span className={`status-badge status-${patch.status}`}>{formatStatus(patch.status)}</span></td>
                  <td><time dateTime={patch.createdAt}>{new Date(patch.createdAt).toLocaleString()}</time></td>
                  <td className="history-action">
                    {patch.status === 'applied' ? (
                      <button className="text-button rollback-button" onClick={() => { if (!window.confirm(`Roll back ${patch.id} and restore “${patch.oldValue}”?`)) return; const result = onRollback(patch.id, activeDeveloper); onMessage({ type: result.ok ? 'success' : 'error', text: result.message }); }}>Rollback</button>
                    ) : patch.status === 'pending' ? (
                      <button className="text-button" onClick={() => onSelect(patch.id)}>Open</button>
                    ) : <span className="no-action">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}