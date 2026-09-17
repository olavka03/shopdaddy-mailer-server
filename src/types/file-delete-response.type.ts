import { ShopifyUserError } from './shopify-user-error.type';

export type FileDeleteResponse = {
  fileDelete: {
    deletedFileIds: string[] | null;
    userErrors: ShopifyUserError[];
  } | null;
};
