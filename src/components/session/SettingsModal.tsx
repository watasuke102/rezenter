'use client';

import {useViewerSettings} from '@/lib/useViewerSettings';
import * as styles from './SettingsModal.css';

type Props = {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({sessionId, isOpen, onClose}: Props) {
  const {settings, updateSettings, isLoaded} = useViewerSettings(sessionId);

  if (!isOpen || !isLoaded) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.header}>表示設定</h2>

        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type='checkbox'
              checked={settings.concatenatedMode}
              onChange={e =>
                updateSettings({concatenatedMode: e.target.checked})
              }
            />
            <span>連結モード</span>
          </label>
        </div>

        <div className={styles.field}>
          <span>マージン設定（連結モード時のみ有効・px）</span>
          <div className={styles.inputGroup}>
            <label>
              上:
              <input
                type='number'
                className={styles.numberInput}
                value={settings.marginTop}
                disabled={!settings.concatenatedMode}
                onChange={e =>
                  updateSettings({marginTop: Number(e.target.value)})
                }
              />
            </label>
            <label>
              下:
              <input
                type='number'
                className={styles.numberInput}
                value={settings.marginBottom}
                disabled={!settings.concatenatedMode}
                onChange={e =>
                  updateSettings({marginBottom: Number(e.target.value)})
                }
              />
            </label>
            <label>
              左:
              <input
                type='number'
                className={styles.numberInput}
                value={settings.marginLeft}
                disabled={!settings.concatenatedMode}
                onChange={e =>
                  updateSettings({marginLeft: Number(e.target.value)})
                }
              />
            </label>
            <label>
              右:
              <input
                type='number'
                className={styles.numberInput}
                value={settings.marginRight}
                disabled={!settings.concatenatedMode}
                onChange={e =>
                  updateSettings({marginRight: Number(e.target.value)})
                }
              />
            </label>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type='button'
            className={styles.closeButton}
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
