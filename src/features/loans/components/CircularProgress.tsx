import { Check } from 'lucide-react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isFullyRepaid?: boolean;
}

export function CircularProgress({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  isFullyRepaid = false
}: CircularProgressProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${
            isFullyRepaid 
              ? 'text-green-500' 
              : clampedPercentage > 75 
              ? 'text-blue-500' 
              : clampedPercentage > 50 
              ? 'text-yellow-500' 
              : 'text-orange-500'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isFullyRepaid ? (
          <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full">
            <Check className="w-6 h-6 text-white" />
          </div>
        ) : (
          <span className="text-sm font-bold text-gray-900">
            {clampedPercentage}%
          </span>
        )}
      </div>
    </div>
  );
}
