# ApyHub Backend Architecture & API Flow

## 🏗️ Architecture Overview

ApyHub.xyz is a cross-chain yield farming dashboard powered by:
- **Envio HyperSync**: Real-time blockchain indexing for LP positions
- **Avail Nexus SDK**: Cross-chain bridge aggregation
- **AI Agent (Opus 4.1)**: Personalized yield strategy recommendations
- **Multi-layer Caching**: Redis + In-memory fallback

## 📁 Backend Structure

```
backend/
├── indexer/              # Envio HyperSync Configuration
│   ├── envio.config.ts   # Networks, protocols, events
│   ├── schema.graphql    # GraphQL data schema
│   └── fetchPositions.ts # Position fetching with caching
│
├── ai/                   # AI Agent (Python)
│   ├── agent.py          # Opus 4.1 powered strategy advisor
│   ├── agent_helpers.py  # Helper functions
│   ├── model_config.yaml # AI model configuration
│   └── prompts/          # Strategy prompts
│
├── bridge/               # Cross-chain Bridge
│   └── availBridge.ts    # Avail Nexus integration
│
├── api/                  # REST API Endpoints
│   ├── portfolio.ts      # User portfolio aggregation
│   ├── pools.ts          # Pool data endpoints
│   └── strategy.ts       # AI strategy recommendations
│
├── src/
│   ├── index.ts          # Express server entry
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   └── config/           # Configuration files
│
├── utils/                # Utilities
│   ├── env.ts            # Environment handler
│   ├── logger.ts         # Logging service
│   └── cache.ts          # Cache manager
│
└── tests/                # Test suites
    ├── envio.test.ts
    ├── bridge.test.ts
    └── aiAgent.test.py
```

## 🔄 Data Flow Architecture

```mermaid
graph TD
    A[User Request] --> B[Express API]
    B --> C{Route Handler}
    
    C --> D[Envio HyperSync]
    D --> E[Blockchain Data]
    E --> F[GraphQL Processing]
    
    C --> G[AI Agent]
    G --> H[Opus 4.1 / GPT-4]
    H --> I[Strategy Generation]
    
    C --> J[Avail Bridge]
    J --> K[Bridge Aggregators]
    K --> L[Cross-chain Routes]
    
    F --> M[Cache Layer]
    I --> M
    L --> M
    
    M --> N[Redis / Memory]
    N --> O[Response to User]
```

## 📍 API Endpoints

### Core Endpoints

#### 1. Position Management
```typescript
GET /api/positions
  Query: ?userAddress=0x...&chainId=1&protocol=Aave
  Response: LPPosition[]

POST /api/positions/sync
  Body: { userAddress: string }
  Response: { synced: boolean, positions: number }
```

#### 2. Pool Discovery
```typescript
GET /api/pools
  Query: ?limit=100&offset=0&orderBy=TVL_DESC
  Response: Pool[]

GET /api/pools/:poolId
  Response: PoolDetails
```

#### 3. Portfolio Analytics
```typescript
GET /api/portfolio/:address
  Response: {
    totalValueUSD: number,
    weightedAPY: number,
    positions: Position[],
    diversificationScore: number
  }

GET /api/portfolio/:address/stats
  Response: PortfolioStatistics
```

#### 4. AI Strategy
```typescript
POST /api/strategy/recommend
  Body: {
    walletAddress: string,
    targetAPY?: number,
    riskTolerance: "low" | "medium" | "high"
  }
  Response: YieldStrategy[]

POST /api/strategy/analyze
  Body: { strategyId: string }
  Response: RiskMetrics
```

#### 5. Bridge Operations
```typescript
POST /api/bridge/quote
  Body: {
    fromChain: string,
    toChain: string,
    token: string,
    amount: string
  }
  Response: BridgeQuote

POST /api/bridge/execute
  Body: { quoteId: string, signer: string }
  Response: BridgeTransaction
```

## 🚀 Key Features

### 1. Envio HyperSync Integration
- Real-time indexing of 50+ DeFi protocols
- Multi-chain support (Ethereum, Arbitrum, Optimism, Base)
- Event-based position tracking
- Automatic APY calculation

### 2. AI-Powered Recommendations
- **Opus 4.1 (Claude)** for advanced reasoning
- **GPT-4** fallback support
- Personalized strategy generation
- Risk-adjusted recommendations
- Market condition analysis

### 3. Cross-Chain Bridge Aggregation
- 10+ bridge protocols integrated
- Optimal route finding
- Gas optimization
- Single-click bridge & execute

### 4. Intelligent Caching
- Redis for distributed caching
- In-memory fallback when Redis unavailable
- TTL-based cache invalidation
- GraphQL response caching

## 🔐 Security Measures

1. **Rate Limiting**: 100 requests per 15 minutes per IP
2. **Input Validation**: Zod schema validation
3. **CORS Protection**: Whitelisted origins only
4. **API Key Authentication**: For premium features
5. **Smart Contract Audits**: Only audited protocols indexed

## 📊 Performance Optimizations

### Caching Strategy
```typescript
// Three-tier caching
1. CDN Edge Cache (CloudFlare) - Static assets
2. Redis Cache - API responses (60s TTL)
3. Memory Cache - Fallback when Redis down
```

### Database Optimization
```typescript
// Prisma with connection pooling
connectionLimit: 10
queryTimeout: 10000
pool: { min: 2, max: 10 }
```

### Indexing Performance
```typescript
// Batch processing
batchSize: 1000
maxRetries: 3
parallelQueries: 5
```

## 🛠️ Environment Variables

```env
# Blockchain
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/KEY
ENVIO_HYPERSYNC_API_KEY=your_envio_key

# AI Models
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Bridge
AVAIL_NEXUS_API_KEY=your_avail_key

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/apyhub
```

## 📈 Monitoring & Analytics

### Health Check
```typescript
GET /api/health
Response: {
  status: "operational",
  services: {
    api: "ok",
    database: "ok", 
    redis: "ok",
    blockchain: "ok"
  },
  latency: {
    db: 5,
    redis: 1,
    rpc: 120
  }
}
```

### Metrics Collection
- Request latency tracking
- Error rate monitoring
- Cache hit ratio
- AI usage statistics
- Bridge success rate

## 🔄 WebSocket Support

```typescript
// Real-time position updates
ws://localhost:3001/ws

// Subscribe to position updates
{ type: "subscribe", channel: "positions", address: "0x..." }

// Receive updates
{ type: "position_update", data: Position }
```

## 🧪 Testing Strategy

### Unit Tests
- Service layer testing
- Helper function validation
- Cache mechanism tests

### Integration Tests
- API endpoint testing
- Database operations
- External service mocks

### E2E Tests
- Full flow validation
- Multi-chain scenarios
- Bridge operation tests

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "timestamp": "2024-01-15T12:00:00Z",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 500
  }
}
```

### Error Response
```json
{
  "success": false,
  "timestamp": "2024-01-15T12:00:00Z",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid wallet address",
    "details": { ... }
  }
}
```

## 🚧 Current Issues & Solutions

### Issue: Redis Connection Errors
**Status**: Non-critical (fallback to memory cache active)
**Solution**: Redis is optional; system uses in-memory cache when unavailable

### Issue: Enhanced DeFi Service Disabled
**Status**: Temporary (module compatibility issues)
**Solution**: Using Envio HyperSync as primary data source

## 🎯 Next Steps

1. **Production Deployment**
   - Set up Redis cluster
   - Configure CDN caching
   - Enable rate limiting

2. **Monitoring Setup**
   - Grafana dashboards
   - Prometheus metrics
   - Error tracking (Sentry)

3. **Performance Tuning**
   - Query optimization
   - Index optimization
   - Connection pooling

4. **Security Hardening**
   - API key rotation
   - Request signing
   - DDoS protection

---

## 📚 Additional Resources

- [Envio Documentation](https://docs.envio.dev)
- [Avail Nexus SDK](https://docs.availproject.org)
- [Anthropic Claude API](https://docs.anthropic.com)
- [ApyHub Frontend Docs](./frontend_architecture.md)

## Updated API Flow
1. User requests data via frontend.
2. Backend routes handle request.
3. Fetch from Envio or cache.
4. AI processes if needed.
5. Return response.

```mermaid
graph TD
    Envio[Envio Hypersync] -->|fetchPositions.ts| Pools[/api/pools]
    Envio --> Portfolio[/api/portfolio]
    Portfolio --> Avail[Avail Bridge] --> Liquidity[cross-chain liquidity]
    Portfolio --> PYUSD[PayPal PYUSD]
    Portfolio --> AI[AI Agent]
    AI --> Prompt[advisor_prompt.txt]
    AI --> Strategy[strategy.ts]
```