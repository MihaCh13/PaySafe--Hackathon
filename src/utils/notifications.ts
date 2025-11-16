import { useNotificationStore } from '@/stores/notificationStore';
import { toast } from 'sonner';

export const createNotification = (
  title: string,
  message: string,
  type: 'payment' | 'transfer' | 'security' | 'info' | 'achievement' | 'budget_card' | 'dark_days' = 'info',
  color: string = 'blue',
  icon: string = 'Info',
  showToast: boolean = true
) => {
  const store = useNotificationStore.getState();
  
  store.addNotification({
    title,
    message,
    type,
    color,
    icon,
  });

  if (showToast) {
    toast.success(title, {
      description: message,
      duration: 4000,
    });
  }
};

export const notifyMoneyReceived = (amount: number, from: string) => {
  createNotification(
    'Money Received',
    `You received $${amount.toFixed(2)} from @${from}`,
    'transfer',
    'green',
    'DollarSign',
    true
  );
};

export const notifyMoneySent = (amount: number, to: string) => {
  createNotification(
    'Money Sent',
    `You sent $${amount.toFixed(2)} to @${to}`,
    'transfer',
    'blue',
    'Send',
    true
  );
};

export const notifyBudgetCardPayment = (amount: number, cardName: string) => {
  createNotification(
    'Budget Card Payment',
    `Paid $${amount.toFixed(2)} with ${cardName}`,
    'budget_card',
    'violet',
    'CreditCard',
    true
  );
};

export const notifyDarkDaysPocketWithdrawal = (amount: number) => {
  createNotification(
    'Dark Days Pocket Withdrawal',
    `Emergency withdrawal of $${amount.toFixed(2)} from Dark Days Pocket`,
    'dark_days',
    'red',
    'AlertCircle',
    true
  );
};

export const notifyTopUp = (amount: number, method: string) => {
  createNotification(
    'Top-up Successful',
    `Your wallet was topped up with $${amount.toFixed(2)} via ${method}`,
    'payment',
    'green',
    'TrendingUp',
    true
  );
};

export const notifyQRPaymentReceived = (amount: number) => {
  createNotification(
    'QR Payment Received',
    `You received $${amount.toFixed(2)} via QR code`,
    'transfer',
    'green',
    'QrCode',
    true
  );
};

export const notifyQRPaymentSent = (amount: number) => {
  createNotification(
    'QR Payment Sent',
    `You sent $${amount.toFixed(2)} via QR code`,
    'transfer',
    'blue',
    'QrCode',
    true
  );
};

export const notifyBankTransfer = (amount: number, recipient: string) => {
  createNotification(
    'Bank Transfer Initiated',
    `Transfer of $${amount.toFixed(2)} to ${recipient} is being processed`,
    'transfer',
    'blue',
    'Banknote',
    true
  );
};
