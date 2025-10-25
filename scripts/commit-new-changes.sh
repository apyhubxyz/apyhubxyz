#!/bin/bash

# ApyHub.xyz - Commit New Changes Script
# This script commits the new changes in logical groups

echo "🚀 ApyHub.xyz - Committing New Changes"
echo "============================================"
echo "Branch: feature-mojtaba"
echo ""

# Function to commit with a message
commit_with_message() {
    local message="$1"
    
    # Check if there are staged changes
    if git diff --cached --quiet; then
        echo "⚠️ No changes staged for: $message"
    else
        git commit -m "$message"
        echo "✅ Committed: $message"
        sleep 1
    fi
}

# Ensure we're on the right branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "none")
if [ "$CURRENT_BRANCH" != "feature-mojtaba" ]; then
    echo "⚠️ Not on feature-mojtaba branch. Current branch: $CURRENT_BRANCH"
    echo "Run: git checkout feature-mojtaba"
    exit 1
fi

echo "📝 Starting incremental commits..."
echo ""

# Commit 1: Remove hackathon documentation files
echo "🗑️ Step 1: Clean up hackathon docs"
git add -A HACKATHON_README.md HACKATHON_SUBMISSION.md IMPLEMENTATION_SUMMARY.md 2>/dev/null
commit_with_message "chore: remove hackathon documentation files from branch"

# Commit 2: Database schema updates
echo ""
echo "💾 Step 2: Database updates"
git add backend/prisma/schema.prisma backend/prisma/seed.ts
commit_with_message "feat: update Prisma schema and seed data for production"

# Commit 3: Backend service updates
echo ""
echo "⚙️ Step 3: Backend service improvements"
git add backend/src/services/PoolService.ts
commit_with_message "fix: improve PoolService error handling and performance"

# Commit 4: Backend route updates
echo ""
echo "🛣️ Step 4: API route enhancements"
git add backend/src/routes/protocols.ts
commit_with_message "feat: enhance protocol routes with better filtering"

# Commit 5: Backend server configuration
echo ""
echo "🔧 Step 5: Server configuration updates"
git add backend/src/index.ts
commit_with_message "feat: update server configuration for production readiness"

# Commit 6: Frontend configuration
echo ""
echo "🎨 Step 6: Frontend build configuration"
git add frontend/next.config.js
commit_with_message "feat: optimize Next.js configuration for production"

# Commit 7: Nginx configuration
echo ""
echo "🌐 Step 7: Nginx reverse proxy setup"
git add nginx/nginx.conf
commit_with_message "feat: configure nginx for production deployment"

# Commit 8: Build automation
echo ""
echo "🔨 Step 8: Build automation tools"
git add Makefile
commit_with_message "feat: add Makefile for build automation"

# Commit 9: Unified environment configuration
echo ""
echo "⚙️ Step 9: Unified environment setup"
git add .env.example
commit_with_message "feat: add unified environment configuration for dev and production"

# Commit 10: Deployment scripts
echo ""
echo "🚀 Step 10: Deployment automation"
git add scripts/deploy-prod.sh 2>/dev/null
git add scripts/ 2>/dev/null
commit_with_message "feat: add production deployment scripts"

# Commit 11: Deployment documentation
echo ""
echo "📚 Step 11: Deployment documentation"
git add DEPLOYMENT.md
commit_with_message "docs: add comprehensive deployment documentation"

# Commit 12: Saved documentation (internal use)
echo ""
echo "📋 Step 12: Save documentation for later use"
git add SAVED_HACKATHON_DOCS.md
commit_with_message "docs: preserve hackathon documentation for future reference"

# Commit 13: Commit script itself
echo ""
echo "📝 Step 13: Version control tools"
git add commit-hackathon.sh commit-new-changes.sh 2>/dev/null
commit_with_message "chore: add git commit automation scripts"

echo ""
echo "============================================"
echo "✅ All changes committed successfully!"
echo ""
echo "📊 Summary:"
git log --oneline -13
echo ""
echo "🎯 Next steps:"
echo "1. Review the commits: git log --oneline"
echo "2. Push to remote: git push origin feature-mojtaba"
echo "3. Create a pull request if needed"
echo ""
echo "💡 All changes have been organized into logical commits!"