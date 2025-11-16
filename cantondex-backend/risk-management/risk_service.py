"""
Risk Management Service
Real-time position tracking, margin calculation, VaR, and limit enforcement
"""

from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
from decimal import Decimal

class Position(BaseModel):
    """Trading position"""
    account_id: str
    asset: str
    quantity: Decimal
    entry_price: Decimal
    current_price: Decimal
    unrealized_pnl: Decimal
    
    def get_value(self) -> Decimal:
        """Current position value"""
        return self.quantity * self.current_price
    
    def get_pnl(self) -> Decimal:
        """Unrealized P&L"""
        return (self.current_price - self.entry_price) * self.quantity

class MarginStatus(BaseModel):
    """Margin status for account"""
    account_id: str
    equity: Decimal
    initial_margin_required: Decimal
    maintenance_margin_required: Decimal
    available_margin: Decimal
    margin_level: Decimal  # equity / maintenance_margin
    margin_call: bool

class RiskMetrics(BaseModel):
    """Risk metrics for account"""
    account_id: str
    total_position_value: Decimal
    portfolio_var_95: Decimal  # Value at Risk at 95% confidence
    portfolio_var_99: Decimal  # Value at Risk at 99% confidence
    portfolio_beta: Decimal
    sharpe_ratio: Decimal
    max_drawdown: Decimal
    concentration_limits: Dict[str, float]  # Asset -> % of portfolio

class RiskLimitBreach(BaseModel):
    """Risk limit breach event"""
    account_id: str
    limit_type: str  # position, concentration, leverage, etc.
    limit_value: Decimal
    current_value: Decimal
    timestamp: datetime
    severity: str  # warning, critical

class RiskManagementService:
    """Risk management service"""
    
    def __init__(self):
        self.positions: Dict[str, List[Position]] = {}
        self.margin_status: Dict[str, MarginStatus] = {}
        self.risk_metrics: Dict[str, RiskMetrics] = {}
        self.breaches: List[RiskLimitBreach] = []
    
    async def update_position(
        self,
        account_id: str,
        asset: str,
        quantity: Decimal,
        current_price: Decimal,
    ):
        """Update position after trade"""
        if account_id not in self.positions:
            self.positions[account_id] = []
        
        # Find existing position
        position = next(
            (p for p in self.positions[account_id] if p.asset == asset),
            None,
        )
        
        if position:
            # Update existing position
            avg_price = (
                (position.quantity * position.entry_price + quantity * current_price) /
                (position.quantity + quantity)
            )
            position.quantity += quantity
            position.entry_price = avg_price
            position.current_price = current_price
        else:
            # Create new position
            new_position = Position(
                account_id=account_id,
                asset=asset,
                quantity=quantity,
                entry_price=current_price,
                current_price=current_price,
                unrealized_pnl=Decimal(0),
            )
            self.positions[account_id].append(new_position)
    
    async def calculate_margin(self, account_id: str) -> MarginStatus:
        """Calculate margin requirements"""
        if account_id not in self.positions:
            return MarginStatus(
                account_id=account_id,
                equity=Decimal(0),
                initial_margin_required=Decimal(0),
                maintenance_margin_required=Decimal(0),
                available_margin=Decimal(0),
                margin_level=Decimal(0),
                margin_call=False,
            )
        
        positions = self.positions[account_id]
        total_value = sum(p.get_value() for p in positions)
        equity = Decimal(100000) + sum(p.get_pnl() for p in positions)
        
        # Initial margin: 20% of position value
        initial_margin = total_value * Decimal("0.2")
        # Maintenance margin: 10% of position value
        maintenance_margin = total_value * Decimal("0.1")
        
        available_margin = equity - initial_margin
        margin_level = equity / maintenance_margin if maintenance_margin > 0 else Decimal(0)
        margin_call = margin_level < Decimal("1.5")
        
        status = MarginStatus(
            account_id=account_id,
            equity=equity,
            initial_margin_required=initial_margin,
            maintenance_margin_required=maintenance_margin,
            available_margin=available_margin,
            margin_level=margin_level,
            margin_call=margin_call,
        )
        
        self.margin_status[account_id] = status
        return status
    
    async def check_pre_trade_limits(
        self,
        account_id: str,
        order_size: Decimal,
        position_limit: Decimal,
        concentration_limit: float = 0.25,
    ) -> bool:
        """
        Pre-trade limit checks before order execution
        
        Returns:
            True if order passes all limits
        """
        margin = await self.calculate_margin(account_id)
        
        # Check 1: Margin requirement
        if order_size > margin.available_margin:
            self.breaches.append(RiskLimitBreach(
                account_id=account_id,
                limit_type="margin",
                limit_value=margin.available_margin,
                current_value=order_size,
                timestamp=datetime.utcnow(),
                severity="critical",
            ))
            return False
        
        # Check 2: Position limit
        if order_size > position_limit:
            self.breaches.append(RiskLimitBreach(
                account_id=account_id,
                limit_type="position",
                limit_value=position_limit,
                current_value=order_size,
                timestamp=datetime.utcnow(),
                severity="warning",
            ))
            return False
        
        # Check 3: Concentration
        if margin.equity > 0:
            concentration = order_size / margin.equity
            if concentration > Decimal(str(concentration_limit)):
                self.breaches.append(RiskLimitBreach(
                    account_id=account_id,
                    limit_type="concentration",
                    limit_value=Decimal(str(concentration_limit)),
                    current_value=concentration,
                    timestamp=datetime.utcnow(),
                    severity="warning",
                ))
                return False
        
        return True
    
    async def calculate_var(
        self,
        account_id: str,
        confidence_level: float = 0.95,
    ) -> Decimal:
        """
        Calculate Value at Risk for portfolio
        
        Historical VaR: percentile of past returns
        
        Args:
            account_id: Account ID
            confidence_level: Confidence level (95% or 99%)
        
        Returns:
            VaR amount
        """
        if account_id not in self.positions:
            return Decimal(0)
        
        positions = self.positions[account_id]
        total_value = sum(p.get_value() for p in positions)
        
        # Simplified: assume 20% portfolio volatility
        volatility = Decimal("0.20")
        z_score = Decimal("1.645") if confidence_level == 0.95 else Decimal("2.326")
        
        var = total_value * volatility * z_score
        return var
