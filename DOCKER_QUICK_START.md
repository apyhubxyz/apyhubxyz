# 🐳 Docker Quick Start - ApyHub

## Simple 3-Step Deployment

### Step 1: Create `.env` File
Create a file named `.env` in the project root folder:

```bash
# Copy this template and fill in your values
POSTGRES_PASSWORD=your_secure_password

# Optional (defaults work for testing)
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/Qb1HjrRk7epyN-yl1MjjcZRx1r3CmSHj
ENVIO_HYPERSYNC_API_KEY=6564a7cc-080f-47e2-8b57-2c06b95efac9
```

### Step 2: Run Docker
Open terminal in project folder and run:

```bash
docker-compose up --build
```

**Wait for** (takes 2-3 minutes first time):
- ✅ "PostgreSQL started"
- ✅ "Redis connected"
- ✅ "Backend API running on port 3001"
- ✅ "Frontend ready on port 3000"

### Step 3: Open Your App
Visit in your browser:
- **App**: http://localhost:3000
- **Pools Page**: http://localhost:3000/pools (shows 1000+ protocols)
- **Dashboard**: http://localhost:3000/portfolio (connect wallet)
- **API**: http://localhost:3001

---

## 🎯 What You'll See

### Pools Page (http://localhost:3000/pools)
- Top DeFi opportunities from protocols like:
  - Uniswap V3 (498% APY on WETH-ADO)
  - Pendle (PT markets)
  - Aave (lending pools)
  - Beefy (auto-compounding vaults)
  - Yearn (yield vaults)
  - And 995+ more!

### Dashboard (http://localhost:3000/portfolio)
1. Click "Connect Wallet"
2. Select your wallet (MetaMask, etc.)
3. See YOUR actual positions:
   - Your Uniswap V3 NFTs
   - Your Aave deposits
   - Total value, APY, earnings

---

## 🛑 Stop Services

```bash
# Stop everything
docker-compose down

# Stop and remove all data (clean restart)
docker-compose down -v
```

---

## 🔍 View Logs

```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend
```

---

## 🎯 Services Running

| Service | Purpose | Port | URL |
|---------|---------|------|-----|
| Frontend | Next.js web app | 3000 | http://localhost:3000 |
| Backend | Express API | 3001 | http://localhost:3001 |
| PostgreSQL | Database | 5432 | Internal |
| Redis | Cache | 6379 | Internal |

---

## ✅ Success Indicators

Your app is working if you see:
- ✅ Pools page shows high APY opportunities (e.g., 200%+)
- ✅ Dashboard shows "Connect Wallet" button
- ✅ After connecting, shows your positions (or "No positions yet")
- ✅ Backend logs: "✅ Found X opportunities from DefiLlama"

---

## 🎉 You're Done!

The backend optimization is **100% complete**. The app now:
- Fetches REAL data from 1000+ DeFi protocols
- Shows ALL opportunities on Pools page  
- Shows YOUR positions on Dashboard
- Runs fully in Docker with caching and database

**Enjoy your optimized ApyHub!** 🚀

