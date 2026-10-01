import { env } from '@config';
import { EMAIL_BRAND, EMAIL_COLORS, EMAIL_FONTS } from '@constants';
import { escapeHtml } from '@utils';
import { buildTable } from './email-blocks.template';

type EmailLayoutOptions = {
  title: string;
  /** Table rows of the card, built with the email blocks. Empty rows are skipped. */
  rowsHtml: string[];
};

const buildBrandLogo = (): string => {
  return `<a href="${escapeHtml(env.SHOPIFY_STORE_URL)}" style="text-decoration:none;"><img src="${escapeHtml(EMAIL_BRAND.LOGO_URL)}" width="${EMAIL_BRAND.LOGO_WIDTH}" alt="${escapeHtml(EMAIL_BRAND.NAME)}" style="display:block;width:${EMAIL_BRAND.LOGO_WIDTH}px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;font-size:20px;color:${EMAIL_COLORS.text};"></a>`;
};

const buildCard = (rowsHtml: string[]): string => {
  return `<table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;margin:0 auto;border-collapse:separate;border-spacing:0;">
            <tr>
              <td align="center" style="padding:0 0 24px;background-color:${EMAIL_COLORS.background};">${buildBrandLogo()}</td>
            </tr>
            <tr>
              <td style="padding:28px 28px 32px;background-color:${EMAIL_COLORS.surface};border-radius:8px;text-align:left;font-family:${EMAIL_FONTS.BODY};color:${EMAIL_COLORS.text};">
                ${buildTable(rowsHtml.filter(Boolean).join(''))}
              </td>
            </tr>
          </table>`;
};

/** Complete HTML document: brand logo on the page background, then the content card (max 640px wide). */
export const buildEmailLayout = ({ title, rowsHtml }: EmailLayoutOptions): string => {
  const page = `<tr>
        <td align="center" style="padding:32px 16px;background-color:${EMAIL_COLORS.background};">
          ${buildCard(rowsHtml)}
        </td>
      </tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${escapeHtml(EMAIL_FONTS.STYLESHEET_URL)}">
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_COLORS.background};font-family:${EMAIL_FONTS.BODY};">
    ${buildTable(page, `background-color:${EMAIL_COLORS.background};`)}
  </body>
</html>
`;
};
