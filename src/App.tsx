import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/sonner';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import SettingsPage from './features/settings/pages/SettingsPage';
import BudgetCardsPage from './features/budget-cards/pages/BudgetCardsPage';
import SavingsPage from './features/savings/pages/SavingsPage';
import DarkDaysPocketPage from './features/savings/pages/DarkDaysPocketPage';
import ISICCardPage from './features/isic/pages/ISICCardPage';
import MarketplacePage from './features/marketplace/pages/MarketplacePage';
import LoansPage from './features/loans/pages/LoansPage';
import FinanceTimelinePage from './features/timeline/pages/FinanceTimelinePage';
import PiggyGoalsPage from './features/piggy-goals/pages/PiggyGoalsPage';
import TransactionsPage from './features/transactions/pages/TransactionsPage';
import TransfersPage from './features/transfers/pages/TransfersPage';
import TopupPage from './features/topup/pages/TopupPage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';

import './App.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/budget-cards" element={<BudgetCardsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/timeline" element={<FinanceTimelinePage />} />
            <Route path="/piggy-goals" element={<PiggyGoalsPage />} />
            <Route path="/savings" element={<SavingsPage />} />
            <Route path="/darkdays-pocket" element={<DarkDaysPocketPage />} />
            <Route path="/isic" element={<ISICCardPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/topup" element={<TopupPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
