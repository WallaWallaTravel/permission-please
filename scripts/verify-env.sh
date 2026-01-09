#!/bin/bash
# Pre-deployment environment verification script
# Run this before deploying to verify DATABASE_URL points to correct project

set -e

EXPECTED_PROJECT_ID="djbonsnacfcwovqzjwcs"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Permission Please - Environment Verification"
echo "=========================================="
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}ERROR: Vercel CLI not installed${NC}"
    echo "Install with: npm i -g vercel"
    exit 1
fi

# Pull production environment variables
echo "Pulling production environment variables..."
vercel env pull .env.verify --environment=production --yes > /dev/null 2>&1

if [ ! -f .env.verify ]; then
    echo -e "${RED}ERROR: Could not pull Vercel environment variables${NC}"
    exit 1
fi

# Extract DATABASE_URL
DATABASE_URL=$(grep "^DATABASE_URL=" .env.verify | cut -d= -f2- | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not found in production environment${NC}"
    rm -f .env.verify
    exit 1
fi

# Extract project ID from URL
ACTUAL_PROJECT_ID=$(echo "$DATABASE_URL" | grep -o 'postgres\.[a-z0-9]*' | cut -d. -f2)

echo ""
echo "Database Configuration:"
echo "  Expected Project ID: $EXPECTED_PROJECT_ID"
echo "  Actual Project ID:   $ACTUAL_PROJECT_ID"
echo ""

# Cleanup
rm -f .env.verify

# Verify
if [ "$ACTUAL_PROJECT_ID" = "$EXPECTED_PROJECT_ID" ]; then
    echo -e "${GREEN}✓ DATABASE_URL points to correct Supabase project${NC}"
    echo ""

    # Optional: Test actual connection
    echo "Testing database connection..."
    if command -v psql &> /dev/null; then
        # Extract connection details for a quick test
        DB_HOST=$(echo "$DATABASE_URL" | grep -o '@[^:]*' | tr -d '@')
        if timeout 5 psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Database connection successful${NC}"
        else
            echo -e "${YELLOW}⚠ Could not verify database connection (may be network/firewall)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ psql not installed - skipping connection test${NC}"
    fi

    echo ""
    echo -e "${GREEN}All checks passed! Safe to deploy.${NC}"
    exit 0
else
    echo -e "${RED}✗ DATABASE_URL points to WRONG Supabase project!${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Update DATABASE_URL in Vercel:"
    echo "     vercel env add DATABASE_URL production --force"
    echo "  2. Enter the correct connection string for project $EXPECTED_PROJECT_ID"
    echo "  3. Run this script again to verify"
    echo ""
    echo -e "${RED}DO NOT DEPLOY until this is fixed!${NC}"
    exit 1
fi
