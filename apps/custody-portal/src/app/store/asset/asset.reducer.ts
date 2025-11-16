import { createReducer, on } from '@ngrx/store';
import { Asset, AssetDetail } from '../../types';
import * as AssetActions from './asset.actions';

export interface AssetState {
  assets: Asset[];
  selectedAssetId: string | null;
  selectedAssetDetail: AssetDetail | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AssetState = {
  assets: [],
  selectedAssetId: null,
  selectedAssetDetail: null,
  loading: false,
  error: null
};

export const assetReducer = createReducer(
  initialState,

  // Load Assets
  on(AssetActions.loadAssets, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AssetActions.loadAssetsSuccess, (state, { assets }) => ({
    ...state,
    assets,
    loading: false,
    error: null
  })),

  on(AssetActions.loadAssetsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Asset Detail
  on(AssetActions.loadAssetDetail, (state, { assetId }) => ({
    ...state,
    selectedAssetId: assetId,
    loading: true,
    error: null
  })),

  on(AssetActions.loadAssetDetailSuccess, (state, { asset }) => ({
    ...state,
    selectedAssetDetail: asset,
    loading: false,
    error: null
  })),

  on(AssetActions.loadAssetDetailFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Balance
  on(AssetActions.updateAssetBalance, (state, { update }) => {
    const updatedAssets = state.assets.map(asset =>
      asset.id === update.assetId
        ? {
            ...asset,
            balance: update.balance,
            availableBalance: update.availableBalance,
            lockedBalance: update.lockedBalance,
            lastUpdated: new Date()
          }
        : asset
    );

    const updatedDetail = state.selectedAssetDetail?.id === update.assetId
      ? {
          ...state.selectedAssetDetail,
          balance: update.balance,
          availableBalance: update.availableBalance,
          lockedBalance: update.lockedBalance,
          lastUpdated: new Date()
        }
      : state.selectedAssetDetail;

    return {
      ...state,
      assets: updatedAssets,
      selectedAssetDetail: updatedDetail
    };
  }),

  // Select Asset
  on(AssetActions.selectAsset, (state, { assetId }) => ({
    ...state,
    selectedAssetId: assetId
  })),

  // Clear Asset Detail
  on(AssetActions.clearAssetDetail, (state) => ({
    ...state,
    selectedAssetDetail: null,
    selectedAssetId: null
  })),

  // Refresh Assets
  on(AssetActions.refreshAssets, (state) => ({
    ...state,
    loading: true
  }))
);
