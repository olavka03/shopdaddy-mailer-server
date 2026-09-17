import { PREVIOUS_PAGE_FIELD_KEYS } from '@constants';
import { RequestSource } from '@types';
import { Request } from 'express';
import { resolveAbsoluteUrl } from './resolve-absolute-url.util';

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
};

export const resolveRequestSource = (req: Request, baseUrl?: string | null): RequestSource => {
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const previousPageUrl = PREVIOUS_PAGE_FIELD_KEYS.map((key) => toNonEmptyString(body[key])).find(Boolean) ?? null;

  return {
    previousPageUrl: resolveAbsoluteUrl(previousPageUrl, baseUrl),
    previousPageReported: PREVIOUS_PAGE_FIELD_KEYS.some((key) => key in body),
  };
};
