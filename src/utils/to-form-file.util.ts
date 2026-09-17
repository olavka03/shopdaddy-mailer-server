import { INLINE_IMAGE_MIME_TYPES } from '@constants';
import { MailAttachment } from '@types';
import { resolveLogoMimeType } from './resolve-logo-mime-type.util';

const inlineImageMimeTypes = new Set<string>(INLINE_IMAGE_MIME_TYPES);

export const toFormFile = (file?: Express.Multer.File): MailAttachment | undefined => {
  if (!file) {
    return undefined;
  }

  const contentType = resolveLogoMimeType(file.originalname) ?? 'application/octet-stream';
  const isInlineImage = inlineImageMimeTypes.has(contentType);

  return {
    filename: file.originalname,
    content: file.buffer,
    contentType,
    size: Number.isFinite(file.size) ? file.size : file.buffer.length,
    isInlineImage,
    ...(isInlineImage ? { cid: 'logo' } : {}),
  };
};
