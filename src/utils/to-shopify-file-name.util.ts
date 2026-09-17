import { randomUUID } from 'node:crypto';
import path from 'node:path';

const MAX_SLUG_LENGTH = 60;

const toAsciiSlug = (value: string): string => {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
};

/**
 * Unique, ASCII-only file name for Shopify Files: `<uuid>-<slug>.<ext>`, or `<uuid>.<ext>` when nothing of the
 * original name survives slugging. The extension is lowercased so it always matches the canonical mime type.
 */
export const toShopifyFileName = (originalName: string): string => {
  const extension = path
    .extname(originalName)
    .slice(1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const slug = toAsciiSlug(path.basename(originalName, path.extname(originalName)));
  const baseName = slug ? `${randomUUID()}-${slug}` : randomUUID();

  return extension ? `${baseName}.${extension}` : baseName;
};
