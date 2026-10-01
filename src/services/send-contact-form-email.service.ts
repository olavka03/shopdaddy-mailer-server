import { resendClient } from '@api';
import { env } from '@config';
import { ApiError } from '@exceptions';
import { buildContactFormEmail } from '@templates';
import { ContactFormPayload, MailAttachment } from '@types';
import { Attachment } from 'resend';

const MAIL_FROM = `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_EMAIL}>`;

/** Sent as base64: the SDK serializes a Buffer with JSON.stringify, which turns every byte into a JSON number. */
const toResendAttachments = (logo?: MailAttachment): Attachment[] => {
  if (!logo) {
    return [];
  }

  return [{ filename: logo.filename, content: logo.content.toString('base64'), contentType: logo.contentType }];
};

/** Sends the submission to MAIL_TO; replying to the email answers the visitor directly. */
export const sendContactFormEmail = async (payload: ContactFormPayload): Promise<{ id: string }> => {
  const { subject, html, text } = buildContactFormEmail(payload);
  const attachments = toResendAttachments(payload.logo);

  const { data, error } = await resendClient.emails.send({
    from: MAIL_FROM,
    to: env.MAIL_TO,
    replyTo: payload.email,
    subject,
    html,
    text,
    attachments,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      `[MAIL] Resend rejected the contact form email — ${error.name} (status: ${error.statusCode ?? 'none'}): ${error.message}`,
    );

    throw ApiError.BadGateway('Failed to send the contact form email', { code: error.name });
  }

  // eslint-disable-next-line no-console
  console.info(
    `[MAIL] Contact form email sent — id: ${data.id}, products: ${payload.products.length}, links: ${payload.links.length}, attachments: ${attachments.length}`,
  );

  return { id: data.id };
};
