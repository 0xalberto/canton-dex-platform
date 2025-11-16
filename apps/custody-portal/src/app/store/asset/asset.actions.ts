import { createAction, props } from '@ngrx/store';
import { Asset, AssetDetail, BalanceUpdate } from '../../types';

// Load Assets
export const loadAssets = createAction('[Asset] Load Assets');

export const loadAssetsSuccess = createAction(
  '[Asset] Load Assets Success',
  props<{ assets: Asset[] }>()
);

export const loadAssetsFailure = createAction(
  '[Asset] Load Assets Failure',
  props<{ error: string }>()
);

// Load Asset Detail
export const loadAssetDetail = createAction(
  '[Asset] Load Asset Detail',
  props<{ assetId: string }>()
);

export const loadAssetDetailSuccess = createAction(
  '[Asset] Load Asset Detail Success',
  props<{ asset: AssetDetail }>()
);

export const loadAssetDetailFailure = createAction(
  '[Asset] Load Asset Detail Failure',
  props<{ error: string }>()
);

// Update Balance (from WebSocket)
export const updateAssetBalance = createAction(
  '[Asset] Update Balance',
  props<{ update: BalanceUpdate }>()
);

// Select Asset
export const selectAsset = createAction(
  '[Asset] Select Asset',
  props<{ assetId: string | null }>()
);

// Clear Asset Detail
export const clearAssetDetail = createAction('[Asset] Clear Asset Detail');

// Refresh Assets
export const refreshAssets = createAction('[Asset] Refresh Assets');
