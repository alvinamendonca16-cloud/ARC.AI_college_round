import { useEffect, useState } from 'react';
import { COLOR_VALUES, formatOptionLabel, INITIAL_WEBSITE_STATE, TARGETS } from '../utils/patchUtils.js';

function suggestedValue(target, property, websiteState) {
  const current = websiteState[target]?.[property];
  const values = TARGETS[target].properties[property].values;
  if (values) return values.find((value) => value !== current) ?? values[0];
  return '';
}

export function VisualInspector({
  activeDeveloper,
  createPatch,
  onCreated,
  onMessage,
  selectedTarget,
  setSelectedTarget,
  selectionMode,
  setSelectionMode,
  websiteState,
}) {
  const [property, setProperty] = useState('');
  const [value, setValue] = useState('');
  const definition = selectedTarget ? TARGETS[selectedTarget] : null;
  const properties = definition ? Object.keys(definition.properties) : [];
  const activeProperty = properties.includes(property) ? property : properties[0] ?? '';

  useEffect(() => {
    if (!selectedTarget) return;
    setProperty(activeProperty);
    setValue(suggestedValue(selectedTarget, activeProperty, websiteState));
  }, [selectedTarget, activeProperty, websiteState[selectedTarget]?.[activeProperty]]);

  function chooseProperty(nextProperty) {
    setProperty(nextProperty);
    setValue(suggestedValue(selectedTarget, nextProperty, websiteState));
  }

  function stageVisualPatch(event) {
    event.preventDefault();
    const result = createPatch({ target: selectedTarget, property: activeProperty, newValue: value }, activeDeveloper);
    onMessage({ type: result.ok ? 'success' : 'error', text: result.message });
    if (result.ok) onCreated(result.patch.id);
  }

  function resetSelectedProperty() {
    const originalValue = INITIAL_WEBSITE_STATE[selectedTarget]?.[activeProperty];
    if (originalValue === undefined) return;
    const result = createPatch({ target: selectedTarget, property: activeProperty, newValue: originalValue }, activeDeveloper);
    onMessage({ type: result.ok ? 'success' : 'error', text: result.ok ? `Reset patch ${result.patch.id} is ready to preview and deploy.` : result.message });
    if (result.ok) onCreated(result.patch.id);
  }

  const isColorProperty = activeProperty === 'backgroundColor' || activeProperty === 'color';
  const colorValue = /^#[\da-f]{6}$/i.test(value) ? value : COLOR_VALUES[value] ?? '#ffffff';
  const originalValue = selectedTarget ? INITIAL_WEBSITE_STATE[selectedTarget]?.[activeProperty] : undefined;

  return (
    <section className="panel inspector-panel">
      <div className="inspector-heading">
        <div><p className="eyebrow">EDIT PROPERTIES</p><h3>Element Inspector</h3></div>
        <button className={`inspect-toggle ${selectionMode ? 'is-on' : ''}`} onClick={() => setSelectionMode((current) => !current)}>
          {selectionMode ? 'Stop Selecting' : 'Select On Page'}
        </button>
      </div>
      <p className="inspector-hint">{selectionMode ? 'Choose the highlighted headline, product card, or Buy Now button in the storefront.' : 'Select an element in the storefront to stage a focused visual change.'}</p>
      {definition ? (
        <form className="inspector-form" onSubmit={stageVisualPatch}>
          <label className="inspector-target">Selected Element <strong>{definition.label}</strong></label>
          {properties.length > 1 && (
            <label className="control-label">Property
              <select value={activeProperty} onChange={(event) => chooseProperty(event.target.value)}>
                {properties.map((key) => <option key={key} value={key}>{definition.properties[key].label}</option>)}
              </select>
            </label>
          )}
          {isColorProperty ? (
            <div className="control-label color-editor"><label htmlFor="visual-color">New Color</label><div><input id="visual-color" type="color" value={colorValue} onChange={(event) => setValue(event.target.value)} aria-label="Choose a color" /><input className="hex-color-input" value={value} onChange={(event) => setValue(event.target.value)} aria-label="Hex color value" placeholder="#22C55E" maxLength={7} spellCheck="false" /></div></div>
          ) : definition.properties[activeProperty]?.values ? (
            <label className="control-label">New Value
              <select value={value} onChange={(event) => setValue(event.target.value)}>
                {definition.properties[activeProperty].values.map((option) => <option key={option} value={option}>{formatOptionLabel(option)}</option>)}
              </select>
            </label>
          ) : (
            <label className="control-label">New Value
              <input value={value} onChange={(event) => setValue(event.target.value)} maxLength={activeProperty === 'imageSource' ? 2048 : 80} placeholder={activeProperty === 'imageSource' ? 'https://example.com/product-image.jpg' : `Enter ${definition.properties[activeProperty]?.label}`} />
            </label>
          )}
          <div className="inspector-actions"><button className="stage-button" type="submit" disabled={!value.trim()}>Stage Change <span aria-hidden="true">↗</span></button><button className="reset-property-button" type="button" onClick={resetSelectedProperty} disabled={originalValue === undefined || websiteState[selectedTarget]?.[activeProperty] === originalValue}>Reset to Original</button></div>
          <label className="control-label inspector-current">Current Value
            <input readOnly value={websiteState[selectedTarget]?.[activeProperty] ?? ''} />
          </label>
          <span className="sr-only">Supported colors: {Object.keys(COLOR_VALUES).join(', ')}</span>
        </form>
      ) : (
        <div className="inspector-empty"><span>01</span><p>No element selected</p></div>
      )}
    </section>
  );
}