import zod from 'zod';
import dotenv from 'dotenv';
import { Environment } from '@enums';
import { availableOriginsSchema, booleanStringSchema, validPortSchema } from '@validators';

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
    .pipe(zod.url('SHOPIFY_STORE_URL must be a valid URL, for example https://shopdaddy-studio.com')),
  MAIL_HOST: zod.string().trim().optional().default('smtp.gmail.com'),
  MAIL_PORT: zod.string().optional().default('465').pipe(validPortSchema),
  MAIL_SECURE: zod.string().optional().default('true').pipe(booleanStringSchema),
  MAIL_USER: zod.string().trim().pipe(zod.email('MAIL_USER must be a valid email address')),
  MAIL_APP_PASSWORD: zod.string().trim().min(1, 'MAIL_APP_PASSWORD is required'),
  MAIL_TO: zod.string().trim().pipe(zod.email('MAIL_TO must be a valid email address')),
  MAIL_FROM_NAME: zod.string().trim().optional().default('Contact Form'),
  MAIL_SUBJECT_PREFIX: zod.string().trim().optional().default('New contact form submission'),
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
