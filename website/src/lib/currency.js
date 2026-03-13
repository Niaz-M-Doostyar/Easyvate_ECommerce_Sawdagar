// Currency formatting for Sawdagar - Afghanistan Afghani (AFN)
export const CURRENCY_SYMBOL = '؋';
export const CURRENCY_CODE = 'AFN';

export function formatPrice(amount) {
  const num = Number(amount) || 0;
  return `${CURRENCY_SYMBOL}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPriceDecimal(amount) {
  const num = Number(amount) || 0;
  return `${CURRENCY_SYMBOL}${num.toFixed(2)}`;
}
