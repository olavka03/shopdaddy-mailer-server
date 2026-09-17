import type Mail from 'nodemailer/lib/mailer';
import { mailTransporter } from '@api';
import { env } from '@config';
import { ApiError } from '@exceptions';
import { buildContactFormEmail } from '@templates';
import { ContactFormPayload, MailAttachment } from '@types';

const buildNodemailerAttachments = (attachments: MailAttachment[]): Mail.Attachment[] => {
  return attachments.map((attachment) => {
    const base: Mail.Attachment = {
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    };

    if (!attachment.isInlineImage || !attachment.cid) {
      return base;
    }

    return { ...base, cid: attachment.cid, contentDisposition: 'inline' };
  });
};

const toAddressList = (addresses: Array<string | Mail.Address>): string[] => {
  return addresses
    .map((address) => (typeof address === 'string' ? address : address.address))
    .filter((address): address is string => Boolean(address));
};

const resolveFailureReason = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const sendContactFormEmail = async (payload: ContactFormPayload) => {
  const { subject, html, text } = buildContactFormEmail(payload);
  const attachments = buildNodemailerAttachments(payload.attachments);

  try {
    const info = await mailTransporter.sendMail({
      from: { name: env.MAIL_FROM_NAME, address: env.MAIL_USER },
      to: env.MAIL_TO,
      replyTo: payload.email,
      subject,
      html,
      text,
      attachments,
    });

    // eslint-disable-next-line no-console
    console.info(
      `[MAIL] Contact form email sent to ${env.MAIL_TO} — messageId: ${info.messageId}, products: ${payload.products.length}, attachments: ${attachments.length}`,
    );

    return {
      messageId: info.messageId,
      accepted: toAddressList(info.accepted),
      rejected: toAddressList(info.rejected),
    };
  } catch (error) {
    throw ApiError.BadGateway('Failed to send the contact form email', { reason: resolveFailureReason(error) });
  }
};
