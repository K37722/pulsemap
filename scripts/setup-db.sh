#!/bin/bash

# PulseMap Database Setup Script

set -e

echo "🗄️  PulseMap Database Setup"
echo "============================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: PostgreSQL is not installed"
    echo "Please install PostgreSQL first or use Docker:"
    echo "  docker-compose up -d postgres"
    exit 1
fi

# Configuration
DB_NAME="${1:-pulsemap}"
DB_USER="${2:-postgres}"
DB_HOST="${3:-localhost}"
DB_PORT="${4:-5432}"

echo "📝 Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if database exists
if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️  Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Dropping database..."
        dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" || true
    else
        echo "Continuing with existing database..."
    fi
fi

# Create database if it doesn't exist
if ! psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "📦 Creating database '$DB_NAME'..."
    createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
fi

# Enable PostGIS extension
echo "🗺️  Enabling PostGIS extension..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run schema
echo "🏗️  Creating schema..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f lib/db/schema.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update your .env.local with the database URL:"
echo "     DATABASE_URL=postgresql://$DB_USER:password@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "  2. Start the development server:"
echo "     npm run dev"
echo ""
echo "  3. Click 'Sync Now' in the app to fetch incidents"
echo ""
