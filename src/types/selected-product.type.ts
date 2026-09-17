export type SelectedProduct = {
  name: string;
  variant?: string;
  /** As sent by the storefront, usually relative: /products/<handle>?variant=<id>. */
  url?: string;
  /** `url` resolved against SHOPIFY_STORE_URL. */
  absoluteUrl?: string;
};
