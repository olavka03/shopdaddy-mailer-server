import { env } from '@config';
import { LOGO_UPLOAD } from '@constants';
import cors from 'cors';
import express from 'express';
import { errorMiddleware } from './error.middleware';
import { createLogoUploadMiddleware } from './file-upload.middleware';
import { successWrapperMiddleware } from './success-wrapper.middleware';

export const middlewares = {
  cors: cors({ origin: env.AVAILABLE_ORIGINS }),
  json: express.json({ limit: '5mb' }),
  urlencoded: express.urlencoded({ extended: true, limit: '5mb' }),
  logoUpload: createLogoUploadMiddleware(LOGO_UPLOAD.SHOPIFY_MAX_SIZE_MB),
  // nodemailer (disabled)
  // emailLogoUpload: createLogoUploadMiddleware(LOGO_UPLOAD.EMAIL_MAX_SIZE_MB),
  successWrapper: successWrapperMiddleware,
  error: errorMiddleware,
};
