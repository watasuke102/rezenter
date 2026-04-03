'use client';

import {useState} from 'react';
import * as styles from '@/components/session/NoteImportForm.css';

type Props = {
  sessionId: string;
};

export function NoteImportForm({sessionId}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function upload() {
    setMessage(null);

    if (!file) {
      setMessage('JSONファイルを選択してください');
      return;
    }

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
  }

  return (
    <div className={styles.box}>
      <h3>JSONノートを読み込む</h3>
      <input
        className={styles.textarea}
        type='file'
        accept='application/json'
        onChange={event => setFile(event.target.files?.[0] ?? null)}
      />
      <button className={styles.button} onClick={upload} type='button'>
        ノートを取り込む
      </button>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
