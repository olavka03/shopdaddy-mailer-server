import { UploadedShopifyFile } from './uploaded-shopify-file.type';

export type ContactFormEntry = {
  id: string;
  handle: string;
  type: string;
  logo?: UploadedShopifyFile;
};
