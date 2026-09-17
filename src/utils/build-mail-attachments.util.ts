import { INLINE_IMAGE_MIME_TYPES } from '@constants';
import { MailAttachment } from '@types';

const inlineImageMimeTypes = new Set<string>(INLINE_IMAGE_MIME_TYPES);

export const buildMailAttachments = (files: Express.Multer.File[]): MailAttachment[] => {
  if (!Array.isArray(files)) {
    return [];
  }

  return files.map((file, index): MailAttachment => {
    const contentType = file.mimetype || 'application/octet-stream';
    const isInlineImage = inlineImageMimeTypes.has(contentType);

    return {
      fieldName: file.fieldname || 'file',
      filename: file.originalname || `attachment-${index}`,
      content: file.buffer,
      contentType,
      size: Number.isFinite(file.size) ? file.size : (file.buffer?.length ?? 0),
      isInlineImage,
      ...(isInlineImage ? { cid: `attachment-${index}` } : {}),
    };
  });
};
