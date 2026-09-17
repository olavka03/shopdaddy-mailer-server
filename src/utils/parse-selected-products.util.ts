import { SelectedProduct } from '@types';
import { selectedProductSchema } from '@validators';

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

export const parseSelectedProducts = (value: unknown): SelectedProduct[] => {
  const products: SelectedProduct[] = [];

  for (const item of toRawProductList(value)) {
    const parsed = selectedProductSchema.safeParse(item);

    if (parsed.success) {
      products.push(parsed.data as SelectedProduct);
    }
  }

  return products;
};
