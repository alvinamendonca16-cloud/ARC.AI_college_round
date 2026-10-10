import { useState } from 'react';
import { usePatches } from '../context/PatchContext.jsx';

export function PatchGenerator({ activeDeveloper, onCreated, onMessage }) {
  const [request, setRequest] = useState('');
  const [error, setError] = useState('');
  const { createPatch } = usePatches();

  function submit(event) {
    event.preventDefault();
    const result = createPatch(request, activeDeveloper);
    if (!result.ok) {
      setError(result.message);
      onMessage({ type: 'error', text: result.message });
      return;
    }
    setError('');
    setRequest('');
    onCreated(result.patch.id);
    onMessage({ type: 'success', text: result.message });
  }

  return (
    <form className="generator" onSubmit={submit}>
      <label htmlFor="patch-request">Describe a Patch</label>
      <div className="generator-row">
        <input
          id="patch-request"
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          placeholder="Change the Primary Button to green"
          aria-describedby={error ? 'request-error' : 'request-hint'}
        />
        <button className="primary-button generate-button" type="submit">Create Patch <span aria-hidden="true">↗</span></button>
      </div>
      {error ? <p id="request-error" className="field-error">{error}</p> : (
        <p id="request-hint" className="field-hint">Try a button color or label, the Main Heading, or the Product Card layout.</p>
      )}
    </form>
  );
}