import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, DollarSign, AlertCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface Loan {
  id: number;
  amount: number;
  amount_repaid: number;
  description: string;
  created_at: string;
  deadline?: string;
  status: 'active' | 'repaid';
  borrower?: { username: string };
  lender?: { username: string };
}

interface DebtCardProps {
  loan: Loan;
  type: 'lent' | 'borrowed';
  onRepay?: (loan: Loan) => void;
  onRemind?: (loan: Loan) => void;
  isProcessing?: boolean;
}

export default function DebtCard({ loan, type, onRepay, onRemind, isProcessing }: DebtCardProps) {
  const otherUser = type === 'lent' ? loan.borrower : loan.lender;
  const remaining = loan.amount - (loan.amount_repaid || 0);
  const percentRepaid = ((loan.amount_repaid || 0) / loan.amount) * 100;
  
  const daysSinceLoan = loan.created_at 
    ? Math.floor((new Date().getTime() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const daysUntilDeadline = loan.deadline
    ? Math.ceil((new Date(loan.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${
        isOverdue ? 'ring-2 ring-red-400' : ''
      }`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-violet-500 to-indigo-500">
                <AvatarFallback className="text-white font-semibold">
                  {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-gray-900">
                  {otherUser?.username || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-600">{loan.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${remaining.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">of ${loan.amount.toFixed(2)}</p>
            </div>
          </div>

          {loan.amount_repaid > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Repaid</span>
                <span>{percentRepaid.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentRepaid}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {daysSinceLoan} days ago
            </Badge>
            
            {daysUntilDeadline !== null && (
              <Badge 
                variant={isOverdue ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {isOverdue ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {Math.abs(daysUntilDeadline)} days overdue
                  </>
                ) : (
                  <>
                    <DollarSign className="h-3 w-3 mr-1" />
                    {daysUntilDeadline} days left
                  </>
                )}
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {type === 'borrowed' && onRepay && (
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                onClick={() => onRepay(loan)}
                disabled={isProcessing}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                {isProcessing ? 'Processing...' : 'Repay'}
              </Button>
            )}

            {type === 'lent' && onRemind && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onRemind(loan)}
              >
                <Send className="h-4 w-4 mr-1" />
                Send Reminder
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
