import { env } from '@config';
import cors from 'cors';
import express from 'express';
import { errorMiddleware } from './error.middleware';
import { fileUploadMiddleware } from './file-upload.middleware';
import { successWrapperMiddleware } from './success-wrapper.middleware';

export const middlewares = {
  cors: cors({ origin: env.AVAILABLE_ORIGINS }),
  json: express.json({ limit: '5mb' }),
  urlencoded: express.urlencoded({ extended: true, limit: '5mb' }),
  fileUpload: fileUploadMiddleware,
  successWrapper: successWrapperMiddleware,
  error: errorMiddleware,
};
