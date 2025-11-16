import { motion } from 'framer-motion';

interface CalendarGridProps {
  currentDate: Date;
  transactionsByDate: Record<string, any[]>;
  onDayClick: (date: Date) => void;
}

export default function CalendarGrid({
  currentDate,
  transactionsByDate,
  onDayClick,
}: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays: (Date | null)[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isIncomeTransaction = (transaction: any) => {
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

    if (incomeTypes.includes(transaction.transaction_type)) {
      return true;
    }

    // Legacy support: transfers where user is the receiver
    if (transaction.transaction_type === 'transfer' && transaction.receiver_id) {
      return true; // Note: We can't check user_id here, but transfer_received should be used for new transactions
    }

    return false;
  };

  const getCellBackgroundColor = (date: Date | null) => {
    if (!date) return '';
    
    const dateKey = date.toISOString().split('T')[0];
    const dayTransactions = transactionsByDate[dateKey] || [];

    if (dayTransactions.length === 0) return '';

    const hasUpcoming = dayTransactions.some((t: any) => 
      t.status === 'scheduled' || 
      (t.metadata && t.metadata.source === 'USER_EXPECTED_PAYMENT')
    );
    const hasIncome = dayTransactions.some((t: any) => 
      isIncomeTransaction(t) && t.status !== 'scheduled'
    );
    const hasExpense = dayTransactions.some((t: any) => 
      !isIncomeTransaction(t) && t.status !== 'scheduled'
    );

    // Prioritize upcoming payments (show yellow)
    if (hasUpcoming) {
      return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200';
    }
    // Then mixed days
    if (hasExpense && hasIncome) {
      return 'bg-gradient-to-br from-red-100 to-green-100';
    }
    // Then expenses
    if (hasExpense) {
      return 'bg-red-50 hover:bg-red-100';
    }
    // Then income
    if (hasIncome) {
      return 'bg-green-50 hover:bg-green-100';
    }

    return '';
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          const bgColor = getCellBackgroundColor(date);
          const dayIsToday = isToday(date);
          const hasTransactions = bgColor !== '';

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => date && onDayClick(date)}
              disabled={!date}
              className={`
                aspect-square p-2 rounded-lg border relative
                transition-all duration-200
                ${!date ? 'invisible' : ''}
                ${dayIsToday && !hasTransactions ? 'bg-violet-100 border-violet-400 ring-2 ring-violet-400' : ''}
                ${dayIsToday && hasTransactions ? 'border-violet-400 ring-2 ring-violet-400' : ''}
                ${!dayIsToday ? 'border-gray-200' : ''}
                ${bgColor}
                ${hasTransactions ? 'hover:shadow-md hover:scale-105 font-semibold' : ''}
                ${!hasTransactions ? 'hover:bg-gray-50' : ''}
                disabled:cursor-default cursor-pointer
              `}
            >
              {date && (
                <span className={`
                  text-sm font-semibold
                  ${dayIsToday ? 'text-violet-700' : 'text-gray-900'}
                `}>
                  {date.getDate()}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
