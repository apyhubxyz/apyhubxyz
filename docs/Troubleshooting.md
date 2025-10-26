# Troubleshooting

This guide helps you resolve common issues when using ApyHub.

## Docker Issues

### Port Conflicts
**Problem:** Docker containers fail to start due to port conflicts.

**Solution:**
```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :5432

# Stop conflicting services or change ports in docker-compose.yml
# Then restart containers
docker-compose down
docker-compose up -d
```

### Memory Issues
**Problem:** Containers crash with out-of-memory errors.

**Solution:**
- Increase Docker memory allocation to at least 4GB
- Reduce concurrent requests
- Use lighter base images

### Build Failures
**Problem:** Docker build fails during image creation.

**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check build logs
docker-compose build --progress=plain
```

## API Issues

### Rate Limiting
**Problem:** Receiving 429 Too Many Requests errors.

**Solution:**
- Implement exponential backoff in your client
- Cache responses locally
- Upgrade to higher tier API plan
- Use WebSocket connections for real-time data

### Authentication Errors
**Problem:** 401 Unauthorized or 403 Forbidden responses.

**Solution:**
- Verify API key is correct and not expired
- Check API key has required permissions
- Ensure proper Authorization header format
- Confirm account is in good standing

### Data Inconsistencies
**Problem:** API returns outdated or incorrect data.

**Solution:**
- Clear application cache
- Wait for data synchronization (up to 5 minutes)
- Check blockchain network status
- Report issue if problem persists

## Frontend Issues

### Loading Problems
**Problem:** Page fails to load or shows blank screen.

**Solution:**
```bash
# Clear browser cache and cookies
# Hard refresh: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)

# Check network connectivity
ping api.apyhub.com

# Verify API endpoints are accessible
curl https://api.apyhub.com/health
```

### Wallet Connection Issues
**Problem:** Cannot connect wallet or transactions fail.

**Solution:**
- Ensure MetaMask or wallet is updated
- Check network selection (Mainnet/Testnet)
- Verify sufficient gas fees
- Confirm wallet has required permissions

### Chart Rendering Issues
**Problem:** Charts don't display or show incorrect data.

**Solution:**
- Enable JavaScript in browser
- Disable ad blockers temporarily
- Clear browser cache
- Try different browser (Chrome, Firefox, Safari)

## Backend Issues

### Database Connection Problems
**Problem:** Application cannot connect to database.

**Solution:**
```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database connection
docker-compose restart backend
```

### Redis Cache Issues
**Problem:** Caching not working or causing errors.

**Solution:**
```bash
# Check Redis status
docker-compose ps redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# Restart Redis service
docker-compose restart redis
```

### AI Service Failures
**Problem:** AI features not working.

**Solution:**
- Verify AI service API keys are configured
- Check AI service logs for errors
- Ensure sufficient API quota remaining
- Fallback to basic functionality if AI is unavailable

## Performance Issues

### Slow Response Times
**Problem:** API calls take too long to respond.

**Solution:**
- Enable response compression
- Implement proper caching strategies
- Optimize database queries
- Use CDN for static assets
- Consider upgrading server resources

### High Memory Usage
**Problem:** Application consumes excessive memory.

**Solution:**
- Monitor memory usage with tools like `htop`
- Implement memory limits in Docker
- Optimize code for memory efficiency
- Use streaming for large data transfers

## Network Issues

### Connection Timeouts
**Problem:** Requests timeout frequently.

**Solution:**
- Increase timeout values in client configuration
- Check network connectivity and stability
- Verify firewall settings
- Use retry logic with exponential backoff

### SSL/TLS Errors
**Problem:** Certificate validation failures.

**Solution:**
- Update root certificates on system
- Check system clock is accurate
- Verify SSL certificate is valid
- Use HTTP for local development

## Deployment Issues

### Environment Variable Problems
**Problem:** Application fails to start due to missing env vars.

**Solution:**
- Verify all required environment variables are set
- Check variable naming and case sensitivity
- Ensure .env file is in correct location
- Use default values where appropriate

### Container Orchestration Issues
**Problem:** Services fail to communicate in containerized environment.

**Solution:**
- Verify docker-compose.yml network configuration
- Check service dependencies are correctly defined
- Ensure services start in correct order
- Use docker-compose logs to debug inter-service communication

## Monitoring and Logging

### Log Analysis
**Problem:** Need to debug application behavior.

**Solution:**
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Filter logs by time
docker-compose logs --since "1h" backend

# Search logs for specific errors
docker-compose logs backend | grep "ERROR"
```

### Health Checks
**Problem:** Need to verify service health.

**Solution:**
```bash
# Check all services
docker-compose ps

# Test API health endpoint
curl http://localhost:3001/health

# Database connectivity test
docker-compose exec postgres pg_isready
```

## Getting Help

If you cannot resolve an issue:

1. **Check the GitHub Issues page** for similar problems
2. **Review recent changes** in the changelog
3. **Contact support** with detailed information:
   - Error messages and stack traces
   - Steps to reproduce the issue
   - System information (OS, Docker version, etc.)
   - Relevant log files

## Prevention

- Keep dependencies updated
- Monitor resource usage regularly
- Implement proper error handling
- Use health checks in production
- Maintain backup and recovery procedures