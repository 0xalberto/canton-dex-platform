import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CustodyState } from './custody.reducer';

export const selectCustodyState = createFeatureSelector<CustodyState>('custody');

// Accounts
export const selectAllCustodyAccounts = createSelector(
  selectCustodyState,
  (state) => state.accounts
);

export const selectAccountsLoading = createSelector(
  selectCustodyState,
  (state) => state.loading.accounts
);

// Transactions
export const selectAllTransactions = createSelector(
  selectCustodyState,
  (state) => state.transactions
);

export const selectTransactionsLoading = createSelector(
  selectCustodyState,
  (state) => state.loading.transactions
);

export const selectTransactionsPagination = createSelector(
  selectCustodyState,
  (state) => state.pagination.transactions
);

// Withdrawals
export const selectAllWithdrawals = createSelector(
  selectCustodyState,
  (state) => state.withdrawals
);

export const selectWithdrawalsLoading = createSelector(
  selectCustodyState,
  (state) => state.loading.withdrawals
);

export const selectWithdrawalsPagination = createSelector(
  selectCustodyState,
  (state) => state.pagination.withdrawals
);

export const selectPendingWithdrawals = createSelector(
  selectAllWithdrawals,
  (withdrawals) => withdrawals.filter(w => w.status === 'pending')
);

export const selectPendingWithdrawalsCount = createSelector(
  selectPendingWithdrawals,
  (withdrawals) => withdrawals.length
);

// Deposits
export const selectAllDeposits = createSelector(
  selectCustodyState,
  (state) => state.deposits
);

export const selectDepositsLoading = createSelector(
  selectCustodyState,
  (state) => state.loading.deposits
);

export const selectDepositsPagination = createSelector(
  selectCustodyState,
  (state) => state.pagination.deposits
);

export const selectUnreconciledDeposits = createSelector(
  selectAllDeposits,
  (deposits) => deposits.filter(d => !d.reconciled)
);

// Selected Transaction
export const selectSelectedTransactionId = createSelector(
  selectCustodyState,
  (state) => state.selectedTransactionId
);

export const selectSelectedTransaction = createSelector(
  selectCustodyState,
  selectSelectedTransactionId,
  (state, selectedId) => {
    if (!selectedId) return null;
    return state.transactions.find(tx => tx.id === selectedId) ||
           state.withdrawals.find(w => w.id === selectedId) ||
           state.deposits.find(d => d.id === selectedId) ||
           null;
  }
);

// Error
export const selectCustodyError = createSelector(
  selectCustodyState,
  (state) => state.error
);

// Statistics
export const selectActiveTransactionsCount = createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(tx =>
    tx.status === 'pending' || tx.status === 'confirming'
  ).length
);
