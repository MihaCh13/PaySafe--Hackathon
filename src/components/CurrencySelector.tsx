import { Currency, useCurrencyStore } from '@/stores/currencyStore';
import { motion } from 'framer-motion';

const currencies: { code: Currency; name: string; flag: string }[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'BGN', name: 'Bulgarian Lev', flag: '🇧🇬' },
];

interface CurrencySelectorProps {
  compact?: boolean;
}

export const CurrencySelector = ({ compact = false }: CurrencySelectorProps) => {
  const { selectedCurrency, setCurrency } = useCurrencyStore();

  if (compact) {
    return (
      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
        {currencies.map((currency) => (
          <button
            key={currency.code}
            onClick={() => setCurrency(currency.code)}
            className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              selectedCurrency === currency.code
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {selectedCurrency === currency.code && (
              <motion.div
                layoutId="currency-indicator"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>{currency.flag}</span>
              <span>{currency.code}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Display Currency
      </label>
      <div className="grid grid-cols-3 gap-2">
        {currencies.map((currency) => (
          <button
            key={currency.code}
            onClick={() => setCurrency(currency.code)}
            className={`relative p-3 rounded-lg border-2 transition-all ${
              selectedCurrency === currency.code
                ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">{currency.flag}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currency.code}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currency.name}
              </span>
            </div>
            {selectedCurrency === currency.code && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-violet-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Visual only - for demonstration purposes
      </p>
    </div>
  );
};
