interface TransactionDotProps {
  color: 'red' | 'green' | 'yellow';
}

export default function TransactionDot({ color }: TransactionDotProps) {
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className={`h-1.5 w-1.5 rounded-full ${colorClasses[color]}`} />
  );
}
