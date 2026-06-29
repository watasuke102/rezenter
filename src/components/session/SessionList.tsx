'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import * as styles from '@/components/session/SessionList.css';
import {SettingsModal} from '@/components/session/SettingsModal';
import type {SessionSummary} from '@/lib/types';

type Props = {
  sessions: SessionSummary[];
};

export function SessionList({sessions}: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(sessionId: string) {
    const ok = window.confirm('このセッションを削除しますか？');
    if (!ok) {
      return;
    }

    setError(null);
    setDeletingId(sessionId);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? '削除に失敗しました');
        return;
      }
      router.refresh();
    } catch {
      setError('削除中に通信エラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  }

  const [settingsSessionId, setSettingsSessionId] = useState<string | null>(null);

  return (
    <div className={styles.sessions}>
      {settingsSessionId && (
        <SettingsModal
          sessionId={settingsSessionId}
          isOpen={true}
          onClose={() => setSettingsSessionId(null)}
        />
      )}

      {sessions.length === 0 ? <p>まだセッションがありません。</p> : null}
      {sessions.map(session => (
        <div key={session.id} className={styles.sessionItem}>
          <div className={styles.sessionMeta}>
            <strong>{session.title}</strong>
            <span>ID: {session.id}</span>
            <span>
              Page: {session.currentPage + 1} / {session.totalPages ?? '?'}
            </span>
            <span>
              {new Date(session.createdAt).toISOString().slice(0, 10)}
            </span>
          </div>
          <div className={styles.sessionActions}>
            <div className={styles.sessionLink}>
              <Link
                href={`/session/${session.id}/viewer`}
                className={styles.pageLink}
              >
                Viewer
              </Link>
              <Link
                href={`/session/${session.id}/presenter`}
                className={styles.pageLink}
              >
                Presenter
              </Link>
              <Link
                href={`/session/${session.id}/controller`}
                className={styles.pageLink}
              >
                Controller
              </Link>
              <button
                type='button'
                className={styles.pageLink}
                onClick={() => setSettingsSessionId(session.id)}
              >
                表示設定
              </button>
            </div>
            <button
              type='button'
              className={styles.deleteButton}
              disabled={deletingId === session.id}
              onClick={() => onDelete(session.id)}
            >
              {deletingId === session.id ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      ))}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
