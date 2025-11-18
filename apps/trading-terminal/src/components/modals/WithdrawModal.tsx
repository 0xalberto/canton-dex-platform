import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePortfolioStore } from '../../store/portfolioStore';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { withdraw, assets: portfolioAssets } = usePortfolioStore();
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const assets = ['USDT', 'BTC', 'ETH', 'SOL', 'tTBILL'];
  
  // Get real balances from portfolio
  const getBalance = (symbol: string) => {
    return portfolioAssets[symbol]?.balance || '0';
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const withdrawAmount = parseFloat(amount);
      const currentBalance = parseFloat(getBalance(asset).replace(',', ''));
      
      if (withdrawAmount > currentBalance) {
        alert('Insufficient balance!');
        setLoading(false);
        return;
      }

      // Simulate withdraw transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actually update portfolio balance
      withdraw(asset, withdrawAmount);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Withdraw failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAsset('USDT');
    setAmount('');
    setAddress('');
    setSuccess(false);
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
            <h2 className="text-2xl font-bold gradient-text mb-2">Withdrawal Submitted!</h2>
            <p className="text-gray-400">{amount} {asset} withdrawal initiated</p>
            <p className="text-sm text-gray-500 mt-2">Processing time: ~5-10 minutes</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">Withdraw Funds</h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* User Info */}
            <div className="glass rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Withdraw From</p>
              <p className="font-semibold">{user?.displayName || 'Unknown'}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">{user?.partyId}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleWithdraw} className="space-y-6">
              {/* Asset Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Select Asset
                </label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="input-modern"
                  required
                >
                  {assets.map((a) => (
                    <option key={a} value={a}>
                      {a} (Available: {getBalance(a)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Address */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Destination Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-modern font-mono text-sm"
                  placeholder={`${asset} address`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Double-check the address before withdrawing
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Amount
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(getBalance(asset).replace(',', ''))}
                    className="text-primary-light text-xs hover:text-primary transition-colors"
                  >
                    Max: {getBalance(asset)} {asset}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-modern"
                  placeholder="0.00"
                  required
                  min="0"
                  max={getBalance(asset).replace(',', '')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Network fee: ~0.1 {asset}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['25%', '50%', '75%', '100%'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const percent = parseInt(val) / 100;
                      const max = parseFloat(getBalance(asset).replace(',', ''));
                      setAmount((max * percent).toString());
                    }}
                    className="btn bg-primary/10 hover:bg-primary/20 text-primary-light text-sm py-2"
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Warning Box */}
              <div className="glass rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-500 text-xl">⚠️</div>
                  <div className="text-xs text-gray-400">
                    <p className="font-semibold text-yellow-500 mb-1">Important</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Withdrawals are irreversible</li>
                      <li>Verify the destination address</li>
                      <li>Network fees apply</li>
                      <li>Processing time: 5-10 minutes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn bg-red-500/20 hover:bg-red-500/30 text-red-400 w-full"
                disabled={loading || !amount || !address || parseFloat(amount) <= 0}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Withdraw ${amount || '0'} ${asset}`
                )}
              </button>
            </form>

            {/* Disclaimer */}
            <div className="mt-4 p-3 glass rounded-lg">
              <p className="text-xs text-gray-500">
                <strong className="text-primary-light">Note:</strong> This is a hackathon prototype. 
                In production, this would integrate with Canton custody contracts and multi-sig approvals.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
