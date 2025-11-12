import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Target, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCurrencyStore, formatCurrency, convertToUSD } from '@/stores/currencyStore';

export default function SavingsPage() {
  const { selectedCurrency } = useCurrencyStore();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  
  const queryClient = useQueryClient();

  const { data: goalsData } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      const response = await savingsAPI.getGoals();
      return response.data.goals;
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => savingsAPI.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      setGoalDialogOpen(false);
      toast.success('Goal created');
      setGoalTitle('');
      setGoalAmount('');
      setGoalDescription('');
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const contributeMutation = useMutation({
    mutationFn: ({ goalId, amount }: { goalId: number; amount: number }) =>
      savingsAPI.contributeToGoal(goalId, amount),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      setContributionDialogOpen(false);
      setContributionAmount('');
      if (response.data.goal_unlocked) {
        toast.success('Congratulations! Goal completed! 🎉');
      } else {
        toast.success('Contribution added');
      }
    },
    onError: () => {
      toast.error('Failed to contribute to goal');
    },
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
      className="space-y-6 max-w-4xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Savings & Goals</h1>
        <p className="text-gray-600 mt-1">Set and track your financial goals</p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Piggy Goals</h2>
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                  <Plus className="h-4 w-4 mr-1" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Savings Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-title">Goal Title</Label>
                    <Input
                      id="goal-title"
                      placeholder="New Laptop"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-amount">Target Amount ($)</Label>
                    <Input
                      id="goal-amount"
                      type="number"
                      placeholder="1000"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-description">Description (optional)</Label>
                    <Input
                      id="goal-description"
                      placeholder="MacBook Pro for coding"
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                    onClick={() => {
                      const targetAmountInUSD = convertToUSD(Number(goalAmount), selectedCurrency);
                      createGoalMutation.mutate({
                        title: goalTitle,
                        target_amount: targetAmountInUSD,
                        description: goalDescription,
                      });
                    }}
                    disabled={createGoalMutation.isPending || !goalTitle || !goalAmount}
                  >
                    {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {goalsData && goalsData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {goalsData.map((goal: any) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                    <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2.5 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl flex-shrink-0">
                          <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-base sm:text-lg truncate">{goal.title}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                            {formatCurrency(goal.current_amount, selectedCurrency)} of {formatCurrency(goal.target_amount, selectedCurrency)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 mt-auto">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                          <div
                            className="bg-gradient-to-r from-green-600 to-emerald-600 h-2.5 sm:h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">
                            {((goal.current_amount / goal.target_amount) * 100).toFixed(0)}% complete
                          </p>
                          {!goal.is_completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setContributionDialogOpen(true);
                              }}
                              className="text-xs sm:text-sm min-h-[44px] px-3 sm:px-4"
                            >
                              Contribute
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 sm:p-8 md:p-10 text-center">
                <Target className="h-12 w-12 sm:h-14 sm:w-14 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5">No goals yet</p>
                <Button
                  size="sm"
                  onClick={() => setGoalDialogOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 min-h-[40px] sm:min-h-[44px] px-4 sm:px-5"
                >
                  <Plus className="h-4 w-4 sm:h-4.5 sm:w-4.5 mr-1.5 sm:mr-2" />
                  Create Goal
                </Button>
              </CardContent>
            </Card>
          )}
      </motion.div>

      <Dialog open={contributionDialogOpen} onOpenChange={setContributionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribute to {selectedGoal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Contribution Amount ($)</Label>
              <Input
                id="contribution-amount"
                type="number"
                placeholder="50"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
              onClick={() => {
                if (selectedGoal && contributionAmount && Number(contributionAmount) > 0) {
                  const amountInUSD = convertToUSD(Number(contributionAmount), selectedCurrency);
                  contributeMutation.mutate({
                    goalId: selectedGoal.id,
                    amount: amountInUSD,
                  });
                }
              }}
              disabled={contributeMutation.isPending || !contributionAmount || Number(contributionAmount) <= 0}
            >
              {contributeMutation.isPending ? 'Contributing...' : 'Contribute'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
