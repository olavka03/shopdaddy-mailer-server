import { ShopifyStagedUploadTarget } from './shopify-staged-upload-target.type';
import { ShopifyUserError } from './shopify-user-error.type';

export type StagedUploadsCreateResponse = {
  stagedUploadsCreate: {
    stagedTargets: ShopifyStagedUploadTarget[] | null;
    userErrors: ShopifyUserError[];
  } | null;
};
