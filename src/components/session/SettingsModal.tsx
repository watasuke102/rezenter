'use client';

import {useViewerSettings} from '@/lib/useViewerSettings';
import {useMarginPresets} from '@/lib/useMarginPresets';
import {useState} from 'react';
import * as styles from './SettingsModal.css';

type Props = {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({sessionId, isOpen, onClose}: Props) {
  const {settings, updateSettings, isLoaded} = useViewerSettings(sessionId);
  const {presets, savePreset, isLoaded: presetsLoaded} = useMarginPresets();
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState('');

  if (!isOpen || !isLoaded || !presetsLoaded) return null;

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    savePreset({
      name: newPresetName.trim(),
      marginTop: settings.marginTop,
      marginBottom: settings.marginBottom,
      marginLeft: settings.marginLeft,
      marginRight: settings.marginRight,
    });
    setNewPresetName('');
  };

  const handleLoadPreset = () => {
    const p = presets.find(p => p.name === selectedPresetName);
    if (!p) return;
    updateSettings({
      marginTop: p.marginTop,
      marginBottom: p.marginBottom,
      marginLeft: p.marginLeft,
      marginRight: p.marginRight,
    });
  };

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

        <div className={styles.field}>
          <span>プリセット</span>
          <div className={styles.presetContainer}>
            <select
              className={styles.presetSelect}
              value={selectedPresetName}
              onChange={e => setSelectedPresetName(e.target.value)}
            >
              <option value=''>プリセットを選択...</option>
              {presets.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type='button'
              className={styles.presetButton}
              disabled={!selectedPresetName}
              onClick={handleLoadPreset}
            >
              呼び出し
            </button>
            <input
              type='text'
              className={styles.presetInput}
              placeholder='プリセット名'
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
            />
            <button
              type='button'
              className={styles.presetButton}
              disabled={!newPresetName.trim()}
              onClick={handleSavePreset}
            >
              保存
            </button>
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
