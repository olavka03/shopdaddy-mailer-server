export type ShopifyStagedUploadTarget = {
  url: string | null;
  resourceUrl: string | null;
  parameters: {
    name: string;
    value: string;
  }[];
};
