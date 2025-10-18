# Apyhub - DeFi Yield Aggregator

A modern DeFi yield aggregator platform that helps users discover the best yield opportunities across multiple DeFi protocols.

## Monorepo Structure

This is a full-stack monorepo containing:
- **Frontend:** Next.js 14 application
- **Backend:** Express.js API with Prisma ORM
- **Database:** PostgreSQL
- **Infrastructure:** Docker Compose setup

## Overview

Apyhub (apyhub.xyz) is a decentralized APY aggregator that helps users discover the best yield opportunities across multiple DeFi protocols. The frontend provides a clean, responsive interface with real-time data visualization.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** React Icons

## Features

-  Real-time APY tracking across protocols
-  Interactive data visualization
-  Modern UI with glassmorphism effects
-  Fully responsive design
-  Dark mode support (system preference)
-  Optimized performance with lazy loading
-  Smooth animations and transitions

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Homepage
│   └── globals.css      # Global styles
├── components/
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Hero section
│   ├── Features.tsx     # Features grid
│   ├── APYShowcase.tsx  # Protocol APY display
│   ├── Benefits.tsx     # Platform benefits
│   ├── CTA.tsx          # Call-to-action section
│   └── Footer.tsx       # Footer with links
├── public/              # Static assets
└── package.json         # Dependencies
```

## Design System

### Colors

- **Primary (Brown):** Various shades from `brown-50` to `brown-950`
- **Secondary (Purple):** Various shades from `purple-50` to `purple-950`
- **Accent:** Gradient combinations of brown and purple

### Typography

- **Headings:** Poppins font
- **Body:** Inter font

## Development Notes

### Component Guidelines

- All components use client-side rendering (`'use client'`)
- Motion animations are implemented with Framer Motion
- Components follow a consistent structure with TypeScript

### Performance Considerations

- Images are optimized with Next.js Image component
- Lazy loading for below-the-fold content
- CSS animations use GPU acceleration where possible

### Known Issues

- [ ] Mobile menu animation could be smoother
- [ ] Need to implement actual Web3 wallet connection
- [ ] APY data currently using mock data
- [ ] Newsletter subscription not connected to backend

## API Integration

The frontend is designed to connect with the Apyhub backend API. Currently using mock data for development.

### Endpoints (To be implemented)

- `GET /api/protocols` - Fetch supported protocols
- `GET /api/apy/:protocol` - Get APY rates for specific protocol
- `GET /api/stats` - Platform statistics
- `POST /api/subscribe` - Newsletter subscription

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+ (or use Docker)
- npm or yarn

### Environment Setup

**This project uses a centralized `.env` file in the root directory.** All environment variables for frontend, backend, and database are configured in one place.

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and configure your values:
```env
# Database
POSTGRES_PASSWORD=your_secure_password

# Blockchain RPC (get from Alchemy/Infura)
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# WalletConnect (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# OpenAI (optional, for AI chat)
OPENAI_API_KEY=sk-your_key
```

### Local Development

#### Option 1: Without Docker

1. Install dependencies:
```bash
# Backend
cd backend
npm install
npm run db:generate
npm run db:push

# Frontend
cd ../frontend
npm install
```

2. Start development servers:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

#### Option 2: With Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

### Production Deployment

```bash
# Build with Docker
docker-compose --profile production up -d

# Or build manually
cd backend && npm run build
cd ../frontend && npm run build
```

## Environment Variables Reference

All variables are now centralized in the root [`.env`](.env.example:1) file:

**Database:**
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_PORT` - Database port
- `DATABASE_URL` - Prisma connection string

**Backend:**
- `NODE_ENV` - Environment (development/production)
- `BACKEND_PORT` - Backend API port
- `RPC_URL` - Blockchain RPC endpoint
- `CORS_ORIGIN` - Allowed origins
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `CACHE_TTL` - Cache time-to-live
- `RATE_LIMIT_WINDOW_MS` - Rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `LOG_LEVEL` - Logging level

**Frontend:**
- `FRONTEND_PORT` - Frontend port
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

## Project Structure

```
apyhubxyz/
├── .env.example              # Centralized environment config
├── docker-compose.yml        # Docker services
├── backend/
│   ├── src/
│   │   ├── index.ts         # Express server
│   │   ├── routes/          # API routes
│   │   └── services/        # Business logic
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   └── package.json
└── nginx/
    └── nginx.conf           # Reverse proxy config
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

- Website(Soon): [apyhub.xyz](https://apyhub.xyz)

---

Built with ❤️ by the Apyhub team