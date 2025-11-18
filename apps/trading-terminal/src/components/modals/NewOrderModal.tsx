import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tradingAPI, Balance } from '../../services/api';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPair?: string;
}

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT';

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultPair = 'BTC/USDT'
}) => {
  const { user } = useAuth();
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [pair, setPair] = useState(defaultPair);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, Balance>>({});

  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'tTBILL/USDT'];

  // Load account and balances
  useEffect(() => {
    const initAccount = async () => {
      if (!user?.partyId) return;
      
      try {
        let account;
        try {
          account = await tradingAPI.getAccount(user.partyId);
        } catch {
          account = await tradingAPI.createAccount(
            user.partyId,
            user.displayName,
            user.email
          );
        }
        
        setAccountId(account.account_id);
        
        // Load balances
        const balancesList = await tradingAPI.getBalances(user.partyId);
        const balancesMap: Record<string, Balance> = {};
        balancesList.forEach(b => {
          balancesMap[b.asset_symbol] = b;
        });
        setBalances(balancesMap);
      } catch (error) {
        console.error('Failed to load account:', error);
      }
    };

    if (isOpen && user) {
      initAccount();
    }
  }, [isOpen, user]);

  // Get available balance for the asset we're trading
  const getAvailableBalance = () => {
    const [base, quote] = pair.split('/');
    const asset = side === 'BUY' ? quote : base;
    return balances[asset]?.available || '0';
  };

  // Calculate total
  const calculateTotal = () => {
    if (!quantity || !price) return '0';
    return (parseFloat(quantity) * parseFloat(price)).toFixed(2);
  };

  // Check if user has sufficient balance
  const checkBalance = (): boolean => {
    const [base, quote] = pair.split('/');
    const total = calculateTotal();
    
    if (side === 'BUY') {
      // Buying: Need enough quote currency (USDT)
      const available = parseFloat(balances[quote]?.available || '0');
      return available >= parseFloat(total);
    } else {
      // Selling: Need enough base currency (BTC)
      const available = parseFloat(balances[base]?.available || '0');
      return available >= parseFloat(quantity || '0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountId) {
      setError('Account not ready. Please try again.');
      return;
    }

    // Validate balance
    if (!checkBalance()) {
      const [base, quote] = pair.split('/');
      const asset = side === 'BUY' ? quote : base;
      setError(`Insufficient ${asset} balance!`);
      return;
    }

    // Validate inputs
    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);

    try {
      const result = await tradingAPI.createOrder(
        accountId,
        pair,
        side,
        orderType,
        parseFloat(quantity),
        orderType === 'LIMIT' ? parseFloat(price) : undefined
      );

      console.log('Order created:', result);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error('Order creation failed:', error);
      setError(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSide('BUY');
    setOrderType('LIMIT');
    setQuantity('');
    setPrice('');
    setSuccess(false);
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative glass-card w-full max-w-md">
        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold gradient-text mb-2">Order Placed!</h2>
            <p className="text-gray-400">
              {side} {quantity} {pair.split('/')[0]} @ {orderType === 'LIMIT' ? price : 'Market'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your order is now in the matching engine
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">New Order</h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Side Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`btn py-3 ${side === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'glass text-gray-400'}`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`btn py-3 ${side === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'glass text-gray-400'}`}
              >
                Sell
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pair Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Trading Pair
                </label>
                <select
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="input-modern"
                >
                  {pairs.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('LIMIT')}
                    className={`btn py-2 ${orderType === 'LIMIT' ? 'bg-primary/20 text-primary-light' : 'glass text-gray-400'}`}
                  >
                    Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`btn py-2 ${orderType === 'MARKET' ? 'bg-primary/20 text-primary-light' : 'glass text-gray-400'}`}
                  >
                    Market
                  </button>
                </div>
              </div>

              {/* Price (only for LIMIT) */}
              {orderType === 'LIMIT' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Price ({pair.split('/')[1]})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="input-modern"
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Quantity ({pair.split('/')[0]})
                  </label>
                  <span className="text-xs text-gray-500">
                    Available: {getAvailableBalance()} {side === 'BUY' ? pair.split('/')[1] : pair.split('/')[0]}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input-modern"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Quick Quantity Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['25%', '50%', '75%', '100%'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const percent = parseInt(val) / 100;
                      const available = parseFloat(getAvailableBalance());
                      const [base, quote] = pair.split('/');
                      
                      if (side === 'BUY' && price) {
                        // Calculate how much base asset we can buy
                        const qty = (available * percent) / parseFloat(price);
                        setQuantity(qty.toFixed(6));
                      } else if (side === 'SELL') {
                        // Use available base asset
                        setQuantity((available * percent).toFixed(6));
                      }
                    }}
                    className="btn bg-primary/10 hover:bg-primary/20 text-primary-light text-sm py-2"
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Total */}
              {orderType === 'LIMIT' && quantity && price && (
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white font-semibold">
                      {calculateTotal()} {pair.split('/')[1]}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`btn w-full py-3 ${
                  side === 'BUY' 
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                }`}
                disabled={loading || !quantity || (orderType === 'LIMIT' && !price)}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Placing Order...
                  </div>
                ) : (
                  `${side} ${quantity || '0'} ${pair.split('/')[0]}`
                )}
              </button>
            </form>

            {/* Info */}
            <div className="mt-4 p-3 glass rounded-lg">
              <p className="text-xs text-gray-500">
                <strong className="text-primary-light">Real Matching:</strong> Your order will be matched by the Price-Time Priority engine running every 500ms.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
