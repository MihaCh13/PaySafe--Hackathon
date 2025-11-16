import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Check, 
  X, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Gift,
  AlertCircle,
  Info,
  Send,
  QrCode,
  Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationStore } from '@/stores/notificationStore';

const MotionCard = motion.create(Card);

const iconMap: Record<string, any> = {
  DollarSign,
  CreditCard,
  TrendingUp,
  Gift,
  AlertCircle,
  Info,
  Send,
  QrCode,
  Banknote,
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
    toast.success('Marked as read');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success('All notifications marked as read');
  };

  const handleDeleteNotification = (id: number) => {
    deleteNotification(id);
    toast.success('Notification deleted');
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string }> = {
      green: { bg: 'bg-green-100 dark:bg-green-900', icon: 'text-green-600 dark:text-green-400', border: 'border-green-200' },
      blue: { bg: 'bg-blue-100 dark:bg-blue-900', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', icon: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200' },
      violet: { bg: 'bg-violet-100 dark:bg-violet-900', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200' },
      red: { bg: 'bg-red-100 dark:bg-red-900', icon: 'text-red-600 dark:text-red-400', border: 'border-red-200' },
    };
    return colors[color] || colors.blue;
  };

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
          >
            {filter === 'all' ? 'Show Unread' : 'Show All'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Notifications</h3>
          <p className="text-gray-500">
            {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = iconMap[notification.icon] || Info;
            const colors = getColorClasses(notification.color);
            
            return (
              <MotionCard
                key={notification.id}
                variants={itemVariants}
                className={`hover:shadow-md transition-all ${
                  !notification.read ? 'border-l-4 border-l-violet-600' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${colors.bg}`}>
                      <Icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {getRelativeTime(new Date(notification.timestamp))}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-8 w-8 p-0 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
            );
          })}
        </div>
      )}

      <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 border-violet-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-violet-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">
                Real-time Notifications
              </h3>
              <p className="text-sm text-violet-800 dark:text-violet-200">
                Stay updated with instant notifications for payments, transfers, and important account activities.
                WebSocket integration coming soon for real-time updates!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
