const crypto = require('node:crypto');
function normalizeAfghanPhone(value) {
  if (typeof value !== 'string') return null;
  let phone = value.trim().replace(/[\s()-]/g, '').replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632)));
  if (phone.startsWith('0093')) phone = '+' + phone.slice(2);
  if (/^07\d{8}$/.test(phone)) phone = '+93' + phone.slice(1);
  if (/^937\d{8}$/.test(phone)) phone = '+' + phone;
  return /^\+937\d{8}$/.test(phone) ? phone : null;
}
function codeHash(id, code) { return crypto.createHash('sha256').update(`${id}:${code}`).digest('hex'); }
function deliveryError(code) {
  return Object.assign(new Error('OTP delivery unavailable. Please try again later or choose the other method.'), { code });
}
async function sendCode(phone, code, channel) {
  if (typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) throw deliveryError('OTP_INVALID_CODE');
  if (!process.env.GHONCHA_API_KEY?.trim()) throw deliveryError('OTP_NOT_CONFIGURED');
  const whatsapp = channel === 'whatsapp';
  const response = await fetch(`https://sms.ghoncha.com${whatsapp ? '/api/v1/otp/send/whatsapp' : '/api/v1/send'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.GHONCHA_API_KEY },
    body: JSON.stringify(whatsapp ? { phone, code } : { phone, message: code }), signal: AbortSignal.timeout(15000),
  });
  // Keep provider bodies out of logs: they may contain phone numbers or codes.
  if (!response.ok) throw deliveryError(`OTP_PROVIDER_HTTP_${response.status || 'ERROR'}`);
  let data;
  try { data = await response.json(); } catch { throw deliveryError('OTP_PROVIDER_INVALID_RESPONSE'); }
  if (!data || data.status === 'failed' || data.error) throw deliveryError('OTP_PROVIDER_REJECTED');
  return data;
}
module.exports = { normalizeAfghanPhone, codeHash, sendCode };
