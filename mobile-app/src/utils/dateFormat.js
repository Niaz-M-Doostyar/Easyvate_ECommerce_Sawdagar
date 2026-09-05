const APP_LOCALES = {
  en: 'en-GB-u-ca-gregory',
  ps: 'ps-AF-u-ca-gregory',
  dr: 'fa-AF-u-ca-gregory',
};

function formatDateValue(value, lang, options) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(APP_LOCALES[lang] || APP_LOCALES.en, options).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  }
}

export function formatAppDate(value, lang = 'en', options = {}) {
  return formatDateValue(value, lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatAppDateTime(value, lang = 'en', options = {}) {
  return formatDateValue(value, lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}
