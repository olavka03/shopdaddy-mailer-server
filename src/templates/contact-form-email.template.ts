import { env } from '@config';
import { EMAIL_COLORS } from '@constants';
import { ContactFormPayload, MailAttachment, RequestSource, SelectedProduct } from '@types';
import { escapeHtml, formatBytes, formatDateTime } from '@utils';
import { buildEmailLayout } from './email-layout.template';

type ContactFormEmail = {
  subject: string;
  html: string;
  text: string;
};

const FONT_STACK = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';

const TABLE_RESET = 'border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;';

const ROUNDED_TABLE_RESET = 'border-collapse:separate; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt;';

const CARD_STYLE = `${ROUNDED_TABLE_RESET} width:100%; background-color:${EMAIL_COLORS.background}; border:1px solid ${EMAIL_COLORS.border}; border-radius:12px;`;

const LABEL_STYLE = `font-family:${FONT_STACK}; font-size:11px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:${EMAIL_COLORS.muted};`;

const VALUE_STYLE = `font-family:${FONT_STACK}; font-size:14px; line-height:1.55; color:${EMAIL_COLORS.text}; word-break:break-word; overflow-wrap:anywhere;`;

const LINK_STYLE = `color:${EMAIL_COLORS.accent}; text-decoration:underline; word-break:break-word; overflow-wrap:anywhere;`;

const INFO_ROW_LINE = 'line-height:22px; mso-line-height-rule:exactly;';

const KEY_STYLE = `${LABEL_STYLE} letter-spacing:0.08em; font-weight:600; word-break:break-word;`;

const buildSpacer = (height: number): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%;"><tr><td style="height:${height}px; line-height:${height}px; mso-line-height-rule:exactly; font-size:0;">&nbsp;</td></tr></table>`;

const buildCard = (inner: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${CARD_STYLE}"><tr><td style="padding:20px 22px;">${inner}</td></tr></table>`;

const buildSection = (label: string, body: string): string => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%;">
                <tr>
                  <td class="cfm-pad" style="padding:28px 32px 0 32px;">
                    <div style="${LABEL_STYLE} padding-bottom:12px;">${escapeHtml(label)}</div>
                    ${body}
                  </td>
                </tr>
              </table>`;

const buildInfoRow = (label: string, valueHtml: string): string =>
  `<tr><td class="cfm-stack cfm-stack-label" width="128" valign="top" style="width:128px; padding:9px 12px 9px 0; ${KEY_STYLE} ${INFO_ROW_LINE}">${escapeHtml(label)}</td><td class="cfm-stack" valign="top" style="padding:9px 0; ${VALUE_STYLE} ${INFO_ROW_LINE}">${valueHtml}</td></tr>`;

const buildInfoTable = (rows: string[]): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%;">${rows.join('')}</table>`;

const buildChip = (label: string, value: string, isAccent = false): string => {
  const background = isAccent ? EMAIL_COLORS.accentSoft : EMAIL_COLORS.surface;
  const borderColor = isAccent ? EMAIL_COLORS.accentBorder : EMAIL_COLORS.border;

  return `<table role="presentation" align="left" cellpadding="0" cellspacing="0" border="0" style="${ROUNDED_TABLE_RESET} float:left; margin:0 6px 8px 0; background-color:${background}; border:1px solid ${borderColor}; border-radius:999px;"><tr><td style="padding:6px 11px; font-family:${FONT_STACK}; font-size:12px; line-height:1.2; mso-line-height-rule:exactly; color:${EMAIL_COLORS.text}; white-space:nowrap;"><span style="color:${EMAIL_COLORS.muted}; letter-spacing:0.06em; text-transform:uppercase; font-size:10px;">${escapeHtml(label)}</span>&nbsp;<span style="font-weight:600;">${escapeHtml(value)}</span></td></tr></table>`;
};

const buildTimestampStrip = (submittedAt: Date): string => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%; background-color:${EMAIL_COLORS.accentSoft}; border-bottom:1px solid ${EMAIL_COLORS.border};">
                <tr>
                  <td class="cfm-pad" style="padding:13px 32px; font-family:${FONT_STACK}; font-size:12px; font-weight:600; letter-spacing:0.04em; color:${EMAIL_COLORS.accent};">Received ${escapeHtml(formatDateTime(submittedAt))}</td>
                </tr>
              </table>`;

const buildSourceLink = (url: string): string =>
  `<a href="${escapeHtml(url)}" style="font-family:${FONT_STACK}; font-size:15px; font-weight:600; line-height:1.45; ${LINK_STYLE}">${escapeHtml(url)}</a>`;

const buildDirectVisitNote = (): string =>
  `<div style="font-family:${FONT_STACK}; font-size:14px; line-height:1.45; color:${EMAIL_COLORS.muted};">Direct visit &mdash; the form page was opened without a previous page</div>`;

const buildSourceSection = (source: RequestSource): string => {
  const value = source.previousPageUrl
    ? buildSourceLink(source.previousPageUrl)
    : source.previousPageReported
      ? buildDirectVisitNote()
      : '';

  if (!value) {
    return '';
  }

  const card = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${ROUNDED_TABLE_RESET} width:100%;">
                      <tr>
                        <td style="padding:18px 22px; background-color:${EMAIL_COLORS.accentSoft}; border:1px solid ${EMAIL_COLORS.border}; border-left:3px solid ${EMAIL_COLORS.accent}; border-radius:12px;">
                          ${value}
                        </td>
                      </tr>
                    </table>`;

  return buildSection('Visitor came from', card);
};

const buildContactSection = (payload: ContactFormPayload): string => {
  const telHref = payload.phone ? payload.phone.replace(/[^+\d]/g, '') : '';
  const termsBadge = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${ROUNDED_TABLE_RESET} border:1px solid ${EMAIL_COLORS.success}; border-radius:999px;"><tr><td style="padding:5px 12px; font-family:${FONT_STACK}; font-size:12px; font-weight:600; line-height:1.2; mso-line-height-rule:exactly; color:${EMAIL_COLORS.success}; white-space:nowrap;">Accepted</td></tr></table>`;

  const rows = [
    buildInfoRow('Name', `<strong style="font-weight:700;">${escapeHtml(payload.name)}</strong>`),
    buildInfoRow(
      'Email',
      `<a href="mailto:${escapeHtml(payload.email)}" style="${LINK_STYLE}">${escapeHtml(payload.email)}</a>`,
    ),
    payload.phone
      ? buildInfoRow(
          'Phone',
          `<a href="tel:${escapeHtml(telHref)}" style="${LINK_STYLE}">${escapeHtml(payload.phone)}</a>`,
        )
      : '',
    payload.subject ? buildInfoRow('Subject', escapeHtml(payload.subject)) : '',
    payload.termsAccepted ? buildInfoRow('Terms', termsBadge) : '',
  ].filter((row) => row.length > 0);

  return buildSection('Contact details', buildCard(buildInfoTable(rows)));
};

const buildMessageSection = (message: string): string => {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return '';
  }

  const body = escapeHtml(trimmedMessage).replace(/\r?\n/g, '<br />');

  return buildSection(
    'Message',
    buildCard(`<div style="${VALUE_STYLE} font-size:15px; line-height:1.65;">${body}</div>`),
  );
};

const buildProductCard = (product: SelectedProduct, index: number): string => {
  const chips = [
    product.variant ? buildChip('Variant', product.variant, true) : '',
    product.sku ? buildChip('SKU', product.sku) : '',
    product.price ? buildChip('Price', product.price) : '',
    product.quantity ? buildChip('Qty', product.quantity) : '',
  ].filter((chip) => chip.length > 0);

  const chipsRow =
    chips.length > 0
      ? `<div style="padding:2px 0 4px 0;">${chips.join('')}<div style="clear:both; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</div></div>`
      : '';
  const button = product.absoluteUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} margin-top:6px;">
                          <tr>
                            <td align="center" bgcolor="${EMAIL_COLORS.accent}" style="padding:11px 18px; mso-padding-alt:11px 18px; background-color:${EMAIL_COLORS.accent}; border-radius:999px; font-family:${FONT_STACK}; font-size:13px; font-weight:600; line-height:1; mso-line-height-rule:exactly;">
                              <a href="${escapeHtml(product.absoluteUrl)}" style="font-family:${FONT_STACK}; font-size:13px; font-weight:600; line-height:1; color:${EMAIL_COLORS.surface}; text-decoration:none; white-space:nowrap;">View product &rarr;</a>
                            </td>
                          </tr>
                        </table>`
    : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${CARD_STYLE}">
                      <tr>
                        <td width="52" valign="top" style="width:52px; padding:20px 0 20px 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${ROUNDED_TABLE_RESET} width:26px; background-color:${EMAIL_COLORS.accent}; border-radius:999px;">
                            <tr>
                              <td align="center" style="width:26px; height:26px; font-family:${FONT_STACK}; font-size:11px; font-weight:700; line-height:26px; mso-line-height-rule:exactly; color:${EMAIL_COLORS.surface};">${index + 1}</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding:20px 20px 18px 6px;">
                          <div style="font-family:${FONT_STACK}; font-size:15px; font-weight:700; line-height:1.4; color:${EMAIL_COLORS.text}; word-break:break-word; padding-bottom:10px;">${escapeHtml(product.name)}</div>
                          ${chipsRow}
                          ${button}
                        </td>
                      </tr>
                    </table>`;
};

const buildProductsSection = (products: SelectedProduct[]): string => {
  if (products.length === 0) {
    return '';
  }

  const cards = products.map((product, index) => buildProductCard(product, index)).join(buildSpacer(10));

  return buildSection(`Selected products (${products.length})`, cards);
};

const buildAttachmentRow = (attachment: MailAttachment, index: number): string => {
  const preview =
    attachment.isInlineImage && attachment.cid
      ? `<img src="cid:${escapeHtml(attachment.cid)}" alt="${escapeHtml(attachment.filename)}" width="160" style="display:block; margin-top:12px; max-width:160px; height:auto; border:1px solid ${EMAIL_COLORS.border}; border-radius:10px;" />`
      : '';
  const divider = index === 0 ? '' : `border-top:1px solid ${EMAIL_COLORS.border};`;

  return `<tr><td style="padding:${index === 0 ? '0' : '16px'} 0 16px 0; ${divider}">
                        <div style="font-family:${FONT_STACK}; font-size:14px; font-weight:600; line-height:1.45; color:${EMAIL_COLORS.text}; word-break:break-word;">${escapeHtml(attachment.filename)}</div>
                        <div style="font-family:${FONT_STACK}; font-size:12px; line-height:1.5; color:${EMAIL_COLORS.muted}; padding-top:3px;">${escapeHtml(attachment.contentType)} &middot; ${escapeHtml(formatBytes(attachment.size))}</div>
                        ${preview}
                      </td></tr>`;
};

const buildAttachmentGroupLabel = (fieldName: string, count: number, isFirst: boolean): string => {
  const spacing = isFirst
    ? 'padding:0 0 12px 0;'
    : `padding:18px 0 12px 0; border-top:1px solid ${EMAIL_COLORS.border};`;
  const suffix = count > 1 ? ` &middot; ${count} files` : '';

  return `<tr><td style="${spacing}">
                        <div style="${LABEL_STYLE} letter-spacing:0.1em; color:${EMAIL_COLORS.accent};">${escapeHtml(fieldName)}${suffix}</div>
                      </td></tr>`;
};

const groupAttachmentsByField = (attachments: MailAttachment[]): Array<[string, MailAttachment[]]> => {
  const groups = new Map<string, MailAttachment[]>();

  for (const attachment of attachments) {
    const items = groups.get(attachment.fieldName);

    if (items) {
      items.push(attachment);
      continue;
    }

    groups.set(attachment.fieldName, [attachment]);
  }

  return [...groups.entries()];
};

const buildAttachmentsSection = (attachments: MailAttachment[]): string => {
  if (attachments.length === 0) {
    return '';
  }

  const rows = groupAttachmentsByField(attachments)
    .map(([fieldName, items], groupIndex) =>
      [
        buildAttachmentGroupLabel(fieldName, items.length, groupIndex === 0),
        ...items.map((attachment, index) => buildAttachmentRow(attachment, index)),
      ].join(''),
    )
    .join('');
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%;">${rows}</table>`;

  return buildSection(`Attachments (${attachments.length})`, buildCard(table));
};

const buildExtraFieldsSection = (extraFields: Record<string, string>): string => {
  const entries = Object.entries(extraFields);

  if (entries.length === 0) {
    return '';
  }

  const rows = entries
    .map(([key, value], index) => {
      const divider = index === 0 ? '' : `border-top:1px solid ${EMAIL_COLORS.border};`;

      return `<tr><td class="cfm-stack cfm-stack-label" width="150" valign="top" style="width:150px; padding:11px 12px 11px 0; ${divider} ${KEY_STYLE} ${INFO_ROW_LINE}">${escapeHtml(key)}</td><td class="cfm-stack" valign="top" style="padding:11px 0; ${divider} ${VALUE_STYLE} ${INFO_ROW_LINE}">${escapeHtml(value)}</td></tr>`;
    })
    .join('');

  return buildSection(
    'Additional fields',
    buildCard(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%;">${rows}</table>`,
    ),
  );
};

const buildSubject = (payload: ContactFormPayload): string => {
  const base = `${env.MAIL_SUBJECT_PREFIX} — ${payload.name}`;

  if (payload.products.length === 0) {
    return base;
  }

  const suffix = payload.products.length === 1 ? '1 product' : `${payload.products.length} products`;

  return `${base} (${suffix})`;
};

const buildPreheader = (payload: ContactFormPayload): string => {
  const parts = [payload.email, payload.subject, payload.source.previousPageUrl].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );

  return parts.join(' · ');
};

const buildTextBlock = (title: string, lines: string[]): string => {
  const filledLines = lines.filter((line) => line.length > 0);

  if (filledLines.length === 0) {
    return '';
  }

  return `${title.toUpperCase()}\n${'-'.repeat(title.length)}\n${filledLines.join('\n')}`;
};

const buildPlainText = (payload: ContactFormPayload): string => {
  const { source, products, attachments, extraFields } = payload;

  const productLines = products.flatMap((product, index) =>
    [
      `${index + 1}. ${product.name}`,
      product.variant ? `   Variant: ${product.variant}` : '',
      product.sku ? `   SKU: ${product.sku}` : '',
      product.price ? `   Price: ${product.price}` : '',
      product.quantity ? `   Quantity: ${product.quantity}` : '',
      product.absoluteUrl ? `   URL: ${product.absoluteUrl}` : '',
    ].filter((line) => line.length > 0),
  );

  const blocks = [
    `${env.MAIL_SUBJECT_PREFIX.toUpperCase()}\nReceived ${formatDateTime(payload.submittedAt)}`,
    buildTextBlock('Visitor came from', [
      source.previousPageUrl
        ? source.previousPageUrl
        : source.previousPageReported
          ? 'Direct visit (no previous page)'
          : '',
    ]),
    buildTextBlock('Contact details', [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      payload.phone ? `Phone: ${payload.phone}` : '',
      payload.subject ? `Subject: ${payload.subject}` : '',
      payload.termsAccepted ? 'Terms: accepted' : '',
    ]),
    buildTextBlock('Message', [payload.message.trim()]),
    buildTextBlock(`Selected products (${products.length})`, productLines),
    buildTextBlock(
      `Attachments (${attachments.length})`,
      groupAttachmentsByField(attachments).flatMap(([fieldName, items]) => [
        `${fieldName}:`,
        ...items.map(
          (attachment) => `  - ${attachment.filename} (${attachment.contentType}, ${formatBytes(attachment.size)})`,
        ),
      ]),
    ),
    buildTextBlock(
      'Additional fields',
      Object.entries(extraFields).map(([key, value]) => `${key}: ${value}`),
    ),
  ].filter((block) => block.length > 0);

  return `${blocks.join('\n\n')}\n`;
};

export const buildContactFormEmail = (payload: ContactFormPayload): ContactFormEmail => {
  const sections = [
    buildTimestampStrip(payload.submittedAt),
    buildSourceSection(payload.source),
    buildContactSection(payload),
    buildMessageSection(payload.message),
    buildProductsSection(payload.products),
    buildAttachmentsSection(payload.attachments),
    buildExtraFieldsSection(payload.extraFields),
    buildSpacer(32),
  ].filter((section) => section.length > 0);

  const html = buildEmailLayout({
    title: env.MAIL_SUBJECT_PREFIX,
    preheader: buildPreheader(payload),
    content: sections.join(''),
  });

  return {
    subject: buildSubject(payload),
    html,
    text: buildPlainText(payload),
  };
};
