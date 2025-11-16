import { createAction, props } from '@ngrx/store';
import {
  CustodyAccount,
  Transaction,
  Withdrawal,
  Deposit,
  PaginatedResponse,
  TransactionUpdate
} from '../../types';

// Load Custody Accounts
export const loadCustodyAccounts = createAction('[Custody] Load Accounts');

export const loadCustodyAccountsSuccess = createAction(
  '[Custody] Load Accounts Success',
  props<{ accounts: CustodyAccount[] }>()
);

export const loadCustodyAccountsFailure = createAction(
  '[Custody] Load Accounts Failure',
  props<{ error: string }>()
);

// Load Transactions
export const loadTransactions = createAction(
  '[Custody] Load Transactions',
  props<{ page: number; pageSize: number }>()
);

export const loadTransactionsSuccess = createAction(
  '[Custody] Load Transactions Success',
  props<{ response: PaginatedResponse<Transaction> }>()
);

export const loadTransactionsFailure = createAction(
  '[Custody] Load Transactions Failure',
  props<{ error: string }>()
);

// Load Withdrawals
export const loadWithdrawals = createAction(
  '[Custody] Load Withdrawals',
  props<{ page: number; pageSize: number }>()
);

export const loadWithdrawalsSuccess = createAction(
  '[Custody] Load Withdrawals Success',
  props<{ response: PaginatedResponse<Withdrawal> }>()
);

export const loadWithdrawalsFailure = createAction(
  '[Custody] Load Withdrawals Failure',
  props<{ error: string }>()
);

// Load Deposits
export const loadDeposits = createAction(
  '[Custody] Load Deposits',
  props<{ page: number; pageSize: number }>()
);

export const loadDepositsSuccess = createAction(
  '[Custody] Load Deposits Success',
  props<{ response: PaginatedResponse<Deposit> }>()
);

export const loadDepositsFailure = createAction(
  '[Custody] Load Deposits Failure',
  props<{ error: string }>()
);

// Create Withdrawal
export const createWithdrawal = createAction(
  '[Custody] Create Withdrawal',
  props<{ withdrawal: { assetId: string; amount: string; toAddress: string; network: string } }>()
);

export const createWithdrawalSuccess = createAction(
  '[Custody] Create Withdrawal Success',
  props<{ withdrawal: Withdrawal }>()
);

export const createWithdrawalFailure = createAction(
  '[Custody] Create Withdrawal Failure',
  props<{ error: string }>()
);

// Approve Withdrawal
export const approveWithdrawal = createAction(
  '[Custody] Approve Withdrawal',
  props<{ withdrawalId: string; signature?: string }>()
);

export const approveWithdrawalSuccess = createAction(
  '[Custody] Approve Withdrawal Success',
  props<{ withdrawal: Withdrawal }>()
);

export const approveWithdrawalFailure = createAction(
  '[Custody] Approve Withdrawal Failure',
  props<{ error: string }>()
);

// Update Transaction Status (from WebSocket)
export const updateTransactionStatus = createAction(
  '[Custody] Update Transaction Status',
  props<{ update: TransactionUpdate }>()
);

// Select Transaction
export const selectTransaction = createAction(
  '[Custody] Select Transaction',
  props<{ transactionId: string | null }>()
);
