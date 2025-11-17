import React from 'react';
import { useWallet } from '../hooks/useWallet';

export const WalletButton: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (wallet.isConnecting) {
    return (
      <button className="btn btn-primary" disabled>
        Connecting...
      </button>
    );
  }

  if (wallet.isConnected && wallet.address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {parseFloat(wallet.balance || '0').toFixed(4)} ETH
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            {formatAddress(wallet.address)}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={disconnectWallet}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-primary" onClick={connectWallet}>
      Connect Wallet
    </button>
  );
};
