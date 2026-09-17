import { ShopifyFileError } from './shopify-file-error.type';

export type ShopifyFileStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

/** Selection of `File` + `... on GenericFile` in FileCreateMutation and FilesStatusQuery. */
export type ShopifyFileNode = {
  id: string;
  fileStatus: ShopifyFileStatus;
  fileErrors: ShopifyFileError[];
  /** GenericFile only, null until the file is READY. */
  url?: string | null;
  /** GenericFile only. */
  mimeType?: string | null;
};
