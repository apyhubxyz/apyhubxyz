"""
Helper methods for OpusAIAgent
Separated for better organization
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import hashlib

class AgentHelpers:
    """Helper methods for AI Agent"""
    
    @staticmethod
    def _calculate_risk_score(portfolio: Any) -> float:
        """Calculate portfolio risk score (0-100)"""
        score = 50.0  # Base score
        
        # Adjust based on position diversity
        if len(portfolio.positions) < 3:
            score += 20  # Concentrated risk
        elif len(portfolio.positions) > 10:
            score -= 10  # Well diversified
        
        # Adjust based on chain diversity
        if len(portfolio.chains) == 1:
            score += 15  # Single chain risk
        elif len(portfolio.chains) > 3:
            score -= 15  # Multi-chain diversified
        
        # Adjust based on risk tolerance
        if portfolio.risk_tolerance.value == "high":
            score += 10
        elif portfolio.risk_tolerance.value == "low":
            score -= 20
        
        return max(0, min(100, score))
    
    @staticmethod
    def _calculate_diversification(portfolio: Any) -> float:
        """Calculate diversification score (0-100)"""
        if not portfolio.positions:
            return 0
        
        # Protocol diversity
        protocols = set(p.get("protocol") for p in portfolio.positions)
        protocol_score = min(len(protocols) * 20, 60)
        
        # Chain diversity
        chains = len(portfolio.chains)
        chain_score = min(chains * 10, 30)
        
        # Asset type diversity
        asset_types = set(p.get("type") for p in portfolio.positions)
        type_score = min(len(asset_types) * 5, 10)
        
        return protocol_score + chain_score + type_score
    
    @staticmethod
    def _calculate_weighted_apy(positions: List[Dict]) -> float:
        """Calculate portfolio weighted average APY"""
        if not positions:
            return 0
        
        total_value = sum(p.get("value_usd", 0) for p in positions)
        if total_value == 0:
            return 0
        
        weighted_apy = sum(
            p.get("apy", 0) * p.get("value_usd", 0) / total_value
            for p in positions
        )
        
        return weighted_apy
    
    @staticmethod
    def _calculate_protocol_risk(protocol: str) -> float:
        """Calculate protocol risk score (0-100, lower is better)"""
        # Blue chip protocols
        blue_chip = {
            "Aave V3": 10,
            "Compound V3": 12,
            "Uniswap V3": 10,
            "Curve": 15,
            "MakerDAO": 10,
            "Lido": 12,
        }
        
        # Mid-tier protocols
        mid_tier = {
            "Liquity V2": 25,
            "Pendle": 30,
            "GMX": 35,
            "Balancer": 25,
            "Sushiswap": 30,
        }
        
        if protocol in blue_chip:
            return blue_chip[protocol]
        elif protocol in mid_tier:
            return mid_tier[protocol]
        else:
            return 50  # Unknown protocol, moderate risk
    
    @staticmethod
    def _matches_criteria(
        template: Dict,
        portfolio: Any,
        target_apy: Optional[float],
        max_gas_usd: float
    ) -> bool:
        """Check if strategy template matches user criteria"""
        # Check risk tolerance
        if portfolio.risk_tolerance.value == "low" and template["risk"].value in ["high", "extreme"]:
            return False
        
        # Check target APY
        if target_apy and template["expected_apy"] < target_apy * 0.8:
            return False
        
        # Check gas cost (estimate)
        estimated_gas = 50  # Default estimate
        if estimated_gas > max_gas_usd:
            return False
        
        return True
    
    @staticmethod
    def _get_cached(cache: Any, key: str) -> Optional[Any]:
        """Get value from cache"""
        if hasattr(cache, 'get'):
            try:
                value = cache.get(key)
                if value:
                    return json.loads(value)
            except:
                pass
        elif hasattr(cache, 'memory_cache'):
            return cache.memory_cache.get(key)
        return None
    
    @staticmethod
    def _set_cached(cache: Any, key: str, value: Any, ttl: int = 3600):
        """Set value in cache"""
        if hasattr(cache, 'setex'):
            try:
                cache.setex(key, ttl, json.dumps(value, default=str))
            except:
                pass
        elif hasattr(cache, 'memory_cache'):
            cache.memory_cache[key] = value
    
    @staticmethod
    def _generate_fallback_explanation(strategy: Any, portfolio: Any) -> str:
        """Generate fallback explanation when AI is not available"""
        return f"""
## {strategy.name} Strategy Explanation

**Overview:**
This strategy involves {strategy.type.value} on {strategy.protocol} ({strategy.chain} network).

**Expected Returns:**
- APY: {strategy.expected_apy}%
- Risk Level: {strategy.risk_level.value}
- Impermanent Loss Exposure: {strategy.il_exposure}%

**How It Works:**
{chr(10).join(f"{i+1}. {step}" for i, step in enumerate(strategy.steps[:3]))}

**Key Risks:**
1. Smart contract risk - Protocol may have vulnerabilities
2. {f"Impermanent loss risk ({strategy.il_exposure}%)" if strategy.il_exposure > 0 else "Market risk - Token prices may decline"}
3. Gas costs may reduce profitability for smaller positions

**Suitability:**
This strategy is suitable for your ${portfolio.total_value_usd:,.0f} portfolio given your {portfolio.risk_tolerance.value} risk tolerance.
The minimum investment of ${strategy.minimum_investment:,.0f} fits within your budget.

**Exit Strategy:**
{chr(10).join(f"- {option}" for option in strategy.exit_options[:2])}

Always monitor your positions regularly and be prepared to exit if market conditions change significantly.
        """


class StrategyBuilder:
    """Build detailed strategies from templates"""
    
    @staticmethod
    async def build_strategy(
        template: Dict,
        portfolio: Any,
        strategy_key: str
    ) -> Any:
        """Build a complete strategy from template"""
        from backend.ai.agent import YieldStrategy, StrategyType
        
        # Map template to strategy type
        type_mapping = {
            "eth_basis_trade": StrategyType.BASIS_TRADE,
            "bold_looping": StrategyType.LOOPING,
            "stable_lp_concentrated": StrategyType.LP,
            "pendle_pt": StrategyType.PT_YT,
            "lrt_maximizer": StrategyType.STAKING,
            "delta_neutral_farming": StrategyType.DELTA_NEUTRAL,
        }
        
        # Generate unique ID
        strategy_id = hashlib.md5(
            f"{strategy_key}:{portfolio.address}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:8]
        
        # Build steps based on strategy type
        steps = StrategyBuilder._generate_steps(strategy_key, template)
        
        # Determine required tokens
        required_tokens = StrategyBuilder._get_required_tokens(strategy_key)
        
        # Define exit options
        exit_options = StrategyBuilder._get_exit_options(strategy_key)
        
        # Calculate confidence score
        confidence = StrategyBuilder._calculate_confidence(template, portfolio)
        
        return YieldStrategy(
            id=strategy_id,
            name=template["name"],
            type=type_mapping.get(strategy_key, StrategyType.LP),
            protocol=template["protocols"][0],
            chain=StrategyBuilder._get_chain_for_protocol(template["protocols"][0]),
            expected_apy=template["expected_apy"],
            risk_level=template["risk"],
            minimum_investment=1000.0,  # Default
            gas_cost_usd=50.0,  # Estimate
            il_exposure=template["il_exposure"],
            steps=steps,
            required_tokens=required_tokens,
            exit_options=exit_options,
            confidence_score=confidence
        )
    
    @staticmethod
    def _generate_steps(strategy_key: str, template: Dict) -> List[str]:
        """Generate detailed execution steps"""
        steps_map = {
            "eth_basis_trade": [
                "Buy spot ETH on Uniswap or 1inch",
                "Open short position on GMX/Vertex/Drift",
                "Monitor funding rates daily",
                "Rebalance if funding goes negative",
                "Close positions when funding normalizes"
            ],
            "bold_looping": [
                "Deposit wstETH as collateral in Liquity V2",
                "Borrow BOLD stablecoin at 0.5% rate",
                "Convert BOLD to more wstETH via DEX",
                "Repeat loop 3-4 times for leverage",
                "Monitor health factor (keep above 1.5)"
            ],
            "stable_lp_concentrated": [
                "Analyze current price range on Uniswap V3",
                "Set tight range (0.995-1.005 for stables)",
                "Provide liquidity equally in both tokens",
                "Monitor position daily for range exits",
                "Rebalance if price moves outside range"
            ],
            "pendle_pt": [
                "Navigate to Pendle Finance",
                "Select desired maturity date",
                "Buy PT tokens at discount to face value",
                "Hold until maturity for guaranteed yield",
                "Redeem at maturity for underlying asset"
            ],
            "lrt_maximizer": [
                "Stake ETH for stETH/rETH",
                "Restake via EigenLayer",
                "Deposit into Renzo/Kelp for ezETH/rsETH",
                "Earn triple rewards (staking + restaking + LRT)",
                "Compound rewards monthly"
            ],
            "delta_neutral_farming": [
                "Deposit assets in high-APY farm",
                "Borrow against position",
                "Short equivalent amount on perp DEX",
                "Maintain delta neutrality daily",
                "Harvest and compound rewards"
            ]
        }
        
        return steps_map.get(strategy_key, ["Execute strategy as per protocol documentation"])
    
    @staticmethod
    def _get_required_tokens(strategy_key: str) -> List[str]:
        """Get required tokens for strategy"""
        tokens_map = {
            "eth_basis_trade": ["ETH", "USDC"],
            "bold_looping": ["wstETH", "BOLD"],
            "stable_lp_concentrated": ["USDC", "USDT"],
            "pendle_pt": ["USDC", "PT-TOKEN"],
            "lrt_maximizer": ["ETH"],
            "delta_neutral_farming": ["USDC", "ETH"]
        }
        
        return tokens_map.get(strategy_key, ["USDC"])
    
    @staticmethod
    def _get_exit_options(strategy_key: str) -> List[str]:
        """Get exit strategy options"""
        exit_map = {
            "eth_basis_trade": [
                "Close short position first",
                "Sell spot ETH on DEX",
                "Emergency exit via flashloan if needed"
            ],
            "bold_looping": [
                "Unwind loops in reverse order",
                "Repay BOLD debt",
                "Withdraw wstETH collateral"
            ],
            "stable_lp_concentrated": [
                "Remove liquidity from pool",
                "Claim accumulated fees",
                "Swap back to preferred stablecoin"
            ],
            "pendle_pt": [
                "Wait for maturity (recommended)",
                "Sell PT on secondary market (may incur loss)",
                "Use PT as collateral elsewhere"
            ],
            "lrt_maximizer": [
                "Unstake from LRT protocol",
                "Wait for unbonding period",
                "Withdraw ETH or swap LRT token"
            ],
            "delta_neutral_farming": [
                "Close hedge positions",
                "Withdraw from farm",
                "Repay any borrowings"
            ]
        }
        
        return exit_map.get(strategy_key, ["Withdraw from protocol", "Swap to stablecoin"])
    
    @staticmethod
    def _get_chain_for_protocol(protocol: str) -> str:
        """Map protocol to primary chain"""
        chain_map = {
            "GMX": "Arbitrum",
            "Vertex": "Arbitrum",
            "Drift": "Solana",
            "Liquity V2": "Ethereum",
            "Fluid": "Ethereum",
            "Uniswap V3": "Ethereum",
            "Curve": "Ethereum",
            "Pendle": "Arbitrum",
            "EigenLayer": "Ethereum",
            "Renzo": "Ethereum",
            "Kelp": "Ethereum",
            "Alpaca": "BSC",
            "Francium": "Solana",
            "Kamino": "Solana"
        }
        
        return chain_map.get(protocol, "Ethereum")
    
    @staticmethod
    def _calculate_confidence(template: Dict, portfolio: Any) -> float:
        """Calculate strategy confidence score"""
        confidence = 70.0  # Base confidence
        
        # Adjust based on risk match
        if template["risk"] == portfolio.risk_tolerance:
            confidence += 10
        
        # Adjust based on portfolio size
        if portfolio.total_value_usd > 10000:
            confidence += 5
        elif portfolio.total_value_usd < 1000:
            confidence -= 10
        
        # Adjust based on protocol reputation
        if template["protocols"][0] in ["Aave V3", "Uniswap V3", "Curve"]:
            confidence += 15
        
        return min(100, max(0, confidence))


class OpportunityFinder:
    """Find yield opportunities based on portfolio"""
    
    @staticmethod
    async def find_opportunities(portfolio: Any) -> List[Any]:
        """Find optimization opportunities for portfolio"""
        opportunities = []
        
        # Analyze current positions
        for position in portfolio.positions:
            current_apy = position.get("apy", 0)
            
            # Look for better alternatives
            if current_apy < 10:
                # Suggest upgrade opportunities
                opportunity = {
                    "action": "upgrade",
                    "from_protocol": position.get("protocol"),
                    "to_protocol": "Pendle",
                    "expected_apy": 15.0,
                    "improvement": 15.0 - current_apy,
                    "description": f"Migrate from {position.get('protocol')} to higher yield"
                }
                opportunities.append(opportunity)
        
        # Suggest new positions for idle capital
        if portfolio.total_value_usd > sum(p.get("value_usd", 0) for p in portfolio.positions):
            idle_capital = portfolio.total_value_usd - sum(p.get("value_usd", 0) for p in portfolio.positions)
            opportunity = {
                "action": "deploy",
                "amount": idle_capital,
                "suggested_protocol": "Liquity V2",
                "expected_apy": 21.0,
                "description": f"Deploy ${idle_capital:,.0f} idle capital for yield"
            }
            opportunities.append(opportunity)
        
        return opportunities