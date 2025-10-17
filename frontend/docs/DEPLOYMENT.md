# Deployment Guide

Quick guide for deploying Apyhub frontend.

## Vercel (Recommended)

Easiest way to deploy:

1. Push your code to GitHub
2. Import project in Vercel
3. Set env variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
4. Deploy!

That's literally it. Vercel handles everything else.

## Manual Deployment

### Build locally

```bash
npm run build
npm start
```

### Using PM2

```bash
npm run build
pm2 start npm --name "apyhub-frontend" -- start
```

### Docker

```dockerfile
# Dockerfile (need to create this properly)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Config

If you're old school and using nginx:

```nginx
server {
    listen 80;
    server_name apyhub.xyz;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

Don't forget to set these in production:

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL for live data
- Add more as needed

## Performance Tips

- Enable caching headers
- Use CDN for static assets
- Consider ISR for dynamic pages
- Monitor Core Web Vitals

## Monitoring

Set up monitoring with:
- Vercel Analytics (built-in)
- Google Analytics
- Sentry for error tracking

## SSL

- Use Let's Encrypt for free SSL
- Or Cloudflare proxy (also free)

---

**Note:** This is a basic guide. Adjust based on your infrastructure needs.