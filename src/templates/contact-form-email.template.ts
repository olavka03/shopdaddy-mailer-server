import { CONTACT_FORM_EMAIL, EMAIL_COLORS } from '@constants';
import { ContactFormEmail, ContactFormPayload, MailAttachment, SelectedProduct } from '@types';
import { escapeHtml, formatBytes, formatDateTime } from '@utils';
import {
  buildButton,
  buildCaption,
  buildDetailRow,
  buildDetails,
  buildLink,
  buildList,
  buildListCell,
  buildMultilineText,
  buildMutedText,
  buildSection,
  buildText,
  buildTitle,
} from './email-blocks.template';
import { buildEmailLayout } from './email-layout.template';

const toTermsLabel = (termsAccepted: boolean): string => (termsAccepted ? 'Accepted' : 'Not accepted');

const toLogoDetails = (logo: MailAttachment): string[] => {
  return [logo.contentType, formatBytes(logo.size), 'attached to this email'];
};

const buildDetailsRows = (payload: ContactFormPayload): string => {
  return buildDetails([
    buildDetailRow('Name', escapeHtml(payload.name)),
    buildDetailRow('Email', buildLink(`mailto:${payload.email}`, payload.email)),
    payload.previousPage ? buildDetailRow('Came from', buildLink(payload.previousPage), { breakAll: true }) : '',
    buildDetailRow('Terms', escapeHtml(toTermsLabel(payload.termsAccepted))),
  ]);
};

const buildMessageSection = (message: string): string => {
  return message ? buildSection('Message', buildMultilineText(message)) : '';
};

const buildProductRow = (product: SelectedProduct): string[] => {
  const variant = product.variant
    ? `<br><span style="color:${EMAIL_COLORS.muted};">${escapeHtml(product.variant)}</span>`
    : '';
  const button = product.url ? buildButton(product.url, 'View product') : '';

  return [
    buildListCell(`${escapeHtml(product.name)}${variant}`, { style: 'padding-right:12px;word-break:break-word;' }),
    buildListCell(button, { align: 'right', style: 'white-space:nowrap;' }),
  ];
};

const buildProductsSection = (products: SelectedProduct[]): string => {
  return products.length > 0 ? buildSection('Products', buildList(products.map(buildProductRow))) : '';
};

const buildLinksSection = (links: string[]): string => {
  const rows = links.map((link) => [buildListCell(buildLink(link), { style: 'word-break:break-all;' })]);

  return links.length > 0 ? buildSection('Links', buildList(rows)) : '';
};

const buildLogoSection = (logo?: MailAttachment): string => {
  if (!logo) {
    return buildSection('Logo', buildMutedText('none'));
  }

  const details = buildMutedText(toLogoDetails(logo).join(' · '), 'padding-top:2px;font-size:13px;line-height:18px;');

  return buildSection('Logo', `${buildText(logo.filename)}${details}`);
};

const buildHtml = (payload: ContactFormPayload): string => {
  return buildEmailLayout({
    title: CONTACT_FORM_EMAIL.TITLE,
    rowsHtml: [
      buildTitle(CONTACT_FORM_EMAIL.TITLE, buildCaption('Submitted', formatDateTime(payload.submittedAt))),
      buildDetailsRows(payload),
      buildMessageSection(payload.message),
      buildProductsSection(payload.products),
      buildLinksSection(payload.links),
      buildLogoSection(payload.logo),
    ],
  });
};

const buildTextSection = (title: string, lines: string[]): string => {
  const filledLines = lines.filter(Boolean);

  return filledLines.length > 0 ? `${title}\n${'-'.repeat(title.length)}\n${filledLines.join('\n')}` : '';
};

/** Plain-text alternative of the same content, shown by clients that do not render HTML. */
const buildPlainText = (payload: ContactFormPayload): string => {
  const { logo } = payload;

  const productLines = payload.products.flatMap((product) => [
    `- ${product.name}${product.variant ? ` (${product.variant})` : ''}`,
    product.url ? `  ${product.url}` : '',
  ]);

  const sections = [
    `${CONTACT_FORM_EMAIL.TITLE}\nSubmitted: ${formatDateTime(payload.submittedAt)}`,
    [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      payload.previousPage ? `Came from: ${payload.previousPage}` : '',
      `Terms: ${toTermsLabel(payload.termsAccepted)}`,
    ]
      .filter(Boolean)
      .join('\n'),
    buildTextSection('Message', [payload.message]),
    buildTextSection('Products', productLines),
    buildTextSection(
      'Links',
      payload.links.map((link) => `- ${link}`),
    ),
    buildTextSection('Logo', [logo ? `${logo.filename} (${toLogoDetails(logo).join(', ')})` : 'none']),
  ];

  return `${sections.filter(Boolean).join('\n\n')}\n`;
};

export const buildContactFormEmail = (payload: ContactFormPayload): ContactFormEmail => {
  return {
    subject: `${CONTACT_FORM_EMAIL.SUBJECT_PREFIX} ${payload.name}`,
    html: buildHtml(payload),
    text: buildPlainText(payload),
  };
};
