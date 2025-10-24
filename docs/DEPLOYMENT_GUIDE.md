# ApyHub Deployment Guide

## 🎯 What You've Built

A complete DeFi yield aggregator with:
- ✅ **Backend**: Real position fetching from 1000+ protocols
- ✅ **Frontend**: Pools page (discovery) + Dashboard (your positions)
- ✅ **Infrastructure**: Redis caching, PostgreSQL, Docker setup

---

## 🚀 Deployment Process (Simple Steps)

### Option 1: Docker Compose (Easiest - Recommended)

This runs everything together: Backend + Frontend + Database + Redis

#### Step 1: Create `.env` File
Create a file called `.env` in the project root with this content:

```env
# Database
POSTGRES_DB=apyhub
POSTGRES_USER=apyhub
POSTGRES_PASSWORD=your_secure_password_here

# Backend API Keys
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/Qb1HjrRk7epyN-yl1MjjcZRx1r3CmSHj
ENVIO_HYPERSYNC_API_KEY=6564a7cc-080f-47e2-8b57-2c06b95efac9
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

#### Step 2: Run with Docker
In your terminal (from project root):

```bash
# Build and start all services
docker-compose up --build

# Or run in background (detached mode)
docker-compose up -d --build
```

**What this does:**
- Builds backend Docker image (Node.js + TypeScript)
- Builds frontend Docker image (Next.js)
- Starts PostgreSQL database
- Starts Redis cache
- Connects everything via network

#### Step 3: Access Your App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

#### Step 4: Stop Services
```bash
docker-compose down
```

---

### Option 2: Manual Running (Development)

If you don't want Docker:

#### Backend:
```bash
cd backend
npm install
npm run build
npm start
```

#### Frontend:
```bash
cd frontend
npm install
npm run build
npm start
```

Make sure Redis and PostgreSQL are running separately.

---

## 📊 Frontend-Backend Connection

### How It Works

```
┌─────────────────────────────────────────────┐
│  Frontend Pages                             │
└────────┬────────────────────────────────────┘
         │
         ├─► Pools Page (/pools)
         │   └─► apiClient.positions.getAllOpportunities()
         │       └─► GET /api/positions?minAPY=10
         │           └─► DefiLlama (1000+ protocols)
         │               └─► Returns: Pendle, Beefy, Yearn, Aave, etc.
         │
         └─► Dashboard (/portfolio)
             └─► apiClient.dashboard.getMyPositions(address)
                 └─► GET /api/dashboard/:address
                     └─► Blockchain (Uniswap V3, Aave contracts)
                         └─► Returns: YOUR actual positions
```

### Frontend API Calls

**Pools Page** (`app/pools/page.tsx`):
```typescript
// Fetch ALL opportunities (no wallet needed)
const { data } = useQuery({
  queryKey: ['all-opportunities'],
  queryFn: () => apiClient.positions.getAllOpportunities({
    minAPY: 10,
    minTVL: 1000000,
    limit: 50,
  })
});

// Shows: Uniswap, Aave, Pendle, Beefy, Yearn, etc.
```

**Dashboard** (`app/portfolio/page.tsx`):
```typescript
// Fetch YOUR positions (requires wallet)
const { address } = useAccount();  // RainbowKit/Wagmi

const { data } = useQuery({
  queryKey: ['dashboard', address],
  queryFn: () => apiClient.dashboard.getMyPositions(address),
  enabled: !!address  // Only when wallet connected
});

// Shows: Your Uniswap NFTs, Aave deposits, etc.
```

---

## 🧪 Testing the Integration

### 1. Test Backend (Must be running)
```bash
# Test pools endpoint (for Pools page)
curl "http://localhost:3001/api/positions?minAPY=20&limit=5"

# Test dashboard endpoint (for Portfolio)
curl "http://localhost:3001/api/dashboard/0xYOUR_ADDRESS"
```

### 2. Test Frontend
```bash
# Start frontend
cd frontend && npm run dev

# Visit pages:
# - http://localhost:3000/pools (shows ALL opportunities)
# - http://localhost:3000/portfolio (connect wallet, shows YOUR positions)
```

---

## 🔧 Environment Variables Summary

| Variable | Purpose | Required |
|----------|---------|----------|
| `RPC_URL` | Ethereum RPC (Alchemy/Infura) | ✅ Yes |
| `ENVIO_HYPERSYNC_API_KEY` | Envio API key | Optional |
| `POSTGRES_PASSWORD` | Database password | ✅ Yes |
| `REDIS_HOST` | Redis host (default: localhost) | Optional |
| `OPENAI_API_KEY` | For AI agent | Optional |
| `ANTHROPIC_API_KEY` | For AI agent (Opus) | Optional |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | Auto-set |

---

## 🐳 Docker Commands Cheat Sheet

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up --build backend

# Stop everything
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## 🎯 What Each Service Does

| Service | Purpose | Port | URL |
|---------|---------|------|-----|
| **Redis** | Caches LP positions (30min) | 6379 | redis://localhost:6379 |
| **PostgreSQL** | Stores user data, protocols | 5432 | postgresql://localhost:5432 |
| **Backend** | API server (Express) | 3001 | http://localhost:3001 |
| **Frontend** | Next.js web app | 3000 | http://localhost:3000 |

---

## 🔑 Key Features Available

### Pools Page (`/pools`)
- ✅ Browse 1000+ DeFi protocols
- ✅ Filter by APY, TVL, protocol
- ✅ Real-time data from DefiLlama
- ✅ No wallet required

### Dashboard (`/portfolio`)
- ✅ Connect wallet (RainbowKit)
- ✅ See YOUR actual positions
- ✅ Real blockchain data (Uniswap, Aave)
- ✅ Portfolio stats (total value, APY)

---

## 📝 Next Steps After Deployment

1. **Test the Flow**:
   - Visit http://localhost:3000/pools (should show pools immediately)
   - Connect wallet on /portfolio (should fetch YOUR positions)

2. **Add More Protocols** (Optional):
   - Edit `backend/src/services/platforms/` to add custom adapters
   - Current: Using DefiLlama for 1000+ protocols (recommended)

3. **Production Deployment**:
   - Use provided Docker setup
   - Deploy to AWS/DigitalOcean with `docker-compose`
   - Or use Vercel (frontend) + Railway (backend)

---

## ✅ Summary

**Simple Process**:
1. Create `.env` file with API keys
2. Run `docker-compose up --build`
3. Visit http://localhost:3000
4. Done! 🎉

**Your app now**:
- Fetches REAL data from 1000+ DeFi protocols
- Shows ALL opportunities on Pools page
- Shows YOUR positions on Dashboard (after wallet connect)
- Fully optimized backend architecture ✅

