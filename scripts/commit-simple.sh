#!/bin/bash

echo "🚀 ApyHub.xyz - Simple Commit (Low Disk Space Mode)"
echo "============================================"

# Get current branch
BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"
echo ""

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

echo "📝 Staging all changes..."
git add -A

echo "💾 Creating single commit..."
git commit -m "feat: add deployment configurations and production setup

- Database: Updated Prisma schema and seed data
- Backend: Enhanced PoolService with error handling
- API: Improved protocol routes with filtering
- Server: Production-ready configuration
- Frontend: Optimized Next.js build config
- Infrastructure: Added nginx, Makefile, deployment scripts
- Documentation: Added deployment guide and saved hackathon docs
- Scripts: Added commit automation tools"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Commit created successfully!"
    echo ""
    echo "📊 Latest commit:"
    git log --oneline -1
    echo ""
    echo "🎯 Next step: Push to remote"
    echo "   git push origin $BRANCH"
else
    echo ""
    echo "❌ Failed to create commit due to disk space"
    echo ""
    echo "🧹 To free up space, try:"
    echo "   1. Empty your Trash/Bin"
    echo "   2. Delete Downloads you don't need"
    echo "   3. Clear browser cache"
    echo "   4. Remove old Docker images: docker system prune -a"
    echo "   5. Clear npm cache manually: rm -rf ~/.npm/_cacache"
fi