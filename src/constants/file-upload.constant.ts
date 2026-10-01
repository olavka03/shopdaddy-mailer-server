/**
 * The storefront form sends at most one logo. Files are validated by extension because browsers send
 * application/octet-stream for EPS, AI and PSD; the canonical mime type is used for the email attachment.
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
  /** Resend caps a whole email at 40 MB after base64 encoding (+33%), so 20 MB leaves room for the markup. */
  MAX_SIZE_MB: 20,
} as const;
