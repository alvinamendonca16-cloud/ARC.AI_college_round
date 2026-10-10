import { useState, useEffect } from 'react';
import { usePatchwork } from '@/context/PatchworkContext';
import { elementRegistry, getElementEntry } from '@/lib/sampleData';
import { parseNaturalLanguage, validatePatchValue } from '@/lib/nlp';
import { getCurrentValue, buildPatchTarget } from './SampleWebsite';
import { Sparkles, Wand2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { PatchProperty } from '@/types';

export function PatchCreator({ preselectedElementId }: { preselectedElementId?: string | null }) {
  const { websiteState, createPatch, runVerification, selectPatch, setView, addAuditEvent } = usePatchwork();
  const [mode, setMode] = useState<'natural' | 'manual'>('natural');
  const [nlInput, setNlInput] = useState('');
  const [nlResult, setNlResult] = useState<{ ok: boolean; explanation: string } | null>(null);

  // Manual form state
  const [selectedElement, setSelectedElement] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<PatchProperty>('text');
  const [newValue, setNewValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // When an element is clicked on the sample website, pre-select it and switch to manual mode
  useEffect(() => {
    if (preselectedElementId) {
      setMode('manual');
      setSelectedElement(preselectedElementId);
      const props = getElementEntry(preselectedElementId)?.supportedProperties ?? [];
      setSelectedProperty((props[0] as PatchProperty) ?? 'text');
      setNewValue('');
      setManualError(null);
    }
  }, [preselectedElementId]);

  const availableProperties = selectedElement
    ? getElementEntry(selectedElement)?.supportedProperties ?? []
    : [];

  function handleNLSubmit() {
    if (!nlInput.trim()) {
      setNlResult({ ok: false, explanation: 'Please enter a request.' });
      return;
    }
    const result = parseNaturalLanguage(nlInput, websiteState);
    setNlResult({ ok: result.ok, explanation: result.explanation });

    if (result.ok) {
      // Create the patch
      const oldValue = getCurrentValue(websiteState, result.target.elementId, result.property);
      const patch = createPatch({
        target: result.target,
        property: result.property,
        oldValue,
        newValue: result.newValue,
      });
      // Auto-run verification
      setTimeout(() => {
        runVerification(patch.id);
        selectPatch(patch.id);
        setView('patches');
      }, 100);
      setNlInput('');
    }
  }

  function handleManualSubmit() {
    setManualError(null);
    if (!selectedElement) {
      setManualError('Please select a target element.');
      return;
    }
    if (!selectedProperty) {
      setManualError('Please select a property to change.');
      return;
    }
    if (!availableProperties.includes(selectedProperty)) {
      setManualError(`Property "${selectedProperty}" is not supported for this element.`);
      return;
    }

    const validation = validatePatchValue(selectedProperty, newValue);
    if (!validation.valid) {
      setManualError(validation.message);
      return;
    }

    const target = buildPatchTarget(selectedElement);
    if (!target) {
      setManualError('Could not build target metadata.');
      return;
    }

    const oldValue = getCurrentValue(websiteState, selectedElement, selectedProperty);
    const resolvedNewValue = validation.message; // for colors, this is the resolved hex

    if (oldValue === resolvedNewValue) {
      setManualError('New value is the same as the current value. No change needed.');
      return;
    }

    const patch = createPatch({
      target,
      property: selectedProperty,
      oldValue,
      newValue: resolvedNewValue,
    });

    setTimeout(() => {
      runVerification(patch.id);
      selectPatch(patch.id);
      setView('patches');
    }, 100);

    // Reset form
    setNewValue('');
    setManualError(null);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-5 h-5 text-cyan-600" />
          <h2 className="font-bold text-gray-900">Create a Patch</h2>
        </div>
        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => setMode('natural')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'natural' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Natural Language
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'manual' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Manual Form
          </button>
        </div>
      </div>

      <div className="p-5">
        {mode === 'natural' ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Describe your change
              </label>
              <textarea
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder='e.g. "Change the Buy Now button to green." or "Rename Buy Now to Add to Cart."'
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleNLSubmit();
                }}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Press Ctrl+Enter to submit. Parsing is done locally — no AI API.
              </p>
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Change the Buy Now button to green.',
                'Rename Buy Now to Add to Cart.',
                'Change the product heading to Premium Headphones.',
                'Change the Buy Now button text color to red.',
                'Change the banner to orange.',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setNlInput(ex)}
                  className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-cyan-50 hover:text-cyan-700 text-gray-500 rounded-md transition-colors border border-gray-200"
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              onClick={handleNLSubmit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate Patch
            </button>

            {nlResult && (
              <div
                className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                  nlResult.ok
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {nlResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{nlResult.explanation}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Element selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Target Element
              </label>
              <select
                value={selectedElement}
                onChange={(e) => {
                  setSelectedElement(e.target.value);
                  const props = getElementEntry(e.target.value)?.supportedProperties ?? [];
                  setSelectedProperty((props[0] as PatchProperty) ?? 'text');
                  setNewValue('');
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              >
                <option value="">Select an element...</option>
                {elementRegistry.map((e) => (
                  <option key={e.elementId} value={e.elementId}>
                    {e.label} ({e.elementType})
                  </option>
                ))}
              </select>
              {selectedElement && (
                <p className="text-[11px] text-gray-400 mt-1">
                  {getElementEntry(selectedElement)?.context}
                </p>
              )}
            </div>

            {/* Property selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value as PatchProperty)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                disabled={!selectedElement}
              >
                {availableProperties.map((p) => (
                  <option key={p} value={p}>
                    {propertyLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Old value (read-only) */}
            {selectedElement && selectedProperty && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Current Value (Old)
                </label>
                <input
                  type="text"
                  value={getCurrentValue(websiteState, selectedElement, selectedProperty) || '(not tracked)'}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            )}

            {/* New value */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                New Value
              </label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={
                  selectedProperty === 'bgColor' || selectedProperty === 'textColor'
                    ? 'e.g. green or #22c55e'
                    : 'e.g. Add to Cart'
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                disabled={!selectedElement}
              />
            </div>

            {manualError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <button
              onClick={handleManualSubmit}
              disabled={!selectedElement || !newValue.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Patch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function propertyLabel(p: string): string {
  const labels: Record<string, string> = {
    text: 'Text Content',
    label: 'Button Label',
    bgColor: 'Background Color',
    textColor: 'Text Color',
  };
  return labels[p] ?? p;
}
