import { EMAIL_COLORS, EMAIL_FONTS } from '@constants';
import { escapeHtml } from '@utils';

/**
 * Building blocks of the email markup: table-based, inline-styled HTML that renders the same in Gmail, Outlook and
 * Apple Mail. Every block escapes the text it receives; arguments named `...Html` are inserted as they are.
 */

type ListCellOptions = {
  align?: 'left' | 'right';
  style?: string;
};

type DetailRowOptions = {
  /** Lets long urls wrap at any character instead of overflowing the card. */
  breakAll?: boolean;
};

const PRESENTATION_TABLE_ATTRIBUTES = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"';

const LIST_CELL_STYLE = `padding:10px 0;border-top:1px solid ${EMAIL_COLORS.border};vertical-align:middle;font-size:14px;line-height:20px;`;

export const buildTable = (rowsHtml: string, style = ''): string => {
  return `<table ${PRESENTATION_TABLE_ATTRIBUTES} style="border-collapse:collapse;${style}">${rowsHtml}</table>`;
};

export const buildLink = (href: string, label = href): string => {
  return `<a href="${escapeHtml(href)}" style="color:${EMAIL_COLORS.text};text-decoration:underline;">${escapeHtml(label)}</a>`;
};

export const buildButton = (href: string, label: string): string => {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:6px 12px;border:1px solid ${EMAIL_COLORS.text};border-radius:6px;font-size:13px;line-height:18px;color:${EMAIL_COLORS.text};text-decoration:none;">${escapeHtml(label)}</a>`;
};

export const buildText = (text: string, style = ''): string => {
  return `<div style="font-size:14px;line-height:20px;word-break:break-word;${style}">${escapeHtml(text)}</div>`;
};

export const buildMutedText = (text: string, style = ''): string => {
  return buildText(text, `color:${EMAIL_COLORS.muted};${style}`);
};

/** Keeps the line breaks of user-typed text. */
export const buildMultilineText = (text: string): string => {
  const html = escapeHtml(text).replace(/\r?\n/g, '<br>');

  return `<div style="font-size:14px;line-height:22px;word-break:break-word;">${html}</div>`;
};

/** Heading of the card with the accent dot, and an optional caption under it. */
export const buildTitle = (title: string, captionHtml = ''): string => {
  return `<tr><td style="padding-bottom:20px;border-bottom:1px solid ${EMAIL_COLORS.border};"><div style="font-family:${EMAIL_FONTS.HEADING};font-size:28px;line-height:34px;font-weight:400;">${escapeHtml(title)}<span style="color:${EMAIL_COLORS.accent};">.</span></div>${captionHtml}</td></tr>`;
};

export const buildCaption = (label: string, value: string): string => {
  return `<div style="padding-top:6px;font-size:13px;line-height:20px;color:${EMAIL_COLORS.muted};"><span style="font-weight:600;">${escapeHtml(label)}:</span> ${escapeHtml(value)}</div>`;
};

export const buildDetailRow = (
  label: string,
  valueHtml: string,
  { breakAll = false }: DetailRowOptions = {},
): string => {
  const wordBreak = breakAll ? 'break-all' : 'break-word';

  return `<tr><td width="110" style="width:110px;padding:6px 16px 6px 0;vertical-align:top;font-size:14px;line-height:20px;color:${EMAIL_COLORS.muted};">${escapeHtml(label)}</td><td style="padding:6px 0;vertical-align:top;font-size:14px;line-height:20px;word-break:${wordBreak};">${valueHtml}</td></tr>`;
};

/** Label/value table right under the title. Empty rows are skipped. */
export const buildDetails = (rowsHtml: string[]): string => {
  return `<tr><td style="padding-top:16px;">${buildTable(rowsHtml.filter(Boolean).join(''))}</td></tr>`;
};

export const buildSection = (title: string, bodyHtml: string): string => {
  return `<tr><td style="padding-top:24px;"><div style="padding-bottom:8px;font-family:${EMAIL_FONTS.HEADING};font-size:18px;line-height:24px;font-weight:400;">${escapeHtml(title)}</div>${bodyHtml}</td></tr>`;
};

export const buildListCell = (contentHtml: string, { align = 'left', style = '' }: ListCellOptions = {}): string => {
  return `<td align="${align}" style="${LIST_CELL_STYLE}${style}">${contentHtml}</td>`;
};

/** Rows separated by hairlines; each row is a list of cells built with `buildListCell`. */
export const buildList = (rows: string[][]): string => {
  const rowsHtml = rows.map((cells) => `<tr>${cells.join('')}</tr>`).join('');

  return buildTable(rowsHtml, `border-bottom:1px solid ${EMAIL_COLORS.border};`);
};
