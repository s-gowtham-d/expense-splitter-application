import { Currency } from '@/types';

export const currencySymbols: Record<Currency, string> = {
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

export const currencyNames: Record<Currency, string> = {
  [Currency.USD]: 'US Dollar',
  [Currency.EUR]: 'Euro',
  [Currency.GBP]: 'British Pound',
  [Currency.INR]: 'Indian Rupee',
  [Currency.JPY]: 'Japanese Yen',
  [Currency.AUD]: 'Australian Dollar',
  [Currency.CAD]: 'Canadian Dollar',
  [Currency.CHF]: 'Swiss Franc',
  [Currency.CNY]: 'Chinese Yuan',
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbol = currencySymbols[currency];
  const formattedAmount = amount.toFixed(2);

  // For currencies that use symbol before amount
  if (
    [Currency.USD, Currency.GBP, Currency.AUD, Currency.CAD, Currency.CHF].includes(currency)
  ) {
    return `${symbol}${formattedAmount}`;
  }

  // For currencies that use symbol after amount or different format
  return `${symbol}${formattedAmount}`;
};
