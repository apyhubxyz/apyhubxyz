# ApyHub

A modern DeFi dashboard that helps you track yield opportunities and manage your positions across multiple protocols.

## What is this?

ApyHub aggregates APY data from various DeFi lending protocols like Aave, Compound, and others. It gives you a clean interface to compare rates, track your portfolio, and get AI-powered insights about your positions.

## Stack

**Frontend**
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- RainbowKit for wallet connections
- Recharts for data visualization

**Backend**
- Express.js API
- PostgreSQL with Prisma ORM
- WebSocket for real-time updates
- Redis for caching

**Infrastructure**
- Docker Compose for local development
- Nginx reverse proxy for production
- Envio for blockchain indexing

## Quick Start

### Local Development

1. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Run with Docker** (recommended)
   ```bash
   docker-compose up -d
   ```

   Visit:
   - Frontend: http://localhost:3002
   - API: http://localhost:3003

3. **Or run manually**
   ```bash
   # Backend
   cd backend
   npm install
   npm run db:push
   npm run dev

   # Frontend (in another terminal)
   cd frontend
   npm install
   npm run dev
   ```

### Production

```bash
make prod-up
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment details.

## Key Features

**Cross-Chain Bridge** 🌉
Bridge assets between Ethereum, Arbitrum, Optimism, Base, and Polygon using Avail Nexus SDK. Real transactions with optimized routes and minimal fees.

**Portfolio Tracking**
Connect your wallet to see all your DeFi positions in one place. The dashboard fetches your lending positions, liquidity pools, and calculates your total value.

**Real-Time APY Data**
Live updates on interest rates across protocols. Data is cached and refreshed automatically.

**AI Assistant**
Ask questions about DeFi strategies, protocols, or your portfolio. Powered by OpenAI.

**Multi-Protocol Support**
Currently tracking Aave, Compound, Spark, and more. Easy to add new protocols.

## Project Structure

```
apyhubxyz/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   └── services/        # Business logic
│   └── prisma/              # Database schema
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   └── hooks/               # Custom hooks
├── docs/                    # Documentation
├── scripts/                 # Deployment scripts
└── nginx/                   # Reverse proxy config
```

## API Endpoints

```
GET  /api/pools              # List all lending pools
GET  /api/protocols          # Supported protocols
GET  /api/positions/:address # User positions
GET  /api/dashboard/:address # Dashboard data
POST /api/ai/chat           # AI assistant
WS   /ws                     # Real-time updates
```

## Environment Variables

The project uses a single `.env` file in the root directory. Here are the key variables you'll need:

```env
# Database
POSTGRES_PASSWORD=your_password

# Blockchain
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# APIs (optional)
OPENAI_API_KEY=sk-...
ENVIO_HYPERSYNC_API_KEY=...

# Frontend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

See [.env.example](.env.example) for the complete list with detailed comments.

## Development Notes

**Adding a new protocol:**
1. Add protocol config to `backend/src/config/protocols.ts`
2. Implement rate fetching in `backend/src/services/`
3. Add to supported protocols list

**Database changes:**
```bash
cd backend
npx prisma migrate dev --name your_migration
```

**Running tests:**
```bash
cd backend && npm test
cd frontend && npm test
```

## Documentation

- [Documentation](docs/Documentation.md)
- [Deployment Guide](docs/Deployment%20Guide.md)
- [Docker Quick Start](docs/Docker%20Quick%20Start.md)
- [API Reference](docs/API%20Reference.md)
- [Troubleshooting](docs/Troubleshooting.md)
## Contributing

We welcome contributions. Please:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Links

- Website: [apyhub.xyz](https://apyhub.xyz)
- Telegram: [t.me/apyhubxyz](https://t.me/apyhubxyz)

---

Built for the DeFi community.
