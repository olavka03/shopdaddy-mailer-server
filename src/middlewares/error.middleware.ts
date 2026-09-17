import { ApiError } from '@exceptions';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MULTER_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'The logo file is too large',
  LIMIT_FILE_COUNT: 'Only one file can be uploaded, in the "logo" field',
  LIMIT_UNEXPECTED_FILE: 'Only one file can be uploaded, in the "logo" field',
};

const logClientError = (status: number, message: string, errors: unknown) => {
  // eslint-disable-next-line no-console
  console.warn(`[WARN] ${status} ${message} — ${JSON.stringify(errors)}`);
};

const logServerError = (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', error);
};

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    const { status, message, errors } = error;

    if (status < 500) {
      logClientError(status, message, errors);
    } else {
      logServerError(error);
    }

    res.status(status).send({ success: false, message, errors });

    return;
  }

  if (error instanceof multer.MulterError) {
    const message = MULTER_ERROR_MESSAGES[error.code] || 'The uploaded file could not be processed';
    const errors = { code: error.code, field: error.field };

    logClientError(400, message, errors);

    res.status(400).send({ success: false, message, errors });

    return;
  }

  logServerError(error);

  res.status(500).send({
    success: false,
    message: (error as Error)?.message || 'Internal error',
    errors: {},
  });

  return;
};
