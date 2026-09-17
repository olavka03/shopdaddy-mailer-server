import zod from 'zod';

const ACCEPTED_TERMS_VALUES = ['on', 'true', '1', 'yes', 'accepted'];

const optionalTextSchema = zod
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const displayValueSchema = zod
  .union([zod.string(), zod.number()])
  .optional()
  .transform((value) => (value === undefined ? undefined : String(value).trim() || undefined));

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
  name: zod.string().trim().min(1, 'Product name is required'),
  variant: optionalTextSchema,
  url: optionalTextSchema,
  image: optionalTextSchema,
  price: displayValueSchema,
  quantity: displayValueSchema,
  sku: optionalTextSchema,
});

export const contactFormSchema = zod
  .object({
    name: zod.string().trim().min(1, 'Name is required'),
    email: zod.string().trim().pipe(zod.email('Invalid email address')),
    phone: optionalTextSchema,
    subject: optionalTextSchema,
    message: zod.string().trim().optional().default(''),
    selectedProducts: zod.unknown().optional(),
    terms: termsSchema,
  })
  .catchall(zod.unknown());

export type ContactFormInput = zod.input<typeof contactFormSchema>;

export type ContactFormParsed = zod.infer<typeof contactFormSchema>;
