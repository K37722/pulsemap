#!/bin/bash
set -e

echo "🚀 PulseMap Mac Installation (Homebrew)"
echo "========================================"
echo ""

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add to PATH for Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew found ($(brew --version | head -n1))"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js found ($(node --version))"
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "🗄️  Installing PostgreSQL + PostGIS..."
    brew install postgresql@15 postgis

    # Add to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

    # Start service
    brew services start postgresql@15
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 5
else
    echo "✅ PostgreSQL found ($(psql --version | head -n1))"

    # Make sure it's running
    brew services start postgresql@15 2>/dev/null || true
fi

# Install npm dependencies
echo "📥 Installing npm dependencies..."
npm install

# Setup database
echo "🗄️  Setting up database..."
createdb pulsemap 2>/dev/null || echo "Database already exists"
psql pulsemap -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null
psql pulsemap < lib/db/schema.sql

# Setup environment
echo "⚙️  Setting up environment..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✏️  Please update NOMINATIM_USER_AGENT in .env.local with your email"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env.local with your email in NOMINATIM_USER_AGENT"
echo "  2. npm run dev"
echo "  3. Open http://localhost:3000"
echo "  4. Click 'Sync Now' to fetch incidents"
echo ""
