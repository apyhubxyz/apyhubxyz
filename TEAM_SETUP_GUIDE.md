# 🚀 ApyHub - Team Setup & Testing Guide

## Quick Start (5 Minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/apyhubxyz/apyhubxyz.git
cd apyhubxyz
git checkout feature-mojtaba
```

---

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 3. Set Up Environment
Create `.env` file in project root:

```env
# Database
POSTGRES_PASSWORD=your_password

# API Keys (already configured - use these)
DEBANK_API_KEY=d099aa26d4dcceb4705398b9038849d038a0df35
ZAPPER_API_KEY=dfb5bff7-6564-4631-8efb-871768e61bb4
ENVIO_HYPERSYNC_API_KEY=6564a7cc-080f-47e2-8b57-2c06b95efac9
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/Qb1HjrRk7epyN-yl1MjjcZRx1r3CmSHj
```

---

### 4. Start with Docker (Easiest!)
```bash
# Start everything (Redis, PostgreSQL, Backend, Frontend)
docker-compose up --build

# Wait 2-3 minutes, then visit:
# → Frontend: http://localhost:3000
# → Backend: http://localhost:3001
```

**OR** start manually:

```bash
# Terminal 1 - Start Redis
brew install redis
brew services start redis

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

---

## 🧪 Test the API (Copy-Paste These)

### Test 1: Health Check
```bash
curl http://localhost:3001/api/health
```
Expected: `{"status":"ok"}`

---

### Test 2: Discovery - Browse Opportunities
```bash
curl "http://localhost:3001/api/positions?minAPY=20&limit=3"
```
Expected: Top 3 pools with >20% APY from 1000+ protocols

**Example Result**:
```json
{
  "data": [
    {"protocol": "uniswap-v3", "poolName": "WETH-ADO", "apy": 486%, "tvl": $3.1M}
  ]
}
```

---

### Test 3: Personal Dashboard - Get User's All Positions ⭐
```bash
curl "http://localhost:3001/api/dashboard/0xda3720e03d30acb8d52de68e34fa66c1e5a26849"
```
Expected: 158 positions across 59 protocols

**Example Result**:
```json
{
  "data": {
    "stats": {
      "totalPositions": 158,
      "totalValueUSD": 2514.31,
      "byProtocol": {
        "Ethena": {"count": 3, "value": 887},
        "Ether.fi": {"count": 3, "value": 565},
        "EigenLayer": {"count": 1, "value": 203},
        // ... 56 more protocols
      }
    },
    "meta": {
      "dataSource": "Zapper GraphQL"
    }
  }
}
```

---

### Test 4: Filter by Protocol
```bash
curl "http://localhost:3001/api/positions?protocol=aave&limit=5"
```
Expected: Aave pools only

---

### Test 5: Position Stats
```bash
curl "http://localhost:3001/api/positions/stats"
```
Expected: Aggregate statistics

---

## 🎯 Main Endpoints Reference

| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `GET /api/positions` | Browse 1000+ protocols | Pools page |
| `GET /api/dashboard/:address` | User's positions (800+ protocols) | Portfolio page |
| `GET /api/pools` | Pool discovery | Pools page |
| `GET /api/health` | System status | Monitoring |

---

## 🌐 Frontend Pages

After starting, visit:

1. **Home**: http://localhost:3000
2. **Pools** (Discovery): http://localhost:3000/pools
   - Shows ALL yield opportunities
   - No wallet needed
3. **Portfolio** (Dashboard): http://localhost:3000/portfolio
   - Connect wallet OR enter address
   - Shows YOUR 158 positions!

---

## 🔑 What Makes This Special

- ✅ **Real Data**: Fetches from Zapper GraphQL (800+ protocols)
- ✅ **Comprehensive**: 158 positions in test (Ethena, EigenLayer, Ether.fi, etc.)
- ✅ **Dual Mode**: Wallet connect OR manual address entry
- ✅ **Fast**: 30-second caching
- ✅ **Reliable**: 3-tier fallback (DeBank → Zapper → Blockchain)

---

## 📊 Test Results to Show

When you run the dashboard endpoint with test address:

**Fetches from these protocols**:
- Ethena (3 positions, $887)
- Ether.fi (3 positions, $565)
- EigenLayer (1 position, $203)
- Extra Finance (3 positions, $191)
- Symbiotic (1 position, $143)
- Aave V3 (20 positions across chains!)
- Uniswap V3 (19 positions!)
- Pendle, Balancer, Curve, GMX, Beefy, Yearn
- **And 53 more protocols!**

---

## 🐳 Docker Quick Start (Recommended)

```bash
# One command to rule them all
docker-compose up --build

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - Database: Auto-configured
# - Redis: Auto-configured
```

---

## 🆘 Troubleshooting

**Port 3001 in use?**
```bash
lsof -i :3001
kill -9 <PID>
```

**Redis not running?**
```bash
brew services start redis
```

**Need to reset?**
```bash
docker-compose down -v
docker-compose up --build
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend running: `curl http://localhost:3001/api/health`
- [ ] Discovery works: `curl "http://localhost:3001/api/positions?limit=1"`
- [ ] Dashboard works: `curl "http://localhost:3001/api/dashboard/0xda3720e03d30acb8d52de68e34fa66c1e5a26849"`
- [ ] Frontend loads: Open http://localhost:3000
- [ ] Pools page shows data: http://localhost:3000/pools
- [ ] Portfolio works: http://localhost:3000/portfolio

---

## 📦 Project Structure

```
apyhubxyz/
├── backend/           # Express API (port 3001)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── positions.ts      # Discovery endpoint
│   │   │   └── dashboard.ts      # Personal positions ⭐
│   │   └── services/
│   │       ├── ZapperGraphQLFetcher.ts   # 1000+ protocols
│   │       ├── DeBankPositionFetcher.ts  # 800+ protocols  
│   │       └── DefiLlamaAggregator.ts    # Discovery
│   └── indexer/       # Envio config
├── frontend/          # Next.js app (port 3000)
│   └── app/
│       ├── pools/     # Discovery page
│       └── portfolio/ # Dashboard (wallet + address search)
└── docker-compose.yml # One-command deployment
```

---

## 🎯 Key Features

1. **Discovery**: Browse 1000+ DeFi protocols (Pools page)
2. **Dashboard**: View ANY wallet's positions across 800+ protocols
3. **Dual Mode**: Wallet connect OR manual address entry
4. **Real Data**: Zapper GraphQL, DeBank, DefiLlama
5. **Fast**: Redis caching (30s-30min)
6. **Reliable**: Multi-tier fallback system

---

## 📞 Support

**Questions?** Check these docs:
- `SIMPLE_GUIDE.md` - Beginner overview
- `DOCKER_QUICK_START.md` - Docker deployment
- `API_QUICK_REFERENCE.md` - Endpoint cheat sheet

**Status**: ✅ Production Ready  
**Last Updated**: Oct 24, 2025  
**Branch**: feature-mojtaba

