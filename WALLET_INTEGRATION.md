# Web3 Wallet Integration Guide

## Overview

CantonDEX supports Web3 wallet authentication for seamless blockchain integration.

## Features

- ✅ MetaMask Integration
- ✅ Signature-based Authentication
- ✅ JWT Token Generation
- ✅ Balance Checking

## Backend Implementation

### Wallet Authentication Service

**File**: `cantondex-backend/api-gateway/wallet_integration.py`

```python
class WalletAuth:
    def verify_signature(self, address: str, message: str, signature: str) -> bool:
        """Verify wallet signature"""
        
    def generate_jwt_token(self, wallet_address: str) -> str:
        """Generate JWT token"""
        
    def get_wallet_balance(self, address: str) -> Dict:
        """Get wallet balance"""
```

### API Endpoints

#### Get Nonce
```http
POST /wallet/nonce
Content-Type: application/json

{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response**:
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Welcome to CantonDEX!...",
  "instructions": "Please sign this message with your wallet"
}
```

#### Login with Signature
```http
POST /wallet/login
Content-Type: application/json

{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x1234...",
  "message": "Welcome to CantonDEX!..."
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "balance": {
    "balance_eth": 1.23456789,
    "currency": "ETH"
  },
  "expires_in": 86400
}
```

## Frontend Implementation

### Wallet Hook

**File**: `apps/trading-terminal/src/hooks/useWallet.tsx`

```typescript
export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
  });

  const connectWallet = async () => {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Get nonce from backend
    const { message } = await fetch('/wallet/nonce', {...});

    // Sign message
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });

    // Login with signature
    const { token } = await fetch('/wallet/login', {...});
    
    localStorage.setItem('auth_token', token);
  };

  return { wallet, connectWallet, disconnectWallet };
};
```

### Wallet Button Component

**File**: `apps/trading-terminal/src/components/WalletButton.tsx`

```typescript
export const WalletButton: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet } = useWallet();

  if (wallet.isConnected) {
    return (
      <div>
        <div>{wallet.balance} ETH</div>
        <div>{formatAddress(wallet.address)}</div>
        <button onClick={disconnectWallet}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={connectWallet}>
      Connect Wallet
    </button>
  );
};
```

## User Flow

### 1. Connect Wallet
1. User clicks "Connect Wallet"
2. MetaMask popup appears
3. User approves connection
4. Frontend receives wallet address

### 2. Sign Message
1. Backend generates nonce message
2. Frontend requests signature
3. User signs (no gas fees)
4. Frontend sends signature to backend

### 3. Authentication
1. Backend verifies signature
2. Backend generates JWT token
3. Frontend stores token
4. User authenticated

## Security

### Message Signing

```
Welcome to CantonDEX!

Please sign this message to verify your wallet ownership.

Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Timestamp: 1700000000
Nonce: a1b2c3d4...

This signature will not trigger any blockchain transaction.
```

### JWT Tokens

- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Claims**: wallet_address, iat, exp
- **Storage**: localStorage

### Best Practices

1. **Never request private keys**
2. **No blockchain transactions** for auth
3. **Short-lived tokens**
4. **Secure storage**
5. **Network validation**

## Testing

```bash
# Get nonce
curl -X POST http://localhost:8000/wallet/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'

# Get balance
curl http://localhost:8000/wallet/balance/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## Troubleshooting

### MetaMask Not Detected

```javascript
if (typeof window.ethereum === 'undefined') {
  alert('Please install MetaMask!');
  window.open('https://metamask.io/download/');
}
```

### Wrong Network

```javascript
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
if (chainId !== '0x1') {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x1' }],
  });
}
```

---

**Web3 Authentication Made Simple! 🔐**
