'use client';

import {useEffect, useRef, useState} from 'react';

type Options = {
  sessionId: string;
  totalPages: number | null | undefined;
};

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

export function usePageNumberNavigation({sessionId, totalPages}: Options) {
  const [pageNumberInput, setPageNumberInput] = useState('');
  const pageNumberInputRef = useRef('');

  useEffect(() => {
    function updatePageNumberInput(value: string) {
      pageNumberInputRef.current = value;
      setPageNumberInput(value);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        isEditableElement(event.target) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        updatePageNumberInput(pageNumberInputRef.current + event.key);
        return;
      }

      if (event.key === 'Backspace' && pageNumberInputRef.current) {
        event.preventDefault();
        updatePageNumberInput(pageNumberInputRef.current.slice(0, -1));
        return;
      }

      if (event.key === 'Escape') {
        updatePageNumberInput('');
        return;
      }

      if (event.key !== 'Enter' || !pageNumberInputRef.current) {
        return;
      }

      event.preventDefault();
      const pageNumber = Number(pageNumberInputRef.current);
      updatePageNumberInput('');
      const maximumPage = Math.max(
        1,
        totalPages ?? Number.MAX_SAFE_INTEGER,
      );
      const targetPage = Math.min(maximumPage, Math.max(1, pageNumber));

      void fetch(`/api/sessions/${sessionId}/slide`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({action: 'set', page: targetPage - 1}),
      }).catch(() => {
        // ignore transient navigation request failures
      });
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sessionId, totalPages]);

  return pageNumberInput;
}
