import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from './CircularProgress';
import { Calendar, Clock, AlertCircle, Bell, DollarSign, Eye, XCircle, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

interface LoanCardProps {
  loan: any;
  isLender: boolean;
  onRepay?: (loan: any) => void;
  onSendReminder?: (loan: any) => void;
  onViewDetails?: (loan: any) => void;
  onCancel?: (loan: any) => void;
  onApprove?: (loan: any) => void;
  onDecline?: (loan: any) => void;
  isRepaying?: boolean;
  isCancelling?: boolean;
  isApproving?: boolean;
  isDeclining?: boolean;
}

export function LoanCard({ 
  loan, 
  isLender, 
  onRepay, 
  onSendReminder,
  onViewDetails,
  onCancel,
  onApprove,
  onDecline,
  isRepaying = false,
  isCancelling = false,
  isApproving = false,
  isDeclining = false
}: LoanCardProps) {
  const otherParty = isLender ? loan.borrower : loan.lender;
  const progress = (loan.amount_repaid / loan.amount) * 100;
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getLoanStatusBadge = () => {
    if (loan.status === 'pending') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    if (loan.status === 'declined') {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs flex items-center gap-1">
          <X className="h-3 w-3" />
          Declined
        </Badge>
      );
    }
    if (loan.status === 'cancelled') {
      return (
        <Badge variant="secondary" className="bg-gray-200 text-gray-800 text-xs flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    }
    if (loan.is_overdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 text-xs">
          <AlertCircle className="h-3 w-3" />
          {loan.days_overdue}d Overdue
        </Badge>
      );
    }
    if (loan.is_fully_repaid) {
      return (
        <Badge variant="default" className="bg-green-600 text-xs">
          Repaid
        </Badge>
      );
    }
    if (loan.amount_repaid > 0) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
          Partial
        </Badge>
      );
    }
    return <Badge variant="outline" className="text-xs">Active</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full border-l-4 hover:shadow-lg transition-shadow ${
        loan.is_overdue 
          ? 'border-l-red-500' 
          : loan.is_fully_repaid 
          ? 'border-l-green-500' 
          : 'border-l-violet-500'
      }`}>
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900 truncate">
                  {otherParty?.username || 'Unknown'}
                </p>
                {getLoanStatusBadge()}
              </div>
              <p className="text-xs text-gray-600 truncate" title={loan.description}>
                {loan.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
              {!loan.is_fully_repaid && (
                <p className="text-xs text-gray-600 mt-1">
                  Remaining: {formatCurrency(loan.amount_remaining)}
                </p>
              )}
            </div>
            
            <CircularProgress 
              percentage={Math.round(progress)} 
              isFullyRepaid={loan.is_fully_repaid}
              size={70}
              strokeWidth={6}
            />
          </div>

          <div className="space-y-1 mb-4 text-xs text-gray-500">
            {loan.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due: {format(parseISO(loan.due_date), 'MMM dd, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Created: {format(parseISO(loan.created_at), 'MMM dd, yyyy')}</span>
            </div>
            {loan.amount_repaid > 0 && !loan.is_fully_repaid && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>Repaid: {formatCurrency(loan.amount_repaid)}</span>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-2">
            {/* Pending request - lender can approve or decline */}
            {loan.status === 'pending' && isLender && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove?.(loan)}
                  disabled={isApproving}
                >
                  {isApproving ? 'Approving...' : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDecline?.(loan)}
                  disabled={isDeclining}
                >
                  {isDeclining ? 'Declining...' : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Active loan - borrower can repay */}
            {loan.status === 'active' && !loan.is_fully_repaid && !isLender && (
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={() => onRepay?.(loan)}
                disabled={isRepaying}
              >
                {isRepaying ? 'Processing...' : 'Repay Loan'}
              </Button>
            )}
            
            {/* Active loan - lender can cancel if no repayments */}
            {loan.status === 'active' && isLender && !loan.is_fully_repaid && loan.amount_repaid === 0 && (
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => onCancel?.(loan)}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Loan'}
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              {loan.status === 'active' && isLender && !loan.is_fully_repaid && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onSendReminder?.(loan)}
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Remind
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className={`text-xs ${loan.status === 'active' && isLender && !loan.is_fully_repaid ? '' : 'col-span-2'}`}
                onClick={() => onViewDetails?.(loan)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
