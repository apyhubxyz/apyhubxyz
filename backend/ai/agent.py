
"""
ApyHub AI Agent - Opus 4.1 Powered Yield Strategy Advisor
Advanced DeFi yield optimization with cross-chain intelligence
"""

import os
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import optional dependencies
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    logger.warning("OpenAI package not installed. Using fallback responses.")

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    logger.warning("Anthropic package not installed. Using fallback responses.")

try:
    import redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    logger.info("Redis not available. Using in-memory cache.")

class RiskLevel(Enum):
    """Risk levels for yield strategies"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"

class StrategyType(Enum):
    """Types of yield strategies"""
    LENDING = "lending"
    LP = "liquidity_provision"
    STAKING = "staking"
    LOOPING = "looping"
    BASIS_TRADE = "basis_trade"
    DELTA_NEUTRAL = "delta_neutral"
    TRANCHING = "tranching"
    PT_YT = "principal_token_yield_token"

@dataclass
class YieldStrategy:
    """Represents a yield farming strategy"""
    id: str
    name: str
    type: StrategyType
    protocol: str
    chain: str
    expected_apy: float
    risk_level: RiskLevel
    minimum_investment: float
    gas_cost_usd: float
    il_exposure: float
    steps: List[str]
    required_tokens: List[str]
    exit_options: List[str]
    confidence_score: float

@dataclass
class Portfolio:
    """User portfolio data"""
    address: str
    total_value_usd: float
    positions: List[Dict[str, Any]]
    chains: List[str]
    risk_tolerance: RiskLevel
    preferred_protocols: List[str]

class OpusAIAgent:
    """
    Main AI Agent powered by Opus 4.1 (Claude) or GPT-4
    Provides advanced yield strategy recommendations
    """
    
    # Strategy templates based on market conditions
    STRATEGY_TEMPLATES = {
        "eth_basis_trade": {
            "name": "ETH Perpetual Basis Trade",
            "description": "Long spot ETH, short perp futures for market-neutral yield",
            "protocols": ["GMX", "Vertex", "Drift"],
            "expected_apy": 15.0,
            "risk": RiskLevel.MEDIUM,
            "il_exposure": 0.0,
        },
        "bold_looping": {
            "name": "BOLD Recursive Lending",
            "description": "Deposit wstETH → Borrow BOLD at 0.5% → Loop for 20%+ APY",
            "protocols": ["Liquity V2", "Fluid"],
            "expected_apy": 21.0,
            "risk": RiskLevel.MEDIUM,
            "il_exposure": 0.0,
        },
        "stable_lp_concentrated": {
            "name": "Concentrated Stablecoin LP",
            "description": "USDC/USDT tight range on Uniswap V3",
            "protocols": ["Uniswap V3", "Curve"],
            "expected_apy": 12.0,
            "risk": RiskLevel.LOW,
            "il_exposure": 0.5,
        },
        "pendle_pt": {
            "name": "Pendle Principal Tokens",
            "description": "Buy PT tokens for fixed yield to maturity",
            "protocols": ["Pendle"],
            "expected_apy": 10.0,
            "risk": RiskLevel.LOW,
            "il_exposure": 0.0,
        },
        "lrt_maximizer": {
            "name": "Liquid Restaking Maximizer",
            "description": "Stack ETH staking + EigenLayer + LRT rewards",
            "protocols": ["EigenLayer", "Renzo", "Kelp"],
            "expected_apy": 18.0,
            "risk": RiskLevel.MEDIUM,
            "il_exposure": 0.0,
        },
        "delta_neutral_farming": {
            "name": "Delta Neutral Yield Farming",
            "description": "Farm high APY while hedging price exposure",
            "protocols": ["Alpaca", "Francium", "Kamino"],
            "expected_apy": 25.0,
            "risk": RiskLevel.HIGH,
            "il_exposure": 2.0,
        },
    }
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        cache_ttl: int = 3600
    ):
        """Initialize the AI Agent"""
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        self.cache_ttl = cache_ttl
        
        # Initialize clients
        self._init_ai_clients()
        self._init_cache()
        
        # Knowledge base
        self.knowledge_base = self._load_knowledge_base()
        
        logger.info("OpusAIAgent initialized successfully")
    
    def _init_ai_clients(self):
        """Initialize AI model clients"""
        self.openai_client = None
        self.anthropic_client = None
        
        if HAS_ANTHROPIC and self.anthropic_api_key:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            logger.info("Anthropic Claude (Opus 4.1) client initialized")
        
        if HAS_OPENAI and self.openai_api_key:
            openai.api_key = self.openai_api_key
            self.openai_client = openai
            logger.info("OpenAI GPT-4 client initialized")
    
    def _init_cache(self):
        """Initialize caching layer"""
        self.cache = None
        if HAS_REDIS:
            try:
                self.cache = redis.Redis(
                    host=os.getenv("REDIS_HOST", "localhost"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    decode_responses=True,
                    socket_connect_timeout=2
                )
                self.cache.ping()
                logger.info("Redis cache initialized")
            except:
                self.cache = None
                logger.info("Redis unavailable, using memory cache")
        
        # Fallback to memory cache
        if not self.cache:
            self.memory_cache = {}
    
    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Load DeFi knowledge base for RAG"""
        knowledge_file = os.path.join(
            os.path.dirname(__file__),
            "fine_tune/data/yield_strategies.json"
        )
        
        if os.path.exists(knowledge_file):
            with open(knowledge_file, 'r') as f:
                return json.load(f)
        
        # Return default knowledge
        return {
            "protocols": [
                "Aave V3", "Compound V3", "Liquity V2", "MakerDAO",
                "Uniswap V3", "Curve", "Balancer", "Pendle",
                "GMX", "Vertex", "Drift", "Jupiter"
            ],
            "chains": [
                "Ethereum", "Arbitrum", "Optimism", "Base", "Polygon",
                "Avalanche", "Solana"
            ],
            "risk_factors": {
                "smart_contract": "Code vulnerabilities and exploits",
                "impermanent_loss": "Price divergence in LP positions",
                "liquidation": "Collateral liquidation in leveraged positions",
                "bridge": "Cross-chain bridge risks",
                "oracle": "Price oracle manipulation"
            }
        }
    
    async def analyze_portfolio(self, portfolio: Portfolio) -> Dict[str, Any]:
        """
        Analyze user portfolio and provide insights
        """
        analysis = {
            "total_value": portfolio.total_value_usd,
            "risk_score": self._calculate_risk_score(portfolio),
            "diversification_score": self._calculate_diversification(portfolio),
            "optimization_potential": 0.0,
            "recommendations": []
        }
        
        # Calculate current weighted APY
        current_apy = self._calculate_weighted_apy(portfolio.positions)
        
        # Find optimization opportunities
        opportunities = await self._find_opportunities(portfolio)
        
        if opportunities:
            best_opportunity = opportunities[0]
            potential_apy = best_opportunity.expected_apy
            analysis["optimization_potential"] = potential_apy - current_apy
        
        analysis["recommendations"] = opportunities[:3]
        
        return analysis
    
    async def get_strategy_recommendation(
        self,
        portfolio: Portfolio,
        target_apy: Optional[float] = None,
        max_gas_usd: float = 100.0
    ) -> List[YieldStrategy]:
        """
        Get personalized yield strategy recommendations
        """
        # Check cache first
        cache_key = f"strategy:{portfolio.address}:{target_apy}:{max_gas_usd}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        # Generate recommendations
        strategies = []
        
        # Filter strategies based on user preferences
        for template_key, template in self.STRATEGY_TEMPLATES.items():
            if self._matches_criteria(template, portfolio, target_apy, max_gas_usd):
                strategy = await self._build_strategy(
                    template,
                    portfolio,
                    template_key
                )
                strategies.append(strategy)
        
        # Sort by expected APY
        strategies.sort(key=lambda s: s.expected_apy, reverse=True)
        
        # Cache results
        self._set_cached(cache_key, strategies[:5])
        
        return strategies[:5]
    
    async def explain_strategy(
        self,
        strategy: YieldStrategy,
        portfolio: Portfolio
    ) -> str:
        """
        Generate detailed explanation of a yield strategy
        """
        prompt = f"""
        Explain this DeFi yield strategy for a user with ${portfolio.total_value_usd} portfolio:
        
        Strategy: {strategy.name}
        Type: {strategy.type.value}
        Protocol: {strategy.protocol}
        Chain: {strategy.chain}
        Expected APY: {strategy.expected_apy}%
        Risk Level: {strategy.risk_level.value}
        IL Exposure: {strategy.il_exposure}%
        
        Steps:
        {chr(10).join(f"{i+1}. {step}" for i, step in enumerate(strategy.steps))}
        
        Provide a clear, concise explanation covering:
        1. How the strategy works
        2. Main risks and how to mitigate them
        3. Exit strategy
        4. Why it's suitable for this user
        """
        
        # Try Anthropic Claude first
        if self.anthropic_client:
            try:
                response = self.anthropic_client.messages.create(
                    model="claude-3-opus-20240229",
                    max_tokens=1000,
                    temperature=0.7,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
            except Exception as e:
                logger.error(f"Anthropic API error: {e}")
        
        # Fallback to OpenAI
        if self.openai_client:
            try:
                response = self.openai_client.ChatCompletion.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.error(f"OpenAI API error: {e}")
        
        # Fallback explanation
        return self._generate_fallback_explanation(strategy, portfolio)
    
    async def calculate_risk_metrics(
        self,
        strategy: YieldStrategy,
        investment_amount: float
    ) -> Dict[str, Any]:
        """
        Calculate detailed risk metrics for a strategy
        """
        metrics = {
            "var_95": 0.0,  # Value at Risk (95% confidence)
            "max_drawdown": 0.0,
            "sharpe_ratio": 0.0,
            "liquidation_risk": 0.0,
            "protocol_risk_score": 0.0,
            "time_to_breakeven_days": 0
        }
        
        # Calculate VaR based on historical volatility
        if strategy.type == StrategyType.LP:
            # Higher VaR for LP strategies due to IL
            metrics["var_95"] = investment_amount * 0.15
            metrics["max_drawdown"] = 0.25
        elif strategy.type == StrategyType.LENDING:
            metrics["var_95"] = investment_amount * 0.05
            metrics["max_drawdown"] = 0.10
        elif strategy.type == StrategyType.LOOPING:
            metrics["var_95"] = investment_amount * 0.20
            metrics["max_drawdown"] = 0.35
            metrics["liquidation_risk"] = 0.15
        
        # Calculate Sharpe ratio (simplified)
        risk_free_rate = 4.0  # US Treasury rate
        excess_return = strategy.expected_apy - risk_free_rate
        volatility = metrics["max_drawdown"] * 100
        metrics["sharpe_ratio"] = excess_return / volatility if volatility > 0 else 0
        
        # Protocol risk score (0-100, lower is better)
        metrics["protocol_risk_score"] = self._calculate_protocol_risk(
            strategy.protocol
        )
        
        # Time to breakeven (accounting for gas costs)
        daily_yield = (investment_amount * strategy.expected_apy / 100) / 365
        metrics["time_to_breakeven_days"] = int(
            strategy.gas_cost_usd / daily_yield
        ) if daily_yield > 0 else 999
        
        return metrics
    
    async def monitor_positions(
        self,
        positions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Monitor existing positions and generate alerts
        """
        alerts = []
        
        for position in positions:
            # Check for IL threshold
            if position.get("il_percentage", 0) > 5:
                alerts.append({
                    "type": "HIGH_IL",
                    "severity": "warning",
                    "position_id": position["id"],
                    "message": f"High impermanent loss detected: {position['il_percentage']}%",
                    "action": "Consider rebalancing or exiting position"
                })
            
            # Check for low APY
            if position.get("current_apy", 0) < 5:
                alerts.append({
                    "type": "LOW_APY",
                    "severity": "info",
                    "position_id": position["id"],
                    "message": f"Low APY detected: {position['current_apy']}%",
                    "action": "Consider migrating to higher yield opportunity"
                })
            
            # Check health factor for leveraged positions
            if position.get("health_factor", 999) < 1.5:
                alerts.append({
                    "type": "LIQUIDATION_RISK",
                    "severity": "critical",
                    "position_id": position["id"],
                    "message": f"Liquidation risk! Health factor: {position['health_factor']}",
                    "action": "Add collateral immediately or reduce debt"
                })
        
        return alerts
    
    #