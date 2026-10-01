export type SelectedProduct = {
  name: string;
  variant?: string;
  /** Absolute storefront url, kept only when it points to SHOPIFY_STORE_URL. */
  url?: string;
};
