import { ShopifyFileNode } from './shopify-file-node.type';

export type FilesStatusResponse = {
  /** Same order as the requested ids; null for ids that no longer exist. */
  nodes: (ShopifyFileNode | null)[];
};
