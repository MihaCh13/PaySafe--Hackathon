import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function ColorLegend() {
  const legendItems = [
    { color: 'red', label: 'Expenses', icon: '🔴' },
    { color: 'green', label: 'Income', icon: '🟢' },
    { color: 'yellow', label: 'Upcoming Payments', icon: '🟡' },
    { color: 'mixed', label: 'Both in One Day', icon: '🔴🟢' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-semibold text-gray-700">Legend:</span>
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
