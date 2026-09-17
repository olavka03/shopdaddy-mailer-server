// nodemailer (disabled): email sending through nodemailer (POST /api/contact-form/email) is switched off.
// To restore it, uncomment this file and every line marked "nodemailer (disabled)".

// import type Mail from 'nodemailer/lib/mailer';
// import { mailTransporter } from '@api';
// import { env } from '@config';
// import { ApiError } from '@exceptions';
// import { buildContactFormEmail } from '@templates';
// import { ContactFormPayload, MailAttachment } from '@types';
//
// const buildNodemailerAttachments = (logo?: MailAttachment): Mail.Attachment[] => {
//   if (!logo) {
//     return [];
//   }
//
//   const attachment: Mail.Attachment = {
//     filename: logo.filename,
//     content: logo.content,
//     contentType: logo.contentType,
//   };
//
//   if (!logo.isInlineImage || !logo.cid) {
//     return [attachment];
//   }
//
//   return [{ ...attachment, cid: logo.cid, contentDisposition: 'inline' }];
// };
//
// const toAddressList = (addresses: Array<string | Mail.Address>): string[] => {
//   return addresses
//     .map((address) => (typeof address === 'string' ? address : address.address))
//     .filter((address): address is string => Boolean(address));
// };
//
// const resolveFailureReason = (error: unknown): string => {
//   if (error instanceof Error) {
//     return error.message;
//   }
//
//   return String(error);
// };
//
// export const sendContactFormEmail = async (payload: ContactFormPayload) => {
//   const { subject, html, text } = buildContactFormEmail(payload);
//   const attachments = buildNodemailerAttachments(payload.logo);
//
//   try {
//     const info = await mailTransporter.sendMail({
//       from: { name: env.MAIL_FROM_NAME, address: env.MAIL_USER },
//       to: env.MAIL_TO,
//       replyTo: payload.email,
//       subject,
//       html,
//       text,
//       attachments,
//     });
//
//     // eslint-disable-next-line no-console
//     console.info(
//       `[MAIL] Contact form email sent to ${env.MAIL_TO} — messageId: ${info.messageId}, products: ${payload.products.length}, attachments: ${attachments.length}`,
//     );
//
//     return {
//       messageId: info.messageId,
//       accepted: toAddressList(info.accepted),
//       rejected: toAddressList(info.rejected),
//     };
//   } catch (error) {
//     throw ApiError.BadGateway('Failed to send the contact form email', { reason: resolveFailureReason(error) });
//   }
// };
