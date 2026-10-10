import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export function VersionHistory({
  versions = [],
  currentVersionId,
  deployedVersionId,
  getPreviousVersion,
  getNextVersion,
  switchToPreviousVersion,
  switchToNextVersion,
  switchToVersion,
  restoreVersion,
  activeDeveloper,
  onMessage,
}) {
  const currentVersion = versions.find((v) => v.versionId === currentVersionId);
  const deployedVersion = versions.find((v) => v.versionId === deployedVersionId);
  const hasPrevious = Boolean(getPreviousVersion());
  const hasNext = Boolean(getNextVersion());
  const versionCount = versions.length;
  const currentVersionNumber = currentVersion?.versionNumber ?? 0;

  const handlePrevious = () => {
    const result = switchToPreviousVersion();
    if (onMessage) onMessage({ type: result.ok ? 'success' : 'error', text: result.message });
  };

  const handleNext = () => {
    const result = switchToNextVersion();
    if (onMessage) onMessage({ type: result.ok ? 'success' : 'error', text: result.message });
  };

  const handleRestore = (versionId) => {
    const result = restoreVersion(versionId, activeDeveloper);
    if (onMessage) onMessage({ type: result.ok ? 'success' : 'error', text: result.message });
  };

  const handleSelectVersion = (versionId) => {
    const result = switchToVersion(versionId);
    if (onMessage) onMessage({ type: result.ok ? 'success' : 'error', text: result.message });
  };

  return (
    <div className="version-history-panel">
      <div className="version-header">
        <div className="version-title">
          <Clock size={14} />
          <span>Version History</span>
        </div>
        <div className="version-counter">
          {currentVersion?.versionNumber ?? 0} of {versionCount - 1}
        </div>
      </div>

      <div className="version-controls">
        <button
          className="version-nav-button version-prev"
          onClick={handlePrevious}
          disabled={!hasPrevious}
          title={hasPrevious ? 'Previous Version' : 'No earlier version'}
          aria-label="Previous version"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="version-info">
          <div className="version-label">
            {currentVersion?.label || 'Loading...'}
          </div>
          {currentVersion?.isOriginal && (
            <div className="version-badge version-original">Original</div>
          )}
          {currentVersionId === deployedVersionId && (
            <div className="version-badge version-deployed">Deployed</div>
          )}
        </div>

        <button
          className="version-nav-button version-next"
          onClick={handleNext}
          disabled={!hasNext}
          title={hasNext ? 'Next Version' : 'No later version'}
          aria-label="Next version"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {currentVersionId !== deployedVersionId && !currentVersion?.isOriginal && (
        <button
          className="primary-button version-restore-button"
          onClick={() => handleRestore(currentVersionId)}
          title="Restore this version as the current working state"
        >
          Restore This Version
        </button>
      )}

      <div className="version-timeline">
        <div className="version-list">
          {versions.map((version, index) => (
            <button
              key={version.versionId}
              className={`version-item ${version.versionId === currentVersionId ? 'active' : ''} ${version.versionId === deployedVersionId ? 'deployed' : ''}`}
              onClick={() => handleSelectVersion(version.versionId)}
              title={version.label}
            >
              <div className="version-item-index">{version.versionNumber}</div>
              <div className="version-item-content">
                <div className="version-item-label">{version.label}</div>
                <div className="version-item-time">
                  {new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {version.versionId === deployedVersionId && (
                <div className="version-item-badge">Deployed</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
