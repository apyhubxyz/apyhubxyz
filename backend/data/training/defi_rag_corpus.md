# DeFi Yield Strategies RAG Corpus (Merged)

## Chunk 01 — ETH Super‑Basis (Liquity + Maple/syrupUSDC + Drift)
- Setup: Long wstETH → post as collateral on Liquity → borrow BOLD at fixed rate (~3.5%) at ~50% LTV → swap to syrupUSDC (~7% base) → bridge to Solana (e.g., Interport) → deposit syrupUSDC as Drift margin → open 2× ETH short sized to hedge the wstETH long; target delta‑neutral.
- Indicative math: +2.8% wstETH staking −1.75% cost (3.5% fixed on 50% notional) +3.5% syrupUSDC margin yield + ~2% Drift margin incentives + ~15% short funding = ~21.5% APR.
- Risks: funding flips on Drift; large ETH rallies (~30%) require rebalance; BOLD depeg/redemptions—mitigate by using a delegate and maintaining conservative LTV; bridge/operational costs.
- Why it works: fixed borrow + yield‑bearing collateral + yield‑bearing margin + positive funding = capital‑efficient DN carry.

## Chunk 02 — NAV Checks for Yield‑Bearing Stables (cUSDO example)
- Goal: detect premium/discount to NAV for arbitrage, repeg plays, and EV estimation.
- Steps (Etherscan): 1) Open the asset’s contract; 2) Click 'Read as Proxy' (or 'Read Contract' if proxy absent); 3) Find previewRedeem; 4) Query a large 'shares' amount; 5) Compute NAV per share (redeem amount / shares).
- Example: 1,000,000 cUSDO → 1,017,085 USDO ⇒ NAV ≈ 1.017085 USDO per cUSDO. Trade vs market price or use for exit/entry decisions.
- Tip: If listed on Pendle, the market info tab often surfaces NAV directly.

## Chunk 03 — Liquity V2 Forkonomics (L2 Liquidity Engines)
- Fork benefits for L2s: free native stablecoin liquidity; new use‑case for governance token; align value‑accretive builders with chain growth.
- Mechanics: governance token becomes primary collateral; stability pool harvests liquidations; emissions/grants pull liquidity; fork teams act as active governors in the ecosystem.
- Positioning: forks on chains like Berachain/Hyperliquid (Felix, etc.) compete PvP for stablecoin TVL.

## Chunk 04 — Non‑Leveraged Stablecoin Yields (>10% targets)
- Pendle PTs to lock fixed rates (~12–18% typical windows). Avoid near‑expiry PTs to reduce slippage/fees.
- Infinifi: PT ETF model with liquid siUSD or laddered liUSD for 1–13 weeks; USDC‑in/USDC‑out convenience.
- Gauntlet/curated lend aggregators: 8–12% base with occasional boosts; no lockups aid liquidity for redeploys.
- Gearbox/Noon and others: campaign‑driven non‑lev APYs (some chain‑specific).

## Chunk 05 — Leveraged PT Loops (Morpho/Euler/Contango)
- Pattern: buy PT (fixed‑rate collateral) → borrow against it on high‑LLTV market (e.g., 91–96.5%) → loop up to target leverage using 'cheat loop' to minimize swap fees.
- Example math: 10×*(PT 9.75%) − 9×*(borrow 6.28%) ≈ 41% APR net (before fees).
- Key risks: oracle source (Pendle AMM); liquidation bands if PT price drifts; expiry management; fee multiplication at high leverage—use manual or cheat loop entries; keep <90% LTV buffer.

## Chunk 06 — Stability Pools (Long Black Swans)
- Thesis: during large down‑moves, liquidations pay out collateral to stability providers; some pools auto‑compound.
- Base yields (single‑digit) with occasional spikes (daily ROI during major deleveraging).
- Use cases: BOLD/sBOLD, fxUSD (fxSAVE), Felix feUSD, USDaf, etc.
- Portfolio role: tail‑risk carry and optionality while staying largely uncorrelated to routine yield decay.

## Chunk 07 — BTC Basis Arbitrage (f(x) 0% long + Hyperliquid short)
- Structure: open leveraged BTC long on f(x) with 0% borrow/funding while opening a smaller short on Hyperliquid to harvest positive funding.
- Illustrative sizing: 3× long with $6k margin ($18k notional) vs 2× short with $4k margin ($8k notional) → net $10k long exposure but collect funding on the short leg.
- APR driver: positive short funding (e.g., ~42% annualized historically), plus margin yields where applicable.
- Risks: funding regime flips, exchange‑specific risks; rebalance on large trend moves.

## Chunk 08 — Non‑Leveraged BTC Yields (Vaults & Lending)
- Vaults: avBTC (Avantis), xBTC (Stream), mBTC/mevBTC (Midas) — low‑teens or low‑single‑digits base with point upside.
- Liquidity mining: WBTC<>ecosystem LPs with curated incentives (Merkl/Velodrome), target sustainable pools with avg (not single‑tick) APRs.
- Composability hubs: Avalanche emerging as BTC yield venue (LFJ, Silo, Avantis).

## Chunk 09 — ETH Loops (weETH leverage or non‑leverage)
- Non‑leverage variant: mint weETH (base + seasonal pump 3–6%), lend, borrow USDC at ~50% LTV, farm Pendle PT or curated stables for net 12–16% APR without recursive leverage.
- Leverage variant: loop LST/LRT on Morpho/Euler/Aave Prime at high LLTV for 15–30%+ APR; manage LTV and use stable, deep markets.
- Operational notes: target average APRs; avoid near‑term expiries; size against borrow side depth.

## Chunk 10 — Fee Avoidance: Cheat Looping, Redemption Windows, CoWSwap Limits
- Cheat loop: borrow first to form notional, then add collateral to avoid repeated swaps/flash‑loan fees that multiply with leverage.
- Redemption windows: many wrappers charge for instant redeem but allow fee‑free scheduled redemptions (e.g., 7‑day).
- Exiting at NAV: use limit orders on aggregators (e.g., CoWSwap) to exit at or near NAV when direct redemption is gated or slow.

## Chunk 11 — Risk Controls & Quick Checklist
- LTV discipline: stay <90% where LLTV is 91–96.5%; understand your oracle (Pendle AMM vs external).
- Liquidity: TVL/depth > $1M; confirm 1:1 exit path in USDC for wrappers/PTs.
- Funding regime awareness: basis trades require persistent positive funding; pre‑plan for flips.
- Costs: measure entry/exit slippage, gas, and protocol fees; model breakeven horizon (>1–2 months for complex stacks).
