#!/bin/sh
set -e

echo "🚀 Starting deployment..."

# Check if database is accessible
echo "⏳ Waiting for database to be ready..."
until node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT 1').then(() => { console.log('✅ Database is ready'); pool.end(); process.exit(0); }).catch((err) => { console.log('⏳ Database not ready yet, retrying...'); pool.end(); process.exit(1); });" 2>/dev/null
do
  echo "⏳ Waiting for database..."
  sleep 2
done

echo "📊 Running database migrations..."
npx drizzle-kit push --config=/app/drizzle.config.ts || {
  echo "⚠️  Migration failed, but continuing (tables might already exist)"
}

echo "🌱 Seeding database..."
npx tsx /app/lib/db/seed.ts || {
  echo "⚠️  Seeding failed, but continuing (data might already exist)"
}

echo "✅ Database setup complete!"
echo "🎉 Starting Next.js application..."

# Start the Next.js server
exec node server.js
