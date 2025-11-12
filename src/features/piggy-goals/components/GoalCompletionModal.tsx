import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Goal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  created_at?: string;
}

interface GoalCompletionModalProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export default function GoalCompletionModal({ open, onClose, goal }: GoalCompletionModalProps) {
  if (!goal) return null;

  const daysToComplete = goal.created_at 
    ? Math.ceil((new Date().getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 border-0">
        <div className="text-center space-y-6 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center"
          >
            <div className="relative">
              <Trophy className="h-24 w-24 text-yellow-500" />
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-8 w-8 text-violet-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Congratulations! 🎉
            </h2>
            <p className="text-lg text-gray-700">
              You've achieved your goal!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-3 text-2xl"
          >
            <span className="text-4xl">{goal.icon}</span>
            <span className="font-bold text-gray-900">{goal.title}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="h-5 w-5" />
                  <span>Amount Saved</span>
                </div>
                <span className="font-bold text-xl text-green-600">
                  ${goal.current_amount.toFixed(2)}
                </span>
              </CardContent>
            </Card>

            {daysToComplete > 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-5 w-5" />
                    <span>Time Taken</span>
                  </div>
                  <span className="font-bold text-xl text-blue-600">
                    {daysToComplete} days
                  </span>
                </CardContent>
              </Card>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="pt-4"
          >
            <p className="text-gray-600 text-sm mb-4">
              Great job on reaching your savings goal! Keep up the excellent work! 💪
            </p>
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-lg py-6"
            >
              Celebrate & Continue
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
