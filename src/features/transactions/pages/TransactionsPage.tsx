import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsAPI } from '@/lib/api';
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

  // Fetch transactions for display (list & calendar)
  const { data: transactionsData, refetch: refetchTransactions, isRefetching: isRefetchingTransactions } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: async () => {
      const response = await transactionsAPI.getTransactions(1, 1000);
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

  const transactions = transactionsData?.transactions || [];
  const stats = {
    total_income: statsData?.total_income || 0,
    total_expenses: statsData?.total_expenses || 0,
    transaction_count: statsData?.transaction_count || 0,
  };

  const groupTransactionsByDate = () => {
    const grouped: Record<string, any[]> = {};
    
    transactions.forEach((transaction: any) => {
      const date = new Date(transaction.created_at);
      const dateKey = date.toISOString().split('T')[0];
      
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
      await Promise.all([refetchTransactions(), refetchStats()]);
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
            {transactions.length > 0 ? (
              <CollapsibleTransactionList transactions={transactions} />
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

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          transactions={transactionsByDate[selectedDate.toISOString().split('T')[0]] || []}
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
        />
      )}

      <ExpectedPaymentModal
        open={showExpectedPaymentModal}
        onClose={() => setShowExpectedPaymentModal(false)}
        selectedDate={new Date()}
      />
    </motion.div>
  );
}
