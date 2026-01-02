import { Currency } from '../types';

// Exchange rates relative to USD (base currency)
// In production, these would be fetched from an API like exchangerate-api.com
const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.USD]: 1.0,
  [Currency.EUR]: 0.92,
  [Currency.GBP]: 0.79,
  [Currency.INR]: 83.12,
  [Currency.JPY]: 149.50,
  [Currency.AUD]: 1.52,
  [Currency.CAD]: 1.36,
  [Currency.CHF]: 0.88,
  [Currency.CNY]: 7.24,
};

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount rounded to 2 decimal places
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first (base currency)
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];

  // Then convert to target currency
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];

  return Math.round(convertedAmount * 100) / 100;
};

/**
 * Get exchange rate between two currencies
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Exchange rate
 */
export const getExchangeRate = (
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  return EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];
};

/**
 * Format currency amount with symbol
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string with currency symbol
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.GBP]: '£',
    [Currency.INR]: '₹',
    [Currency.JPY]: '¥',
    [Currency.AUD]: 'A$',
    [Currency.CAD]: 'C$',
    [Currency.CHF]: 'CHF ',
    [Currency.CNY]: '¥',
  };

  const symbol = symbols[currency];
  const formattedAmount = amount.toFixed(2);

  // For currencies that use symbol before amount
  if ([Currency.USD, Currency.GBP, Currency.AUD, Currency.CAD, Currency.CHF].includes(currency)) {
    return `${symbol}${formattedAmount}`;
  }

  // For currencies that use symbol after amount or different format
  return `${symbol}${formattedAmount}`;
};
