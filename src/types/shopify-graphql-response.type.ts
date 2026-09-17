export type ShopifyGraphqlError = {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
};

export type ShopifyGraphqlResponse<TData> = {
  data?: TData | null;
  errors?: ShopifyGraphqlError[];
  extensions?: Record<string, unknown>;
};
