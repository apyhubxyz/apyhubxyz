# ApyHub Backend API - Quick Reference Sheet

## 🎯 Main Endpoints (Copy-Paste Ready)

### **Base URL**: `http://localhost:3001/api`

---

## 🌟 **MOST IMPORTANT ENDPOINTS**

### 1. **Dashboard - Get User's All Positions** ⭐
```bash
GET /api/dashboard/:address
```
**What it does**: Fetches ALL DeFi positions for a wallet (800+ protocols)  
**Used by**: Portfolio page (after wallet connect)  
**Data source**: Zapper GraphQL → DeBank → Blockchain (fallback)

**Test**:
```bash
curl "http://localhost:3001/api/dashboard/0xYOUR_WALLET_ADDRESS_HERE"
```

**Returns**:
- 158 positions across 59 protocols
- Total value: $2,514
- Protocols: Ethena, Ether.fi, EigenLayer, Extra Finance, Aave (20), Uniswap (19), etc.

---

### 2. **Discovery - Browse All Opportunities** ⭐
```bash
GET /api/positions?minAPY=10&minTVL=1000000&limit=50
```
**What it does**: Shows top yield opportunities from 1000+ protocols  
**Used by**: Pools page (discovery, no wallet needed)  
**Data source**: DefiLlama

**Test**:
```bash
curl "http://localhost:3001/api/positions?minAPY=30&limit=5"
```

**Returns**:
- Top 5 pools with >30% APY
- Example: Uniswap WETH-ADO (486% APY, $3.1M TVL)

---

## 📋 All Endpoints List

### Discovery & Pools
```
GET  /api/positions                    # All opportunities (1000+ protocols)
GET  /api/positions/stats              # Aggregate statistics
GET  /api/positions/protocols          # List of protocols
GET  /api/positions/chains             # Supported chains

GET  /api/pools                        # Pool discovery
GET  /api/pools/:id                    # Pool details
GET  /api/pools/top/:limit             # Top pools by APY
GET  /api/pools/search/:query          # Search pools
```

### Personal Portfolio
```
GET  /api/dashboard/:address           # ⭐ User's all positions (158 for test addr)
GET  /api/dashboard/:address/summary   # Quick stats only

GET  /api/portfolio/:address           # Legacy portfolio endpoint
GET  /api/portfolio/:address/suggestions  # Yield optimization ideas
```

### Protocols
```
GET  /api/protocols                    # All protocols
GET  /api/protocols/:slug              # Protocol details
GET  /api/protocols/:slug/pools        # Protocol's pools
GET  /api/protocols/:slug/stats        # Protocol statistics
```

### AI Agent
```
POST /api/ai/chat                      # AI chat for strategies
POST /api/ai/suggest                   # Personalized suggestions
GET  /api/ai/chat/history/:sessionId   # Chat history
```

### System
```
GET  /api/health                       # Health check
GET  /                                 # API documentation
WS   /ws                               # WebSocket for real-time updates
```

---

## 🧪 Test Commands for Team

### Quick Demo (2 minutes)
```bash
# 1. Check health
curl http://localhost:3001/api/health

# 2. Get top opportunities
curl "http://localhost:3001/api/positions?minAPY=20&limit=3" | jq '.data[0]'

# 3. Get user positions (MAIN FEATURE!)
curl "http://localhost:3001/api/dashboard/0xYOUR_WALLET_ADDRESS_HERE" | jq '{positions: .data.stats.totalPositions, value: .data.stats.totalValueUSD, protocols: (.data.stats.byProtocol | length)}'
```

---

## 📊 Response Examples

### Discovery Response
```json
{
  "success": true,
  "data": [{
    "poolName": "uniswap-v3 - WETH-ADO",
    "protocol": "uniswap-v3",
    "apy": 486.58,
    "totalValueUSD": 3193495,
    "chain": "ethereum"
  }],
  "count": 50
}
```

### Dashboard Response  
```json
{
  "success": true,
  "data": {
    "address": "0xda3720...",
    "positions": [/* 158 positions */],
    "stats": {
      "totalPositions": 158,
      "totalValueUSD": 2514.31,
      "avgAPY": 15.2,
      "byProtocol": {
        "Ethena": {"count": 3, "value": 887.39},
        "Ether.fi": {"count": 3, "value": 565.51}
        // ... 57 more
      }
    },
    "meta": {
      "dataSource": "Zapper GraphQL"
    }
  }
}
```

---

## 🎯 Data Coverage

| Endpoint | Protocols | Chains | Data Source |
|----------|-----------|--------|-------------|
| `/api/positions` | 1000+ | 10+ | DefiLlama |
| `/api/dashboard/:address` | 800+ | 10+ | Zapper GraphQL |

**Protocols Include**:
Uniswap, Aave, Compound, Pendle, Beefy, Yearn, Curve, Balancer, GMX, Radiant, Stargate, Morpho, Gearbox, Silo, Dolomite, Extra Finance, EigenLayer, Ether.fi, Symbiotic, Ethena, and 980+ more!

---

## 🔑 Quick Facts for Team

- ✅ **Running**: http://localhost:3001
- ✅ **Status**: Production ready
- ✅ **Rate Limit**: 100 requests / 15 minutes
- ✅ **Caching**: 30 min (discovery), 30 sec (personal)
- ✅ **Real Data**: 100% (no mock)
- ✅ **Coverage**: 1000+ protocols
- ✅ **Tested**: 158 positions successfully fetched

---

## 📦 Files for Team

1. **`BACKEND_ENDPOINTS_DEMO.md`** - Full detailed documentation
2. **`ApyHub_API_Postman_Collection.json`** - Import to Postman for testing
3. **`API_QUICK_REFERENCE.md`** - This file (quick reference)

---

**Ready for team demo!** 🎉

