import { env } from '@config';
import { ApiError } from '@exceptions';
import { sendContactFormEmail } from '@services';
import { ContactFormPayload } from '@types';
import {
  buildMailAttachments,
  parseSelectedProducts,
  pickExtraFields,
  resolveAbsoluteUrl,
  resolveRequestSource,
} from '@utils';
import { contactFormSchema } from '@validators';
import { RequestHandler } from 'express';
import zod from 'zod';

export const sendContactFormController: RequestHandler = async (req, res) => {
  const parsed = contactFormSchema.safeParse(req.body);

  if (!parsed.success) {
    throw ApiError.BadRequest('Validation failed', zod.flattenError(parsed.error));
  }

  const source = resolveRequestSource(req, env.SHOPIFY_STORE_URL);
  const products = parseSelectedProducts(parsed.data.selectedProducts).map((product) => ({
    ...product,
    absoluteUrl: resolveAbsoluteUrl(product.url, env.SHOPIFY_STORE_URL) ?? undefined,
  }));
  const attachments = buildMailAttachments((req.files as Express.Multer.File[] | undefined) ?? []);

  const payload: ContactFormPayload = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    subject: parsed.data.subject,
    message: parsed.data.message ?? '',
    termsAccepted: Boolean(parsed.data.terms),
    products,
    attachments,
    extraFields: pickExtraFields(req.body),
    source,
    submittedAt: new Date(),
  };

  const { messageId, accepted } = await sendContactFormEmail(payload);

  return res.json({
    messageId,
    accepted,
    sentAt: payload.submittedAt.toISOString(),
    productsCount: products.length,
    attachmentsCount: attachments.length,
  });
};
