# 🔧 ApyHub Troubleshooting Guide

## Issue: Frontend Not Showing Pools or Positions

### Common Causes & Fixes

---

## ✅ Quick Fix (Most Likely)

**Problem**: Frontend can't reach backend API

**Solution**: Restart frontend after environment changes

```bash
# 1. Stop frontend (press Ctrl+C in frontend terminal)

# 2. Restart it
cd frontend
npm run dev

# 3. Visit http://localhost:3003/pools
# Should now show pools!
```

**Why**: Next.js caches environment variables. After updating `.env.local`, you need to restart.

---

## 🔍 Diagnostic Checklist

### Step 1: Verify Backend is Running

```bash
curl http://localhost:3001/api/health
```

**Expected**: `{"status":"ok"}`  
**If fails**: Backend isn't running. Start with `cd backend && npm run dev`

---

### Step 2: Test Backend Endpoints Directly

```bash
# Test positions endpoint
curl "http://localhost:3001/api/positions?limit=1"

# Should return pool data with APY, TVL, etc.
```

**Expected**: JSON with pool data  
**If empty**: Backend needs time to fetch from DefiLlama (wait 5 seconds, retry)

---

### Step 3: Check Frontend API URL

```bash
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL
```

**Expected**: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`  
**If different**: Update to match your backend port

---

### Step 4: Check Browser Console

1. Open http://localhost:3003/pools
2. Press F12 (open DevTools)
3. Go to "Console" tab
4. Look for errors like:
   - `Failed to fetch` → Backend not reachable
   - `CORS error` → CORS configuration issue
   - `Network error` → Wrong API URL

---

## 🐛 Common Issues

### Issue 1: "No Data Showing on Pools Page"

**Symptoms**: Pools page loads but table is empty

**Cause**: Frontend API call failing

**Fix**:
```bash
# Check browser console (F12)
# Look for API URL it's calling

# Should be: http://localhost:3001/api/positions
# If wrong, update frontend/.env.local:
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" >> frontend/.env.local

# Restart frontend
cd frontend && npm run dev
```

---

### Issue 2: "Portfolio Page Shows 'Connect Wallet' But No Data After Connecting"

**Symptoms**: Wallet connects but no positions load

**Causes**:
1. Backend dashboard endpoint not working
2. Address has no positions
3. API call failing

**Fix**:
```bash
# Test dashboard endpoint directly (replace with your address)
curl "http://localhost:3001/api/dashboard/0xYOUR_ADDRESS"

# If returns data → Frontend issue (restart frontend)
# If empty/error → Backend issue (check backend logs)
```

---

### Issue 3: "Manual Address Search Not Working"

**Symptoms**: Enter address, click Search, nothing happens

**Cause**: React state not updating or API call failing

**Fix**:
1. Open browser console (F12)
2. Click Search button
3. Look for API call in "Network" tab
4. If call succeeds but no UI update → Restart frontend
5. If call fails → Check backend is running

---

## 🔧 Complete Reset (If Nothing Works)

```bash
# 1. Stop everything (Ctrl+C in all terminals)

# 2. Clear caches
cd frontend
rm -rf .next
npm run dev

# In another terminal
cd backend
npm run dev

# 3. Wait 10 seconds for both to start

# 4. Visit http://localhost:3003/pools

# Should work now!
```

---

## 🎯 Verification Steps

After fixing, verify these work:

```bash
# 1. Backend health
curl http://localhost:3001/api/health
# ✓ Should return: {"status":"ok"}

# 2. Pools data
curl "http://localhost:3001/api/positions?limit=2"
# ✓ Should return: Array of pools

# 3. Frontend loads
# Open: http://localhost:3003
# ✓ Should show homepage

# 4. Pools page loads
# Open: http://localhost:3003/pools
# ✓ Should show table with pools

# 5. Portfolio works
# Open: http://localhost:3003/portfolio
# ✓ Should show "Connect Wallet" or address input
```

---

## 🆘 Still Not Working?

### Check These:

1. **Backend Port**: Is it actually 3001?
   ```bash
   lsof -i :3001
   ```
   Should show: `node` process

2. **Frontend Port**: Is it 3003?
   ```bash
   lsof -i :3003
   ```
   Should show: `node` process

3. **CORS**: Check backend logs for CORS errors

4. **Browser Cache**: Hard refresh (Cmd+Shift+R on Mac)

---

## 📝 Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Failed to fetch" | Backend not running | `cd backend && npm run dev` |
| "CORS error" | Wrong origin | Check backend CORS config |
| "Network error" | Wrong API URL | Update `.env.local`, restart frontend |
| "Empty array []" | DefiLlama loading | Wait 5 seconds, refresh |
| "Invalid address" | Wrong format | Use format: `0x...` (40 chars) |

---

## ✅ Most Likely Solution

**Your specific issue**: Frontend needs restart after we updated the API integration

```bash
# Stop frontend (Ctrl+C)
cd frontend
npm run dev

# Visit: http://localhost:3003/pools
# Should now show pools! 🎉
```

**Backend is working** (we tested it) - just need to reconnect frontend!

