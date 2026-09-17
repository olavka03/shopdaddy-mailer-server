import { env } from '@config';
import { ApiError } from '@exceptions';
import { createContactFormEntry } from '@services';
import { buildContactFormPayload } from '@utils';
import { contactFormSchema } from '@validators';
import { RequestHandler } from 'express';
import zod from 'zod';

export const createContactFormEntryController: RequestHandler = async (req, res) => {
  const parsed = contactFormSchema.safeParse(req.body);

  if (!parsed.success) {
    throw ApiError.BadRequest('Validation failed', zod.flattenError(parsed.error));
  }

  const payload = buildContactFormPayload(req, parsed.data, env.SHOPIFY_STORE_URL);

  const entry = await createContactFormEntry(payload);

  return res.status(201).json({
    id: entry.id,
    handle: entry.handle,
    type: entry.type,
    logoUrl: entry.logo?.url ?? null,
  });
};
