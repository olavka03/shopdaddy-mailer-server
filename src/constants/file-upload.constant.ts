/**
 * The storefront form sends at most one logo. Files are validated by extension because browsers send
 * application/octet-stream for EPS, AI and PSD; the canonical mime type is used for the Shopify upload and the email.
 */
export const LOGO_UPLOAD = {
  FIELD_NAME: 'logo',
  MIME_TYPE_BY_EXTENSION: {
    eps: 'application/postscript',
    ai: 'application/postscript',
    psd: 'image/vnd.adobe.photoshop',
    pdf: 'application/pdf',
    svg: 'image/svg+xml',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  },
  SHOPIFY_MAX_SIZE_MB: 20,
  // nodemailer (disabled)
  // /** Gmail caps a message at 25 MB after base64 encoding (+33%), so the email logo stays well below that. */
  // EMAIL_MAX_SIZE_MB: 10,
} as const;

export const INLINE_IMAGE_MIME_TYPES: readonly string[] = ['image/png', 'image/jpeg'] as const;
