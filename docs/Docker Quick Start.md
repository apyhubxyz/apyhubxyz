# Docker Quick Start

This guide provides a quick way to get ApyHub running locally using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- At least 4GB of available RAM
- Git (optional, for cloning the repository)

## Quick Start

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd apyhubxyz
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to initialize**
   - Backend API will be available at `http://localhost:3001`
   - Frontend will be available at `http://localhost:3000`
   - Database and Redis will run in containers

## Service Overview

### Backend Container
- **Port**: 3001
- **Environment**: Development
- **Features**: API endpoints, AI services, database connections

### Frontend Container
- **Port**: 3000
- **Framework**: Next.js with TypeScript
- **Features**: Web interface, charts, portfolio management

### Database Container
- **Port**: 5432 (internal)
- **Type**: PostgreSQL
- **Volume**: Persistent data storage

### Redis Container
- **Port**: 6379 (internal)
- **Purpose**: Caching and session management

### Nginx Container
- **Port**: 80
- **Purpose**: Reverse proxy and load balancing

## Development Workflow

1. **View logs**
   ```bash
   docker-compose logs -f [service-name]
   ```

2. **Restart services**
   ```bash
   docker-compose restart [service-name]
   ```

3. **Rebuild after code changes**
   ```bash
   docker-compose up --build -d
   ```

4. **Stop all services**
   ```bash
   docker-compose down
   ```

## Environment Configuration

For development, the default configuration should work out of the box. For production deployment, refer to the Deployment Guide.

## Troubleshooting

- **Port conflicts**: Ensure ports 3000, 3001, 5432, 6379 are available
- **Memory issues**: Increase Docker memory allocation to 4GB+
- **Database connection**: Check if PostgreSQL container is running
- **Build failures**: Clear Docker cache with `docker system prune`

## Next Steps

- Explore the API endpoints at `http://localhost:3001/docs`
- Access the web interface at `http://localhost:3000`
- Refer to the API Reference for detailed endpoint documentation