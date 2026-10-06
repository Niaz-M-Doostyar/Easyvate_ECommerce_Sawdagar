// Normalize a pasted or typed code before truncating: native character limits
// otherwise cut formatted values such as "۱۲۳ ۴۵۶" before all six digits arrive.
export function normalizeOtpCode(value) {
  return String(value ?? '')
    .replace(/[۰-۹٠-٩]/g, character => String(character.charCodeAt(0) - (character >= '۰' ? 1776 : 1632)))
    .replace(/[^0-9]/g, '')
    .slice(0, 6);
}

// Keep all six digits readable when the auth form is narrow or text is large.
export function otpInputLayout(availableWidth, fontScale = 1) {
  const width = Math.max(0, Number(availableWidth) || 0);
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const gap = 7;
  const minimumDigitWidth = Math.max(26, Math.ceil(24 * scale * 0.62 + 10));
  const columns = width > 0 && width < minimumDigitWidth * 6 + gap * 5 ? 3 : 6;
  return {
    columns,
    gap,
    digitWidth: width > 0 ? Math.max(0, (width - gap * (columns - 1)) / columns) : 0,
    digitHeight: Math.max(54, Math.ceil(32 * scale + 20)),
  };
}
