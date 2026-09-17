import { env } from '@config';
import { EMAIL_COLORS } from '@constants';
import { escapeHtml } from '@utils';

type EmailLayoutOptions = {
  title: string;
  preheader: string;
  content: string;
};

const FONT_STACK = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';

const TABLE_RESET = 'border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;';

const ROUNDED_TABLE_RESET = 'border-collapse:separate; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt;';

const PREHEADER_FILLER = '&#847;&zwnj;&nbsp;'.repeat(40);

const buildResponsiveStyles = (): string => `
      @media only screen and (max-width: 620px) {
        .cfm-shell { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
        .cfm-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .cfm-band { padding-left: 20px !important; padding-right: 20px !important; padding-top: 26px !important; }
        .cfm-title { font-size: 21px !important; }
        .cfm-stack { display: block !important; width: 100% !important; }
        .cfm-stack-label { padding-bottom: 2px !important; line-height: 15px !important; }
      }`;

const buildPreheaderBlock = (preheader: string): string =>
  `<span style="display:none; max-height:0; max-width:0; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; color:${EMAIL_COLORS.background};">${escapeHtml(preheader)}${PREHEADER_FILLER}</span>`;

const buildHeaderBand = (title: string): string => `
          <tr>
            <td class="cfm-band" style="padding:34px 32px; background-color:${EMAIL_COLORS.text};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%;">
                <tr>
                  <td style="padding:0 0 14px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${ROUNDED_TABLE_RESET} border-radius:999px;">
                      <tr>
                        <td style="width:38px; height:3px; line-height:3px; mso-line-height-rule:exactly; font-size:0; background-color:${EMAIL_COLORS.accent}; border-radius:999px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 8px 0; font-family:${FONT_STACK}; font-size:11px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:${EMAIL_COLORS.accentSoft};">${escapeHtml(env.MAIL_FROM_NAME)}</td>
                </tr>
                <tr>
                  <td class="cfm-title" style="font-family:${FONT_STACK}; font-size:25px; font-weight:700; line-height:1.25; letter-spacing:-0.01em; color:${EMAIL_COLORS.surface};">${escapeHtml(title)}</td>
                </tr>
              </table>
            </td>
          </tr>`;

const buildFooterBand = (): string => `
          <tr>
            <td class="cfm-pad" style="padding:22px 32px 26px 32px; border-top:1px solid ${EMAIL_COLORS.border}; background-color:${EMAIL_COLORS.surface}; font-family:${FONT_STACK}; font-size:12px; line-height:1.6; color:${EMAIL_COLORS.muted};">
              Delivered automatically by ${escapeHtml(env.MAIL_FROM_NAME)}. Hit reply to answer the visitor directly &mdash; the reply address is already set to their email.
            </td>
          </tr>`;

export const buildEmailLayout = ({ title, preheader, content }: EmailLayoutOptions): string => `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
      <xml
        ><o:OfficeDocumentSettings><o:AllowPNG /><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml
      >
    <![endif]-->
    <style type="text/css">${buildResponsiveStyles()}
    </style>
  </head>
  <body style="margin:0; padding:0; width:100%; background-color:${EMAIL_COLORS.background}; font-family:${FONT_STACK}; color:${EMAIL_COLORS.text}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    ${buildPreheaderBlock(preheader)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} width:100%; background-color:${EMAIL_COLORS.background};">
      <tr>
        <td align="center" style="padding:32px 16px 40px 16px;">
          <table role="presentation" class="cfm-shell" width="640" cellpadding="0" cellspacing="0" border="0" style="${ROUNDED_TABLE_RESET} width:640px; max-width:640px; background-color:${EMAIL_COLORS.surface}; border:1px solid ${EMAIL_COLORS.border}; border-radius:16px; overflow:hidden;">${buildHeaderBand(title)}
            <tr>
              <td style="padding:0;">${content}
              </td>
            </tr>${buildFooterBand()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
