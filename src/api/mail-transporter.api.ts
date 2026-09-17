import nodemailer from 'nodemailer';
import { env } from '@config';

const transportOptions = {
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_SECURE,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_APP_PASSWORD,
  },
};

export const mailTransporter = nodemailer.createTransport(transportOptions);
