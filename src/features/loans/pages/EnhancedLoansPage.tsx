import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, ArrowDownRight, ArrowUpRight, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useCurrencyStore, formatCurrency, convertToUSD } from '@/stores/currencyStore';
import DebtCard from '../components/DebtCard';
import LoanRequestModal from '../components/LoanRequestModal';
import LoanHistoryList from '../components/LoanHistoryList';

export default function EnhancedLoansPage() {
  const { selectedCurrency } = useCurrencyStore();
  const [activeTab, setActiveTab] = useState('owed-to-me');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: loansData } = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const response = await loansAPI.getLoans();
      return response.data;
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: (loanData: any) => loansAPI.createLoan(loanData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan request created successfully!');
      setRequestModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to create loan request');
    },
  });

  const repayLoanMutation = useMutation({
    mutationFn: ({ loanId, amount }: { loanId: number; amount: number }) =>
      loansAPI.repayLoan(loanId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Repayment successful!');
    },
    onError: () => {
      toast.error('Failed to process repayment');
    },
  });

  const allLoansGiven = loansData?.loans_given || [];
  const allLoansTaken = loansData?.loans_taken || [];

  const loansGiven = allLoansGiven.filter((loan: any) => loan.status !== 'repaid');
  const loansTaken = allLoansTaken.filter((loan: any) => loan.status !== 'repaid');
  
  const repaidLoansGiven = allLoansGiven
    .filter((loan: any) => loan.status === 'repaid')
    .map((loan: any) => ({ ...loan, loan_type: 'lent' }));
  const repaidLoansTaken = allLoansTaken
    .filter((loan: any) => loan.status === 'repaid')
    .map((loan: any) => ({ ...loan, loan_type: 'borrowed' }));
  const repaidLoans = [...repaidLoansGiven, ...repaidLoansTaken];

  const totalOwedToMe = loansGiven.reduce(
    (sum: number, loan: any) => sum + (loan.amount - loan.amount_repaid),
    0
  );

  const totalIOwe = loansTaken.reduce(
    (sum: number, loan: any) => sum + (loan.amount - loan.amount_repaid),
    0
  );

  const netBalance = totalOwedToMe - totalIOwe;

  const overdueCount = [...loansGiven, ...loansTaken].filter((loan: any) => {
    if (!loan.deadline) return false;
    return new Date(loan.deadline) < new Date() && loan.amount_repaid < loan.amount;
  }).length;

  const handleCreateLoanRequest = (requestData: any) => {
    const amountInUSD = convertToUSD(requestData.amount, selectedCurrency);
    createLoanMutation.mutate({
      ...requestData,
      amount: amountInUSD,
    });
  };

  const handleRepay = (loan: any) => {
    const remainingAmount = loan.amount - loan.amount_repaid;
    repayLoanMutation.mutate({ loanId: loan.id, amount: remainingAmount });
  };

  const handleRemind = (loan: any) => {
    toast.success(`Reminder sent to ${loan.borrower.username}!`, {
      description: 'Your borrower will receive a notification to repay the loan',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-violet-600" />
            P2P Borrow/Lend
          </h1>
          <p className="text-gray-600 mt-1">Track debts and manage loans with friends</p>
        </div>
        <Button
          onClick={() => setRequestModalOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Request Loan
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowDownRight className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Owed to Me</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalOwedToMe, selectedCurrency)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-sm text-gray-600">I Owe</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalIOwe, selectedCurrency)}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${
          netBalance >= 0 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50' 
            : 'bg-gradient-to-br from-orange-50 to-amber-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-2 ${netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-lg`}>
                <TrendingUp className={`h-4 w-4 ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <span className="text-sm text-gray-600">Net Balance</span>
            </div>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netBalance), selectedCurrency)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {overdueCount}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="owed-to-me" className="text-base">
              Owed to Me
            </TabsTrigger>
            <TabsTrigger value="i-owe" className="text-base">
              I Owe
            </TabsTrigger>
            <TabsTrigger value="history" className="text-base">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owed-to-me" className="space-y-4 mt-6">
            {loansGiven.length > 0 ? (
              loansGiven.map((loan) => (
                <DebtCard
                  key={loan.id}
                  loan={loan}
                  type="lent"
                  onRemind={handleRemind}
                />
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Active Loans
                  </h3>
                  <p className="text-gray-600">
                    You haven't lent money to anyone yet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="i-owe" className="space-y-4 mt-6">
            {loansTaken.length > 0 ? (
              loansTaken.map((loan) => (
                <DebtCard
                  key={loan.id}
                  loan={loan}
                  type="borrowed"
                  onRepay={handleRepay}
                />
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Outstanding Debts
                  </h3>
                  <p className="text-gray-600">
                    You don't owe anyone money right now
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Repaid Loans
              </h3>
              <LoanHistoryList loans={repaidLoans} type="lent" />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <LoanRequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleCreateLoanRequest}
      />
    </div>
  );
}
