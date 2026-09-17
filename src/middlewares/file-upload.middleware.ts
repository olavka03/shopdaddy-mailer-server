import { LOGO_UPLOAD } from '@constants';
import { ApiError } from '@exceptions';
import { resolveLogoMimeType } from '@utils';
import multer from 'multer';

const ALLOWED_EXTENSIONS = Object.keys(LOGO_UPLOAD.MIME_TYPE_BY_EXTENSION).map((extension) => extension.toUpperCase());

export const createLogoUploadMiddleware = (maxSizeMb: number) => {
  return multer({
    storage: multer.memoryStorage(),
    defParamCharset: 'utf8',
    limits: {
      files: 1,
      fileSize: maxSizeMb * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
      if (!resolveLogoMimeType(file.originalname)) {
        callback(
          ApiError.BadRequest(`The logo must be one of these file types: ${ALLOWED_EXTENSIONS.join(', ')}`, {
            field: file.fieldname,
            allowed: ALLOWED_EXTENSIONS,
          }),
        );

        return;
      }

      callback(null, true);
    },
  }).single(LOGO_UPLOAD.FIELD_NAME);
};
