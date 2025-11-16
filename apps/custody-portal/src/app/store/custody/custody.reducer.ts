import { createReducer, on } from '@ngrx/store';
import { CustodyAccount, Transaction, Withdrawal, Deposit } from '../../types';
import * as CustodyActions from './custody.actions';

export interface CustodyState {
  accounts: CustodyAccount[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  deposits: Deposit[];
  selectedTransactionId: string | null;
  pagination: {
    transactions: { page: number; pageSize: number; total: number };
    withdrawals: { page: number; pageSize: number; total: number };
    deposits: { page: number; pageSize: number; total: number };
  };
  loading: {
    accounts: boolean;
    transactions: boolean;
    withdrawals: boolean;
    deposits: boolean;
  };
  error: string | null;
}

export const initialState: CustodyState = {
  accounts: [],
  transactions: [],
  withdrawals: [],
  deposits: [],
  selectedTransactionId: null,
  pagination: {
    transactions: { page: 1, pageSize: 20, total: 0 },
    withdrawals: { page: 1, pageSize: 20, total: 0 },
    deposits: { page: 1, pageSize: 20, total: 0 }
  },
  loading: {
    accounts: false,
    transactions: false,
    withdrawals: false,
    deposits: false
  },
  error: null
};

export const custodyReducer = createReducer(
  initialState,

  // Load Custody Accounts
  on(CustodyActions.loadCustodyAccounts, (state) => ({
    ...state,
    loading: { ...state.loading, accounts: true },
    error: null
  })),

  on(CustodyActions.loadCustodyAccountsSuccess, (state, { accounts }) => ({
    ...state,
    accounts,
    loading: { ...state.loading, accounts: false },
    error: null
  })),

  on(CustodyActions.loadCustodyAccountsFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, accounts: false },
    error
  })),

  // Load Transactions
  on(CustodyActions.loadTransactions, (state, { page, pageSize }) => ({
    ...state,
    loading: { ...state.loading, transactions: true },
    pagination: {
      ...state.pagination,
      transactions: { ...state.pagination.transactions, page, pageSize }
    },
    error: null
  })),

  on(CustodyActions.loadTransactionsSuccess, (state, { response }) => ({
    ...state,
    transactions: response.items,
    pagination: {
      ...state.pagination,
      transactions: {
        page: response.page,
        pageSize: response.pageSize,
        total: response.total
      }
    },
    loading: { ...state.loading, transactions: false },
    error: null
  })),

  on(CustodyActions.loadTransactionsFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, transactions: false },
    error
  })),

  // Load Withdrawals
  on(CustodyActions.loadWithdrawals, (state, { page, pageSize }) => ({
    ...state,
    loading: { ...state.loading, withdrawals: true },
    pagination: {
      ...state.pagination,
      withdrawals: { ...state.pagination.withdrawals, page, pageSize }
    },
    error: null
  })),

  on(CustodyActions.loadWithdrawalsSuccess, (state, { response }) => ({
    ...state,
    withdrawals: response.items,
    pagination: {
      ...state.pagination,
      withdrawals: {
        page: response.page,
        pageSize: response.pageSize,
        total: response.total
      }
    },
    loading: { ...state.loading, withdrawals: false },
    error: null
  })),

  on(CustodyActions.loadWithdrawalsFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, withdrawals: false },
    error
  })),

  // Load Deposits
  on(CustodyActions.loadDeposits, (state, { page, pageSize }) => ({
    ...state,
    loading: { ...state.loading, deposits: true },
    pagination: {
      ...state.pagination,
      deposits: { ...state.pagination.deposits, page, pageSize }
    },
    error: null
  })),

  on(CustodyActions.loadDepositsSuccess, (state, { response }) => ({
    ...state,
    deposits: response.items,
    pagination: {
      ...state.pagination,
      deposits: {
        page: response.page,
        pageSize: response.pageSize,
        total: response.total
      }
    },
    loading: { ...state.loading, deposits: false },
    error: null
  })),

  on(CustodyActions.loadDepositsFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, deposits: false },
    error
  })),

  // Create Withdrawal
  on(CustodyActions.createWithdrawal, (state) => ({
    ...state,
    loading: { ...state.loading, withdrawals: true },
    error: null
  })),

  on(CustodyActions.createWithdrawalSuccess, (state, { withdrawal }) => ({
    ...state,
    withdrawals: [withdrawal, ...state.withdrawals],
    loading: { ...state.loading, withdrawals: false },
    error: null
  })),

  on(CustodyActions.createWithdrawalFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, withdrawals: false },
    error
  })),

  // Approve Withdrawal
  on(CustodyActions.approveWithdrawal, (state) => ({
    ...state,
    loading: { ...state.loading, withdrawals: true },
    error: null
  })),

  on(CustodyActions.approveWithdrawalSuccess, (state, { withdrawal }) => ({
    ...state,
    withdrawals: state.withdrawals.map(w =>
      w.id === withdrawal.id ? withdrawal : w
    ),
    loading: { ...state.loading, withdrawals: false },
    error: null
  })),

  on(CustodyActions.approveWithdrawalFailure, (state, { error }) => ({
    ...state,
    loading: { ...state.loading, withdrawals: false },
    error
  })),

  // Update Transaction Status
  on(CustodyActions.updateTransactionStatus, (state, { update }) => {
    const updatedTransactions = state.transactions.map(tx =>
      tx.id === update.transactionId
        ? {
            ...tx,
            status: update.status,
            confirmations: update.confirmations,
            ...(update.txHash && { txHash: update.txHash })
          }
        : tx
    );

    const updatedWithdrawals = state.withdrawals.map(w =>
      w.id === update.transactionId
        ? {
            ...w,
            status: update.status,
            confirmations: update.confirmations,
            ...(update.txHash && { txHash: update.txHash })
          }
        : w
    );

    const updatedDeposits = state.deposits.map(d =>
      d.id === update.transactionId
        ? {
            ...d,
            status: update.status,
            confirmations: update.confirmations,
            ...(update.txHash && { txHash: update.txHash })
          }
        : d
    );

    return {
      ...state,
      transactions: updatedTransactions,
      withdrawals: updatedWithdrawals,
      deposits: updatedDeposits
    };
  }),

  // Select Transaction
  on(CustodyActions.selectTransaction, (state, { transactionId }) => ({
    ...state,
    selectedTransactionId: transactionId
  }))
);
