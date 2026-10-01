import zod from 'zod';

/** Resend accepts at most 50 recipients per email (https://resend.com/docs/api-reference/emails/send-email). */
const MAX_RECIPIENTS = 50;

export const validPortSchema = zod
  .string()
  .trim()
  .transform(Number)
  .refine((port) => Number.isInteger(port) && port >= 1 && port <= 65535, 'Must be an integer between 1 and 65535');

export const availableOriginsSchema = zod
  .string()
  .trim()
  .optional()
  .default('*')
  .transform((value): string[] | '*' => {
    const origins = value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);

    return value === '*' || origins.length === 0 ? '*' : origins;
  });

export const resendApiKeySchema = zod.string().trim().startsWith('re_', 'Must be a Resend API key, it starts with re_');

/** Display name of the From header; quotes, angle brackets, commas and line breaks would break `Name <email>`. */
export const mailFromNameSchema = zod
  .string()
  .trim()
  .optional()
  .transform((value) => value || 'Shopdaddy Studio')
  .pipe(zod.string().regex(/^[^"<>,;\r\n]+$/, 'Must not contain quotes, angle brackets, commas or semicolons'));

/** Comma-separated list of email addresses, for example `orders@shop.com, owner@shop.com`. */
export const emailListSchema = zod
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0),
  )
  .pipe(
    zod
      .array(zod.email('Must be a comma-separated list of valid email addresses'))
      .min(1, 'At least one email address is required')
      .max(MAX_RECIPIENTS, `At most ${MAX_RECIPIENTS} email addresses are allowed`),
  );
