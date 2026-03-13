export const CURRENCY_SYMBOL = '؋';
export const CURRENCY_CODE = 'AFN';

export function formatPrice(amount) {
  const num = Number(amount);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${num.toLocaleString()}`;
}

export function formatPriceDecimal(amount) {
  const num = Number(amount);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0.00`;
  return `${CURRENCY_SYMBOL}${num.toFixed(2)}`;
}
