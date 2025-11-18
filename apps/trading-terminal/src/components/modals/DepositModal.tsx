import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tradingAPI } from '../../services/api';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  const assets = ['USDT', 'BTC', 'ETH', 'SOL', 'tTBILL'];

  // Get or create trading account on mount
  useEffect(() => {
    const initAccount = async () => {
      if (!user?.partyId) return;
      
      try {
        // Try to get existing account
        const account = await tradingAPI.getAccount(user.partyId);
        setAccountId(account.account_id);
      } catch (error) {
        // Account doesn't exist, create it
        try {
          const newAccount = await tradingAPI.createAccount(
            user.partyId,
            user.displayName,
            user.email
          );
          setAccountId(newAccount.account_id);
        } catch (createError) {
          console.error('Failed to create account:', createError);
        }
      }
    };

    if (isOpen && user) {
      initAccount();
    }
  }, [isOpen, user]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      alert('Account not ready. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Call real API
      const result = await tradingAPI.deposit(
        accountId,
        asset,
        parseFloat(amount)
      );
      
      console.log('Deposit successful:', result);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Deposit failed:', error);
      alert(`Deposit failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAsset('USDT');
    setAmount('');
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
            <h2 className="text-2xl font-bold gradient-text mb-2">Deposit Successful!</h2>
            <p className="text-gray-400">{amount} {asset} deposited</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">Deposit Funds</h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* User Info */}
            <div className="glass rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Deposit To</p>
              <p className="font-semibold">{user?.displayName || 'Unknown'}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">{user?.partyId}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleDeposit} className="space-y-6">
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
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-modern"
                  placeholder="0.00"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum deposit: 0.001 {asset}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['100', '500', '1000', '5000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="btn bg-primary/10 hover:bg-primary/20 text-primary-light text-sm py-2"
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Deposit Address */}
              <div className="glass rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Deposit Address</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${asset}:${user?.partyId?.split('::')[2] || 'address'}`}
                    readOnly
                    className="input-modern text-xs font-mono flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${asset}:${user?.partyId}`);
                    }}
                    className="btn btn-primary py-2 px-4 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Deposit ${amount || '0'} ${asset}`
                )}
              </button>
            </form>

            {/* Disclaimer */}
            <div className="mt-4 p-3 glass rounded-lg">
              <p className="text-xs text-gray-500">
                <strong className="text-primary-light">Note:</strong> This is a hackathon prototype. 
                In production, this would integrate with Canton custody contracts.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
