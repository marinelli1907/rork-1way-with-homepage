import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { PaymentMethod, PaymentTransaction } from '@/types';
import { safeGetItem, safeSetItem } from '@/utils/storage-helpers';

const STORAGE_KEY_PAYMENT_METHODS = '@payment_methods';
const STORAGE_KEY_TRANSACTIONS = '@payment_transactions';

export const [PaymentProvider, usePayment] = createContextHook(() => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      console.log('[PaymentProvider] hydrating payment data...');
      if (mounted) setIsLoading(true);

      try {
        const [methodsData, transactionsData] = await Promise.all([
          safeGetItem<PaymentMethod[]>(STORAGE_KEY_PAYMENT_METHODS),
          safeGetItem<PaymentTransaction[]>(STORAGE_KEY_TRANSACTIONS),
        ]);

        if (!mounted) return;

        if (methodsData && Array.isArray(methodsData)) {
          console.log('[PaymentProvider] loaded paymentMethods:', methodsData.length);
          setPaymentMethods(methodsData);
        } else {
          console.log('[PaymentProvider] no stored paymentMethods');
          setPaymentMethods([]);
        }

        if (transactionsData && Array.isArray(transactionsData)) {
          console.log('[PaymentProvider] loaded transactions:', transactionsData.length);
          setTransactions(transactionsData);
        } else {
          console.log('[PaymentProvider] no stored transactions');
          setTransactions([]);
        }
      } catch (error) {
        console.error('[PaymentProvider] Failed to load payment data:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const savePaymentMethods = async (newMethods: PaymentMethod[]) => {
    try {
      console.log('[PaymentProvider] saving paymentMethods:', newMethods.length);
      const ok = await safeSetItem(STORAGE_KEY_PAYMENT_METHODS, newMethods);
      if (!ok) {
        console.error('[PaymentProvider] safeSetItem returned false while saving payment methods');
        return;
      }
      setPaymentMethods(newMethods);
    } catch (error) {
      console.error('[PaymentProvider] Failed to save payment methods:', error);
    }
  };

  const saveTransactions = async (newTransactions: PaymentTransaction[]) => {
    try {
      console.log('[PaymentProvider] saving transactions:', newTransactions.length);
      const ok = await safeSetItem(STORAGE_KEY_TRANSACTIONS, newTransactions);
      if (!ok) {
        console.error('[PaymentProvider] safeSetItem returned false while saving transactions');
        return;
      }
      setTransactions(newTransactions);
    } catch (error) {
      console.error('[PaymentProvider] Failed to save transactions:', error);
    }
  };

  const addPaymentMethod = useCallback(async (methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'userId'>) => {
    const newMethod: PaymentMethod = {
      ...methodData,
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user_1',
      createdAt: new Date().toISOString(),
    };

    let updatedMethods = [...paymentMethods, newMethod];

    if (newMethod.isDefault) {
      updatedMethods = updatedMethods.map(m => ({
        ...m,
        isDefault: m.id === newMethod.id,
      }));
    }

    console.log('[PaymentProvider] addPaymentMethod -> before:', paymentMethods.length, 'after:', updatedMethods.length);
    await savePaymentMethods(updatedMethods);
    console.log('[PaymentProvider] addPaymentMethod -> persisted (requested).');
    return newMethod;
  }, [paymentMethods]);

  const removePaymentMethod = useCallback(async (methodId: string) => {
    const updatedMethods = paymentMethods.filter(m => m.id !== methodId);
    await savePaymentMethods(updatedMethods);
  }, [paymentMethods]);

  const setDefaultPaymentMethod = useCallback(async (methodId: string) => {
    const updatedMethods = paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === methodId,
    }));
    await savePaymentMethods(updatedMethods);
  }, [paymentMethods]);

  const getDefaultPaymentMethod = useCallback((): PaymentMethod | null => {
    return paymentMethods.find(m => m.isDefault) || paymentMethods[0] || null;
  }, [paymentMethods]);

  const createPendingTransaction = useCallback(async (rideId: string, amount: number, paymentMethodId: string) => {
    const newTransaction: PaymentTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user_1',
      rideId,
      amount,
      paymentMethodId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [...transactions, newTransaction];
    await saveTransactions(updatedTransactions);
    return newTransaction;
  }, [transactions]);

  const processPayment = useCallback(async (transactionId: string): Promise<boolean> => {
    console.log(`Processing payment for transaction: ${transactionId}`);
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        const updatedTransactions = transactions.map(t => {
          if (t.id === transactionId) {
            const success = Math.random() > 0.1;
            return {
              ...t,
              status: success ? 'completed' as const : 'failed' as const,
              completedAt: new Date().toISOString(),
              errorMessage: success ? undefined : 'Payment processing failed',
            };
          }
          return t;
        });

        await saveTransactions(updatedTransactions);
        
        const transaction = updatedTransactions.find(t => t.id === transactionId);
        resolve(transaction?.status === 'completed');
      }, 1500);
    });
  }, [transactions]);

  const getTransactionForRide = useCallback((rideId: string): PaymentTransaction | null => {
    return transactions.find(t => t.rideId === rideId) || null;
  }, [transactions]);

  const hasPaymentMethods = useCallback((): boolean => {
    const result = paymentMethods.length > 0;
    console.log('[PaymentProvider] hasPaymentMethods ->', result, '(count=', paymentMethods.length, ')');
    return result;
  }, [paymentMethods]);

  return useMemo(() => ({
    paymentMethods,
    transactions,
    isLoading,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    getDefaultPaymentMethod,
    createPendingTransaction,
    processPayment,
    getTransactionForRide,
    hasPaymentMethods,
  }), [
    paymentMethods,
    transactions,
    isLoading,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    getDefaultPaymentMethod,
    createPendingTransaction,
    processPayment,
    getTransactionForRide,
    hasPaymentMethods,
  ]);
});
