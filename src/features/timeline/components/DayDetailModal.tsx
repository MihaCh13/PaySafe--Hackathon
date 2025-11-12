import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, Plus, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import ExpectedPaymentModal from './ExpectedPaymentModal';

interface DayDetailModalProps {
  date: Date;
  transactions: any[];
  open: boolean;
  onClose: () => void;
}

export default function DayDetailModal({ date, transactions, open, onClose }: DayDetailModalProps) {
  const [showExpectedPaymentModal, setShowExpectedPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalIncome = transactions
    .filter((t: any) => 
      t.transaction_type === 'topup' || 
      t.transaction_type === 'income' || 
      t.transaction_type === 'refund'
    )
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t: any) => 
      t.transaction_type === 'transfer' || 
      t.transaction_type === 'payment' || 
      t.transaction_type === 'withdrawal' ||
      t.transaction_type === 'purchase'
    )
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-600" />
                {formattedDate}
              </DialogTitle>
              <DialogDescription>
                View all transactions and financial activity for this day
              </DialogDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedPayment(null);
                setShowExpectedPaymentModal(true);
              }}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expected Payment
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Income</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Expenses</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">${totalExpense.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className={`border-0 shadow-sm ${netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className={`h-4 w-4 ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                    <span className={`text-xs font-medium ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      Net
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {netBalance >= 0 ? '+' : ''} ${netBalance.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Transactions ({transactions.length})
                </h3>
                {transactions.map((transaction: any, index: number) => {
                  const isIncome = 
                    transaction.transaction_type === 'topup' || 
                    transaction.transaction_type === 'income' || 
                    transaction.transaction_type === 'refund';
                  
                  const isScheduled = transaction.status === 'scheduled';
                  
                  return (
                    <motion.div
                      key={transaction.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow ${isScheduled ? 'bg-yellow-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`
                                h-10 w-10 rounded-full flex items-center justify-center
                                ${isScheduled ? 'bg-yellow-100' : isIncome ? 'bg-green-100' : 'bg-red-100'}
                              `}>
                                {isIncome ? (
                                  <ArrowUpCircle className={`h-5 w-5 ${isScheduled ? 'text-yellow-600' : 'text-green-600'}`} />
                                ) : (
                                  <ArrowDownCircle className={`h-5 w-5 ${isScheduled ? 'text-yellow-600' : 'text-red-600'}`} />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">
                                    {transaction.description || transaction.transaction_type}
                                  </p>
                                  {isScheduled && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full font-medium">
                                      Expected
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {transaction.metadata?.frequency && transaction.metadata.frequency !== 'one-time' && (
                                    <span className="ml-2 text-xs text-gray-400">
                                      • {transaction.metadata.frequency === 'monthly' ? '📅 Monthly' : '📆 Weekly'}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={`
                                  text-lg font-bold
                                  ${isScheduled ? 'text-yellow-600' : isIncome ? 'text-green-600' : 'text-red-600'}
                                `}>
                                  {isIncome ? '+' : '-'}${parseFloat(transaction.amount || 0).toFixed(2)}
                                </p>
                                {transaction.metadata?.category && (
                                  <p className="text-xs text-gray-500 capitalize">{transaction.metadata.category}</p>
                                )}
                              </div>
                              {isScheduled && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedPayment(transaction);
                                    setShowExpectedPaymentModal(true);
                                  }}
                                  className="hover:bg-yellow-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
                  <p className="text-gray-600">No financial activity on this day</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      <ExpectedPaymentModal
        open={showExpectedPaymentModal}
        onClose={() => {
          setShowExpectedPaymentModal(false);
          setSelectedPayment(null);
        }}
        selectedDate={date}
        payment={selectedPayment}
      />
    </Dialog>
  );
}
