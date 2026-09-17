import { ALLOWED_FILE_MIME_TYPES, FILE_UPLOAD_LIMITS } from '@constants';
import { ApiError } from '@exceptions';
import multer from 'multer';

const allowedFileMimeTypes = new Set<string>(ALLOWED_FILE_MIME_TYPES);

export const fileUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: FILE_UPLOAD_LIMITS.MAX_FILES,
    fileSize: FILE_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedFileMimeTypes.has(file.mimetype)) {
      callback(
        ApiError.BadRequest(`The file type "${file.mimetype}" is not allowed`, {
          mimetype: file.mimetype,
          allowed: [...allowedFileMimeTypes],
        }),
      );

      return;
    }

    callback(null, true);
  },
}).any();
