#!/bin/bash
# TaskFlow Pro - Setup Script
# Run this after extracting the project files

echo "======================================="
echo "  TaskFlow Pro - Setup"
echo "======================================="

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found! Creating from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your MongoDB connection string before continuing."
  exit 1
fi

# Check if DATABASE_URL contains mongodb
if ! grep -q "mongodb" .env; then
  echo "❌ .env does not contain a MongoDB DATABASE_URL. Please update it."
  exit 1
fi

echo ""
echo "1. Installing dependencies..."
npm install

echo ""
echo "2. Generating Prisma Client..."
npx prisma generate

echo ""
echo "3. Pushing schema to MongoDB..."
npx prisma db push

echo ""
echo "======================================="
echo "  ✅ Setup Complete!"
echo "======================================="
echo ""
echo "Run 'npm run dev' to start the development server."
echo "Then open http://localhost:3000 in your browser."
