import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

export function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, {recursive: true});
}

export function pdfPathForSession(sessionId: string) {
  ensureUploadsDir();
  return path.join(UPLOADS_DIR, `${sessionId}.pdf`);
}
