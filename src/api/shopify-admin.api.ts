import { env } from '@config';
import { SHOPIFY_API_VERSION, SHOPIFY_THROTTLE_RETRY_DELAY_MS } from '@constants';
import { ApiError } from '@exceptions';
import { ShopifyGraphqlError, ShopifyGraphqlResponse } from '@types';
import { wait } from '@utils';

const SHOPIFY_ADMIN_API_URL = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

const isThrottled = (errors: ShopifyGraphqlError[]) => {
  return errors.some((error) => error.extensions?.code === 'THROTTLED');
};

const discardBody = async (response: Response) => {
  try {
    await response.body?.cancel();
  } catch {
    // The body is not needed, a failure to release it is irrelevant.
  }
};

const sendRequest = async (body: string): Promise<Response> => {
  try {
    return await fetch(SHOPIFY_ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
      },
      body,
    });
  } catch (error) {
    throw ApiError.BadGateway('Shopify Admin API is unreachable', {
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};

const readResponse = async <TData>(response: Response): Promise<ShopifyGraphqlResponse<TData> | null> => {
  try {
    return (await response.json()) as ShopifyGraphqlResponse<TData>;
  } catch {
    return null;
  }
};

const executeRequest = async <TData>(body: string, isRetry: boolean): Promise<TData> => {
  const retryOrThrow = async () => {
    if (isRetry) {
      throw ApiError.BadGateway('Shopify Admin API is throttling requests');
    }

    await wait(SHOPIFY_THROTTLE_RETRY_DELAY_MS);

    return executeRequest<TData>(body, true);
  };

  const response = await sendRequest(body);

  if (response.status === 401 || response.status === 403) {
    await discardBody(response);

    throw ApiError.BadGateway('Shopify Admin API rejected the access token', { status: response.status });
  }

  if (response.status === 429) {
    await discardBody(response);

    return retryOrThrow();
  }

  if (!response.ok) {
    await discardBody(response);

    throw ApiError.BadGateway('Shopify Admin API request failed', { status: response.status });
  }

  const result = await readResponse<TData>(response);
  const errors = result?.errors ?? [];

  if (errors.length > 0) {
    if (isThrottled(errors)) {
      return retryOrThrow();
    }

    throw ApiError.BadGateway('Shopify Admin API returned errors', { errors: errors.map((error) => error.message) });
  }

  if (!result?.data) {
    throw ApiError.BadGateway('Shopify Admin API returned no data');
  }

  return result.data;
};

/**
 * Runs one Admin GraphQL operation. Transport, auth, throttling and top-level GraphQL errors become
 * ApiError.BadGateway; `userErrors` are left to the caller.
 */
export const shopifyAdminRequest = async <TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> => {
  const body = JSON.stringify({ query, variables });

  return executeRequest<TData>(body, false);
};
