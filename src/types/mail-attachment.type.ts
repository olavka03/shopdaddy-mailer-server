export type MailAttachment = {
  filename: string;
  content: Buffer;
  /** Canonical mime type resolved from the file extension, never the browser-sent mimetype. */
  contentType: string;
  size: number;
  cid?: string;
  isInlineImage: boolean;
};
