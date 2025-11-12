import { motion } from 'framer-motion';

interface GoalProgressBarProps {
  current: number;
  target: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function GoalProgressBar({ 
  current, 
  target, 
  showPercentage = true,
  size = 'md' 
}: GoalProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);

  const getProgressColor = () => {
    if (percentage >= 100) return 'from-green-500 to-emerald-500';
    if (percentage >= 76) return 'from-green-400 to-green-500';
    if (percentage >= 51) return 'from-blue-400 to-blue-500';
    if (percentage >= 26) return 'from-yellow-400 to-amber-500';
    return 'from-red-400 to-orange-500';
  };

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full space-y-1">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${getProgressColor()} relative`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {percentage >= 100 && (
            <motion.div
              className="absolute inset-0 bg-white opacity-30"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-gray-700">
            {percentage.toFixed(0)}%
          </span>
          <span className="text-gray-500">
            ${current.toFixed(2)} / ${target.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
