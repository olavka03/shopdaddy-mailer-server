export type UploadedShopifyFile = {
  /** GenericFile GID, for example gid://shopify/GenericFile/123. */
  id: string;
  /** Public CDN url of the READY file. */
  url: string;
  originalFilename: string;
  mimeType: string;
  size: number;
};
