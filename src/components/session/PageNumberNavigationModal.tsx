import * as styles from './PageNumberNavigationModal.css';

type Props = {
  pageNumberInput: string;
};

export function PageNumberNavigationModal({pageNumberInput}: Props) {
  if (!pageNumberInput) {
    return null;
  }

  return (
    <div className={styles.overlay} aria-live='polite'>
      <div className={styles.modal}>{pageNumberInput}</div>
    </div>
  );
}
