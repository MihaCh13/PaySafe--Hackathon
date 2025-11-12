import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import CalendarGrid from '../components/CalendarGrid';
import ColorLegend from '../components/ColorLegend';
import DayDetailModal from '../components/DayDetailModal';

export default function FinanceTimelinePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const response = await transactionsAPI.getTransactions(1, 100);
      return response.data;
    },
  });

  const transactions = transactionsData?.transactions || [];

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

  const currentMonthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-7 w-7 text-violet-600" />
            Finance Timeline
          </h1>
          <p className="text-gray-600 mt-1">Track your spending patterns over time</p>
        </div>
      </motion.div>

      <ColorLegend />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
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
      </motion.div>

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          transactions={transactionsByDate[selectedDate.toISOString().split('T')[0]] || []}
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
        />
      )}
    </div>
  );
}
