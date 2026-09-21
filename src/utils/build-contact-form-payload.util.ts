import { ContactFormPayload } from '@types';
import { ContactFormParsed } from '@validators';
import { Request } from 'express';
import { parseLinkList } from './parse-link-list.util';
import { parseSelectedProducts } from './parse-selected-products.util';
import { resolveAbsoluteUrl } from './resolve-absolute-url.util';
import { toFormFile } from './to-form-file.util';

export const buildContactFormPayload = (
  req: Request,
  data: ContactFormParsed,
  storeUrl: string,
): ContactFormPayload => {
  const products = parseSelectedProducts(data.selectedProducts).map((product) => ({
    ...product,
    absoluteUrl: resolveAbsoluteUrl(product.url, storeUrl) ?? undefined,
  }));

  return {
    name: data.name,
    email: data.email,
    message: data.message,
    termsAccepted: data.terms,
    products,
    links: parseLinkList(data.linkList),
    logo: toFormFile(req.file),
    previousPage: data.previousPage,
    submittedAt: new Date(),
  };
};
