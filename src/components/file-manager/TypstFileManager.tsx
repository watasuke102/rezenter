'use client';

import {useCallback, useEffect, useState} from 'react';
import {
  ChevronUp,
  FileCode2,
  Folder,
  FolderOpen,
  RefreshCw,
  Star,
  X,
} from 'lucide-react';
import * as styles from './TypstFileManager.css';

type FileEntry = {
  name: string;
  path: string;
  type: 'directory' | 'typst';
};

type DirectoryPayload = {
  path: string;
  parent: string | null;
  entries: FileEntry[];
  error?: string;
};

type Props = {
  value: string;
  onChange: (path: string) => void;
};

export function TypstFileManager({value, onChange}: Props) {
  const [currentPath, setCurrentPath] = useState('');
  const [pathInput, setPathInput] = useState('');
  const [parent, setParent] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = useCallback(async (target?: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = target ? `?path=${encodeURIComponent(target)}` : '';
      const response = await fetch(`/api/files${query}`, {cache: 'no-store'});
      const payload = (await response.json()) as DirectoryPayload;
      if (!response.ok) {
        throw new Error(payload.error || 'フォルダを開けませんでした');
      }
      setCurrentPath(payload.path);
      setPathInput(payload.path);
      setParent(payload.parent);
      setEntries(payload.entries);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'フォルダを開けませんでした',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    const response = await fetch('/api/files/favorites', {cache: 'no-store'});
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as {favorites?: string[]};
    setFavorites(payload.favorites ?? []);
  }, []);

  useEffect(() => {
    void loadDirectory();
    void loadFavorites();
  }, [loadDirectory, loadFavorites]);

  async function toggleFavorite(favoritePath: string) {
    if (!favoritePath) {
      return;
    }
    const isFavorite = favorites.includes(favoritePath);
    const response = await fetch('/api/files/favorites', {
      method: isFavorite ? 'DELETE' : 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({path: favoritePath}),
    });
    if (response.ok) {
      await loadFavorites();
    }
  }

  function openFavorite(favoritePath: string) {
    if (favoritePath.toLowerCase().endsWith('.typ')) {
      onChange(favoritePath);
      const separator = favoritePath.lastIndexOf('/');
      if (separator > 0) {
        void loadDirectory(favoritePath.slice(0, separator));
      }
      return;
    }
    void loadDirectory(favoritePath);
  }

  return (
    <section className={styles.manager} aria-label='Typstファイルマネージャー'>
      <div className={styles.toolbar}>
        <button
          type='button'
          className={styles.iconButton}
          onClick={() => parent && void loadDirectory(parent)}
          disabled={!parent}
          aria-label='親フォルダへ'
          title='親フォルダへ'
        >
          <ChevronUp size={18} />
        </button>
        <div className={styles.pathForm}>
          <input
            className={styles.pathInput}
            value={pathInput}
            onChange={event => setPathInput(event.currentTarget.value)}
            onKeyDown={event => {
              if (event.key !== 'Enter') {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              void loadDirectory(pathInput);
            }}
            aria-label='フォルダパス'
          />
        </div>
        <button
          type='button'
          className={styles.iconButton}
          onClick={() => void loadDirectory(currentPath)}
          aria-label='再読み込み'
          title='再読み込み'
        >
          <RefreshCw size={17} />
        </button>
        <button
          type='button'
          className={`${styles.iconButton} ${
            favorites.includes(currentPath) ? styles.favoriteActive : ''
          }`}
          onClick={() => void toggleFavorite(currentPath)}
          aria-label='現在のフォルダをお気に入りに追加'
          title='現在のフォルダをお気に入りに追加'
        >
          <Star size={17} fill='currentColor' />
        </button>
      </div>

      <div className={styles.selection}>
        <span className={styles.selectionLabel}>選択中</span>
        <span className={styles.selectionPath}>{value || '未選択'}</span>
        {value ? (
          <button
            type='button'
            className={`${styles.iconButton} ${
              favorites.includes(value) ? styles.favoriteActive : ''
            }`}
            onClick={() => void toggleFavorite(value)}
            aria-label='選択中のファイルのお気に入りを切り替え'
          >
            <Star size={16} fill='currentColor' />
          </button>
        ) : null}
      </div>

      <div className={styles.content}>
        <aside className={styles.favorites}>
          <div className={styles.asideTitle}>
            <Star size={14} />
            お気に入り
          </div>
          {favorites.length === 0 ? (
            <p className={styles.empty}>まだありません</p>
          ) : (
            favorites.map(favorite => (
              <div className={styles.favoriteRow} key={favorite}>
                <button
                  type='button'
                  className={styles.favoritePath}
                  title={favorite}
                  onClick={() => openFavorite(favorite)}
                >
                  {favorite.toLowerCase().endsWith('.typ') ? (
                    <FileCode2 size={14} />
                  ) : (
                    <FolderOpen size={14} />
                  )}
                  <span className={styles.favoriteName}>
                    {favorite.split('/').filter(Boolean).at(-1) || '/'}
                  </span>
                </button>
                <button
                  type='button'
                  className={styles.removeFavorite}
                  onClick={() => void toggleFavorite(favorite)}
                  aria-label={`${favorite}をお気に入りから削除`}
                >
                  <X size={13} />
                </button>
              </div>
            ))
          )}
        </aside>

        <div className={styles.fileList}>
          {loading ? <p className={styles.status}>読み込み中...</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {!loading && !error && entries.length === 0 ? (
            <p className={styles.status}>
              フォルダまたは .typ ファイルがありません
            </p>
          ) : null}
          {!loading &&
            entries.map(entry => {
              const selected = entry.type === 'typst' && entry.path === value;
              const favorite = favorites.includes(entry.path);
              return (
                <div
                  className={`${styles.entry} ${selected ? styles.entrySelected : ''}`}
                  key={entry.path}
                >
                  <button
                    type='button'
                    className={styles.entryMain}
                    onClick={() => {
                      if (entry.type === 'directory') {
                        void loadDirectory(entry.path);
                      } else {
                        onChange(entry.path);
                      }
                    }}
                  >
                    {entry.type === 'directory' ? (
                      <Folder size={18} fill='currentColor' />
                    ) : (
                      <FileCode2 size={18} />
                    )}
                    <span>{entry.name}</span>
                  </button>
                  <button
                    type='button'
                    className={`${styles.entryFavorite} ${
                      favorite ? styles.favoriteActive : ''
                    }`}
                    onClick={() => void toggleFavorite(entry.path)}
                    aria-label={`${entry.name}のお気に入りを切り替え`}
                  >
                    <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
