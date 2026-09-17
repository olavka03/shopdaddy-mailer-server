import { LOGO_UPLOAD } from '@constants';
import path from 'node:path';

const mimeTypeByExtension: Readonly<Record<string, string>> = LOGO_UPLOAD.MIME_TYPE_BY_EXTENSION;

/** Canonical mime type of an allowed logo, resolved from the file extension (case-insensitive), or null. */
export const resolveLogoMimeType = (filename: string): string | null => {
  const extension = path.extname(filename).slice(1).toLowerCase();

  return Object.hasOwn(mimeTypeByExtension, extension) ? mimeTypeByExtension[extension] : null;
};
