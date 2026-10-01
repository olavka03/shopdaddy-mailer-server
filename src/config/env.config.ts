import zod from 'zod';
import dotenv from 'dotenv';
import { Environment } from '@enums';
import {
  availableOriginsSchema,
  emailListSchema,
  mailFromNameSchema,
  resendApiKeySchema,
  validPortSchema,
} from '@validators';

dotenv.config();

const envSchema = zod.object({
  PORT: validPortSchema,
  NODE_ENV: zod.union(
    Object.values(Environment).map((environment) => zod.literal(environment)),
    { error: `NODE_ENV must be one of: ${Object.values(Environment).join(', ')}` },
  ),
  AVAILABLE_ORIGINS: availableOriginsSchema,
  SHOPIFY_STORE_URL: zod
    .string()
    .trim()
    .pipe(
      zod.url({
        protocol: /^https?$/,
        error: 'SHOPIFY_STORE_URL must be a valid URL, for example https://shopdaddy-studio.com',
      }),
    ),
  RESEND_API_KEY: resendApiKeySchema,
  MAIL_FROM_EMAIL: zod
    .string()
    .trim()
    .pipe(zod.email('MAIL_FROM_EMAIL must be a valid email address on a domain verified in Resend')),
  MAIL_FROM_NAME: mailFromNameSchema,
  MAIL_TO: emailListSchema,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => {
    const name = String(issue.path[0] ?? 'env');

    return `  - ${name}: ${process.env[name] === undefined ? 'is required but was not set' : issue.message}`;
  });

  // eslint-disable-next-line no-console
  console.error(
    [
      '[CONFIG] The server cannot start — invalid environment variables:',
      ...issues,
      '',
      'See .env.example for the full list.',
    ].join('\n'),
  );

  process.exit(1);
}

export const env = parsedEnv.data;
