import { KNOWN_CONTACT_FORM_FIELDS } from '@constants';

const knownContactFormFields = new Set<string>(KNOWN_CONTACT_FORM_FIELDS);

export const pickExtraFields = (body: Record<string, unknown>): Record<string, string> => {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const extraFields: Record<string, string> = {};

  for (const [key, value] of Object.entries(body)) {
    if (knownContactFormFields.has(key)) {
      continue;
    }

    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      continue;
    }

    const stringified = String(value).trim();

    if (stringified) {
      extraFields[key] = stringified;
    }
  }

  return extraFields;
};
