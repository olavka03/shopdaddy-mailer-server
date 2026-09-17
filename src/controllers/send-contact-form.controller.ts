// nodemailer (disabled): email sending through nodemailer (POST /api/contact-form/email) is switched off.
// To restore it, uncomment this file and every line marked "nodemailer (disabled)".

// import { env } from '@config';
// import { ApiError } from '@exceptions';
// import { sendContactFormEmail } from '@services';
// import { buildContactFormPayload } from '@utils';
// import { contactFormSchema } from '@validators';
// import { RequestHandler } from 'express';
// import zod from 'zod';
//
// export const sendContactFormController: RequestHandler = async (req, res) => {
//   const parsed = contactFormSchema.safeParse(req.body);
//
//   if (!parsed.success) {
//     throw ApiError.BadRequest('Validation failed', zod.flattenError(parsed.error));
//   }
//
//   const payload = buildContactFormPayload(req, parsed.data, env.SHOPIFY_STORE_URL);
//
//   const { messageId, accepted } = await sendContactFormEmail(payload);
//
//   return res.json({
//     messageId,
//     accepted,
//     sentAt: payload.submittedAt.toISOString(),
//     productsCount: payload.products.length,
//     attachmentsCount: payload.logo ? 1 : 0,
//   });
// };
