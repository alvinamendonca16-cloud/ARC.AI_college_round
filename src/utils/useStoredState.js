import { useEffect, useState } from 'react';
import { readStoredValue } from './patchUtils.js';

export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStoredValue(key, fallback));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }, [key, value]);
  return [value, setValue];
}