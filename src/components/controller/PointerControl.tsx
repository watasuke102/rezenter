'use client';

import * as styles from '@/components/controller/PointerControl.css';
import {usePointerControl} from '@/components/controller/use-pointer-control';
import type {PointerControlOptions} from '@/components/controller/use-pointer-control';

export function PointerControl(props: PointerControlOptions) {
  return <div className={styles.trackpad} {...usePointerControl(props)} />;
}
