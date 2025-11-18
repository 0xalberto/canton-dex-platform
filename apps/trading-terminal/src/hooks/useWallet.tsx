/**
 * Wallet Connection Hook
 * Supports MetaMask and WalletConnect
 */

import { useState, useEffect } from 'react';

interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  jwtToken: string | null;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    jwtToken: null,
    error: null,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setWallet(prev => ({
        ...prev,
        error: 'MetaMask is not installed',
      }));
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

      // 1) Backend'ten nonce/message al
      const nonceResponse = await fetch(`${apiBaseUrl}/wallet/nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_address: address }),
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get wallet nonce');
      }

      const { message } = await nonceResponse.json();

      // 2) Mesajı cüzdanla imzalat
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // 3) Backend'e login isteği gönder
      const loginResponse = await fetch(`${apiBaseUrl}/wallet/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          signature,
          message,
        }),
      });

      if (!loginResponse.ok) {
        const errorBody = await loginResponse.json().catch(() => null);
        const errorMessage =
          errorBody?.detail || errorBody?.error || 'Wallet login failed';
        throw new Error(errorMessage);
      }

      const loginData = await loginResponse.json();

      const token: string | null = loginData.token ?? null;
      const balanceEth: string | null =
        loginData.balance?.balance_eth != null
          ? String(loginData.balance.balance_eth)
          : null;

      // 4) JWT token'ı localStorage'a kaydet
      if (token) {
        window.localStorage.setItem('auth_token', token);
      }
      if (address) {
        window.localStorage.setItem('wallet_address', address);
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      setWallet({
        address,
        balance: balanceEth,
        chainId,
        isConnected: true,
        isConnecting: false,
        jwtToken: token,
        error: null,
      });
    } catch (error: any) {
      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnectWallet = () => {
    window.localStorage.removeItem('auth_token');
    window.localStorage.removeItem('wallet_address');

    setWallet({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      jwtToken: null,
      error: null,
    });
  };

  return {
    wallet,
    connectWallet,
    disconnectWallet,
  };
};
