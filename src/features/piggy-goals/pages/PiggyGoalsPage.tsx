import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsAPI, walletAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import GoalCard from '../components/GoalCard';
import CreateGoalModal from '../components/CreateGoalModal';
import TransferToGoalModal from '../components/TransferToGoalModal';
import ConfettiCelebration from '../components/ConfettiCelebration';
import GoalCompletionModal from '../components/GoalCompletionModal';

export default function PiggyGoalsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completedGoal, setCompletedGoal] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: goalsData } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await savingsAPI.getGoals();
      return response.data;
    },
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await walletAPI.getWallet();
      return response.data;
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (goalData: any) => savingsAPI.createGoal(goalData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success(`Goal "${response.data.goal.title}" created! Start saving now! 🎯`);
      setCreateModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const contributeToGoalMutation = useMutation({
    mutationFn: ({ goalId, amount }: { goalId: number; amount: number }) =>
      savingsAPI.contributeToGoal(goalId, amount),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      const goalUnlocked = response.data.goal_unlocked;
      toast.success(`Added $${variables.amount.toFixed(2)} to ${selectedGoal?.title}! 🎉`);

      if (goalUnlocked) {
        setTimeout(() => {
          setCelebrationActive(true);
          setCompletedGoal(response.data.goal);
          setCompletionModalOpen(true);
          setTimeout(() => setCelebrationActive(false), 4000);
        }, 500);
      }
      
      setTransferModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to contribute to goal');
    },
  });

  const goals = goalsData?.goals || [];
  const walletBalance = walletData?.wallet?.balance || 0;

  const handleCreateGoal = (goalData: any) => {
    const activeGoals = goals.filter((g: any) => !g.is_completed);
    if (activeGoals.length >= 10) {
      toast.error('You can only have 10 active goals at a time');
      return;
    }

    createGoalMutation.mutate({
      title: goalData.name,
      description: goalData.description || '',
      target_amount: goalData.target_amount,
      target_date: goalData.deadline,
      icon: goalData.icon,
      color: goalData.color || '#8b5cf6',
    });
  };

  const handleAddMoney = (goal: any) => {
    setSelectedGoal(goal);
    setTransferModalOpen(true);
  };

  const handleTransfer = (goalId: number, amount: number) => {
    if (amount > walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    contributeToGoalMutation.mutate({ goalId, amount });
  };

  const handleDelete = (goal: any) => {
    toast.info('Delete feature coming soon');
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
            <PiggyBank className="h-7 w-7 text-violet-600" />
            Piggy Goals
          </h1>
          <p className="text-gray-600 mt-1">Save for what matters most</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Goal
        </Button>
      </motion.div>

      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-violet-100 rounded-full mb-6">
                <PiggyBank className="h-12 w-12 text-violet-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Start Your First Savings Goal
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Whether it's a new laptop, vacation, or emergency fund, Piggy Goals helps you save
                with visual progress tracking and fun celebrations!
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GoalCard
                goal={goal}
                onAddMoney={handleAddMoney}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <CreateGoalModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateGoal}
        activeGoalsCount={goals.filter(g => g.status === 'active').length}
      />

      <TransferToGoalModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        goal={selectedGoal}
        walletBalance={walletBalance}
        onTransfer={handleTransfer}
      />

      <ConfettiCelebration isActive={celebrationActive} />

      <GoalCompletionModal
        open={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        goal={completedGoal}
      />
    </div>
  );
}
