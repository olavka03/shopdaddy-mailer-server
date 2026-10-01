import { CONTACT_FORM_LIMITS } from '@constants';
import { ContactFormPayload } from '@types';
import { ContactFormParsed } from '@validators';
import { Request } from 'express';
import { parseLinkList } from './parse-link-list.util';
import { parseSelectedProducts } from './parse-selected-products.util';
import { toLinkUrl } from './to-link-url.util';
import { toMailAttachment } from './to-mail-attachment.util';
import { toStoreUrl } from './to-store-url.util';

/**
 * Links may point anywhere (a product, a page, a file, another site), so unlike products they are not limited to the
 * store. Invalid links are dropped without failing the submission, duplicates are dropped after normalization.
 */
const toLinks = (links: string[]): string[] => {
  const urls = links.map((link) => toLinkUrl(link)).filter((url): url is string => Boolean(url));

  return [...new Set(urls)].slice(0, CONTACT_FORM_LIMITS.LINKS_MAX_COUNT);
};

export const buildContactFormPayload = (
  req: Request,
  data: ContactFormParsed,
  storeUrl: string,
): ContactFormPayload => {
  const products = parseSelectedProducts(data.selectedProducts).map((product) => ({
    name: product.name,
    variant: product.variant,
    url: toStoreUrl(product.url, storeUrl),
  }));

  return {
    name: data.name,
    email: data.email,
    message: data.message,
    termsAccepted: data.terms,
    products,
    links: toLinks(parseLinkList(data.linkList)),
    logo: toMailAttachment(req.file),
    previousPage: data.previousPage,
    submittedAt: new Date(),
  };
};
