'use client';

import {useState, useEffect} from 'react';
import type {ClientSession} from '@/lib/client-types';
import type {ViewerSettings} from '@/lib/types';

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
      } catch {
        // Ignore
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }
    void load();

    // Setup SSE to receive updates
    const source = new EventSource(`/api/sessions/${sessionId}/events`);
    source.addEventListener('session.update', event => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          session?: ClientSession;
        };
        if (payload.session?.viewerSettings) {
          setSettings(prev => ({
            ...prev,
            ...payload.session?.viewerSettings,
          }));
        }
      } catch {
        // Ignore malformed event payloads.
      }
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
    } catch {
      // Keep the optimistic local state on transient network failures.
    }
  };

  return {settings, updateSettings, isLoaded};
}
