const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/otpInput.js'), 'utf8');
const helpers = import('data:text/javascript,' + encodeURIComponent(source));

test('formatted pasted codes preserve all six digits before truncation', async () => {
  const { normalizeOtpCode } = await helpers;
  for (const value of ['123456', '123 456', '123-456', '\u200f۱۲۳ ۴۵۶\u200e', '١٢٣٤٥٦', '1۲٣4۵٦']) {
    assert.equal(normalizeOtpCode(value), '123456', value);
  }
  assert.equal(normalizeOtpCode('12345678'), '123456');
  assert.equal(normalizeOtpCode('12x 3'), '123');
  assert.equal(normalizeOtpCode('not a code'), '');
  assert.equal(normalizeOtpCode(null), '');
});

test('OTP boxes fit narrow auth forms and large text without reducing text scaling', async () => {
  const { otpInputLayout } = await helpers;
  assert.equal(otpInputLayout(220, 1).columns, 6);
  assert.equal(otpInputLayout(220, 2.35).columns, 3);
  assert.equal(otpInputLayout(480, 2.35).columns, 6);
  for (const width of [180, 200, 220, 260, 320, 480]) {
    for (const scale of [1, 1.15, 1.3, 1.8, 2.35, 3]) {
      const layout = otpInputLayout(width, scale);
      assert(Math.abs(layout.digitWidth * layout.columns + layout.gap * (layout.columns - 1) - width) < 0.001);
      assert(layout.digitHeight >= 32 * scale + 20 || layout.digitHeight === 54);
      assert(layout.digitWidth >= 24 * scale * 0.62, `${width}pt at ${scale}x text clips a digit`);
    }
  }
  assert(Number.isFinite(otpInputLayout(undefined, NaN).digitHeight));
});
