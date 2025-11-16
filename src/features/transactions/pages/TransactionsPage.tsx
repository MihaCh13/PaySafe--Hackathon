import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsAPI, expectedPaymentsAPI, subscriptionsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Receipt, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CalendarGrid from '@/features/timeline/components/CalendarGrid';
import CompactColorLegend from '@/features/timeline/components/CompactColorLegend';
import DayDetailModal from '@/features/timeline/components/DayDetailModal';
import CollapsibleTransactionList from '@/features/transactions/components/CollapsibleTransactionList';
import ExpectedPaymentModal from '@/features/timeline/components/ExpectedPaymentModal';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

const MotionCard = motion.create(Card);

export default function TransactionsPage() {
  const { selectedCurrency } = useCurrencyStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showExpectedPaymentModal, setShowExpectedPaymentModal] = useState(false);

  // Fetch ALL transactions for display (list & calendar) - handle pagination
  const { data: transactionsData, refetch: refetchTransactions, isRefetching: isRefetchingTransactions } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: async () => {
      let allTransactions: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      // Fetch all pages
      while (hasMore) {
        const response = await transactionsAPI.getTransactions(currentPage, 1000);
        const data = response.data;
        
        allTransactions = [...allTransactions, ...(data.transactions || [])];
        
        // Check if there are more pages (backend returns 'pages' field for total pages)
        hasMore = data.pages && currentPage < data.pages;
        currentPage++;
        
        // Safety break to prevent infinite loops (max 100 pages = 100k transactions)
        if (currentPage > 100) break;
      }
      
      return { 
        transactions: allTransactions,
        total: allTransactions.length 
      };
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch expected payments (manually scheduled)
  const { data: expectedPaymentsData, refetch: refetchExpectedPayments } = useQuery({
    queryKey: ['expected-payments'],
    queryFn: async () => {
      const response = await expectedPaymentsAPI.getAll();
      return response.data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch subscription statistics (includes upcoming payments)
  const { data: subscriptionStatsData, refetch: refetchSubscriptionStats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const response = await subscriptionsAPI.getStatistics();
      return response.data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch accurate stats from backend (calculated from transactions in selected period)
  const { data: statsData, refetch: refetchStats, isRefetching: isRefetchingStats } = useQuery({
    queryKey: ['transaction-stats', 'last_12_months'],
    queryFn: async () => {
      const response = await transactionsAPI.getStats('last_12_months');
      return response.data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const regularTransactions = transactionsData?.transactions || [];
  const expectedPaymentsRaw = expectedPaymentsData?.expected_payments || [];
  
  // Fix duplicate IDs: Prefix expected payment IDs to prevent React key collisions
  const expectedPayments = expectedPaymentsRaw.map((payment: any) => ({
    ...payment,
    id: `expected-${payment.id}`,
    is_upcoming: true, // Mark as upcoming for classification
  }));
  
  // Separate settled (past/today) from upcoming (future) transactions
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  const settledTransactions = regularTransactions.filter((t: any) => {
    const txDate = new Date(t.created_at);
    return txDate <= today;
  });
  
  const upcomingTransactions = expectedPayments.filter((t: any) => {
    // Use scheduled_for, fallback to transaction_metadata.payment_date, then created_at
    const scheduledDate = t.scheduled_for || t.transaction_metadata?.payment_date || t.created_at;
    const txDate = new Date(scheduledDate);
    return txDate > today;
  });
  
  // Merge only settled transactions for calendar and All view
  const transactions = [...settledTransactions];
  
  // Shared transaction type classification
  const incomeTypes = ['topup', 'income', 'refund', 'transfer_received', 'loan_repayment_received', 'loan_received', 'loan_cancelled_refund', 'savings_withdrawal', 'sale', 'budget_withdrawal'];
  const expenseTypes = ['purchase', 'transfer_sent', 'card_payment', 'subscription_payment', 'loan_disbursement', 'loan_repayment', 'loan_cancelled_return', 'savings_deposit', 'budget_allocation', 'budget_expense', 'withdrawal'];
  
  // Calculate upcoming payment totals (only future-dated transactions)
  const upcomingTotals = upcomingTransactions.reduce((acc: { income: number; expenses: number }, payment: any) => {
    const isIncomeType = incomeTypes.includes(payment.transaction_type);
    const isExpenseType = expenseTypes.includes(payment.transaction_type);
    // Check transaction_metadata first, fallback to metadata
    const metadata = payment.transaction_metadata || payment.metadata;
    const isManualExpected = metadata && metadata.source === 'USER_EXPECTED_PAYMENT';
    
    if (isIncomeType) {
      // Known income type
      acc.income += Math.abs(payment.amount);
    } else if (isExpenseType) {
      // Known expense type
      acc.expenses += Math.abs(payment.amount);
    } else if (isManualExpected) {
      // Ambiguous type from manual creation
      // Manual expected payments use type='payment' and store as positive
      // Treat as expense (since manual expected payments are typically expenses)
      acc.expenses += Math.abs(payment.amount);
    } else if (payment.amount < 0) {
      // Negative amount = expense
      acc.expenses += Math.abs(payment.amount);
    } else {
      // Positive amount with unknown type = income
      acc.income += payment.amount;
    }
    
    return acc;
  }, { income: 0, expenses: 0 });
  
  // Calculate upcoming subscription totals (subscriptions are always expenses)
  const upcomingSubscriptionExpenses = (subscriptionStatsData?.upcoming_payments || []).reduce((sum: number, sub: any) => {
    return sum + Math.abs(sub.amount);
  }, 0);
  
  // Use backend stats for summary cards (correctly filtered to last 12 months)
  // The CollapsibleTransactionList will show ALL settled transactions with its own accurate counters
  const stats = {
    total_income: statsData?.total_income || 0,
    total_expenses: statsData?.total_expenses || 0,
    transaction_count: statsData?.transaction_count || 0,
    period_label: statsData?.period_label || 'Last 12 Months',
    upcoming_income: upcomingTotals.income,
    upcoming_expenses: upcomingTotals.expenses + upcomingSubscriptionExpenses,
    upcoming_total: upcomingTotals.income + upcomingTotals.expenses + upcomingSubscriptionExpenses,
  };

  // Helper to get timezone-safe local date key (YYYY-MM-DD)
  const getLocalDateKey = (dateString: string): string => {
    // Extract date part directly from ISO string to avoid timezone conversion
    // "2024-11-16T12:00:00Z" → "2024-11-16"
    // "2024-11-16" → "2024-11-16"
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    // Fallback: if no 'T', assume it's already in YYYY-MM-DD format
    return dateString.substring(0, 10);
  };

  const groupTransactionsByDate = () => {
    const grouped: Record<string, any[]> = {};
    
    transactions.forEach((transaction: any) => {
      const dateKey = getLocalDateKey(transaction.created_at);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    
    return grouped;
  };

  const transactionsByDate = groupTransactionsByDate();

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDetailModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchTransactions(), 
        refetchStats(), 
        refetchExpectedPayments(),
        refetchSubscriptionStats()
      ]);
      toast.success('Activity refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh activity');
    }
  };

  const currentMonthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="text-center mb-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Activity</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetchingTransactions || isRefetchingStats}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(isRefetchingTransactions || isRefetchingStats) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-gray-600">Track your transactions and upcoming payments</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 lg:hidden">
        <MotionCard variants={itemVariants} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Income {statsData?.period_label && `(${statsData.period_label})`}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.total_income, selectedCurrency)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <ArrowDownLeft className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard variants={itemVariants} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Expenses {statsData?.period_label && `(${statsData.period_label})`}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.total_expenses, selectedCurrency)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard variants={itemVariants} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transactions {statsData?.period_label && `(${statsData.period_label})`}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.transaction_count}
                </p>
              </div>
              <div className="p-3 bg-violet-100 dark:bg-violet-900 rounded-lg">
                <Receipt className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </MotionCard>
      </div>

      <motion.div
        variants={itemVariants}
        className="space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-violet-600" />
              <h2 className="text-xl font-bold text-gray-900">Finance Timeline</h2>
            </div>
            <Button
              onClick={() => setShowExpectedPaymentModal(true)}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expected Payment
            </Button>
          </div>
          <CompactColorLegend />
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousMonth}
                  className="hover:bg-white/50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {currentMonthName}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="hover:bg-white/50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CalendarGrid
                currentDate={currentDate}
                transactionsByDate={transactionsByDate}
                onDayClick={handleDayClick}
              />
            </CardContent>
          </Card>

          <div className="hidden lg:flex lg:flex-col lg:justify-center lg:space-y-4 h-full">
            <MotionCard variants={itemVariants} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Income {statsData?.period_label && `(${statsData.period_label})`}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.total_income, selectedCurrency)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <ArrowDownLeft className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </MotionCard>

            <MotionCard variants={itemVariants} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Expenses {statsData?.period_label && `(${statsData.period_label})`}
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(stats.total_expenses, selectedCurrency)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </MotionCard>

            <MotionCard variants={itemVariants} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Transactions {statsData?.period_label && `(${statsData.period_label})`}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.transaction_count}
                    </p>
                  </div>
                  <div className="p-3 bg-violet-100 dark:bg-violet-900 rounded-lg">
                    <Receipt className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          </div>
        </div>

        <MotionCard variants={itemVariants} className="border-0 shadow-sm overflow-visible">
          <CardContent className="p-0">
            {(transactions.length > 0 || upcomingTransactions.length > 0) ? (
              <CollapsibleTransactionList 
                transactions={transactions} 
                upcomingTransactions={upcomingTransactions}
                subscriptionUpcoming={subscriptionStatsData?.upcoming_payments || []}
              />
            ) : (
              <div className="p-6 text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </MotionCard>
      </motion.div>

      {selectedDate && (() => {
        // Get timezone-safe date key for the selected date
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        return (
          <DayDetailModal
            date={selectedDate}
            transactions={transactionsByDate[dateKey] || []}
            open={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
          />
        );
      })()}

      <ExpectedPaymentModal
        open={showExpectedPaymentModal}
        onClose={() => setShowExpectedPaymentModal(false)}
        selectedDate={new Date()}
      />
    </motion.div>
  );
}
