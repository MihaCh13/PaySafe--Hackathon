import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function CompactColorLegend() {
  const legendItems = [
    { 
      color: 'bg-red-100', 
      dotColor: 'bg-red-500', 
      label: 'Expenses', 
      description: 'Days with outgoing payments'
    },
    { 
      color: 'bg-green-100', 
      dotColor: 'bg-green-500', 
      label: 'Income', 
      description: 'Days with incoming funds'
    },
    { 
      color: 'bg-yellow-100', 
      dotColor: 'bg-yellow-500', 
      label: 'Upcoming', 
      description: 'Scheduled payments'
    },
    { 
      color: 'bg-gradient-to-r from-red-100 to-green-100', 
      dotColor: 'bg-gradient-to-r from-red-500 to-green-500', 
      label: 'Mixed', 
      description: 'Both income & expenses'
    },
  ];

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm w-fit"
      >
        <span className="text-xs font-medium text-gray-600">Legend:</span>
        <div className="flex items-center gap-2">
          {legendItems.map((item) => (
            <Tooltip key={item.label} delayDuration={100}>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  className="cursor-help flex items-center gap-1.5"
                >
                  <div className={`w-4 h-4 rounded-full ${item.color} border border-gray-300 flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                  </div>
                  <span className="text-xs text-gray-700 hidden sm:inline">{item.label}</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 text-white px-3 py-2">
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-xs text-gray-300 mt-0.5">{item.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
