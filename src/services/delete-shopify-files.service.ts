import { shopifyAdminRequest } from '@api';
import { FileDeleteMutation } from '@graphql';
import { FileDeleteResponse } from '@types';

/** Best-effort cleanup of Shopify Files. Failures are logged and never thrown. */
export const deleteShopifyFiles = async (fileIds: string[]): Promise<void> => {
  const ids = [...new Set(fileIds.filter(Boolean))];

  if (ids.length === 0) {
    return;
  }

  try {
    const data = await shopifyAdminRequest<FileDeleteResponse>(FileDeleteMutation, { fileIds: ids });
    const userErrors = data.fileDelete?.userErrors ?? [];

    if (userErrors.length > 0) {
      // eslint-disable-next-line no-console
      console.error('[SHOPIFY] Could not delete files', { fileIds: ids, userErrors });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SHOPIFY] Could not delete files', { fileIds: ids, error });
  }
};
