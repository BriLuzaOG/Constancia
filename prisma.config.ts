import { defineConfig } from 'prisma/config';

// Prisma 7 does not read .env files. loadEnvFile keeps existing values, so .env.local goes first.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

// `prisma generate` runs in CI without a database, so the URL falls back to a placeholder.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
