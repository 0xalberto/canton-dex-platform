import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AssetState } from './asset.reducer';

export const selectAssetState = createFeatureSelector<AssetState>('assets');

export const selectAllAssets = createSelector(
  selectAssetState,
  (state) => state.assets
);

export const selectAssetsLoading = createSelector(
  selectAssetState,
  (state) => state.loading
);

export const selectAssetsError = createSelector(
  selectAssetState,
  (state) => state.error
);

export const selectSelectedAssetId = createSelector(
  selectAssetState,
  (state) => state.selectedAssetId
);

export const selectSelectedAssetDetail = createSelector(
  selectAssetState,
  (state) => state.selectedAssetDetail
);

export const selectAssetById = (assetId: string) => createSelector(
  selectAllAssets,
  (assets) => assets.find(asset => asset.id === assetId)
);

export const selectTotalAssetsValue = createSelector(
  selectAllAssets,
  (assets) => assets.reduce((total, asset) => total + asset.usdValue, 0)
);

export const selectAssetsBySymbol = createSelector(
  selectAllAssets,
  (assets) => {
    const assetMap = new Map();
    assets.forEach(asset => assetMap.set(asset.symbol, asset));
    return assetMap;
  }
);
