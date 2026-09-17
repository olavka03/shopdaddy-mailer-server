export const PREVIOUS_PAGE_FIELD_KEYS: readonly string[] = [
  'previousPage',
  'previous_page',
  'previousPageUrl',
  'previous_page_url',
  'previousUrl',
  'previous_url',
  'documentReferrer',
  'document_referrer',
  'referrer',
  'referer',
];

/**
 * Field names the form may send that are deliberately dropped: the page the form was submitted from is
 * intentionally not reported. They stay listed so they never surface as unknown "additional fields".
 */
export const IGNORED_FIELD_KEYS: readonly string[] = [
  'pageUrl',
  'page_url',
  'sourceUrl',
  'source_url',
  'currentUrl',
  'current_url',
  'pageURL',
  'url',
];

export const KNOWN_CONTACT_FORM_FIELDS: readonly string[] = [
  'name',
  'email',
  'phone',
  'subject',
  'message',
  'selectedProducts',
  'terms',
  ...PREVIOUS_PAGE_FIELD_KEYS,
  ...IGNORED_FIELD_KEYS,
];

export const EMAIL_COLORS = {
  background: '#f2efe9',
  surface: '#ffffff',
  border: '#e3ddd2',
  text: '#1d1b19',
  muted: '#6e675e',
  accent: '#b8501f',
  accentSoft: '#fbeee5',
  accentBorder: '#f0d3bd',
  success: '#1f7a5c',
} as const;
