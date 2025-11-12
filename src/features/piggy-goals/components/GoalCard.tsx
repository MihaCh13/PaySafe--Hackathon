import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit3, CheckCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import GoalProgressBar from './GoalProgressBar';

interface Goal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  target_date?: string;
  is_completed: boolean;
}

interface GoalCardProps {
  goal: Goal;
  onAddMoney: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
}

export default function GoalCard({ goal, onAddMoney, onEdit, onDelete }: GoalCardProps) {
  const isCompleted = goal.is_completed || goal.current_amount >= goal.target_amount;
  const daysRemaining = goal.target_date 
    ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const isOverdue = daysRemaining !== null && daysRemaining < 0 && !isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${
        isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 ring-2 ring-green-400' : 'bg-white'
      }`}>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{goal.icon}</div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{goal.title}</h3>
                <p className="text-sm text-gray-600">
                  ${(goal.target_amount - goal.current_amount).toFixed(2)} to go
                </p>
              </div>
            </div>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
              </motion.div>
            )}
          </div>

          <GoalProgressBar 
            current={goal.current_amount} 
            target={goal.target_amount} 
            size="lg"
          />

          <div className="flex flex-wrap gap-2">
            {daysRemaining !== null && (
              <Badge 
                variant={isOverdue ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {isOverdue 
                  ? `${Math.abs(daysRemaining)} days overdue` 
                  : `${daysRemaining} days left`
                }
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onAddMoney(goal)}
              disabled={isCompleted}
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Money
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(goal)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(goal)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
