#!/bin/bash
# Database Migration Script for Permission Please
#
# This script provides a safe way to manage database migrations
# for development and production environments.
#
# Usage:
#   ./scripts/db-migrate.sh [command] [options]
#
# Commands:
#   dev       - Apply migrations in development (creates migration if schema changed)
#   deploy    - Apply migrations in production (safe, no schema changes)
#   status    - Show migration status
#   reset     - Reset development database (DESTRUCTIVE!)
#   seed      - Seed the database with test data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

command="${1:-help}"

case "$command" in
    dev)
        echo -e "${GREEN}Running development migrations...${NC}"
        # Create migration if schema changed
        npx prisma migrate dev
        echo -e "${GREEN}✓ Development migrations complete${NC}"
        ;;

    deploy)
        echo -e "${GREEN}Deploying migrations to production...${NC}"
        # Only apply existing migrations, never create new ones in production
        npx prisma migrate deploy
        echo -e "${GREEN}✓ Production migrations deployed${NC}"
        ;;

    status)
        echo -e "${GREEN}Checking migration status...${NC}"
        npx prisma migrate status
        ;;

    reset)
        echo -e "${YELLOW}⚠️  WARNING: This will delete all data in the database!${NC}"
        echo -n "Are you sure you want to continue? (yes/no): "
        read -r confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "${RED}Resetting database...${NC}"
            npx prisma migrate reset --force
            echo -e "${GREEN}✓ Database reset complete${NC}"
        else
            echo "Aborted."
            exit 0
        fi
        ;;

    seed)
        echo -e "${GREEN}Seeding database...${NC}"
        npx tsx prisma/seed.ts
        echo -e "${GREEN}✓ Database seeded${NC}"
        ;;

    generate)
        echo -e "${GREEN}Generating Prisma client...${NC}"
        npx prisma generate
        echo -e "${GREEN}✓ Prisma client generated${NC}"
        ;;

    studio)
        echo -e "${GREEN}Opening Prisma Studio...${NC}"
        npx prisma studio
        ;;

    validate)
        echo -e "${GREEN}Validating schema...${NC}"
        npx prisma validate
        echo -e "${GREEN}✓ Schema is valid${NC}"
        ;;

    help|*)
        echo "Permission Please Database Migration Tool"
        echo ""
        echo "Usage: ./scripts/db-migrate.sh [command]"
        echo ""
        echo "Commands:"
        echo "  dev       Apply migrations in development (creates migration if needed)"
        echo "  deploy    Apply migrations in production (safe, no schema changes)"
        echo "  status    Show current migration status"
        echo "  reset     Reset database (DESTRUCTIVE - development only!)"
        echo "  seed      Seed database with test data"
        echo "  generate  Generate Prisma client"
        echo "  studio    Open Prisma Studio"
        echo "  validate  Validate the schema"
        echo ""
        echo "Examples:"
        echo "  ./scripts/db-migrate.sh dev      # Development workflow"
        echo "  ./scripts/db-migrate.sh deploy   # Production deployment"
        ;;
esac
