import zod from 'zod';

export const validPortSchema = zod
  .string()
  .trim()
  .transform(Number)
  .refine((port) => Number.isInteger(port) && port >= 1 && port <= 65535, 'Must be an integer between 1 and 65535');

export const booleanStringSchema = zod
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value === 'true' || value === '1');

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

/** The Admin API is served only on the *.myshopify.com host, never on the storefront domain. */
export const myshopifyDomainSchema = zod
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/,
    'SHOPIFY_STORE_DOMAIN must be the *.myshopify.com domain, for example shopdaddy-studio.myshopify.com',
  );

/**
 * MetaobjectDefinitionCreateInput.type (2026-07): 3-255 characters, only alphanumeric, hyphen and underscore
 * (https://shopify.dev/docs/api/admin-graphql/2026-07/input-objects/MetaobjectDefinitionCreateInput).
 * The type must be merchant-owned: `$app:` types are app-owned and no other app, Shopify Flow included, can read them
 * (https://shopify.dev/docs/api/admin-graphql/2026-07/enums/MetaobjectAdminAccessInput).
 */
export const metaobjectTypeSchema = zod
  .string()
  .trim()
  .refine(
    (value) => !value.startsWith('$app:'),
    'SHOPIFY_METAOBJECT_TYPE must be a merchant-owned type, it must not start with $app:',
  )
  .regex(
    /^[A-Za-z0-9_-]{3,255}$/,
    'SHOPIFY_METAOBJECT_TYPE must be 3-255 characters long and contain only letters, digits, hyphens and underscores, for example contact_form',
  );
