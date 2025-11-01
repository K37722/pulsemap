#!/bin/bash

# PulseMap Environment Setup Script
# Automatically creates .env.local with correct settings for your system

set -e

echo "🔧 PulseMap Environment Setup"
echo "=============================="
echo ""

# Detect Mac username
USERNAME=$(whoami)
echo "✅ Detected username: $USERNAME"

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.local"
        exit 0
    fi
fi

# Create .env.local from template
echo "📝 Creating .env.local..."

cat > .env.local <<EOF
# Database Configuration (Auto-configured for Mac with Homebrew PostgreSQL)
DATABASE_URL=postgresql://${USERNAME}@localhost:5432/pulsemap

# Politiloggen API
POLITILOGGEN_API_URL=https://api.politiet.no/politiloggen/v1

# Geocoding Service (Nominatim)
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=PulseMap/1.0 ${USERNAME}@example.com

# Optional: If using Google Geocoding API instead
# GOOGLE_GEOCODING_API_KEY=your_api_key_here

# Application Settings
NEXT_PUBLIC_MAP_CENTER_LAT=59.9139
NEXT_PUBLIC_MAP_CENTER_LNG=10.7522
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12
NEXT_PUBLIC_REFRESH_INTERVAL_MS=60000
NEXT_PUBLIC_OSLO_DISTRICT=Oslo

# API Rate Limiting
API_RATE_LIMIT_PER_MINUTE=60
GEOCODING_RATE_LIMIT_PER_SECOND=1
EOF

echo "✅ Created .env.local"
echo ""
echo "📋 Configuration:"
echo "  Database User: $USERNAME"
echo "  Database: pulsemap"
echo "  Port: 5432"
echo ""
echo "⚠️  IMPORTANT: Update NOMINATIM_USER_AGENT with your real email!"
echo "    Current: ${USERNAME}@example.com"
echo ""
echo "💡 To edit: nano .env.local"
echo ""
