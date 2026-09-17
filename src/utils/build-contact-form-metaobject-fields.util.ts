import { CONTACT_FORM_METAOBJECT_FIELD_KEYS, METAOBJECT_URL_MAX_BYTES } from '@constants';
import { ContactFormPayload, MetaobjectFieldInput, SelectedProduct, UploadedShopifyFile } from '@types';
import { toShopifyDateTime } from './to-shopify-date-time.util';

const toTrimmedString = (value?: string | null): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const toSingleLine = (value?: string | null): string => {
  return toTrimmedString(value).replace(/\s+/g, ' ');
};

/** Absolute http(s) url, serialized so it never contains spaces, and short enough for a Shopify url field. */
const toHttpUrl = (value?: string | null): string => {
  const trimmed = toTrimmedString(value);

  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    const serialized = url.toString();
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';

    return isHttp && Buffer.byteLength(serialized) <= METAOBJECT_URL_MAX_BYTES ? serialized : '';
  } catch {
    return '';
  }
};

const toOrigin = (value: string): string => {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
};

/**
 * Products link to the storefront only: a tampered request must not put a link to another site into the admin email.
 * The url must already be in canonical form (as resolved from a relative storefront url), so the stored link always
 * starts with `<store origin>/` and never carries credentials, a default port, upper case or raw whitespace.
 */
const toProductUrl = (value: string | undefined, storeOrigin: string): string => {
  const trimmed = toTrimmedString(value);

  try {
    const url = new URL(trimmed);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const isStoreOrigin = url.origin === storeOrigin;
    const isCanonical = url.href === trimmed && !url.username && !url.password;

    return isHttp && isStoreOrigin && isCanonical && Buffer.byteLength(trimmed) <= METAOBJECT_URL_MAX_BYTES
      ? trimmed
      : '';
  } catch {
    return '';
  }
};

/** Compact JSON array of `{ name, variant?, url? }` in the storefront format; empty string when there is nothing to store. */
const toProductsJson = (products: SelectedProduct[], storeUrl: string): string => {
  const storeOrigin = toOrigin(storeUrl);
  const items = products
    .map((product) => {
      const name = toSingleLine(product.name);
      const variant = toSingleLine(product.variant);
      const url = toProductUrl(product.absoluteUrl, storeOrigin);

      return { name, ...(variant && { variant }), ...(url && { url }) };
    })
    .filter((item) => item.name);

  return items.length > 0 ? JSON.stringify(items) : '';
};

/** Builds the metaobjectCreate `fields` input. Empty optional fields are omitted, `terms_accepted` is always written. */
export const buildContactFormMetaobjectFields = (
  payload: ContactFormPayload,
  storeUrl: string,
  logo?: UploadedShopifyFile,
): MetaobjectFieldInput[] => {
  const fields: MetaobjectFieldInput[] = [];

  const addField = (key: string, value: string) => {
    if (value) {
      fields.push({ key, value });
    }
  };

  addField(CONTACT_FORM_METAOBJECT_FIELD_KEYS.NAME, toTrimmedString(payload.name));
  addField(CONTACT_FORM_METAOBJECT_FIELD_KEYS.EMAIL, toTrimmedString(payload.email));
  addField(CONTACT_FORM_METAOBJECT_FIELD_KEYS.MESSAGE, toTrimmedString(payload.message));
  addField(CONTACT_FORM_METAOBJECT_FIELD_KEYS.PRODUCTS, toProductsJson(payload.products, storeUrl));
  addField(CONTACT_FORM_METAOBJECT_FIELD_KEYS.LOGO, toHttpUrl(logo?.url));
  addField(CONTACT_FORM_METAOBJECT_FIELD_KEYS.PREVIOUS_PAGE, toHttpUrl(payload.previousPage));
  fields.push({ key: CONTACT_FORM_METAOBJECT_FIELD_KEYS.TERMS_ACCEPTED, value: String(payload.termsAccepted) });
  addField(CONTACT_FORM_METAOBJECT_FIELD_KEYS.SUBMITTED_AT, toShopifyDateTime(payload.submittedAt));

  return fields;
};
