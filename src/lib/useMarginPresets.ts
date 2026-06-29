'use client';

import {useState, useEffect} from 'react';

export type MarginPreset = {
  name: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
};

export function useMarginPresets() {
  const [presets, setPresets] = useState<MarginPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let disposed = false;
    async function load() {
      try {
        const res = await fetch('/api/presets');
        if (!res.ok) return;
        const data = await res.json();
        if (!disposed) {
          setPresets(data.presets);
          setIsLoaded(true);
        }
      } catch {
        if (!disposed) setIsLoaded(true);
      }
    }
    load();
    return () => {
      disposed = true;
    };
  }, []);

  const savePreset = async (preset: MarginPreset) => {
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(preset),
    });
    if (res.ok) {
      const data = await res.json();
      setPresets(data.presets);
    }
  };

  const deletePreset = async (name: string) => {
    const res = await fetch(`/api/presets/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      setPresets(data.presets);
    }
  };

  return {presets, savePreset, deletePreset, isLoaded};
}
