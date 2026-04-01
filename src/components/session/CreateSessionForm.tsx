'use client';

import {useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import * as styles from '@/components/session/home.css';

export function CreateSessionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setError(null);
    setPending(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Failed to create session');
        return;
      }

      const id = payload.session?.id;
      if (!id) {
        setError('Session ID is missing in response');
        return;
      }

      router.push(`/session/${id}`);
      router.refresh();
    } catch {
      setError('Network error while creating session');
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className={`${styles.panel} ${styles.form}`}
      onSubmit={onSubmit}
      encType='multipart/form-data'
    >
      <div className={styles.row}>
        <label className={styles.label} htmlFor='title'>
          セッション名
        </label>
        <input className={styles.input} id='title' name='title' />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>PDFの読み込み方法</span>
        <div className={styles.switchRow}>
          <button
            type='button'
            className={`${styles.switchButton} ${sourceType === 'file' ? styles.switchButtonActive : ''}`}
            onClick={() => setSourceType('file')}
          >
            ファイル
          </button>
          <button
            type='button'
            className={`${styles.switchButton} ${sourceType === 'url' ? styles.switchButtonActive : ''}`}
            onClick={() => setSourceType('url')}
          >
            URL
          </button>
        </div>
      </div>

      {sourceType === 'file' ? (
        <div className={styles.row}>
          <label className={styles.label} htmlFor='pdfFile'>
            PDFファイル（ローカル）
          </label>
          <input
            className={styles.fileInput}
            id='pdfFile'
            name='pdfFile'
            type='file'
            accept='application/pdf'
          />
        </div>
      ) : (
        <div className={styles.row}>
          <label className={styles.label} htmlFor='pdfUrl'>
            PDF URL
          </label>
          <input
            className={styles.input}
            id='pdfUrl'
            name='pdfUrl'
            type='url'
          />
        </div>
      )}

      <div className={styles.row}>
        <label className={styles.label} htmlFor='notesFile'>
          ノートJSON（任意）
        </label>
        <input
          className={styles.fileInput}
          id='notesFile'
          name='notesFile'
          type='file'
          accept='application/json'
        />
      </div>

      <button disabled={pending} className={styles.button} type='submit'>
        {pending ? '作成中...' : 'セッションを作成'}
      </button>
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </form>
  );
}
