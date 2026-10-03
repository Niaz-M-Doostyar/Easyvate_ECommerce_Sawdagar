// Accept local, international, pasted and Persian/Arabic numeral input.
function nationalPhone(value) {
  let digits = String(value || '').replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632))).replace(/\D/g, '');
  if (digits.startsWith('0093')) digits = digits.slice(4);
  else if (digits.startsWith('93') && (String(value).trim().startsWith('+93') || digits.length > 9)) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}
function internationalPhone(value) { const digits = nationalPhone(value); return digits ? `+93${digits}` : ''; }
module.exports = { nationalPhone, internationalPhone };
