import { env } from '@config';
import { ApiError } from '@exceptions';
import { sendContactFormEmail } from '@services';
import { buildContactFormPayload } from '@utils';
import { contactFormSchema } from '@validators';
import { RequestHandler } from 'express';
import zod from 'zod';

export const sendContactFormController: RequestHandler = async (req, res) => {
  const parsed = contactFormSchema.safeParse(req.body);

  if (!parsed.success) {
    throw ApiError.BadRequest('Validation failed', zod.flattenError(parsed.error));
  }

  const payload = buildContactFormPayload(req, parsed.data, env.SHOPIFY_STORE_URL);

  const { id } = await sendContactFormEmail(payload);

  return res.status(201).json({
    id,
    sentAt: payload.submittedAt.toISOString(),
    productsCount: payload.products.length,
    linksCount: payload.links.length,
    attachmentsCount: payload.logo ? 1 : 0,
  });
};
