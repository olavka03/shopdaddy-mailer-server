import { MailAttachment } from '@types';
import { resolveLogoMimeType } from './resolve-logo-mime-type.util';

/** Control characters, quotes and path separators are replaced so the name is safe in the attachment headers. */
const toSafeFilename = (originalName: string): string => {
  return originalName.replace(/[\p{Cc}"/\\]/gu, '_').trim();
};

export const toMailAttachment = (file?: Express.Multer.File): MailAttachment | undefined => {
  if (!file) {
    return undefined;
  }

  return {
    filename: toSafeFilename(file.originalname),
    content: file.buffer,
    contentType: resolveLogoMimeType(file.originalname) ?? 'application/octet-stream',
    size: Number.isFinite(file.size) ? file.size : file.buffer.length,
  };
};
