import { mailTransporter } from '@api';
import { env } from '@config';

export const verifyMailTransporter = async (): Promise<boolean> => {
  try {
    await mailTransporter.verify();

    // eslint-disable-next-line no-console
    console.info(`[MAIL] SMTP transporter ready on ${env.MAIL_HOST}:${env.MAIL_PORT} as ${env.MAIL_USER}`);

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[MAIL] SMTP transporter verification failed', error);

    return false;
  }
};
