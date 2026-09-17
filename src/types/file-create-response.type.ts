import { ShopifyFileNode } from './shopify-file-node.type';
import { ShopifyUserError } from './shopify-user-error.type';

export type FileCreateResponse = {
  fileCreate: {
    files: ShopifyFileNode[] | null;
    userErrors: ShopifyUserError[];
  } | null;
};
