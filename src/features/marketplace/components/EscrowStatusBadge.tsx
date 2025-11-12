import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Lock, XCircle, AlertTriangle } from 'lucide-react';

interface EscrowStatusBadgeProps {
  status: 'available' | 'pending' | 'in_escrow' | 'completed' | 'cancelled' | 'disputed';
}

export default function EscrowStatusBadge({ status }: EscrowStatusBadgeProps) {
  const statusConfig = {
    available: {
      label: 'Available',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700',
    },
    pending: {
      label: 'Pending Payment',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-700',
    },
    in_escrow: {
      label: 'In Escrow',
      icon: Lock,
      className: 'bg-blue-100 text-blue-700',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700',
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className: 'bg-gray-100 text-gray-700',
    },
    disputed: {
      label: 'Disputed',
      icon: AlertTriangle,
      className: 'bg-red-100 text-red-700',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
