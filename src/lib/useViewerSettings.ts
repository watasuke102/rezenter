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
    const saved = localStorage.getItem(`rezenter_viewerSettings_${sessionId}`);
    if (saved) {
      try {
        setSettings({...defaultSettings, ...JSON.parse(saved)});
      } catch {}
    } else {
      setSettings(defaultSettings);
    }
    setIsLoaded(true);
  }, [sessionId]);

  const updateSettings = (newSettings: Partial<ViewerSettings>) => {
    setSettings(prev => {
      const next = {...prev, ...newSettings};
      localStorage.setItem(`rezenter_viewerSettings_${sessionId}`, JSON.stringify(next));
      return next;
    });
  };

  return {settings, updateSettings, isLoaded};
}
