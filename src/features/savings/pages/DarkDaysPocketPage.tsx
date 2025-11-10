/**
 * DarkDaysPocketPage - Enhanced Savings Interface
 * 
 * Purpose:
 *   Comprehensive DarkDays Pocket management interface with all security features.
 *   Integrates all DarkDays components for complete user experience.
 * 
 * Components Included:
 *   - DarkDaysCard: Black card visualization with vault aesthetics
 *   - SecurityVerificationModal: Multi-layer security for withdrawals
 *   - AutoSaveConfigPanel: Automatic savings configuration
 *   - EmergencyUnlockDialog: Emergency access with verification
 *   - SavingsReportWidget: Progress reports and milestones
 * 
 * Status:
 *   [DONE] Component integration
 *   [DONE] Deposit functionality UI
 *   [DONE] Emergency access flow UI
 *   [DONE] Auto-save configuration UI
 *   [DONE] Reports and analytics UI
 *   [PENDING] Backend integration for new endpoints
 *   [PENDING] Actual withdrawal implementation
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Settings, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrencyStore, formatCurrency, convertToUSD, getCurrencySymbol } from '@/stores/currencyStore';

import { DarkDaysCard } from '../components/DarkDaysCard';
import { SecurityVerificationModal } from '../components/SecurityVerificationModal';
import { ConsolidatedSettingsPanel } from '../components/ConsolidatedSettingsPanel';
import { EmergencyUnlockDialog } from '../components/EmergencyUnlockDialog';
import { SavingsReportWidget } from '../components/SavingsReportWidget';

export default function DarkDaysPocketPage() {
  const { selectedCurrency } = useCurrencyStore();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawalAmountDialogOpen, setWithdrawalAmountDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  
  // Form states
  const [pocketName, setPocketName] = useState('DarkDays Pocket');
  const [autoSavePercentage, setAutoSavePercentage] = useState('20');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPin, setDepositPin] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [emergencyData, setEmergencyData] = useState<any>(null);
  
  // Selected pocket for operations
  const [selectedPocket, setSelectedPocket] = useState<any>(null);

  // Fetch pockets
  const { data: pocketsData, isLoading } = useQuery({
    queryKey: ['savings-pockets'],
    queryFn: async () => {
      const response = await savingsAPI.getPockets();
      return response.data.pockets;
    },
  });

  // Create pocket mutation
  const createPocketMutation = useMutation({
    mutationFn: (data: any) => savingsAPI.createPocket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-pockets'] });
      setCreateDialogOpen(false);
      toast.success('DarkDays Pocket created successfully!');
      setPocketName('DarkDays Pocket');
      setAutoSavePercentage('20');
    },
    onError: (error: any) => {
      toast.error(`Failed to create pocket: ${error.response?.data?.error || error.message}`);
    },
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: ({ pocketId, amount, pin, originalAmount }: any) => 
      savingsAPI.depositToPocket(pocketId, { amount, pin }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savings-pockets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setDepositDialogOpen(false);
      toast.success(`Deposit of ${formatCurrency(variables.originalAmount, selectedCurrency)} successful!`);
      setDepositAmount('');
      setDepositPin('');
    },
    onError: (error: any) => {
      toast.error(`Deposit failed: ${error.response?.data?.error || error.message}`);
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: ({ pocketId, amount, pin, emergencyData, originalAmount }: any) => 
      savingsAPI.withdrawFromPocket(pocketId, { amount, pin, emergencyData }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savings-pockets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setVerificationDialogOpen(false);
      setWithdrawalAmountDialogOpen(false);
      setEmergencyDialogOpen(false);
      toast.success(`Withdrawal of ${formatCurrency(variables.originalAmount, selectedCurrency)} successful!`);
      setWithdrawalAmount('');
      setEmergencyData(null);
    },
    onError: (error: any) => {
      toast.error(`Withdrawal failed: ${error.response?.data?.error || error.message}`);
    },
  });

  // Consolidated settings mutation (combines goal and auto-save)
  const consolidatedSettingsMutation = useMutation({
    mutationFn: ({ pocketId, settings }: any) => 
      savingsAPI.updateAutoSave(pocketId, {
        goal_amount: settings.goal_amount,
        enabled: settings.auto_save_config.enabled,
        percentage: settings.auto_save_config.percentage,
        frequency: settings.auto_save_config.frequency,
        next_date: settings.auto_save_config.next_date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-pockets'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.response?.data?.error || error.message}`);
    },
  });

  // Handle emergency access initiation
  const handleEmergencyAccess = (pocket: any) => {
    setSelectedPocket(pocket);
    setEmergencyDialogOpen(true);
  };

  // Handle emergency proceed
  const handleEmergencyProceed = (data: { category: string; reason: string }) => {
    setEmergencyData(data);
    setEmergencyDialogOpen(false);
    // Show withdrawal amount dialog first
    setWithdrawalAmountDialogOpen(true);
  };

  // Handle withdrawal amount submission
  const handleWithdrawalAmountSubmit = () => {
    if (withdrawalAmount && parseFloat(withdrawalAmount) > 0) {
      setWithdrawalAmountDialogOpen(false);
      setVerificationDialogOpen(true);
    }
  };

  // Handle security verification complete
  const handleVerificationComplete = (verificationData: any) => {
    if (!selectedPocket || !withdrawalAmount) {
      toast.error('Missing pocket or withdrawal amount');
      return;
    }

    const originalAmount = Number(withdrawalAmount);
    const amountInUSD = convertToUSD(originalAmount, selectedCurrency);
    
    withdrawalMutation.mutate({
      pocketId: selectedPocket.id,
      amount: amountInUSD,
      originalAmount: originalAmount,
      pin: verificationData.pin,
      emergencyData: emergencyData || undefined,
    });
  };

  // Handle deposit
  const handleDeposit = (pocket: any) => {
    setSelectedPocket(pocket);
    setDepositDialogOpen(true);
  };

  // Handle consolidated settings save
  const handleConsolidatedSettings = (settings: any) => {
    if (activePocket) {
      consolidatedSettingsMutation.mutate({
        pocketId: activePocket.id,
        settings,
      });
    }
  };

  const activePocket = pocketsData?.[0]; // For demo, using first pocket

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            DarkDays Pocket
          </h1>
          <p className="text-muted-foreground mt-2">
            Secure emergency fund with multi-layer protection
          </p>
        </div>
      </div>

      {/* Main Content */}
      {activePocket ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* DarkDays Card */}
              <DarkDaysCard
                pocket={activePocket}
                onDeposit={() => handleDeposit(activePocket)}
                onEmergencyAccess={() => handleEmergencyAccess(activePocket)}
              />

              {/* Savings Report Widget */}
              <SavingsReportWidget
                pocketId={activePocket.id}
                totalSaved={activePocket.balance}
                monthsSaving={6}
                currentStreak={42}
              />
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                <h3 className="font-semibold text-violet-900 mb-2">🔒 Multi-Layer Security</h3>
                <p className="text-sm text-violet-700">
                  PIN + Password + Emergency confirmation required for withdrawals
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">⚡ Auto-Save Active</h3>
                <p className="text-sm text-green-700">
                  {activePocket.auto_save_percentage}% of income automatically saved
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2">🏆 Emergency Fund Goal</h3>
                <p className="text-sm text-amber-700">
                  Build 3-6 months of expenses for financial security
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            {/* Consolidated Settings Panel */}
            <ConsolidatedSettingsPanel
              currentBalance={activePocket.balance}
              goalAmount={activePocket.goal_amount}
              currentConfig={{
                enabled: activePocket.auto_save_enabled,
                percentage: activePocket.auto_save_percentage,
                frequency: activePocket.auto_save_frequency || 'monthly',
                next_date: activePocket.auto_save_next_date,
              }}
              onSave={handleConsolidatedSettings}
            />
          </TabsContent>

          <TabsContent value="reports">
            <SavingsReportWidget
              pocketId={activePocket.id}
              totalSaved={activePocket.balance}
              monthsSaving={6}
              currentStreak={42}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">🏦</div>
            <h2 className="text-2xl font-bold text-gray-900">No DarkDays Pocket Yet</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              No DarkDays Pocket has been set up for your account.
            </p>
          </div>
        </div>
      )}

      {/* Create Pocket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create DarkDays Pocket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pocket-name">Pocket Name</Label>
              <Input
                id="pocket-name"
                value={pocketName}
                onChange={(e) => setPocketName(e.target.value)}
                placeholder="DarkDays Pocket"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-save">Auto-Save Percentage (%)</Label>
              <Input
                id="auto-save"
                type="number"
                min="5"
                max="50"
                value={autoSavePercentage}
                onChange={(e) => setAutoSavePercentage(e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                createPocketMutation.mutate({
                  name: pocketName,
                  auto_save_percentage: Number(autoSavePercentage),
                })
              }
              disabled={createPocketMutation.isPending}
              className="w-full bg-gradient-to-r from-gray-900 to-gray-700"
            >
              {createPocketMutation.isPending ? 'Creating...' : 'Create Pocket'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deposit to DarkDays Pocket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount ({getCurrencySymbol(selectedCurrency)})</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit-pin">Security PIN</Label>
              <Input
                id="deposit-pin"
                type="password"
                maxLength={6}
                value={depositPin}
                onChange={(e) => setDepositPin(e.target.value)}
                placeholder="••••"
              />
            </div>
            <Button
              onClick={() => {
                if (selectedPocket && depositAmount) {
                  const originalAmount = Number(depositAmount);
                  const amountInUSD = convertToUSD(originalAmount, selectedCurrency);
                  depositMutation.mutate({
                    pocketId: selectedPocket.id,
                    amount: amountInUSD,
                    originalAmount: originalAmount,
                    pin: depositPin,
                  });
                }
              }}
              disabled={depositMutation.isPending || !depositAmount || !depositPin}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {depositMutation.isPending ? 'Processing...' : 'Confirm Deposit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Amount Dialog */}
      <Dialog open={withdrawalAmountDialogOpen} onOpenChange={setWithdrawalAmountDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Withdrawal Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Amount ({getCurrencySymbol(selectedCurrency)})</Label>
              <Input
                id="withdrawal-amount"
                type="number"
                min="0.01"
                max={selectedPocket?.balance || 0}
                step="0.01"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Available balance: {formatCurrency(selectedPocket?.balance || 0, selectedCurrency)}
              </p>
            </div>
            <Button
              onClick={handleWithdrawalAmountSubmit}
              disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > (selectedPocket?.balance || 0)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700"
            >
              Continue to Verification
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Unlock Dialog */}
      <EmergencyUnlockDialog
        open={emergencyDialogOpen}
        onClose={() => setEmergencyDialogOpen(false)}
        onProceed={handleEmergencyProceed}
        pocketBalance={selectedPocket?.balance || 0}
      />

      {/* Security Verification Modal */}
      <SecurityVerificationModal
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        onVerified={handleVerificationComplete}
        amount={parseFloat(withdrawalAmount) || 0}
      />
    </motion.div>
  );
}
