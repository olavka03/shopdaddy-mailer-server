import { MailAttachment } from './mail-attachment.type';
import { RequestSource } from './request-source.type';
import { SelectedProduct } from './selected-product.type';

export type ContactFormPayload = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  termsAccepted: boolean;
  products: SelectedProduct[];
  attachments: MailAttachment[];
  extraFields: Record<string, string>;
  source: RequestSource;
  submittedAt: Date;
};
