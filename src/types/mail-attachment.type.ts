export type MailAttachment = {
  fieldName: string;
  filename: string;
  content: Buffer;
  contentType: string;
  size: number;
  cid?: string;
  isInlineImage: boolean;
};
