import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface RepaidLoan {
  id: number;
  amount: number;
  description: string;
  created_at: string;
  repaid_at: string;
  borrower?: { username: string };
  lender?: { username: string };
}

interface LoanHistoryListProps {
  loans: RepaidLoan[];
  type: 'lent' | 'borrowed';
}

export default function LoanHistoryList({ loans, type }: LoanHistoryListProps) {
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loans.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No repaid loans yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {loans.map((loan, index) => {
        const otherUser = type === 'lent' ? loan.borrower : loan.lender;
        const duration = calculateDuration(loan.created_at, loan.repaid_at);
        const isOnTime = duration <= 30;

        return (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        {otherUser?.username || 'Unknown User'}
                      </p>
                      <Badge
                        variant={isOnTime ? 'default' : 'secondary'}
                        className={`text-xs ${
                          isOnTime ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {isOnTime ? 'On Time' : 'Late'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{loan.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {duration} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(loan.repaid_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${loan.amount.toFixed(2)}
                    </p>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
