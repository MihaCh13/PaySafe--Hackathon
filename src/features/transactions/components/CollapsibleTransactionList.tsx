import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Receipt, Wallet, Umbrella, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

interface Transaction {
  id: number;
  user_id: number;
  transaction_type: string;
  transaction_source?: string;
  amount: number;
  description?: string;
  created_at: string;
  status: string;
  sender_id?: number;
  receiver_id?: number;
  metadata?: any;
}

interface CollapsibleTransactionListProps {
  transactions: Transaction[];
}

type FilterType = 'all' | 'income' | 'expenses';
type AccountType = 'all' | 'main_wallet' | 'dark_days' | 'budget_card';

export default function CollapsibleTransactionList({ transactions }: CollapsibleTransactionListProps) {
  const { selectedCurrency } = useCurrencyStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [accountFilter, setAccountFilter] = useState<AccountType>('all');

  // Helper to determine if transaction is income
  const isIncomeTransaction = (t: Transaction): boolean => {
    const incomeTypes = [
      'topup',
      'income',
      'refund',
      'transfer_received',
      'loan_repayment_received',
      'loan_received',
      'loan_cancelled_refund',
      'savings_withdrawal',
      'sale',
      'budget_withdrawal',
    ];
    
    if (incomeTypes.includes(t.transaction_type)) {
      return true;
    }
    
    // Legacy transfer handling
    if (t.transaction_type === 'transfer') {
      return t.receiver_id === t.user_id;
    }
    
    return false;
  };

  // Helper to determine if transaction is expense
  const isExpenseTransaction = (t: Transaction): boolean => {
    // If it's income, it's not an expense (even if scheduled)
    if (isIncomeTransaction(t)) {
      return false;
    }
    
    const expenseTypes = [
      'payment',
      'purchase',
      'transfer_sent',
      'card_payment',
      'subscription_payment',
      'loan_disbursement',
      'loan_repayment',
      'loan_cancelled_return',
      'savings_deposit',
      'budget_allocation',
      'budget_expense',
      'withdrawal',
      'transfer', // Legacy transfers are handled below
    ];
    
    if (expenseTypes.includes(t.transaction_type)) {
      return true;
    }
    
    // Legacy transfer handling: sender is expense
    if (t.transaction_type === 'transfer') {
      return t.sender_id === t.user_id;
    }
    
    // Expected/scheduled payments that aren't income are expenses
    if (t.status === 'scheduled' || (t.metadata && (t.metadata as any).source === 'USER_EXPECTED_PAYMENT')) {
      return true;
    }
    
    return false;
  };

  // Apply account filter first
  const accountFilteredTransactions = accountFilter === 'all' 
    ? transactions 
    : transactions.filter(t => (t.transaction_source || 'main_wallet') === accountFilter);

  // Categorize transactions
  const incomeTransactions = accountFilteredTransactions.filter(isIncomeTransaction);
  const expenseTransactions = accountFilteredTransactions.filter(isExpenseTransaction);

  // Filter transactions based on active filter (layered on top of account filter)
  const filteredTransactions =
    activeFilter === 'income'
      ? incomeTransactions
      : activeFilter === 'expenses'
      ? expenseTransactions
      : accountFilteredTransactions;

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const getAccountLabel = (account: AccountType) => {
    switch (account) {
      case 'main_wallet': return 'Main Account';
      case 'dark_days': return 'Dark Days';
      case 'budget_card': return 'Budget Cards';
      default: return '';
    }
  };

  const getSummaryText = () => {
    const accountPrefix = accountFilter !== 'all' ? `${getAccountLabel(accountFilter)} • ` : '';
    
    if (activeFilter === 'income') {
      return `${accountPrefix}${incomeTransactions.length} income • +${formatCurrency(Math.abs(totalIncome), selectedCurrency)}`;
    }
    if (activeFilter === 'expenses') {
      return `${accountPrefix}${expenseTransactions.length} expenses • -${formatCurrency(Math.abs(totalExpenses), selectedCurrency)}`;
    }
    return `${accountPrefix}${accountFilteredTransactions.length} total • ${incomeTransactions.length} income, ${expenseTransactions.length} expenses`;
  };

  const getTransactionIcon = (transaction: Transaction) => {
    const isIncome = isIncomeTransaction(transaction);

    return isIncome ? (
      <div className="p-2 rounded-full bg-green-100">
        <ArrowDownLeft className="h-4 w-4 text-green-600" />
      </div>
    ) : (
      <div className="p-2 rounded-full bg-red-100">
        <ArrowUpRight className="h-4 w-4 text-red-600" />
      </div>
    );
  };

  const getAmountColor = (transaction: Transaction) => {
    const isIncome = isIncomeTransaction(transaction);
    return isIncome ? 'text-green-600' : 'text-gray-900';
  };

  const getAmountPrefix = (transaction: Transaction) => {
    const isIncome = isIncomeTransaction(transaction);
    return isIncome ? '+' : '-';
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Header with collapse button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-violet-600" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
            {!isExpanded && (
              <p className="text-sm text-gray-600 mt-0.5">{getSummaryText()}</p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-gray-400"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Filter tabs */}
            <div className="px-6 pt-4 pb-2 border-t bg-gray-50">
              <div className="flex gap-2 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                    activeFilter === 'all'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  )}
                >
                  <Receipt className="h-4 w-4" />
                  All ({accountFilteredTransactions.length})
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveFilter('income')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                    activeFilter === 'income'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  Income ({incomeTransactions.length})
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveFilter('expenses')}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                    activeFilter === 'expenses'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  )}
                >
                  <TrendingDown className="h-4 w-4" />
                  Expenses ({expenseTransactions.length})
                </motion.button>
              </div>
              
              {/* Account type filter */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Account Type</p>
                <div className="flex gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAccountFilter('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5',
                      accountFilter === 'all'
                        ? 'bg-violet-100 text-violet-700 border border-violet-300'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    )}
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    All Accounts
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAccountFilter('main_wallet')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5',
                      accountFilter === 'main_wallet'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    )}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Main Account
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAccountFilter('dark_days')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5',
                      accountFilter === 'dark_days'
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    )}
                  >
                    <Umbrella className="h-3.5 w-3.5" />
                    Dark Days
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAccountFilter('budget_card')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5',
                      accountFilter === 'budget_card'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Budget Cards
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Summary stats for active filter */}
            {activeFilter !== 'all' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white border-b"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {activeFilter === 'income' ? 'Total Income' : 'Total Expenses'}
                  </span>
                  <span
                    className={cn(
                      'text-lg font-bold',
                      activeFilter === 'income' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {activeFilter === 'income' ? '+' : '-'}
                    {formatCurrency(Math.abs(activeFilter === 'income' ? totalIncome : totalExpenses), selectedCurrency)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Transaction list */}
            <div className="px-6 py-4">
              <AnimatePresence mode="wait">
                {filteredTransactions.length > 0 ? (
                  <motion.div
                    key={activeFilter}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                  >
                    {filteredTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)', x: 4 }}
                        className="flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getTransactionIcon(transaction)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {transaction.description || transaction.transaction_type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className={cn('font-semibold', getAmountColor(transaction))}>
                            {getAmountPrefix(transaction)}{formatCurrency(Math.abs(transaction.amount), selectedCurrency)}
                          </p>
                          <span className="text-xs text-gray-500 capitalize">
                            {transaction.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <Receipt className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      No {activeFilter === 'all' ? '' : activeFilter} transactions
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
