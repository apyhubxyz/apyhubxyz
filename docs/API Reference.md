# API Reference

This document provides detailed information about the ApyHub API endpoints.

## Base URL
```
https://api.apyhub.com
```

## Authentication
Most endpoints require authentication via API key. Include the key in the request header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Enhanced APY Routes

#### GET /api/enhanced-apy/positions
Get all positions with advanced filtering.

**Query Parameters:**
- `chains` (string[]): Filter by blockchain chains
- `protocols` (string[]): Filter by protocols
- `minAPY` (number): Minimum APY filter
- `maxAPY` (number): Maximum APY filter
- `minTVL` (number): Minimum TVL filter
- `riskLevels` (string[]): Filter by risk levels
- `poolTypes` (string[]): Filter by pool types
- `assets` (string[]): Filter by assets
- `sortBy` (string): Sort field (default: 'apy')
- `sortOrder` (string): Sort order (default: 'desc')
- `limit` (number): Results limit (default: 100)
- `offset` (number): Results offset (default: 0)

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "count": 50,
  "data": [...]
}
```

#### GET /api/enhanced-apy/strategies/:address
Get yield strategies for a user.

**Parameters:**
- `address` (string): Wallet address

**Query Parameters:**
- `targetAPY` (number): Target APY
- `riskTolerance` (string): Risk tolerance level

#### GET /api/enhanced-apy/opportunities
Get top yield opportunities.

**Query Parameters:**
- `category` (string): Strategy category
- `chain` (string): Blockchain chain
- `minAPY` (number): Minimum APY (default: 10)

### Pools Routes

#### GET /api/pools
Get all pools with filters.

**Query Parameters:**
- `asset` (string): Asset filter
- `poolType` (string): Pool type filter
- `protocolId` (string): Protocol ID filter
- `chain` (string): Chain filter
- `minAPY` (number): Minimum APY
- `maxAPY` (number): Maximum APY
- `riskLevel` (string): Risk level
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort order
- `page` (number): Page number
- `limit` (number): Results per page

#### GET /api/pools/:id
Get pool by ID.

**Parameters:**
- `id` (string): Pool ID

#### GET /api/pools/top/:limit
Get top pools.

**Parameters:**
- `limit` (number): Number of pools to return

### Portfolio Routes

#### GET /api/portfolio/:address
Get user portfolio by wallet address.

**Parameters:**
- `address` (string): Wallet address

#### POST /api/portfolio/:address/positions
Add position to portfolio.

**Parameters:**
- `address` (string): Wallet address

**Body:**
```json
{
  "poolId": "string",
  "amount": "number",
  "amountUSD": "number"
}
```

#### GET /api/portfolio/:address/watchlist
Get user watchlist.

**Parameters:**
- `address` (string): Wallet address

### Positions Routes

#### GET /api/positions
Get all available LP opportunities.

**Query Parameters:**
- `protocol` (string): Filter by protocol
- `chainId` (number): Filter by chain ID
- `search` (string): Search query
- `sortBy` (string): Sort field
- `minAPY` (number): Minimum APY
- `minTVL` (number): Minimum TVL
- `limit` (number): Results limit

#### GET /api/positions/stats
Get position statistics.

#### GET /api/positions/protocols
Get list of available protocols.

### AI Routes

#### POST /api/ai/chat
Chat with AI assistant.

**Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ],
  "walletAddress": "string",
  "sessionId": "string"
}
```

#### POST /api/ai/suggest
Get simple AI suggestions.

**Body:**
```json
{
  "walletAddress": "string",
  "assets": ["string"]
}
```

### Bridge Routes

#### GET /api/bridge/routes
Get available bridge routes.

**Query Parameters:**
- `fromChain` (string): Source chain
- `toChain` (string): Destination chain
- `token` (string): Token address
- `amount` (string): Amount to bridge
- `recipient` (string): Recipient address

#### POST /api/bridge/quote
Create bridge quote.

**Body:**
```json
{
  "fromChain": "ethereum",
  "toChain": "arbitrum",
  "token": "0x...",
  "amount": "1000000000000000000",
  "recipient": "0x..."
}
```

#### POST /api/bridge/execute
Execute bridge transaction.

**Body:**
```json
{
  "fromChain": 1,
  "toChain": 42161,
  "token": "0x...",
  "amount": "1000000000000000000",
  "recipient": "0x...",
  "mode": "bridge",
  "executeAction": "swap"
}
```

### Dashboard Routes

#### GET /api/dashboard/:address
Get user's actual positions from blockchain.

**Parameters:**
- `address` (string): Wallet address

### Strategy AI Routes

#### POST /api/strategy-ai/recommend
Get advanced DeFi strategy recommendations.

**Body:**
```json
{
  "query": "string",
  "portfolio": {},
  "riskTolerance": "medium"
}
```

#### POST /api/strategy-ai/chat
Chat with AI using RAG-enhanced context.

**Body:**
```json
{
  "messages": [...],
  "portfolio": {}
}
```

## Error Handling

All endpoints return errors in the following format:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

API requests are rate limited. Standard limits:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

## WebSocket Support

Real-time updates are available via WebSocket at:
```
ws://api.apyhub.com/positions
```

## SDKs and Libraries

- JavaScript/TypeScript SDK: `npm install @apyhub/sdk`
- Python SDK: `pip install apyhub-sdk`
- Go SDK: `go get github.com/apyhub/go-sdk`