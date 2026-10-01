import zod from 'zod';

const ACCEPTED_TERMS_VALUES = ['on', 'true', '1', 'yes', 'accepted'];

const optionalTextSchema = zod
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

/** Whitespace runs, line breaks included, collapsed into one space: the value is rendered on a single line. */
const singleLineSchema = zod.string().transform((value) => value.replace(/\s+/g, ' ').trim());

const termsSchema = zod
  .union([zod.string(), zod.number(), zod.boolean()])
  .optional()
  .transform((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = String(value ?? '');

    return ACCEPTED_TERMS_VALUES.includes(normalized.trim().toLowerCase());
  });

export const selectedProductSchema = zod.object({
  name: singleLineSchema.pipe(zod.string().min(1, 'Product name is required')),
  variant: singleLineSchema.optional().transform((value) => (value ? value : undefined)),
  // usually relative (/products/<handle>?variant=<id>), resolved against SHOPIFY_STORE_URL in the payload builder
  url: optionalTextSchema,
});

export const contactFormSchema = zod.object({
  // also used in the email subject, which must stay on one line
  name: singleLineSchema.pipe(zod.string().min(1, 'Name is required')),
  // becomes the reply-to address of the email
  email: zod.string().trim().pipe(zod.email('Invalid email address')),
  message: zod.string().trim().max(10000, 'Message must be 10000 characters or fewer').optional().default(''),
  selectedProducts: zod.unknown().optional(),
  // multipart/form-data cannot carry an array, so the same list of links arrives as a JSON string there, as a string
  // array when the field is repeated, and as a real array in a JSON body; the urls are validated in the payload builder
  linkList: zod.union([zod.string(), zod.array(zod.string())]).optional(),
  terms: termsSchema,
  // hidden input filled with document.referrer; anything that is not an absolute http(s) url is dropped instead of
  // failing the submission, which also keeps javascript: and relative values out of the email links
  previousPage: zod
    .string()
    .trim()
    .pipe(zod.url({ protocol: /^https?$/ }))
    .optional()
    .catch(undefined),
});

export type ContactFormParsed = zod.infer<typeof contactFormSchema>;

export type SelectedProductParsed = zod.infer<typeof selectedProductSchema>;
