import { shopifyAdminRequest } from '@api';
import { SHOPIFY_FILE_PROCESSING } from '@constants';
import { ApiError } from '@exceptions';
import { FileCreateMutation, FilesStatusQuery, StagedUploadsCreateMutation } from '@graphql';
import {
  FileCreateResponse,
  FilesStatusResponse,
  MailAttachment,
  ShopifyFileNode,
  StagedUploadsCreateResponse,
  UploadedShopifyFile,
} from '@types';
import { toShopifyFileName, wait } from '@utils';
import { deleteShopifyFiles } from './delete-shopify-files.service';

type StagedUpload = {
  url: string;
  resourceUrl: string;
  parameters: { name: string; value: string }[];
};

const stageUpload = async (logo: MailAttachment, filename: string): Promise<StagedUpload> => {
  const data = await shopifyAdminRequest<StagedUploadsCreateResponse>(StagedUploadsCreateMutation, {
    input: [
      {
        filename,
        mimeType: logo.contentType,
        resource: 'FILE',
        httpMethod: 'POST',
        fileSize: String(logo.size),
      },
    ],
  });
  const userErrors = data.stagedUploadsCreate?.userErrors ?? [];
  const target = data.stagedUploadsCreate?.stagedTargets?.[0];

  if (userErrors.length > 0 || !target?.url || !target.resourceUrl) {
    throw ApiError.BadGateway('Could not prepare the logo upload', { userErrors });
  }

  return { url: target.url, resourceUrl: target.resourceUrl, parameters: target.parameters };
};

const uploadToStagedTarget = async (target: StagedUpload, logo: MailAttachment, filename: string): Promise<void> => {
  const formData = new FormData();

  for (const parameter of target.parameters) {
    formData.append(parameter.name, parameter.value);
  }

  formData.append('file', new Blob([new Uint8Array(logo.content)], { type: logo.contentType }), filename);

  let response: Response;

  try {
    response = await fetch(target.url, { method: 'POST', body: formData });
  } catch (error) {
    throw ApiError.BadGateway('Could not upload the logo to Shopify', {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    await response.body?.cancel();
  } catch {
    // The staged upload response body is not needed.
  }

  if (!response.ok) {
    throw ApiError.BadGateway('Could not upload the logo to Shopify', { status: response.status });
  }
};

const registerFile = async (resourceUrl: string, filename: string): Promise<ShopifyFileNode> => {
  const data = await shopifyAdminRequest<FileCreateResponse>(FileCreateMutation, {
    files: [{ originalSource: resourceUrl, contentType: 'FILE', filename }],
  });
  const userErrors = data.fileCreate?.userErrors ?? [];
  const files = data.fileCreate?.files ?? [];
  const file = files[0];

  if (userErrors.length > 0 || !file?.id) {
    await deleteShopifyFiles(files.map((item) => item?.id));

    throw ApiError.BadGateway('Could not register the logo in Shopify', { userErrors });
  }

  return file;
};

const toFailureReason = (file: ShopifyFileNode): string => {
  const messages = (file.fileErrors ?? []).map((error) => error.details || error.message).filter(Boolean);

  return messages.length > 0 ? messages.join('; ') : 'Unknown processing error';
};

const waitForReadyFile = async (initialFile: ShopifyFileNode): Promise<ShopifyFileNode & { url: string }> => {
  const deadline = Date.now() + SHOPIFY_FILE_PROCESSING.TIMEOUT_MS;
  let file: ShopifyFileNode | null = initialFile;
  let delay: number = SHOPIFY_FILE_PROCESSING.POLL_INITIAL_DELAY_MS;

  while (true) {
    if (file?.fileStatus === 'READY' && file.url) {
      return { ...file, url: file.url };
    }

    if (file?.fileStatus === 'FAILED') {
      throw ApiError.UnprocessableEntity('The logo file could not be processed, please upload a different file', {
        reason: toFailureReason(file),
      });
    }

    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      throw ApiError.BadGateway('The logo was not processed by Shopify in time');
    }

    await wait(Math.min(delay, remaining));
    delay = Math.min(delay * 2, SHOPIFY_FILE_PROCESSING.POLL_MAX_DELAY_MS);

    const data: FilesStatusResponse = await shopifyAdminRequest<FilesStatusResponse>(FilesStatusQuery, {
      ids: [initialFile.id],
    });

    file = data.nodes?.[0] ?? null;
  }
};

/**
 * Uploads the logo to Shopify Files as a GenericFile (staged upload -> fileCreate -> poll until READY).
 * Any failure after the file was registered deletes it before the error is rethrown.
 */
export const uploadLogoToShopify = async (logo: MailAttachment): Promise<UploadedShopifyFile> => {
  const filename = toShopifyFileName(logo.filename);
  const target = await stageUpload(logo, filename);

  await uploadToStagedTarget(target, logo, filename);

  const registeredFile = await registerFile(target.resourceUrl, filename);

  try {
    const readyFile = await waitForReadyFile(registeredFile);

    return {
      id: readyFile.id,
      url: readyFile.url,
      originalFilename: logo.filename,
      mimeType: readyFile.mimeType || logo.contentType,
      size: logo.size,
    };
  } catch (error) {
    await deleteShopifyFiles([registeredFile.id]);

    throw error;
  }
};
