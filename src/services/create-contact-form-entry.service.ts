import { randomUUID } from 'node:crypto';
import { shopifyAdminRequest } from '@api';
import { env } from '@config';
import { ApiError } from '@exceptions';
import { MetaobjectCreateMutation } from '@graphql';
import { ContactFormEntry, ContactFormPayload, MetaobjectCreateResponse, UploadedShopifyFile } from '@types';
import { buildContactFormMetaobjectFields } from '@utils';
import { deleteShopifyFiles } from './delete-shopify-files.service';
import { uploadLogoToShopify } from './upload-logo-to-shopify.service';

const CONTACT_FORM_ENTRY_HANDLE_PREFIX = 'contact-form-';

const deleteUploadedLogo = async (logo?: UploadedShopifyFile) => {
  if (logo) {
    await deleteShopifyFiles([logo.id]);
  }
};

/**
 * Uploads the optional logo, then writes the whole entry in one metaobjectCreate call.
 * The entry is never updated afterwards because Shopify Flow only triggers on creation.
 */
export const createContactFormEntry = async (payload: ContactFormPayload): Promise<ContactFormEntry> => {
  const logo = payload.logo ? await uploadLogoToShopify(payload.logo) : undefined;
  const handle = `${CONTACT_FORM_ENTRY_HANDLE_PREFIX}${randomUUID()}`;
  const fields = buildContactFormMetaobjectFields(payload, env.SHOPIFY_STORE_URL, logo);

  let response: MetaobjectCreateResponse;

  try {
    response = await shopifyAdminRequest<MetaobjectCreateResponse>(MetaobjectCreateMutation, {
      metaobject: { type: env.SHOPIFY_METAOBJECT_TYPE, handle, fields },
    });
  } catch (error) {
    await deleteUploadedLogo(logo);

    throw error;
  }

  const userErrors = response.metaobjectCreate?.userErrors ?? [];
  const metaobject = response.metaobjectCreate?.metaobject;

  if (userErrors.length > 0 || !metaobject) {
    await deleteUploadedLogo(logo);

    throw ApiError.BadGateway('Could not create the contact form entry', { userErrors });
  }

  // eslint-disable-next-line no-console
  console.info(
    `[SHOPIFY] Contact form entry created — type: ${metaobject.type}, handle: ${metaobject.handle}, logo: ${logo ? 'yes' : 'no'}`,
  );

  return {
    id: metaobject.id,
    handle: metaobject.handle,
    type: metaobject.type,
    logo,
  };
};
