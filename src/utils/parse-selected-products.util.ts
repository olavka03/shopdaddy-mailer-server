import { SelectedProductParsed, selectedProductSchema } from '@validators';

const toRawProductList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Products as the storefront sent them; items that are not `{ name, variant?, url? }` objects are skipped. */
export const parseSelectedProducts = (value: unknown): SelectedProductParsed[] => {
  const products: SelectedProductParsed[] = [];

  for (const item of toRawProductList(value)) {
    const parsed = selectedProductSchema.safeParse(item);

    if (parsed.success) {
      products.push(parsed.data);
    }
  }

  return products;
};
