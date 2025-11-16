import { useNotificationStore } from '@/stores/notificationStore';
import { toast } from 'sonner';
import { formatCurrency, type Currency } from '@/stores/currencyStore';

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

export const notifyMoneyReceived = (amount: number, from: string, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'Money Received',
    `You received ${formatCurrency(amount, currency)} from @${from}`,
    'transfer',
    'green',
    'DollarSign',
    showToast
  );
};

export const notifyMoneySent = (amount: number, to: string, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'Money Sent',
    `You sent ${formatCurrency(amount, currency)} to @${to}`,
    'transfer',
    'blue',
    'Send',
    showToast
  );
};

export const notifyBudgetCardPayment = (amount: number, cardName: string, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'Budget Card Payment',
    `Paid ${formatCurrency(amount, currency)} with ${cardName}`,
    'budget_card',
    'violet',
    'CreditCard',
    showToast
  );
};

export const notifyDarkDaysPocketWithdrawal = (amount: number, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'Dark Days Pocket Withdrawal',
    `Emergency withdrawal of ${formatCurrency(amount, currency)} from Dark Days Pocket`,
    'dark_days',
    'red',
    'AlertCircle',
    showToast
  );
};

export const notifyTopUp = (amount: number, method: string, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'Top-up Successful',
    `Your wallet was topped up with ${formatCurrency(amount, currency)} via ${method}`,
    'payment',
    'green',
    'TrendingUp',
    showToast
  );
};

export const notifyQRPaymentReceived = (amount: number, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'QR Payment Received',
    `You received ${formatCurrency(amount, currency)} via QR code`,
    'transfer',
    'green',
    'QrCode',
    showToast
  );
};

export const notifyQRPaymentSent = (amount: number, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'QR Payment Sent',
    `You sent ${formatCurrency(amount, currency)} via QR code`,
    'transfer',
    'blue',
    'QrCode',
    showToast
  );
};

export const notifyBankTransfer = (amount: number, recipient: string, currency: Currency = 'USD', showToast = false) => {
  createNotification(
    'Bank Transfer Initiated',
    `Transfer of ${formatCurrency(amount, currency)} to ${recipient} is being processed`,
    'transfer',
    'blue',
    'Banknote',
    showToast
  );
};
