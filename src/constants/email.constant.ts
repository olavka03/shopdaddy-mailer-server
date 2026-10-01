export const EMAIL_COLORS = {
  background: '#e5e3dc',
  surface: '#f6f5f1',
  border: '#e5e3dc',
  text: '#372727',
  muted: '#6f6362',
  accent: '#e2591c',
} as const;

/** Clients that ignore the web font stylesheet (Gmail, Outlook) fall back to the system fonts after it. */
export const EMAIL_FONTS = {
  STYLESHEET_URL: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Shippori+Mincho&display=swap',
  BODY: 'Figtree, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  HEADING: 'Shippori Mincho, Georgia, Times New Roman, serif',
} as const;

export const EMAIL_BRAND = {
  NAME: 'Shopdaddy-Studio',
  /** PNG rendition of the storefront SVG logo: most email clients do not render SVG. */
  LOGO_URL: 'https://shopdaddy-studio.com/cdn/shop/files/Logo_Shopdaddy.svg?v=1777367869&width=600&format=png',
  LOGO_WIDTH: 200,
} as const;

export const CONTACT_FORM_EMAIL = {
  TITLE: 'New custom order request',
  SUBJECT_PREFIX: 'New custom order request from',
} as const;
