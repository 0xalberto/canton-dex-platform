import { AssetState } from './asset/asset.reducer';
import { CustodyState } from './custody/custody.reducer';

export interface AppState {
  assets: AssetState;
  custody: CustodyState;
}
