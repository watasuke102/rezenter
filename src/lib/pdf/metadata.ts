import 'server-only';
import {PDFDocument} from 'pdf-lib';

export async function countPdfPagesFromBytes(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
    updateMetadata: false,
  });
  return doc.getPageCount();
}
