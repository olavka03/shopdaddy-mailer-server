import { ShopifyUserError } from './shopify-user-error.type';

export type MetaobjectCreateResponse = {
  metaobjectCreate: {
    metaobject: {
      id: string;
      handle: string;
      type: string;
    } | null;
    userErrors: ShopifyUserError[];
  } | null;
};
