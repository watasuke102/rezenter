'use client';

import {useState, useEffect} from 'react';

export type ViewerSettings = {
  concatenatedMode: boolean;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
};

const defaultSettings: ViewerSettings = {
  concatenatedMode: false,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
};

export function useViewerSettings(sessionId: string) {
  const [settings, setSettings] = useState<ViewerSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.session?.viewerSettings) {
          setSettings({...defaultSettings, ...data.session.viewerSettings});
        }
      } catch (err) {
        // Ignore
      } finally {
        setIsLoaded(true);
      }
    }
    void load();

    // Setup SSE to receive updates
    const source = new EventSource(`/api/sessions/${sessionId}/events`);
    source.addEventListener('session_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.viewerSettings) {
          setSettings(prev => ({...prev, ...data.viewerSettings}));
        }
      } catch {}
    });

    return () => {
      cancelled = true;
      source.close();
    };
  }, [sessionId]);

  const updateSettings = async (newSettings: Partial<ViewerSettings>) => {
    const next = {...settings, ...newSettings};
    setSettings(next);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({viewerSettings: next}),
      });
    } catch {}
  };

  return {settings, updateSettings, isLoaded};
}
