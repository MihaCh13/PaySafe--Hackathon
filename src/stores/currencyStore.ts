import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'EUR' | 'BGN';

interface CurrencyState {
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  BGN: 'лв',
};

const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  BGN: 'Bulgarian Lev',
};

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.93,
  BGN: 1.80,
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      selectedCurrency: 'USD',
      setCurrency: (currency: Currency) => set({ selectedCurrency: currency }),
    }),
    {
      name: 'currency-storage',
    }
  )
);

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const convertCurrency = (amountInUSD: number, targetCurrency: Currency): number => {
  return roundToTwoDecimals(amountInUSD * EXCHANGE_RATES[targetCurrency]);
};

export const convertToUSD = (amount: number, fromCurrency: Currency): number => {
  return roundToTwoDecimals(amount / EXCHANGE_RATES[fromCurrency]);
};

export const formatCurrency = (amountInUSD: number, currency: Currency): string => {
  const convertedAmount = convertCurrency(amountInUSD, currency);
  const symbol = CURRENCY_SYMBOLS[currency];
  
  const formatted = convertedAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (currency === 'BGN') {
    return `${formatted} ${symbol}`;
  }
  
  return `${symbol}${formatted}`;
};

export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCY_SYMBOLS[currency];
};

export const getCurrencyName = (currency: Currency): string => {
  return CURRENCY_NAMES[currency];
};
