'use client';

import {type ChangeEvent, useRef, useState} from 'react';
import * as styles from '@/components/session/NoteImportForm.css';

type Props = {
  sessionId: string;
};

export function NoteImportForm({sessionId}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setMessage(null);
    setUploading(true);

    try {
      const jsonText = await file.text();
      const response = await fetch(`/api/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({jsonText}),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? 'Import failed');
        return;
      }
      setMessage('ノートを更新しました');
    } catch {
      setMessage('読み込み中に通信エラーが発生しました');
    } finally {
      setUploading(false);
    }
  }

  function openFilePicker() {
    if (uploading) {
      return;
    }
    fileInputRef.current?.click();
  }

  function onSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    if (!selected) {
      return;
    }
    void upload(selected);
  }

  return (
    <div className={styles.box}>
      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type='file'
        accept='application/json'
        onChange={onSelectFile}
      />
      <button
        className={styles.button}
        onClick={openFilePicker}
        type='button'
        disabled={uploading}
      >
        {uploading ? '読み込み中...' : 'JSONノートを読み込む'}
      </button>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
