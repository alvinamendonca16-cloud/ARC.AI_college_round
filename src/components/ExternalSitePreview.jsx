import { useEffect, useState } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';

export function ExternalSitePreview({ url, onTryDemo }) {
  const [frameState, setFrameState] = useState('loading');
  useEffect(() => {
    setFrameState('loading');
    const timeout = window.setTimeout(() => setFrameState((state) => state === 'loading' ? 'unconfirmed' : state), 6000);
    return () => window.clearTimeout(timeout);
  }, [url]);

  return (
    <section className="external-preview panel">
      <div className="external-preview-toolbar"><div><p className="eyebrow">EXTERNAL SITE · VIEW ONLY</p><strong>{new URL(url).hostname}</strong></div><a href={url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open separately</a></div>
      <div className="external-state" role="status"><ShieldAlert size={17} /><span>{frameState === 'loading' ? 'Attempting to display this site. Embedding may be blocked by its security policy.' : frameState === 'unconfirmed' ? 'No frame confirmation received. The site may block embedding; PATCHWORK cannot inspect or edit cross-origin pages.' : frameState === 'error' ? 'The browser reported a frame error. This site may block embedding.' : 'The browser reported a frame load event, but the content may still be blocked. DOM access is unavailable.'}</span></div>
      <iframe
        key={url}
        title={`View-only preview of ${new URL(url).hostname}`}
        src={url}
        sandbox="allow-forms allow-scripts allow-popups"
        referrerPolicy="no-referrer"
        onLoad={() => setFrameState('response')}
        onError={() => setFrameState('error')}
      />
      <div className="external-preview-footer"><span>Cross-origin protections remain enabled. Visual patching is available in the built-in demo only.</span><button className="secondary-button" onClick={onTryDemo}>Switch to demo workspace</button></div>
    </section>
  );
}
