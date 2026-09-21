import { MailAttachment } from './mail-attachment.type';
import { SelectedProduct } from './selected-product.type';

export type ContactFormPayload = {
  name: string;
  email: string;
  message: string;
  termsAccepted: boolean;
  products: SelectedProduct[];
  links: string[];
  logo?: MailAttachment;
  previousPage?: string;
  submittedAt: Date;
};
