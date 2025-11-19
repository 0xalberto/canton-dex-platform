from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CreateAccountRequest(BaseModel):
    party_id: str
    display_name: str
    email: Optional[str] = None

class AccountResponse(BaseModel):
    account_id: str
    party_id: str
    display_name: str
    email: Optional[str]
    created_at: datetime

class BalanceResponse(BaseModel):
    asset_symbol: str
    available: float
    locked: float
    updated_at: datetime

class DepositRequest(BaseModel):
    account_id: str
    asset_symbol: str
    amount: float

class WithdrawRequest(BaseModel):
    account_id: str
    asset_symbol: str
    amount: float

class CreateOrderRequest(BaseModel):
    account_id: str
    pair: str
    side: str  # BUY or SELL
    order_type: str  # LIMIT or MARKET
    quantity: float
    price: Optional[float] = None

class OrderResponse(BaseModel):
    order_id: str
    account_id: str
    party_id: str
    pair: str
    side: str
    order_type: str
    quantity: float
    price: Optional[float]
    status: str
    filled_quantity: float
    created_at: datetime

class TransactionResponse(BaseModel):
    transaction_id: str
    status: str
